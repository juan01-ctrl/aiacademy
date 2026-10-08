# Progress-storage repair evidence

Scope: local progress-file safety only. Product changes are `progress-store.ts`,
synthetic `progress-storage.test.ts`, and the existing certificate test's IO mock.
The concise design/operations plan is `docs/superpowers/plans/2026-10-07-progress-storage.md`.

## Verification

- Baseline: 61 web tests passed in 11 files (exit 0).
- RED: full suite, 22 failed / 65 passed in 12 files (exit 1); expected fail-closed,
  atomic-write, extension-field preservation and competing-instance regressions.
  An initial timeout assertion caused an asynchronous assertion warning; it was
  corrected before the recorded RED run, without production edits.
- GREEN: 87 web tests passed in 12 files (exit 0).
- TypeScript: `--noEmit --incremental false` passed (exit 0).
- Real filesystem locking, crash/power-loss recovery, distributed deployment,
  rendered QA and release readiness: `not_verified`.

Exact execution cwd:
`/Users/juanierace/Documents/Projects/AI Projects/ai-engineering-academy/apps/web`.

Commands (only invocation-local OpenSSL override, no persistent environment change):

```sh
OPENSSL_CONF=/dev/null /Users/juanierace/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/vitest/vitest.mjs run
OPENSSL_CONF=/dev/null /Users/juanierace/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc --noEmit --incremental false
```

`red.txt`, `green.txt`, and `typecheck.txt` retain outputs. `manifest.json` lists
exact changed primary paths, selected before/after snapshots and their SHA-256
hashes. `full.diff` is a complete selected-text diff relative to this batch's
before state, NOT a Git clean-tree/entire historical diff. No real progress JSON
was accessed. No recursive/cache snapshots or filesystem cleanup were performed.
System `git status` was unavailable due missing developer tools; no install was
attempted, and the review package uses explicit file snapshots rather than Git.

Tests exercise the actual store using a fully mocked filesystem, including
malformed storage, missing-file versus permission failures, write/close/rename
faults, cleanup failure, exclusive-open collision, lock permission/release errors,
lock timeout with fake timers, two independently imported modules, and preservation
of historical course A/B credentials, maps, extension fields and all mutations.

## Limits and recovery

See the plan for mandatory offline orphan-lock recovery and single-local-filesystem
constraints. No automatic lock reclamation or empty-store corruption recovery.
Writes use private `0600` files and rename for atomic visibility, not fsync durability.
A lock-release error after a committed rename rejects with potentially committed
state; inspect before retrying non-idempotent attempts. All deployed writers must
use this protocol and the same cwd/storage path; this is not a distributed database.

Independent risk/reliability/resilience review is pending parent orchestration.
