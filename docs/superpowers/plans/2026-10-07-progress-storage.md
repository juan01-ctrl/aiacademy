# Fail-safe local progress storage

## Scope and root cause

The progress reader treated every read/parse failure as an absent file, the writer
replaced the committed file directly, and its promise queue coordinated only one
module instance. A later mutation could erase unreadable or concurrently updated
learner records. Repair storage only; preserve certificate and course behavior.

## Bounded design

- Initialize empty only for the progress file's `ENOENT`. Reject other IO errors,
  invalid JSON, and malformed known fields before mutation. Legacy missing fields
  still receive existing defaults; unknown root/record/certificate fields survive.
- Hold an exclusive `progress.json.lock` directory across read, mutate, write and
  cleanup. Wait up to 100 intervals of 50ms on `EEXIST`, then reject visibly.
  Other acquisition failures reject immediately. Never infer a lock is stale.
- Open an exclusive UUID temporary file next to progress with mode `0600`; write,
  close, then rename over committed storage. Remove only an owned temporary path
  on failure. Cleanup/release failures remain visible, including combined errors.
- Keep exported APIs unchanged; reads see a complete old or new file without a
  write lock. Certificate/progress normalization remains backward-compatible.

## Constraints and operations

Only cooperating processes using the same absolute path on one trusted local
filesystem are covered. Current storage resolves from `process.cwd()`; every web
worker must use the same `apps/web` cwd and shared persistent directory. Separate
container-local copies, rolling workers using the old direct-write protocol,
network filesystems, hostile directory replacement, and distributed deployments
are not covered. No fsync/power-loss/database-durability guarantee is made. Rename
installs mode `0600`, so workers need the same OS identity or compatible access.

On orphan lock/failed release: take ALL writers offline first and confirm none
can restart (including old deployments). Preserve a restricted backup of the
committed progress file and any relevant temporary artifacts. Diagnose permissions
and validate JSON/schema without publishing learner data. Only an operator who
has confirmed quiescence may remove the exact empty `progress.json.lock` directory
(non-recursive removal). Never remove/reclaim by age or PID guess. Never replace
corruption with an empty store. Restore a verified backup under maintenance if
needed. Temporary leftovers are NOT committed and must not be automatically
promoted; inspect them offline and reconcile against committed data before any
manual recovery. Restart only after validation and compatible writer rollout.

A release failure can occur after rename committed successfully; the API rejects
but the mutation may already exist. Confirm committed state before retrying;
attempt recording is not idempotent. Errors bubble to existing callers; polished
learner request-error recovery remains a separate audit item.

## Execution and verification

1. Snapshot only the two selected existing source/test files.
2. Add synthetic filesystem tests and run the complete web suite RED.
3. Implement validation, atomic replacement, cross-instance locking and adapt the
   pre-existing certificate test's synthetic filesystem surface.
4. Run complete web suite GREEN and non-incremental TypeScript checks offline.
5. Publish selected before/after text, full diff, SHA-256 manifest and command logs.

No real learner-file reads/writes, installs, servers, builds, accounts, network,
secrets, commits, or live filesystem lock/fault tests. Independent review remains
required; these offline checks are not release approval or rendered QA.
