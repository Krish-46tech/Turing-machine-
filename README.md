# TuringLab

TuringLab is a browser-based deterministic single-tape Turing machine simulator for CSET302. It separates a strict TypeScript computation engine from a React interface and makes every transition inspectable through a sparse infinite tape, state graph, transition table, and execution history.

## Quick start

Requirements: Node.js 22 or later and pnpm 11 or later.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173`.

## Verification

```bash
pnpm run lint
pnpm run test
pnpm run build
pnpm exec playwright install chromium
pnpm run test:e2e
```

## Features

- Formal model `M = (Q, Σ, Γ, δ, q0, B, F)` with explicit accepting, rejecting, stuck, limit, and error outcomes.
- Sparse `Map<number,string>` tape with negative positions and implicit blanks.
- Step, run, pause, reset, rewind, speed control, history navigation, and keyboard shortcuts.
- React Flow state diagram with current-state and active-transition highlighting.
- JSON machine editor, import/export, trace export, input validation, light/dark themes, and presentation mode.
- Six tested machines: unary increment, binary increment, ending in `01`, even number of `1`s, `0ⁿ1ⁿ`, and binary palindrome.
- Validation dashboard and independent exhaustive algorithm-oracle tests.

## Semantics

Symbols are individual Unicode characters. The tape is unbounded in both directions; only a 15-cell window is rendered. `L`, `R`, and `S` mean left, right, and stationary. A missing rule in a nonhalting state is `STUCK`. The default automated budget is 10,000 transitions; reaching it is `STEP_LIMIT_REACHED`, not rejection and not proof of an infinite loop.

## Project map

- `src/engine` — browser-independent validator, sparse tape, executor, snapshots.
- `src/machines` — complete built-in definitions.
- `src/components` — tape, graph, validation, and machine editor.
- `src/store` — synchronized simulator state and playback actions.
- `src/tests` — unit, algorithm, and integration tests.
- `e2e` — Playwright browser workflows.
- `docs` — report, diagrams, screenshots, and verification evidence.

Static output in `dist/` is compatible with Vercel, Netlify, or any static host.
