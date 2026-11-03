"""How each decoder is called: one prompt, one or more images, a fresh session.

Every call is isolated from this project and from Edgar's own setup: no tools, skills,
plugins, hooks, memory or user and project instructions, and a working directory that
holds nothing but the trial's images. Each call, or each run for Codex, checks that
nothing more came in, and fails or is skipped if it did.
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
import urllib.parse
import urllib.request
from pathlib import Path

SYSTEM = 'You are looking at a picture and answering questions about it.'
FAMILY = {'claude': 'Anthropic', 'codex': 'OpenAI', 'grok': 'xAI', 'gemini': 'Google'}
CLAUDE = {'opus': 'claude-opus-5-5', 'sonnet': 'claude-sonnet-5-5', 'haiku': 'claude-haiku-4-5-20251001'}
CODEX = {'astra': 'gpt-6-astra', 'sol': 'gpt-5.6-sol'}
# Full Flash models only: the lite ones were weaker judges on 28 September.
GEMINI = ('gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash',
          'gemini-3-flash-preview')
ALL = ('claude:haiku', 'claude:sonnet', 'claude:opus', 'codex:astra', 'codex:sol', 'grok:4.7', 'gemini')
ARG_LIMIT = 125000  # Linux allows 128 KB for one argument


class Skip(Exception):
    """This decoder can't take this trial (too large, or out of quota for now)."""


class Failed(Exception):
    """The call didn't complete; try again on a later run."""


def b64(path):
    return base64.b64encode(Path(path).read_bytes()).decode()


def empty_dir():
    return tempfile.mkdtemp(prefix='xa-')


# Edgar's user settings enable plugins (the Field plugin among them) and name an advisor model, which
# `--tools ''` leaves in place, and a CLAUDE.md on the way up from the working directory is read.
# Safe mode drops CLAUDE.md, skills, plugins, hooks and auto-memory, and no settings file is read.
# What remains is Claude Code's own preamble, the model's name, the date and the account's email
# (README, "Isolation of the Claude and Codex calls"). A call whose init event shows anything more
# loaded, in which a hook ran, or in which another model took part, fails.
CLAUDE_FLAGS = ('--tools', '', '--disable-slash-commands', '--strict-mcp-config', '--no-session-persistence',
                '--safe-mode', '--setting-sources=', '--include-hook-events')


def claude_loaded(event):
    """What a Claude init event shows loaded beyond Claude Code's own, or ''."""
    loaded = [name for name in ('tools', 'skills', 'mcp_servers', 'slash_commands') if event.get(name)]
    loaded += [str(plugin.get('source') or plugin.get('name')) for plugin in event.get('plugins') or []
               if not str(plugin.get('source', '')).endswith('@builtin')]
    if event.get('memory_paths'):
        loaded.append('memory')
    if event.get('output_style') not in (None, 'default'):
        loaded.append('output style ' + str(event['output_style']))
    return ', '.join(loaded)


