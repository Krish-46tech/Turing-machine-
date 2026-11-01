# TuringLab Technical Documentation

## Runtime model

`TuringMachineEngine` accepts only definitions that pass `validateMachine`. Its transition lookup is a map keyed by the ordered pair `(state, symbol)`. `SparseTape` stores only nonblank cells in a `Map<number,string>`, so negative indexes work naturally and blank reads allocate nothing.

Each successful call to `executeStep` performs read → lookup → write → move → state update → snapshot → halting check. A missing lookup creates a `STUCK` snapshot. Accepting and rejecting states have no outgoing rules and stop immediately. `runUntilHalt` applies a transition and optional time budget. Identical valid machine, input, and limits produce an identical trace.

## Status contract

| Status | Meaning |
|---|---|
| `READY` | Initialized and not yet executing |
| `RUNNING` | A transition has executed and no terminal state was reached |
| `PAUSED` | Scheduled UI playback was stopped |
| `ACCEPTED` | An explicit accepting state was entered |
| `REJECTED` | An explicit rejecting state was entered |
| `STUCK` | A nonhalting configuration has no rule |
| `STEP_LIMIT_REACHED` | The configured resource bound was exhausted |
| `ERROR` | An execution error was surfaced |

## Validation invariants

The validator enforces nonempty unique states, `q0 ∈ Q`, `Σ ⊆ Γ`, `B ∈ Γ \ Σ`, disjoint accepting and rejecting states, valid references, valid movements, no outgoing transitions from halting states, and no duplicate `(state, symbol)` rules. Input symbols must belong to `Σ`.

## UI architecture

React renders the formal specification, bounded tape viewport, playback controls, React Flow graph, transition table, snapshot history, result banner, validation dashboard, JSON editor, and help. Zustand owns the active engine and synchronized UI state. A single cleanup-safe interval drives playback, and reset/pause/switching a machine cancels it through state changes and effect cleanup.

## Data interchange

Machine JSON is the `MachineDefinition` object documented in `src/engine/types.ts`. Imports are parsed then formally validated before activation. Machine definitions and execution traces download locally; the last valid selected machine is stored in browser local storage. No backend or account is required.

## Complexity

Under average JavaScript `Map` assumptions, transition lookup and tape read/write are expected `O(1)`, so one transition is expected `O(1)` excluding snapshot copying. A snapshot copies `k` nonblank tape cells, making recorded execution `O(k)` per step and `O(tk)` history space in a uniform upper-bound analysis. The displayed tape remains a fixed 15-cell window.

## Deployment

`pnpm build` creates a static `dist/`. Configure a static host with build command `pnpm build` and output directory `dist`. No environment variables are required.
