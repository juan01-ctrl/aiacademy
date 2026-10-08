# Commands and constraints

Absolute root asserted before each source snapshot; only selected source text copied. No Git state, learner data, generated caches, credentials, or real accounts read or included.

Bundled Node: `/Users/juanierace/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`.

From root:
`OPENSSL_CONF=/dev/null <node> apps/web/node_modules/vitest/vitest.mjs run --config apps/web/vitest.config.ts apps/web/src/components/workspace/learner-requests.test.tsx`
- RED: 26 failures / 4 passes, expected duplicate-fetch, rejected request, missing alert, malformed commit failures (red.log).
- GREEN: 36 passes, exit 0 (green.log). Six HTTP message variants added as supplementary branch coverage after initial RED/GREEN.
- Initial GREEN exposed one test-only overly broad text assertion: default console copy includes "output". Fixture/assertion narrowed to unique executed-output without changing production.

From apps/web:
`OPENSSL_CONF=/dev/null <node> node_modules/vitest/vitest.mjs run`
- 123 passes, 13 files, exit 0 (full-suite.log).
`OPENSSL_CONF=/dev/null <node> node_modules/typescript/bin/tsc --noEmit --incremental false`
- exit 0, no diagnostics (typecheck.log).

Incidents: /usr/bin/python3 failed before writing because Xcode tools unavailable; no installation attempted, used pre-approved bundled Python. zsh reserved variable `status` rejected exit capture after test; reran with `result`. No source/data side effects from either incident.

Evidence limits: real wired JSX handlers with stable mocked hook slots, deferred fetch and static rendered alert/controls; not mounted React, DOM, browser, keyboard, screen-reader or responsiveness evidence. No build/server/network/accounts exercised. Autosave and other forms are separate scope.
