# Offline grading repair evidence — 2026-10-07

## Scope and result

**Partial audit remediation, not release approval.** This batch repairs ordinary false positives under the existing simulated exercise contracts. `changed-files.json` lists exact production/test files with before/after SHA-256 hashes; `changes.patch` is the review diff. Original source/grading snapshots are under `before/`. No Git operations occurred.

### RED → GREEN

Commands ran from `/Users/juanierace/Documents/Projects/AI Projects/ai-engineering-academy`:

```sh
PYTHONDONTWRITEBYTECODE=1 /Users/juanierace/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -B apps/executor/grading/test_contracts.py
OPENSSL_CONF=/dev/null ACADEMY_PYTHON=/Users/juanierace/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 /Users/juanierace/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node apps/executor/node_modules/vitest/vitest.mjs run apps/executor/src/grade-boundary.test.ts
OPENSSL_CONF=/dev/null /Users/juanierace/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node apps/executor/node_modules/typescript/bin/tsc --noEmit -p apps/executor/tsconfig.json
```

- `python-red.txt`: 15 tests, 18 expected assertion failures (subcases), exit 1.
- `node-red.txt`: 12 tests, 10 failures/2 passes, exit 1. Absent/failed/malformed payloads improperly entered the grader before the fix.
- `contrast-red.txt`: 16 tests, 1 expected failure proving real calls plus hardcoded output still passed; a second normal-input mock response now contrasts with the first.
- `returned-agent-red.txt`: 17 tests, 1 expected failure proving returning Planner instead of the declared Manager passed; harness records returned mock agent name now.
- `python-green.txt`: 17 tests pass, exit 0. Six taught Python positive controls plus benign incorrect implementations and subcases exercised the real harness/dispatcher. The seventh positive control is the TypeScript valid-submit case in the boundary suite.
- `node-green.txt`: 12 tests pass, exit 0. Process isolation alone is mocked; grading dispatcher remains real. Valid submit and unchanged ungraded Run controls pass.
- `typecheck.txt`: executor TypeScript check passes, exit 0.

`OPENSSL_CONF=/dev/null` applies to these OFFLINE invocations only (default runtime cannot read system OpenSSL configuration). No global environment changes, installs, build/dev servers, account changes, or live submissions.

## Verified behavior

- Submit rejects unless harness `ok` is exactly boolean `true`; included call results must be a nonempty array with strict success. Run retains process-success semantics and empty feedback.
- Capstone requires simulated API success/error observations, blank-call avoidance, error fallback, and contrasting output extraction; fixed strings alone fail.
- LangGraph project requires a compiled snapshot from one mock graph with callable draft/review registrations, draft entry, and valid draft→review edge. Missing function, missing target, wrong source, missing entry/compile, noncallable draft and mixing separate graph traces fail.
- ADK declared mock agents must be researcher then writer, not reversed, duplicated or arbitrary objects. **No agent execution/order propagation was verified.**
- SDK Manager must declare actual Planner/Writer mock handoffs and be the returned named mock Agent. **No planning/search/writing orchestration was verified.**
- JSON-format drill requires the supplied `text_format` unchanged. **Real schema validity remains unfixed:** fixture/lesson omit schema; requiring one would change curriculum.
- Checkpointer drill requires callable draft, entry, compile and current supplied boolean-saver value. **Persistence remains unverified:** current manifest supplies `true`, not a real saver; constant `true` vs passing the argument is not distinguishable in that fixture.

## Remaining release blockers / unavailable checks

- **Learner-controlled traces/results remain forgeable.** All added evidence is emitted inside the learner process and cannot certify hostile-learner isolation. Hidden-grader write protection and isolation policy remain unchanged. This requires a separately approved boundary redesign.
- Python tests run benign source offline outside the production sandbox only. They are grading-contract evidence, never sandbox security evidence.
- Full existing executor sandbox suite and root workspace suite: **not_verified** under this pure-tests-only batch. No sandbox/network workaround was attempted. Real SDK conformance, browser QA, full build: **not_verified**.
- Graph mock only records construction; no node invocation, real compile, or checkpoint persistence is established.
- **Return-object identity remains unbound for graphs, ADK pipelines, and same-name SDK Managers.** Constructing the correct object last and then returning an earlier invalid object of the same type/name may still pass. Current return type/name checks do not associate the returned instance with its construction trace. These are residual preexisting limitations, not newly introduced regressions.
- Snapshot copy included a preexisting `__pycache__`; cleanup was denied. No retry/escalation/chmod. Cache paths are excluded from the review manifest/diff. Before-snapshot duplicates are evidence, not project source changes.

Review package support files: this evidence, before snapshots, plan at `docs/superpowers/plans/2026-10-07-grading-repair.md`, seven command logs, file/hash manifest and unified patch. These generated files are separate from the exact executor source/test change manifest.
