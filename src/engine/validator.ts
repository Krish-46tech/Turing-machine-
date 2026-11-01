import type { MachineDefinition,ValidationResult } from './types';
export function validateMachine(m:MachineDefinition):ValidationResult {
  const e:string[]=[]; const stateSet=new Set(m.states); const tapeSet=new Set(m.tapeAlphabet);
  if(!m.states.length)e.push('Q must contain at least one state.');
  if(new Set(m.states).size!==m.states.length)e.push('State names must be unique.');
  if(!stateSet.has(m.initialState))e.push('Initial state must belong to Q.');
  if(!tapeSet.has(m.blankSymbol))e.push('Blank symbol must belong to the tape alphabet.');
  if(m.inputAlphabet.includes(m.blankSymbol))e.push('Blank symbol cannot belong to the input alphabet.');
  for(const s of m.inputAlphabet)if(!tapeSet.has(s))e.push(`Input symbol ${s} is not in the tape alphabet.`);
  for(const s of [...m.acceptingStates,...m.rejectingStates])if(!stateSet.has(s))e.push(`Halting state ${s} is not in Q.`);
  if(m.acceptingStates.some(s=>m.rejectingStates.includes(s)))e.push('Accepting and rejecting states must be distinct.');
  const seen=new Set<string>(); const halting=new Set([...m.acceptingStates,...m.rejectingStates]);
  for(const t of m.transitions){
    if(!stateSet.has(t.currentState)||!stateSet.has(t.nextState))e.push(`Transition references an unknown state: ${t.currentState} → ${t.nextState}.`);
    if(!tapeSet.has(t.readSymbol)||!tapeSet.has(t.writeSymbol))e.push(`Transition uses an unknown symbol: ${t.readSymbol} → ${t.writeSymbol}.`);
    if(!['L','R','S'].includes(t.movement))e.push(`Invalid movement ${String(t.movement)}.`);
    if(halting.has(t.currentState))e.push(`Halting state ${t.currentState} cannot have outgoing transitions.`);
    const k=`${t.currentState}\u0000${t.readSymbol}`; if(seen.has(k))e.push(`Duplicate transition for (${t.currentState}, ${t.readSymbol}).`); seen.add(k);
  }
  return {valid:e.length===0,errors:[...new Set(e)]};
}
export function validateInput(m:MachineDefinition,input:string):string[] { return [...input].filter((s,i,a)=>!m.inputAlphabet.includes(s)&&a.indexOf(s)===i).map(s=>`Symbol “${s}” is not in Σ = {${m.inputAlphabet.join(', ')}}.`); }
