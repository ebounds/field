import {PRESETS} from './presets.mjs';
import {validateUpdate} from './continuity.mjs';

// Authored examples of possible development, explicitly labeled as scripted.
const scenes=[
  ['An opening question','Room for something not yet clear.','hold',PRESETS.tentative],
  ['Possibilities unfold','The inquiry finds space to move.','reach',{...PRESETS.exploring,history:.45}],
  ['A reservation remains','Care and resistance held together.','gather',{...PRESETS.strained,primary:'amber',secondary:'coral',tension:.64,intensity:.66,history:.58}],
  ['A clarification takes hold','Pressure softens without erasing its influence.','settle',{...PRESETS.gathered,primary:'teal',secondary:'amber',openness:.56,definition:.8,history:.78,counterpoint:.24}],
  ['Something carries forward','An earlier possibility returns in a changed form.','return',{...PRESETS.integrated,secondary:'violet',accent:'amber',accent_strength:.24,history:.82}]
];
export const STUDY=scenes.map(([label,description,transition,spec],i)=>({label,description,
  update:validateUpdate({version:1,conversation:'scripted-study',sequence:i+1,title:'A question takes shape',
    source:{turn:label,producer:'Field studio',kind:'scripted'},
    coverage:{early:'available',middle:'available',late:'available',basis:['verbatim'],gaps:'Authored demonstration; no real conversation is connected.'},
    spec,transition,at:new Date(Date.UTC(2026,8,24,12,i)).toISOString()})}));
