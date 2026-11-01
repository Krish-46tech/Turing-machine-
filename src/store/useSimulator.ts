import { create } from 'zustand';
import { builtInMachines,ending01 } from '../machines';
import { TuringMachineEngine,validateInput,validateMachine } from '../engine';
import type { MachineConfiguration,MachineDefinition,RuntimeStatus } from '../engine';

interface SimulatorState { machine:MachineDefinition; input:string; engine:TuringMachineEngine; configuration:MachineConfiguration; running:boolean; speed:number; selectedHistory:number; inputErrors:string[]; setMachine:(m:MachineDefinition)=>void; setInput:(s:string)=>void; initialize:()=>void; step:()=>void; run:()=>void; pause:()=>void; reset:()=>void; back:()=>void; jump:(i:number)=>void; setSpeed:(n:number)=>void; updateMachine:(m:MachineDefinition)=>void }
const make=(m:MachineDefinition,input:string)=>{const e=new TuringMachineEngine(m);return {e,c:e.initializeMachine(input)}};
const initial=make(ending01,'1101');
export const useSimulator=create<SimulatorState>((set,get)=>({machine:ending01,input:'1101',engine:initial.e,configuration:initial.c,running:false,speed:500,selectedHistory:0,inputErrors:[],
 setMachine:(m)=>{const sample=m.exampleInputs[0]?.input??'';const n=make(m,sample);localStorage.setItem('turinglab-machine',JSON.stringify(m));set({machine:m,input:sample,engine:n.e,configuration:n.c,running:false,selectedHistory:0,inputErrors:[]})},
 setInput:(input)=>set({input,inputErrors:validateInput(get().machine,input),running:false}),
 initialize:()=>{const s=get();if(s.inputErrors.length)return;const n=make(s.machine,s.input);set({engine:n.e,configuration:n.c,running:false,selectedHistory:0})},
 step:()=>{const s=get();if(s.inputErrors.length)return;const c=s.engine.executeStep();set({configuration:c,running:false,selectedHistory:s.engine.getExecutionHistory().length-1})},
 run:()=>{const s=get();if(s.inputErrors.length)return;if(['ACCEPTED','REJECTED','STUCK','STEP_LIMIT_REACHED','ERROR'].includes(s.configuration.runtimeStatus))return;set({running:true})},
 pause:()=>{const s=get();set({running:false,configuration:s.engine.pauseExecution()})},
 reset:()=>{const s=get();set({running:false,configuration:s.engine.resetExecution(),selectedHistory:0})},
 back:()=>{const s=get();const i=Math.max(0,s.engine.getExecutionHistory().length-2);set({running:false,configuration:s.engine.restoreSnapshot(i),selectedHistory:i})},
 jump:(i)=>{const s=get();set({running:false,configuration:s.engine.restoreSnapshot(i),selectedHistory:i})},
 setSpeed:(speed)=>set({speed}),
 updateMachine:(machine)=>{const v=validateMachine(machine);if(!v.valid)throw new Error(v.errors.join('\n'));get().setMachine(machine)}
}));
export const isTerminal=(s:RuntimeStatus)=>['ACCEPTED','REJECTED','STUCK','STEP_LIMIT_REACHED','ERROR'].includes(s);
export {builtInMachines};
