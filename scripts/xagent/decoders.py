"""How each decoder is called: one prompt, one or more images, a fresh session.

Every call is isolated from this project: no tools, skills, memory or project
instructions, and a working directory that holds nothing but the trial's images.
Python 3 standard library only.
"""
import base64
import json
import os
import re
import secrets
import shutil
import subprocess
import tempfile
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path

SYSTEM = 'You are looking at a picture and answering questions about it.'
FAMILY = {'claude': 'Anthropic', 'codex': 'OpenAI', 'grok': 'xAI', 'gemini': 'Google'}
CLAUDE = {'opus': 'claude-opus-5-5', 'sonnet': 'claude-sonnet-5-5', 'haiku': 'claude-haiku-4-5-20251001'}
CODEX = {'astra': 'gpt-6-astra', 'sol': 'gpt-5.6-sol'}
# Full Flash models only: the lite ones were weaker judges on 28 September.
GEMINI = ('gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash',
          'gemini-3-flash-preview')
ALL = ('claude:haiku', 'claude:sonnet', 'claude:opus', 'codex:astra', 'codex:sol', 'grok', 'gemini')
ARG_LIMIT = 125000  # Linux allows 128 KB for one argument


class Skip(Exception):
    """This decoder can't take this trial (too large, or out of quota for now)."""


class Failed(Exception):
    """The call didn't complete; try again on a later run."""


def b64(path):
    return base64.b64encode(Path(path).read_bytes()).decode()


def empty_dir():
    return tempfile.mkdtemp(prefix='xa-')


def claude(model, prompt, images, timeout):
    content = [{'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/png', 'data': b64(i)}}
               for i in images] + [{'type': 'text', 'text': prompt}]
    line = json.dumps({'type': 'user', 'message': {'role': 'user', 'content': content}}) + '\n'
    cwd = empty_dir()
    try:
        done = subprocess.run(
            ['claude', '-p', '--model', CLAUDE[model], '--effort', 'low', '--system-prompt', SYSTEM,
             '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose',
             '--tools', '', '--disable-slash-commands', '--strict-mcp-config', '--no-session-persistence'],
            input=line, capture_output=True, text=True, timeout=timeout, cwd=cwd)
    finally:
        shutil.rmtree(cwd, ignore_errors=True)
    used, result = None, None
    for row in done.stdout.splitlines():
        try:
            event = json.loads(row)
        except ValueError:
            continue
        if event.get('type') == 'system' and event.get('subtype') == 'init':
            used = event.get('model')
            if event.get('tools') or event.get('skills'):
                raise Failed('claude session was not isolated')
        if event.get('type') == 'result':
            result = event
    if not result or result.get('is_error'):
        raise Failed('claude: ' + ((result or {}).get('result') or done.stderr or done.stdout)[-300:])
    return {'text': result.get('result') or '', 'model': used or CLAUDE[model]}


def codex(model, prompt, images, timeout):
    cwd = Path(empty_dir())
    try:
        files = []
        for image in images:
            copy = cwd / (secrets.token_hex(4) + '.png')
            shutil.copyfile(image, copy)
            files.append(str(copy))
        out = cwd / 'answer.txt'
        command = ['codex', 'exec', '--ephemeral', '--ignore-user-config', '--ignore-rules',
                   '--sandbox', 'read-only', '--skip-git-repo-check', '-C', str(cwd),
                   '-m', CODEX[model], '-c', 'model_reasoning_effort="low"', '-o', str(out),
                   prompt + '\n\nAnswer from the attached image alone. Do not run commands or open files.']
        for file in files:
            command += ['-i', file]
        done = subprocess.run(command, stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=timeout)
        if not out.exists() or not out.read_text().strip():
            raise Failed('codex: ' + (done.stderr or done.stdout)[-300:])
        # Codex prints an "exec" block for every command it runs; a decoder shouldn't run any.
        ran = re.search(r'^exec\b', done.stdout + '\n' + done.stderr, flags=re.M)
        return {'text': out.read_text(), 'model': CODEX[model], 'ran_commands': bool(ran)}
    finally:
        shutil.rmtree(cwd, ignore_errors=True)


def grok(model, prompt, images, timeout):
    blocks = [{'type': 'text', 'text': prompt}] + [
        {'type': 'image', 'data': b64(i), 'mimeType': 'image/png'} for i in images]
    payload = json.dumps(blocks)
    if len(payload) > ARG_LIMIT:
        raise Skip('prompt too large for one argument')
    for attempt in range(4):
        with _grok_lock:                       # it refuses requests that come too quickly
            wait = 10 - (time.time() - _grok_last[0])
            if wait > 0:
                time.sleep(wait)
            _grok_last[0] = time.time()
        cwd = empty_dir()
        try:
            done = subprocess.run(
                ['grok', '--prompt-json', payload, '--output-format', 'json', '--disable-web-search',
                 '--tools', '', '--max-turns', '1', '--no-subagents', '--reasoning-effort', 'low',
                 '--system-prompt-override', SYSTEM, '--cwd', cwd],
                stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=timeout)
        finally:
            shutil.rmtree(cwd, ignore_errors=True)
        if 'too quickly' in done.stdout + done.stderr and attempt < 3:
            time.sleep(60*(attempt + 1))
            continue
        try:                                   # the answer is the first JSON object on stdout
            answer, _ = json.JSONDecoder().raw_decode(done.stdout[done.stdout.index('{'):])
        except ValueError:
            raise Failed('grok: ' + (done.stderr or done.stdout)[-300:])
        if not answer.get('text'):
            raise Failed('grok: ' + done.stdout[-300:])
        return {'text': answer['text'], 'model': ', '.join(answer.get('modelUsage', {})) or 'grok'}


