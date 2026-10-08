# Certificate repair review package

Exact scope: 12 selected product/test source files listed in changed-files.txt. Full selected-source before/after snapshots in before.json and after.json; full.patch contains all additions and edits relative to this repair (not baseline executor changes). sha256.json pins review input. Plan: ../../superpowers/plans/2026-10-07-course-certificates.md.

## Verification

Commands run from academy/apps/web using bundled Node:

`OPENSSL_CONF=/dev/null /Users/juanierace/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/vitest/vitest.mjs run`

- Baseline: pass, 29/29.
- RED: fail, 16 assertion/missing-helper failures and one missing navigation module; full output red.txt. Navigation identity skeleton RED: 2 assertions failed, navigation-red.txt. Unknown inherited course key RED: 3 failures, unknown-key-red.txt.
- Final GREEN: pass, 59/59 across 11 files, green.txt; exit 0.

`OPENSSL_CONF=/dev/null /Users/juanierace/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc --noEmit --incremental false`

- Final web typecheck: pass, exit 0, no diagnostics (typecheck.txt empty). Earlier test fixture spread-never diagnostic fixed.
- No install/reification, build, dev server, network calls, auth/account mutation, real learner IO, environment persistence, recursive snapshots, or git commits.

## Coverage and limits

Storage and issuance execute real production code against mocked in-memory filesystem; catalog/auth/executor boundaries synthetic. Tests preserve all populated historical/progress fields, save A/B, retain idempotent metadata/date and both mixed-record public paths, cover eight known metadata IDs plus unknown keys, submit A then B plus repeated Submit, and negative Run/failed/locked/unauthenticated/non-project/incomplete-lessons. Static server rendering verifies overview and project destination; pure production navigation transition verifies issued destination, ordinary lesson fallback, Run and failed Submit behavior. The actual browser click and Monaco integration remain not_verified; no DOM dependency installed.

Storage corruption/atomicity/concurrency architecture deliberately unchanged; separate next batch. Old credential claims intentionally retained as history, not rewritten. Current grader scope supports only simulated practice; this is not broader engineering certification or release approval.

## Incident evidence

Initial root-relative snapshot helper erroneously ran in apps/web and failed first source read before writing snapshots/plan or touching source. Only empty apps/web/docs/audits/certificate-repair-review directory chain was created. Removal was denied; dirs left. Parent commissioned fresh independent reliability/resilience audit and authorized resume, based on empty chain and preincident source mtimes; historical equality not_verified without baseline. Correct-root snapshot helper asserts absolute selected files before creating output.

## Review round 1: historical certificate recovery

Reviewer found: passed project B with legacy credential A hid Submit behind Continue, making B unrecoverable. Reproduced against the actual Workspace controls, not a mocked child: round1-red.txt has 1 assertion failure (missing Submit answer) and 3 passes. Initial incomplete synthetic project fixture error was corrected before the meaningful RED.

Minimal fix: ProjectPage grants initial client completion only for historically passed AND own-course certified projects. This changes local controls only, never clears stored progress. A passed-but-uncertified project exposes Submit answer for explicit revalidation; no historical credential is minted on GET or Run. Actual Workspace server rendering preserves ordinary passed exercise Continue and certified project Continue. Added route verification with historical B + legacy A: Run preserves progress and does not grant B; new graded Submit grants B and retains A/history.

Pre-fix selected source snapshot: round1-before.json (3 changed files); round1.patch isolates this review fix. after.json, full.patch and sha256.json refreshed for scoped fresh review.

Commands: same offline bundled Node Vitest run and tsc --noEmit --incremental false commands above. RED focused ProjectPage.test.tsx exit 1; final GREEN full web suite 61/61 across 11 files, round1-green.txt, exit 0; typecheck no diagnostics, round1-typecheck.txt, exit 0. Browser interaction remains not_verified. Pending scoped fresh review before completion.
