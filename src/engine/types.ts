export type Movement = 'L' | 'R' | 'S';
export type RuntimeStatus = 'READY'|'RUNNING'|'PAUSED'|'ACCEPTED'|'REJECTED'|'STUCK'|'STEP_LIMIT_REACHED'|'ERROR';
export interface Transition { currentState:string; readSymbol:string; nextState:string; writeSymbol:string; movement:Movement }
export interface ExampleInput { input:string; expectedStatus:'ACCEPTED'|'REJECTED'; expectedOutput?:string }
export interface MachineDefinition { id:string; name:string; description:string; language:string; states:string[]; inputAlphabet:string[]; tapeAlphabet:string[]; blankSymbol:string; initialState:string; acceptingStates:string[]; rejectingStates:string[]; transitions:Transition[]; exampleInputs:ExampleInput[] }
export interface SerializedTape { cells:[number,string][]; blankSymbol:string }
export interface MachineConfiguration { currentState:string; tape:SparseTape; headPosition:number; stepCount:number; runtimeStatus:RuntimeStatus }
export interface ExecutionSnapshot { stepNumber:number; previousState:string; currentState:string; headPositionBefore:number; headPositionAfter:number; readSymbol:string; writtenSymbol:string; movement:Movement|'—'; appliedTransition:Transition|null; tapeSnapshot:SerializedTape; runtimeStatus:RuntimeStatus; explanatoryText:string }
export interface ValidationResult { valid:boolean; errors:string[] }
export interface RunOptions { stepLimit?:number; timeLimitMs?:number }
export type SerializedExecution = Omit<ExecutionSnapshot,'tapeSnapshot'> & { tapeSnapshot:SerializedTape };
import type { SparseTape } from './tape';