_grok_lock = threading.Lock()
_grok_last = [0.0]
_gemini_key = None
_gemini_spent = set()          # models out of quota for today
_gemini_lock = threading.Lock()
_gemini_last = [0.0]


def gemini_key():
    global _gemini_key
    if _gemini_key is None:
        _gemini_key = os.environ.get('GEMINI_API_KEY', '')
        env = Path(os.environ.get('XAGENT_ENV_FILE') or Path(__file__).resolve().parents[2] / '.xagent-private/env')
        if not _gemini_key and env.exists():
            for row in env.read_text().splitlines():
                found = re.match(r'\s*(?:export\s+)?GEMINI_API_KEY\s*=\s*["\']?([^"\'\s#]+)', row)
                if found:
                    _gemini_key = found.group(1)
    if not _gemini_key:
        raise Skip('no GEMINI_API_KEY')
    return _gemini_key


def gemini(model, prompt, images, timeout):
    """`model` is one of GEMINI, chosen by the runner so paired trials share it."""
    if model in _gemini_spent:
        raise Skip(model + ' is out of quota today')
    key = gemini_key()
    body = json.dumps({
        'system_instruction': {'parts': [{'text': SYSTEM}]},
        'contents': [{'parts': [{'inline_data': {'mime_type': 'image/png', 'data': b64(i)}} for i in images]
                      + [{'text': prompt}]}]}).encode()
    for attempt in range(4):
        with _gemini_lock:                     # the free tier is also limited per minute
            wait = 6 - (time.time() - _gemini_last[0])
            if wait > 0:
                time.sleep(wait)
            _gemini_last[0] = time.time()
        request = urllib.request.Request(
            f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
            data=body, headers={'Content-Type': 'application/json', 'x-goog-api-key': key})
        try:
            answer = json.load(urllib.request.urlopen(request, timeout=timeout))
            parts = answer['candidates'][0]['content']['parts']
            return {'text': ''.join(p.get('text', '') for p in parts), 'model': model}
        except urllib.error.HTTPError as error:
            detail = error.read().decode(errors='replace').replace(key, '<key>')
            if error.code == 429 and re.search(r'PerDay|per day|daily', detail, flags=re.I):
                _gemini_spent.add(model)
                raise Skip(model + ' is out of quota today')
            if error.code in (429, 500, 503) and attempt < 3:
                time.sleep(20*(attempt + 1))
                continue
            if error.code == 429:
                _gemini_spent.add(model)
                raise Skip(model + ' keeps refusing (429)')
            raise Failed(f'gemini {error.code}: {detail[:200]}')
        except (KeyError, IndexError, ValueError, OSError) as error:
            if attempt < 3:
                time.sleep(10)
                continue
            raise Failed('gemini: ' + str(error)[:200].replace(key, '<key>'))


def call(decoder, prompt, images, timeout=240, gemini_model=None):
    kind, _, model = decoder.partition(':')
    try:
        if kind == 'claude':
            return claude(model, prompt, images, timeout)
        if kind == 'codex':
            return codex(model, prompt, images, timeout)
        if kind == 'grok':
            return grok(model, prompt, images, timeout)
        if kind == 'gemini':
            return gemini(gemini_model or GEMINI[0], prompt, images, timeout)
    except subprocess.TimeoutExpired:
        raise Failed(decoder + ' timed out')
    raise ValueError(decoder)


def parse(text):
    """The first JSON object in an answer, or None."""
    text = re.sub(r'```(?:json)?', '', text or '')
    start, end = text.find('{'), text.rfind('}')
    if start < 0 or end <= start:
        return None
    try:
        answer = json.loads(text[start:end + 1])
    except ValueError:
        return None
    return answer if isinstance(answer, dict) else None


def claude_usage():
    """Edgar's 5-hour and weekly Claude usage, in percent, or None if unreadable."""
    try:
        token = json.loads((Path.home() / '.claude/.credentials.json').read_text())['claudeAiOauth']['accessToken']
        request = urllib.request.Request('https://api.anthropic.com/api/oauth/usage', headers={
            'Authorization': 'Bearer ' + token, 'anthropic-beta': 'oauth-2025-04-20'})
        usage = json.load(urllib.request.urlopen(request, timeout=30))
        return usage['five_hour']['utilization'], usage['seven_day']['utilization']
    except Exception:
        return None
