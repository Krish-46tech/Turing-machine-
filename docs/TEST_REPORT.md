# TuringLab Test Report

Execution date: 30 October 2026 (Asia/Kolkata)

## Final summary

| Gate | Command | Expected | Actual | Status |
|---|---|---|---|---|
| TypeScript and production build | `pnpm run build` | No type errors; deployable bundle | 2,234 modules transformed; bundle created | PASS |
| Lint | `pnpm run lint` | No lint errors | 0 errors | PASS |
| Unit, algorithm, integration | `pnpm run test` | All assertions pass | 19/19 tests passed in 2 files | PASS |
| Browser E2E | `pnpm run test:e2e` | Critical workflows pass | 3/3 Chromium tests passed | PASS |
| Console quality | E2E console listener | No error/warning from app | No app console issues on final run | PASS |

## Coverage evidence

The 19 Vitest cases cover definition validation, duplicate transitions, malformed references, sparse blanks, negative positions, all three head movements, `STUCK`, bounded looping, snapshots, restore/reset/export, both manual traces, unary/binary output, and independent exhaustive oracles for four language recognizers. The exhaustive generators test all binary words through length 7 for suffix/parity and through length 6 for `0ⁿ1ⁿ`/palindrome.

The 3 Playwright workflows verify accepted and rejected ending-`01` inputs, exact five-transition count, unary output, rewind, run/pause, and the validated JSON editor in actual Chromium.

## Self-correction record

| Failure observed | Root cause | Fix | Final verification |
|---|---|---|---|
| Initial npm install stalled then failed with `edgesOut` resolver error | npm 10 resolver defect in the environment | Used pnpm 11 and committed its lock file | Dependencies installed |
| React Flow integration tests lacked `ResizeObserver` | jsdom does not provide the browser observer | Added test-only observer shim | 3 integration tests passed |
| Vitest collected Playwright specs | Test glob was too broad | Excluded `e2e/**` from Vitest | Suites isolated correctly |
| Integration DOM accumulated between tests | Cleanup was not registered explicitly | Added Testing Library cleanup after each test | No duplicate DOM |
| React Flow reported unsupported `bezier` edge type | v12 uses its default edge under `default` | Changed edge type and tightened browser console assertion | E2E passed without app warnings |

## Manual validation

Input `1101` on “Binary Strings Ending in 01” produced `ACCEPTED`, 5 transitions, final state `qAccept`, head index 4, and displayed tape `1101`. Input `1110` produced `REJECTED` in 5 transitions. Both match the independent manual derivation.

## Limitations of evidence

Testing proves the checked implementation behavior, not correctness for every possible user-authored machine. A step limit cannot prove nontermination. Visual QA was performed at a desktop Chromium viewport; responsive CSS is implemented, but the browser suite does not exhaust all device sizes.
