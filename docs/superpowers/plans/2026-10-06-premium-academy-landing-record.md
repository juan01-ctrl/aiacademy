# Premium Academy Landing — Implementation Record

## Envelope / routing

- version: 1
- owner: implementation
- source_inputs: approved `2026-10-06-premium-academy-landing.md`; original homepage; unchanged route/catalog/roadmap/course sources
- assumptions: preserve approved audience/offer scope; no new availability, outcome, pricing or certification claims
- open_questions: none blocking implementation; required rendered acceptance remains outstanding
- decision_log: user-approved reversible homepage redesign only; no publishing, dependencies, domain/auth changes, Git operations or release approval
- mode: existing
- selected_stages: content → art-direction → implementation → same-context self-check
- skipped_stages: strategy inherited from approved scope; conversion not_applicable (no separate conversion review requested); independent QA reserved for orchestration

## BuildRecord

- changed_routes_and_components: homepage presentation only — `Landing.tsx`, new `HeroSection.tsx`, `RoadmapSection.tsx`, `LearningModelSection.tsx`; scoped additions to `globals.css`; new local `learning-loop.svg`; new `Landing.test.tsx`
- stack_choices: unchanged Next.js/React/TypeScript/Tailwind/HeroUI dependencies; native links/buttons for destinations and tabs; no added packages
- artifact_trace: Tasks 1–3 map to regression tests, section extraction, original artwork and scoped visual/motion system; Task 4 partial because build/rendering remain unverified
- interactions: preserved signed-in/out hero, account, catalog, course and final-start destinations; Google callback `/catalog`; native path anchor; roadmap click, arrow keys, Home/End, roving tabindex, existing panel IDs, inactive panels `hidden`
- asset_provenance: self-authored local `learning-loop.svg` illustrates Read → Write → Run → Submit/refine, decorative with empty alt and aria-hidden; hero workspace explicitly labeled illustrative, not a live editor
- tests_run: local direct CLI commands below
- known_deviations: package scripts could not execute in the environment; used installed CLIs directly after resilience audit; no Git or commit-backed ledger; typecheck completed after initial styling rather than before; lint/build/rendering not_verified

## Story / design / claims trace

- StoryMap: offer/action → roadmap/course discovery → read/write/run/submit learning model → first-course/account CTA → catalog footer
- DesignDirection: shared classroom teal `#0F5C73`, Inter/Fraunces/IBM Plex Mono and canvas/ink/soft/mark tokens; light editorial shell; original asymmetrical lesson workspace as signature rather than decorative mesh/stock imagery/competing signup card
- Motion: single 600ms transform-only entry sequence; core text never hidden or transparent; reduced-motion disables animation, transition and hover movement
- Responsive intent: stacked hero, wrapped tabs, single-column course cards, inset controls and wrapping code/content; actual viewport results not_verified
- Claims register: course data verified against authored YAML and supplied route data; roadmap topics sourced from unchanged `src/lib/roadmap.ts`; lesson flow preserves original product statements. Future availability, certificate promises, testimonials, metrics and outcome claims omitted.

## TDD / ledger

- Task 1 RED: initial runner failures were infrastructure, not assertion failures. With the audited isolated runtime and test-only React global (existing Vitest config uses classic JSX), 6 tests failed on missing hero/sections, semantic CTA links, panel linkage and empty states.
- Task 2 GREEN: same 6 tests passed after implementation. No Next/HeroUI mocks remain; tests statically render real components.
- Task 3: scoped CSS/motion implemented; web suite and TypeScript pass; lint startup blocked; build/rendering unverified.
- Self-review RED→GREEN: new test failed on missing inactive panel targets; fixed with all panels present and native hidden inactive state. Final web suite 7/7.
- Ruling: direct installed CLIs only for isolated local verification after parent resilience audit. Invocation-only OpenSSL override must not be used for network, installs, deployment, build, dev server or browser work. Cost: build/rendering remains blocked.
- Incident: attempted root-relative record path from web cwd returned `no such file or directory`; no write occurred. Fresh audit confirmed both intended file and misresolved parent/file absent. Resumed only for this absolute-path documentation write; no cleanup needed.
- Final review: author self-review only. Independent review remains the orchestrator's gate; no release approval implied.

