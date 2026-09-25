import {validateUpdate} from './continuity.mjs';

// One inquiry develops within a recognizable silhouette and enduring palette.
// Posture and palette are held almost still on purpose: the change is carried by
// what the field is made of, not by how much room it takes. These are authored
// examples, explicitly labeled as scripted.
const inquiry={form:'mantle',primary:'violet',secondary:'teal',
  ambient:'violet',ambient_strength:.42,flow:.12,stretch:.12,breadth:.7,
  intensity:.66,saturation:.95};
const scenes=[
  ['An opening question','A violet opening. Much of it is still inferred rather than met.','hold',
    {...inquiry,openness:.62,definition:.34,folding:.2,complexity:.22,tension:.1,
     grounding:.45,history:0}],
  ['Possibilities unfold','The same opening, now met more directly, keeping its earlier edge.','reach',
    {...inquiry,openness:.7,definition:.62,folding:.26,complexity:.4,tension:.12,
     grounding:.82,history:.6}],
  ['A reservation remains','A second current parts through the inquiry and stays there.','gather',
    {...inquiry,openness:.68,definition:.72,folding:.42,complexity:.5,tension:.62,
     accent:'coral',accent_strength:.6,counterpoint:.78,imbalance:.12,
     grounding:.88,history:.72}],
  ['A clarification takes hold','The pressure relaxes; the second current narrows but does not close.','settle',
    {...inquiry,openness:.72,definition:.84,folding:.3,complexity:.52,tension:.2,
     accent:'coral',accent_strength:.32,counterpoint:.34,
     grounding:.96,history:.78}],
  ['Something carries forward','The opening returns, holding a ridge and a thread of what was resisted.','return',
    {...inquiry,openness:.78,definition:.88,folding:.24,complexity:.6,tension:.14,
     accent:'coral',accent_strength:.24,counterpoint:.22,
     grounding:1,history:.85}]
];
export const STUDY=scenes.map(([label,description,transition,spec],i)=>({label,description,
  update:validateUpdate({version:1,conversation:'scripted-study',sequence:i+1,title:'A question takes shape',
    source:{turn:label,producer:'Field studio',kind:'scripted'},
    coverage:{early:'available',middle:'available',late:'available',basis:['verbatim'],gaps:'Authored demonstration; no real conversation is connected.'},
    spec,transition,at:new Date(Date.UTC(2026,8,24,12,i)).toISOString()})}));
