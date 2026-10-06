import {validateUpdate} from './continuity.mjs';

// One inquiry develops within a recognizable silhouette and enduring palette.
// Posture and palette are held almost still on purpose: the change is carried by
// what the field is made of, not by how much room it takes. These are authored
// examples, explicitly labeled as scripted.
// Each moment also has the conversation's side of it, for the legend: a short
// story in the assistant's words, and the lines of the reading it accounts for
// (keyed as in reading.mjs). Only a scripted study has one. A live field's
// author says nothing in words, and the legend must not say it for them.
const inquiry={form:'mantle',primary:'violet',secondary:'teal',
  ambient:'violet',ambient_strength:.42,flow:.12,stretch:.12,breadth:.7,
  intensity:.66,saturation:.95};
const scenes=[
  ['An opening question','A violet opening. Much of it is still inferred rather than met.','hold',
    {...inquiry,openness:.62,definition:.34,folding:.2,complexity:.22,tension:.1,
     grounding:.45,history:0},
    {story:'You have asked one open question and said little around it. I am interested, and most of what I take you to mean is still my guess.',
     here:{colour:'the interest in where it could go',softness:'not knowing yet what shape the question has',grounding:'the guessing'}}],
  ['Possibilities unfold','The same opening, now met more directly, keeping its earlier edge.','reach',
    {...inquiry,openness:.7,definition:.62,folding:.26,complexity:.4,tension:.12,
     grounding:.82,history:.6},
    {story:'You have said more, and the question has opened into several ways it could go. I am going on what you wrote now, and my first reading still shapes how I hear the rest.',
     here:{threads:'the several ways it could go',remains:'my first reading, still shaping how I hear the rest',grounding:'going on what you wrote, no longer on a guess'}}],
  ['A reservation remains','A second current parts through the inquiry and stays there.','gather',
    {...inquiry,openness:.68,definition:.72,folding:.42,complexity:.5,tension:.62,
     accent:'coral',accent_strength:.6,counterpoint:.78,imbalance:.12,
     grounding:.88,history:.72},
    {story:'One of those ways I do not think will hold, and it is the one you favour. I have said so. I still want to follow the question, and the reservation stays.',
     here:{colour:'the coral is the reservation',folding:'wanting to follow it and doubting it at once',pressure:'your wish to go on and my not being persuaded',current:'the reservation'}}],
  ['A clarification takes hold','The pressure relaxes; the second current narrows but does not close.','settle',
    {...inquiry,openness:.72,definition:.84,folding:.3,complexity:.52,tension:.2,
     accent:'coral',accent_strength:.32,counterpoint:.34,
     grounding:.96,history:.78},
    {story:'You explained what you meant, and most of the strain went out of it. Part of my reservation was a misunderstanding. Part of it I still hold.',
     here:{softness:'knowing better what we are talking about',pressure:'the strain easing once you had explained',current:'the part of the reservation I still hold'}}],
  ['Something carries forward','The opening returns, holding a ridge and a thread of what was resisted.','return',
    {...inquiry,openness:.78,definition:.88,folding:.24,complexity:.6,tension:.14,
     accent:'coral',accent_strength:.24,counterpoint:.22,
     grounding:1,history:.85},
    {story:'We are back with the open question, and it is clearer than when we began. What I resisted has become part of how I hold it. A little of the reservation is still with me.',
     here:{openness:'the question, open again',current:'the little of the reservation that is left',remains:'the disagreement, now part of how I hold the question',grounding:'all of it read, none of it guessed'}}]
];
export const STUDY=scenes.map(([label,description,transition,spec,reading],i)=>({label,description,reading,
  update:validateUpdate({version:1,conversation:'scripted-study',sequence:i+1,title:'A question takes shape',
    source:{turn:label,producer:'Field studio',kind:'scripted'},
    coverage:{early:'available',middle:'available',late:'available',basis:['verbatim'],gaps:'Authored demonstration; no real conversation is connected.'},
    spec,transition,at:new Date(Date.UTC(2026,8,24,12,i)).toISOString()})}));