## Exact verification evidence

Successful local runs used `/Users/juanierace/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node` with the audited invocation-only `OPENSSL_CONF=/dev/null`, exclusively for isolated installed local CLIs. No persistent config or dependency change.

| Check | Command / environment | Result |
| --- | --- | --- |
| Requested focused test | `pnpm --filter @academy/web test -- Landing.test.tsx` | infrastructure-blocked: OpenSSL config permission failure; initial override attempt then failed pnpm lifecycle `spawn EPERM` before Vitest |
| Bundled fallback pnpm | version/focused command, auto-download disabled | infrastructure-blocked: OpenSSL config permission failure |
| Direct bundled Node, no override | existing web Vitest CLI | infrastructure-blocked: `/System/Library/OpenSSL//openssl.cnf` `Operation not permitted` |
| Focused RED | root cwd, isolated bundled Node `apps/web/node_modules/vitest/vitest.mjs run --config apps/web/vitest.config.ts --pool=threads apps/web/src/components/home/Landing.test.tsx` | fail as intended: 6 missing redesign contracts |
| Final web suite | web cwd, isolated bundled Node `node_modules/vitest/vitest.mjs run --config vitest.config.ts --pool=threads` | pass: 7/7, Vitest 3.2.7 |
| Final web TypeScript | web cwd, isolated bundled Node `node_modules/typescript/bin/tsc --noEmit --incremental false -p tsconfig.json` | pass: exit 0 |
| Web lint | web cwd, isolated bundled Node `node_modules/eslint/bin/eslint.js .` | not_verified: ESLint 9.39.5 exits 2 before checking code; installed config cannot resolve `eslint-plugin-react-hooks` |
| Workspace-wide tests | root cwd, isolated bundled Node `apps/web/node_modules/vitest/vitest.mjs run --config apps/web/vitest.config.ts --pool=threads` | fail: 20 pass / 6 fail, 26 tests in 10 files |
| Build | not run: `layout.tsx` uses `next/font/google`; potential network requires no OpenSSL bypass | not_verified |
| Browser/dev server | not run under runtime bypass | not_verified |

All 6 workspace failures are in untouched `apps/executor/src/grade.test.ts`, returning `error` rather than:

1. returns deterministic feedback and does not leak the hidden canary — expected `failed`
2. does not treat a run as a grade — expected `ok`
3. accepts a caught API failure and still returns text on success — expected `passed`
4. requires instructions and input to stay separate — expected `passed`
5. grades a blank prompt without a second API call — expected `passed`
6. reports timeouts as operational failures — expected `timeout`

Underlying executor cause was not investigated/repaired within homepage scope. Other diagnostics: system Python failed before editing because Xcode developer tools were unavailable (edit subsequently used apply_patch); initial root TypeScript CLI path was absent (verified web-local CLI retried). Neither counts as a passing check.

## QAReport — same-context self-check, not independent acceptance

- scope_and_environment: existing non-Git target; local static render and TypeScript only, no browser
- checks_with_result:
  - pass: static signed-in/out destinations, course metadata, heading/section presence, default selected tab, all tab-panel targets, empty-step/roadmap fallbacks; web typecheck
  - fail: workspace executor suite (6 failures above)
  - not_verified: lint, build, 320/768/1024/1440 rendered reflow, long content, keyboard interactions/focus, measured contrast, reduced-motion preference, 200% zoom, console/network errors, unaffected-route behavior, Google auth invocation
- findings_with_severity_and_owner: required rendering/build checks block release (qa/environment); lint dependency resolution blocks lint evidence (environment); executor failures block green workspace suite (executor/environment)
- screenshots_or_measurements: none; no browser evidence claimed
- claim_verification: runtime course data contract preserved; unsupported availability/certification claims and fabricated proof omitted
- residual_risks: unrendered layout, no blanket accessibility/performance assurance, same-author review weaker than independent acceptance
- release_decision: blocked pending independent review, required rendered QA/build/lint evidence and executor-suite investigation; internal reversible implementation only
