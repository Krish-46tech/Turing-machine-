import type { SerializedTape } from './types';

export class SparseTape {
  private cells = new Map<number,string>();
  constructor(public readonly blankSymbol:string, input = '', initial?:Iterable<[number,string]>) {
    if (initial) {
      for (const [i,s] of initial) if (s !== blankSymbol) this.cells.set(i,s);
    } else {
      for (let i=0;i<input.length;i++) if (input[i] !== blankSymbol) this.cells.set(i,input[i]);
    }
  }
  read(position:number):string { return this.cells.get(position) ?? this.blankSymbol; }
  write(position:number,symbol:string):void { if(symbol===this.blankSymbol) this.cells.delete(position); else this.cells.set(position,symbol); }
  clone():SparseTape { return new SparseTape(this.blankSymbol,'',this.cells); }
  serialize():SerializedTape { return { blankSymbol:this.blankSymbol, cells:[...this.cells.entries()].sort((a,b)=>a[0]-b[0]) }; }
  static deserialize(data:SerializedTape):SparseTape { return new SparseTape(data.blankSymbol,'',data.cells); }
  relevantBounds(head=0):[number,number] { const keys=[...this.cells.keys(),head]; return [Math.min(...keys),Math.max(...keys)]; }
  displayString():string { if(!this.cells.size) return ''; const [min,max]=this.relevantBounds(); let s=''; for(let i=min;i<=max;i++) s+=this.read(i); return s.replace(new RegExp(`^${escapeRegExp(this.blankSymbol)}+|${escapeRegExp(this.blankSymbol)}+$`,'g'),''); }
  entries():[number,string][] { return [...this.cells.entries()].sort((a,b)=>a[0]-b[0]); }
}
const escapeRegExp=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
