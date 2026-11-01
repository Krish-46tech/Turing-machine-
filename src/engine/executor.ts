import { SparseTape } from './tape';
import { validateInput,validateMachine } from './validator';
import type { ExecutionSnapshot,MachineConfiguration,MachineDefinition,RunOptions,RuntimeStatus,SerializedTape,Transition } from './types';

const terminal:RuntimeStatus[]=['ACCEPTED','REJECTED','STUCK','STEP_LIMIT_REACHED','ERROR'];
export class TuringMachineEngine {
  private configuration:MachineConfiguration|null=null;
  private history:ExecutionSnapshot[]=[];
  private initialInput='';
  private lookup=new Map<string,Transition>();
  constructor(public readonly machine:MachineDefinition){
    const check=validateMachine(machine); if(!check.valid)throw new Error(check.errors.join('\n'));
    for(const t of machine.transitions)this.lookup.set(this.key(t.currentState,t.readSymbol),t);
  }
  initializeMachine(input:string):MachineConfiguration { const errors=validateInput(this.machine,input); if(errors.length)throw new Error(errors.join('\n')); this.initialInput=input; this.configuration={currentState:this.machine.initialState,tape:new SparseTape(this.machine.blankSymbol,input),headPosition:0,stepCount:0,runtimeStatus:'READY'}; this.history=[]; this.history.push(this.initialSnapshot()); return this.getConfiguration(); }
  private initialSnapshot():ExecutionSnapshot { const c=this.required(); return {stepNumber:0,previousState:c.currentState,currentState:c.currentState,headPositionBefore:0,headPositionAfter:0,readSymbol:c.tape.read(0),writtenSymbol:c.tape.read(0),movement:'—',appliedTransition:null,tapeSnapshot:c.tape.serialize(),runtimeStatus:'READY',explanatoryText:`Initialized in ${c.currentState} with the head at index 0.`}; }
  getConfiguration():MachineConfiguration { const c=this.required(); return {...c,tape:c.tape.clone()}; }
  getCurrentSymbol():string{return this.required().tape.read(this.required().headPosition)}
  findTransition():Transition|undefined { const c=this.required(); return this.lookup.get(this.key(c.currentState,c.tape.read(c.headPosition))); }
  executeStep():MachineConfiguration {
    const c=this.required(); if(terminal.includes(c.runtimeStatus))return this.getConfiguration();
    if(this.machine.acceptingStates.includes(c.currentState)){c.runtimeStatus='ACCEPTED';return this.getConfiguration()}
    if(this.machine.rejectingStates.includes(c.currentState)){c.runtimeStatus='REJECTED';return this.getConfiguration()}
    const beforeState=c.currentState,beforeHead=c.headPosition,read=c.tape.read(beforeHead),t=this.findTransition();
    if(!t){c.runtimeStatus='STUCK';this.history.push({stepNumber:c.stepCount,previousState:beforeState,currentState:beforeState,headPositionBefore:beforeHead,headPositionAfter:beforeHead,readSymbol:read,writtenSymbol:read,movement:'—',appliedTransition:null,tapeSnapshot:c.tape.serialize(),runtimeStatus:'STUCK',explanatoryText:`No transition is defined for (${beforeState}, ${read}); the machine is stuck.`});return this.getConfiguration()}
    c.runtimeStatus='RUNNING'; c.tape.write(beforeHead,t.writeSymbol); c.headPosition+=t.movement==='L'?-1:t.movement==='R'?1:0; c.currentState=t.nextState; c.stepCount++;
    if(this.machine.acceptingStates.includes(c.currentState))c.runtimeStatus='ACCEPTED'; else if(this.machine.rejectingStates.includes(c.currentState))c.runtimeStatus='REJECTED';
    this.history.push({stepNumber:c.stepCount,previousState:beforeState,currentState:c.currentState,headPositionBefore:beforeHead,headPositionAfter:c.headPosition,readSymbol:read,writtenSymbol:t.writeSymbol,movement:t.movement,appliedTransition:{...t},tapeSnapshot:c.tape.serialize(),runtimeStatus:c.runtimeStatus,explanatoryText:`At step ${c.stepCount}, the machine read ${read} in ${beforeState}, wrote ${t.writeSymbol}, moved ${t.movement}, and entered ${c.currentState}.`});
    return this.getConfiguration();
  }
  runUntilHalt(options:RunOptions={}):MachineConfiguration { const limit=options.stepLimit??10000,start=Date.now(); let c=this.required(); while(!terminal.includes(c.runtimeStatus)){ if(c.stepCount>=limit){c.runtimeStatus='STEP_LIMIT_REACHED';break} if(options.timeLimitMs!==undefined&&Date.now()-start>=options.timeLimitMs){c.runtimeStatus='STEP_LIMIT_REACHED';break} this.executeStep(); c=this.required(); } return this.getConfiguration(); }
  pauseExecution(){const c=this.required();if(c.runtimeStatus==='RUNNING')c.runtimeStatus='PAUSED';return this.getConfiguration()}
  resetExecution(){return this.initializeMachine(this.initialInput)}
  getExecutionHistory(){return this.history.map(h=>({...h,tapeSnapshot:{...h.tapeSnapshot,cells:h.tapeSnapshot.cells.map(x=>[...x] as [number,string])}}))}
  restoreSnapshot(index:number):MachineConfiguration { const s=this.history[index];if(!s)throw new Error('Snapshot does not exist.');this.configuration={currentState:s.currentState,tape:SparseTape.deserialize(s.tapeSnapshot),headPosition:s.headPositionAfter,stepCount:s.stepNumber,runtimeStatus:s.runtimeStatus};this.history=this.history.slice(0,index+1);return this.getConfiguration(); }
  exportExecutionTrace(){return JSON.stringify({machineId:this.machine.id,input:this.initialInput,history:this.getExecutionHistory()},null,2)}
  private required(){if(!this.configuration)throw new Error('Machine is not initialized.');return this.configuration}
  private key(q:string,s:string){return `${q}\u0000${s}`}
}
export const tapeFromSnapshot=(s:SerializedTape)=>SparseTape.deserialize(s);
