import {validateUpdate} from './continuity.mjs';

// One inquiry develops within a recognizable silhouette and enduring palette.
// These are authored examples, explicitly labeled as scripted.
const inquiry={form:'mantle',primary:'violet',secondary:'teal',accent:'amber',accent_strength:.2,
  ambient:'violet',ambient_strength:.42,flow:.12,stretch:.12,breadth:.7,
  intensity:.64,saturation:.95,tension:.14,complexity:.35,counterpoint:.2};
const scenes=[
  ['An opening question','A violet opening, with room for something not yet clear.','hold',{...inquiry,openness:.58,definition:.3,folding:.2,complexity:.25,history:0}],
  ['Possibilities unfold','The same opening widens; its earlier edge stays within reach.','reach',{...inquiry,openness:.82,definition:.62,folding:.28,history:.6}],
  ['A reservation remains','A warm crease draws inward through the continuing inquiry.','gather',{...inquiry,openness:.66,stretch:-.32,flow:-.02,definition:.72,folding:.68,tension:.58,accent:'coral',accent_strength:.42,counterpoint:.48,imbalance:.15,history:.72}],
  ['A clarification takes hold','The crease relaxes, leaving a visible ridge in the opening.','settle',{...inquiry,openness:.73,stretch:-.08,flow:.06,definition:.78,folding:.3,tension:.2,accent_strength:.3,counterpoint:.24,history:.78}],
  ['Something carries forward','The opening returns with more room, carrying its changed edge.','return',{...inquiry,openness:.86,definition:.83,folding:.22,tension:.13,accent_strength:.26,history:.82}]
];
export const STUDY=scenes.map(([label,description,transition,spec],i)=>({label,description,
  update:validateUpdate({version:1,conversation:'scripted-study',sequence:i+1,title:'A question takes shape',
    source:{turn:label,producer:'Field studio',kind:'scripted'},
    coverage:{early:'available',middle:'available',late:'available',basis:['verbatim'],gaps:'Authored demonstration; no real conversation is connected.'},
    spec,transition,at:new Date(Date.UTC(2026,8,24,12,i)).toISOString()})}));