def claude(model, prompt, images, timeout):
    content = [{'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/png', 'data': b64(i)}}
               for i in images] + [{'type': 'text', 'text': prompt}]
    line = json.dumps({'type': 'user', 'message': {'role': 'user', 'content': content}}) + '\n'
    cwd = empty_dir()
    try:
        done = subprocess.run(
            ['claude', '-p', '--model', CLAUDE[model], '--effort', 'low', '--system-prompt', SYSTEM,
             '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose', *CLAUDE_FLAGS],
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
            loaded = claude_loaded(event)
            if loaded:
                raise Failed('claude session was not isolated: ' + loaded)
        if event.get('type') == 'system' and str(event.get('subtype', '')).startswith('hook'):
            raise Failed(f'claude session was not isolated: a hook ran ({event.get("hook_name")})')
        if event.get('type') == 'result':
            result = event
    if not result or result.get('is_error'):
        raise Failed('claude: ' + ((result or {}).get('result') or done.stderr or done.stdout)[-300:])
    others = set(result.get('modelUsage') or {}) - {CLAUDE[model], used}
    if others:
        raise Failed('claude session was not isolated: another model took part (' + ', '.join(sorted(others)) + ')')
    return {'text': result.get('result') or '', 'model': used or CLAUDE[model]}


# `--ignore-user-config` skips only config.toml. Codex still reads skills from ~/.agents/skills
# (Edgar's has 31 firecrawl skills) and from its plugins (about thirty more), and AGENTS.md from
# CODEX_HOME and the working directory. It runs with an empty home, CODEX_HOME still naming the
# real one so its sign-in stays where it is, and these features off. The context that gives is
# rendered once a run (`codex debug prompt-input`, which also reads config.toml, so it sees at
# least what a call does) and checked: a skill from outside Codex's own bundled set, an AGENTS.md,
# or a trace of Field skips every Codex trial of the run.
CODEX_OFF = ('plugins', 'remote_plugin', 'plugin_sharing', 'apps', 'memories', 'hooks', 'image_generation',
             'browser_use', 'browser_use_external', 'in_app_browser', 'computer_use', 'multi_agent', 'goals',
             'skill_search', 'skill_mcp_dependency_install')


def codex_env(home):
    return {**os.environ, 'HOME': home, 'CODEX_HOME': os.environ.get('CODEX_HOME') or str(Path.home() / '.codex')}


def codex_off():
    return [arg for feature in CODEX_OFF for arg in ('--disable', feature)]


def codex_context():
    """Why the context a Codex call is given isn't isolated, or ''."""
    cwd, home = empty_dir(), empty_dir()
    try:
        env = codex_env(home)
        done = subprocess.run(['codex', 'debug', 'prompt-input', '-c', 'mcp_servers={}', *codex_off()],
                              stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=120, cwd=cwd, env=env)
    finally:
        shutil.rmtree(cwd, ignore_errors=True)
        shutil.rmtree(home, ignore_errors=True)
    try:
        context = json.loads(done.stdout)
        text = '\n'.join(part.get('text', '') for item in context for part in item.get('content') or ())
    except (ValueError, AttributeError, TypeError):
        return "its context can't be read: " + (done.stderr or done.stdout)[-200:]
    own = str(Path(env['CODEX_HOME']) / 'skills' / '.system')
    foreign = [root for root in re.findall(r'^- `r\d+` = `([^`]+)`', text, flags=re.M) if root != own]
    if foreign:
        return 'skills from ' + ', '.join(foreign)
    if '<INSTRUCTIONS>' in text:
        return 'an AGENTS.md'
    if any(leak in done.stdout for leak in LEAKS):
        return 'its context names Field'
    return ''


def codex(model, prompt, images, timeout):
    with _codex_lock:
        if _codex_spent[0]:
            raise Skip('codex is at its usage limit')
        if _codex_checked[0] is None:
            _codex_checked[0] = codex_context()
    if _codex_checked[0]:
        raise Skip('codex session is not isolated: ' + _codex_checked[0])
    cwd, home = Path(empty_dir()), empty_dir()
    try:
        files = []
        for image in images:
            copy = cwd / (secrets.token_hex(4) + '.png')
            shutil.copyfile(image, copy)
            files.append(str(copy))
        out = cwd / 'answer.txt'
        command = ['codex', 'exec', '--ephemeral', '--ignore-user-config', '--ignore-rules', *codex_off(),
                   '--sandbox', 'read-only', '--skip-git-repo-check', '-C', str(cwd),
                   '-m', CODEX[model], '-c', 'model_reasoning_effort="low"', '-o', str(out),
                   prompt + '\n\nAnswer from the attached image alone. Do not run commands or open files.']
        for file in files:
            command += ['-i', file]
        done = subprocess.run(command, stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=timeout,
                              env=codex_env(home))
        if not out.exists() or not out.read_text().strip():
            # Out of credits: every later call would fail the same way, so the run stops calling.
            if re.search(r'hit your usage limit|purchase more credits', done.stdout + done.stderr):
                _codex_spent[0] = True
                raise Skip('codex is at its usage limit')
            raise Failed('codex: ' + (done.stderr or done.stdout)[-300:])
        # Codex prints an "exec" block for every command it runs; a decoder shouldn't run any.
        ran = re.search(r'^exec\b', done.stdout + '\n' + done.stderr, flags=re.M)
        return {'text': out.read_text(), 'model': CODEX[model], 'ran_commands': bool(ran)}
    finally:
        shutil.rmtree(cwd, ignore_errors=True)
        shutil.rmtree(home, ignore_errors=True)


# Grok Build ignores `--tools ''` and reads the Claude and Cursor setups in the home directory, so
# the October `grok` decoder had every tool, auto-approved, and the Field skill's description in its
# context (README, "Grok's October trials"). `grok:4.7` runs with an empty home, those scans off,
# every optional tool removed and the terminal denied. Its rows go to their own results file.
GROK_ENV = {f'GROK_{vendor}_{cell}_ENABLED': 'false'
            for vendor in ('CLAUDE', 'CURSOR') for cell in ('SKILLS', 'AGENTS', 'RULES', 'MCPS', 'HOOKS')}
GROK_ENV.update(GROK_MEMORY='0', GROK_SUBAGENTS='0')
GROK_TOOLS = ('run_terminal_command,read_file,search_replace,list_dir,grep,kill_command_or_subagent,todo_write,'
              'get_command_or_subagent_output,spawn_subagent,scheduler_create,scheduler_delete,scheduler_list,'
              'monitor,search_tool,use_tool,workflow,enter_plan_mode,exit_plan_mode,ask_user_question,'
              'send_feedback,image_gen,image_edit,image_to_video,reference_to_video,write')
LEAKS = ('/.claude/', 'central drone', 'fixed capsule', r'\n- field:')   # as written in a JSON record


def grok_session(cwd, session):
    """What Grok kept of a call: its context and its tool calls, or None if it can't be found."""
    path = Path.home() / '.grok/sessions' / urllib.parse.quote(cwd, safe='') / session / 'chat_history.jsonl'
    return path.read_text() if path.exists() else None


def grok(model, prompt, images, timeout):
    if not model:
        raise Skip('the unisolated grok decoder is retired; use grok:4.7')
    if _grok_spent[0]:
        raise Skip('grok is at its usage limit')
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
        cwd, home = empty_dir(), empty_dir()
        env = {**os.environ, **GROK_ENV, 'HOME': home, 'GROK_HOME': str(Path.home() / '.grok')}
        try:
            done = subprocess.run(
                ['grok', '--prompt-json', payload, '--output-format', 'json', '--disable-web-search',
                 '-m', 'grok-' + model, '--disallowed-tools', GROK_TOOLS, '--deny', 'run_terminal_command',
                 '--permission-mode', 'default', '--max-turns', '1', '--no-subagents',
                 '--reasoning-effort', 'low', '--system-prompt-override', SYSTEM, '--cwd', cwd],
                stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=timeout, env=env)
        finally:
            shutil.rmtree(cwd, ignore_errors=True)
            shutil.rmtree(home, ignore_errors=True)
        if 'too quickly' in done.stdout + done.stderr and attempt < 3:
            time.sleep(60*(attempt + 1))
            continue
        if 'usage limit' in done.stdout + done.stderr:
            _grok_spent[0] = True
            raise Skip('grok is at its usage limit')
        try:                                   # the answer is the first JSON object on stdout
            answer, _ = json.JSONDecoder().raw_decode(done.stdout[done.stdout.index('{'):])
        except ValueError:
            raise Failed('grok: ' + (done.stderr or done.stdout)[-300:])
        kept = grok_session(cwd, answer.get('sessionId', ''))
        if kept is None:
            raise Failed("grok: the session record can't be found, so its isolation can't be checked")
        if any(leak in kept for leak in LEAKS):
            raise Failed('grok session was not isolated')
        if not answer.get('text'):
            raise Failed('grok: ' + done.stdout[-300:])
        return {'text': answer['text'], 'model': ', '.join(answer.get('modelUsage', {})) or 'grok',
                'tool_calls': kept.count('"tool_calls": [{') + kept.count('"tool_calls":[{')}


_grok_lock = threading.Lock()
_grok_last = [0.0]
_grok_spent = [False]          # at its usage limit: no more calls this run
_codex_lock = threading.Lock()
_codex_spent = [False]         # out of credits: no more calls this run
_codex_checked = [None]        # why its context isn't isolated ('' when it is), once checked
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
