import { describe,expect,it } from 'vitest';
import { SparseTape,TuringMachineEngine,validateMachine } from '../engine';
import { binaryIncrement,builtInMachines,ending01,equalZeroOne,evenOnes,palindrome,unaryIncrement } from '../machines';

const run=(machine:typeof ending01,input:string,limit=10000)=>{const e=new TuringMachineEngine(machine);e.initializeMachine(input);return {c:e.runUntilHalt({stepLimit:limit}),e}};
const words=(max:number)=>Array.from({length:2**(max+1)-1},(_,n)=>n===0?'':(n+1).toString(2).slice(1));

describe('formal validation',()=>{
 it('accepts every built-in definition',()=>builtInMachines.forEach(m=>expect(validateMachine(m)).toEqual({valid:true,errors:[]})));
 it('rejects duplicate transitions',()=>{const m=structuredClone(ending01);m.transitions.push({...m.transitions[0]});expect(validateMachine(m).errors.join()).toMatch(/Duplicate/)});
 it('rejects invalid initial state, symbols, and halting transitions',()=>{const m=structuredClone(ending01);m.initialState='nope';m.transitions[0].writeSymbol='Z';m.transitions.push({currentState:'qAccept',readSymbol:'0',nextState:'q0',writeSymbol:'0',movement:'R'});const x=validateMachine(m).errors.join();expect(x).toMatch(/Initial/);expect(x).toMatch(/unknown symbol/);expect(x).toMatch(/Halting/)});
});
describe('sparse tape and execution semantics',()=>{
 it('reads implicit blanks and supports negative writes',()=>{const t=new SparseTape('□');expect(t.read(-99)).toBe('□');t.write(-2,'1');expect(t.read(-2)).toBe('1');t.write(-2,'□');expect(t.entries()).toEqual([])});
 it('moves left, right, and stationary',()=>{const m={...unaryIncrement,id:'moves',states:['a','b','c','ok','no'],initialState:'a',acceptingStates:['ok'],rejectingStates:['no'],inputAlphabet:['1'],tapeAlphabet:['1','□'],transitions:[{currentState:'a',readSymbol:'1',nextState:'b',writeSymbol:'1',movement:'L' as const},{currentState:'b',readSymbol:'□',nextState:'c',writeSymbol:'□',movement:'R' as const},{currentState:'c',readSymbol:'1',nextState:'ok',writeSymbol:'1',movement:'S' as const}]};const {c}=run(m,'1');expect(c.runtimeStatus).toBe('ACCEPTED');expect(c.headPosition).toBe(0);expect(c.stepCount).toBe(3)});
 it('reports STUCK, not rejected, for a missing rule',()=>{const m={...unaryIncrement,transitions:[]};const {c}=run(m,'1');expect(c.runtimeStatus).toBe('STUCK');expect(c.stepCount).toBe(0)});
 it('reports STEP_LIMIT_REACHED for a loop',()=>{const m={...unaryIncrement,acceptingStates:['qAccept'],transitions:[{currentState:'qScan',readSymbol:'1',nextState:'qScan',writeSymbol:'1',movement:'S' as const},{currentState:'qScan',readSymbol:'□',nextState:'qScan',writeSymbol:'□',movement:'S' as const}]};const {c}=run(m,'1',12);expect(c.runtimeStatus).toBe('STEP_LIMIT_REACHED');expect(c.stepCount).toBe(12)});
 it('creates, restores, resets, and exports complete snapshots',()=>{const e=new TuringMachineEngine(ending01);e.initializeMachine('1101');e.executeStep();e.executeStep();expect(e.getExecutionHistory()).toHaveLength(3);expect(e.restoreSnapshot(1).stepCount).toBe(1);expect(e.resetExecution().stepCount).toBe(0);expect(JSON.parse(e.exportExecutionTrace()).input).toBe('1101')});
});
describe('independent algorithm oracles',()=>{
 it('matches endsWith(01) exhaustively through length 7',()=>words(7).forEach(w=>expect(run(ending01,w).c.runtimeStatus).toBe(w.endsWith('01')?'ACCEPTED':'REJECTED')));
 it('matches parity exhaustively through length 7',()=>words(7).forEach(w=>expect(run(evenOnes,w).c.runtimeStatus).toBe([...w].filter(x=>x==='1').length%2===0?'ACCEPTED':'REJECTED')));
 it('matches 0^n1^n exhaustively through length 6',()=>words(6).forEach(w=>expect(run(equalZeroOne,w).c.runtimeStatus).toBe(/^(0*)(1*)$/.test(w)&&w.replace(/1/g,'').length===w.replace(/0/g,'').length?'ACCEPTED':'REJECTED')));
 it('matches reversal palindrome oracle through length 6',()=>words(6).forEach(w=>expect(run(palindrome,w).c.runtimeStatus).toBe(w===[...w].reverse().join('')?'ACCEPTED':'REJECTED')));
 it('increments unary length including empty',()=>['','1','111','1'.repeat(30)].forEach(w=>{const {c}=run(unaryIncrement,w);expect(c.runtimeStatus).toBe('ACCEPTED');expect(c.tape.displayString()).toBe('1'.repeat(w.length+1))}));
 it('increments binary values with documented leading-zero rules',()=>['','0','1','001','1011','111','0'.repeat(12)].forEach(w=>{const {c}=run(binaryIncrement,w);const n=w===''?0n:BigInt(`0b${w}`);let expected=(n+1n).toString(2);if(w.length>expected.length)expected=expected.padStart(w.length,'0');expect(c.tape.displayString()).toBe(expected)}));
 it('reproduces the M1 trace exactly',()=>{const {c,e}=run(ending01,'1101');expect(c.runtimeStatus).toBe('ACCEPTED');expect(c.stepCount).toBe(5);expect(c.headPosition).toBe(4);expect(c.tape.displayString()).toBe('1101');expect(e.getExecutionHistory().map(x=>x.currentState)).toEqual(['q0','q0','q0','q1','q2','qAccept'])});
 it('rejects the manual counterexample 1110',()=>{const {c}=run(ending01,'1110');expect(c.runtimeStatus).toBe('REJECTED');expect(c.stepCount).toBe(5)});
});
