import { useMemo } from 'react';
import { Background,Controls,MarkerType,MiniMap,ReactFlow,type Edge,type Node } from '@xyflow/react';
import type { MachineDefinition,Transition } from '../engine';

export function StateGraph({machine,current,active}:{machine:MachineDefinition;current:string;active:Transition|null}){
 const nodes=useMemo<Node[]>(()=>machine.states.map((id,i)=>{const angle=(i/machine.states.length)*Math.PI*2;const accepting=machine.acceptingStates.includes(id),rejecting=machine.rejectingStates.includes(id);return{id,position:{x:270+Math.cos(angle)*205,y:165+Math.sin(angle)*125},data:{label:id},className:`state-node ${accepting?'accepting':''} ${rejecting?'rejecting':''} ${id===current?'current':''}`}}),[machine,current]);
 const edges=useMemo<Edge[]>(()=>machine.transitions.map((t,i)=>({id:`${t.currentState}-${t.readSymbol}-${i}`,source:t.currentState,target:t.nextState,label:`${t.readSymbol} → ${t.writeSymbol}, ${t.movement}`,type:'default',markerEnd:{type:MarkerType.ArrowClosed},animated:active?.currentState===t.currentState&&active.readSymbol===t.readSymbol,className:active?.currentState===t.currentState&&active.readSymbol===t.readSymbol?'active-edge':''})),[machine,active]);
 return <div className="graph" data-testid="state-graph"><ReactFlow nodes={nodes} edges={edges} fitView minZoom={.3} maxZoom={1.6} nodesDraggable><Background gap={22} size={1}/><MiniMap pannable zoomable/><Controls/></ReactFlow></div>
}
