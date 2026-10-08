# AI Engineering Academy — First Vertical Slice Design

**Status:** Implementation started 2026-09-30. Local runner is not a production sandbox.  
**Date:** 2026-09-30  
**Project root:** `/Users/juanierace/Documents/Projects/AI Projects/ai-engineering-academy`

## Goal

Build the first end-to-end learning slice of AI Engineering Academy: an authenticated learner opens an OpenAI API lesson, edits and runs Python, submits it for deterministic hidden-test grading in an isolated executor, receives actionable feedback, and has progress saved.

## Product scope

The Academy is a hands-on AI engineering learning platform. The exercise execution, grading, feedback, and progression loop is the product—not a content site with an editor attached.

The first release is deliberately one course module, one lesson, and two ordered exercises, not the full planned 20-lesson course or the long-term Academy. The first exercise will use an instrumented mock OpenAI SDK so correctness is deterministic and no paid model call is needed. It will verify a meaningful behavior such as making the expected `responses.create` call and returning `output_text`; a second, smaller exercise proves pass-to-unlock progression.

### In scope

- Sign up/sign in; require authentication before course work.
- One course/module/lesson with two ordered Python exercises; the first has starter code and at least one hint.
- Separate **Run** and **Submit** actions.
- Monaco editor, console output, reset-to-starter action, loading and error states.
- Ephemeral isolated Python execution; deterministic hidden tests; structured feedback.
- Persist attempts and completion; unlock the next item only after a pass.
- Version-controlled course source with schema validation and an import path to the runtime database.
- Automated unit/integration tests and a browser test for the full learner flow.

### Out of scope for this slice

- Multi-course catalog, full curriculum, course builder/CMS, teams, payments, social features, elaborate gamification, AI tutor, certifications, public certificate verification, analytics dashboard, multi-language runtimes, and real external model calls.
- A production sandbox vendor decision until its isolation, resource limits, networking, and operational guarantees are verified.

## Approaches considered

1. **Build the complete Academy platform first.** This appears comprehensive, but combines too many unproven subsystems and delays validation of the core learning loop.
2. **Build a polished UI with simulated execution.** This is quick to demo but leaves the platform's highest-risk behavior untested and could create a misleading foundation.
3. **Build one real vertical slice (recommended).** Keep scope narrow while exercising authentication, content, editor, execution, grading, feedback, and progress together. The tradeoff is a small initial course, but the result validates the product's core architecture before expansion.

## Architecture

Use one repository with clearly separated deployable components:

- `apps/web`: Next.js App Router application for authentication, course experience, content reads, progress APIs, and the learner interface.
- `apps/executor`: separate service boundary for Python execution and grading. It must never execute learner code inside the Next.js process.
- `packages/contracts`: shared, versioned request/result schemas only; keep domain rules and hidden grader logic out of the browser package.
- `content/courses/openai-api-fundamentals`: structured public course metadata, lesson copy, exercise instructions, and starter code.
- `apps/executor/grading`: private mock SDK and hidden tests, packaged only for the executor.
- `db`: Drizzle schema and migrations for Supabase Postgres.

Use Next.js, React, TypeScript, Tailwind, Monaco, Supabase Auth/Postgres, and Drizzle as the initial stack, following the source brief. Use Vitest for unit/component tests and Playwright for end-to-end learner-flow tests. Keep dependency versions current and pinned when the project is initialized.

### Data ownership

- Supabase Auth owns identities and sessions.
- Postgres stores published course runtime records, enrollments, attempts, and learner progress.
- Version-controlled files remain the authoring source; an importer validates before publishing.
- Hidden tests, mock internals, and reference solutions are private executor assets and are never returned in browser responses or public course records.

### Execution and grading flow

1. The authenticated web app validates the exercise ID and submitted source size, then calls the executor with a short-lived, scoped request.
2. **Run** executes the learner program in an ephemeral sandbox and returns bounded stdout/stderr and status. It does not grade or unlock content.
3. **Submit** executes the learner program plus hidden tests in the sandbox. The executor returns a normalized result: `passed`, test feedback safe to show, bounded output, and an operational status.
4. The web app persists the attempt and updates progress transactionally only for a passing grade. A later item becomes available only after the required prerequisite passes.
5. Timeout, resource exhaustion, sandbox startup failure, and executor unavailability are operational failures—not incorrect answers and not completion.

The exact HTTP/API shape will be defined during implementation, with runtime validation at both service boundaries. Requests must be authenticated, rate-limited, and tied to an authorized exercise; results must not disclose private tests or solutions.

## Security and reliability requirements

- Use a disposable, resource-limited sandbox per run/submission, with a strict time limit, memory/CPU limits, output cap, and network denied by default.
- Treat source code, stdout/stderr, filenames, and all exercise submissions as untrusted input.
- Keep the executor separately deployed and reachable only through an authenticated service boundary; do not expose grader assets through the web deployment.
- Never treat a process exit code alone as a passing grade; tests determine correctness.
- Bound concurrency and submission sizes; provide distinct failure states and preserve attempt state on infrastructure failure.
- Verify selected sandbox provider guarantees before production execution is enabled. Local development may use a disposable isolated runner, but that is not evidence of production security.
- On this Mac, `sandbox-exec` aborts under `(deny default)`. The local runner uses `(allow default)` plus denied network and denied read of hidden tests. It does not isolate CPU, memory, or the grading trace from a hostile learner.

## UX requirements

- Desktop-first split workspace: lesson instructions and hints on the left; editor and console on the right.
- Clear distinction between Run and Submit. Run is exploratory; Submit is evaluative.
- Show accessible loading, empty, syntax/runtime error, test-failure, pass, timeout, and service-unavailable states.
- Failure feedback should identify the relevant behavior/concept without exposing hidden assertions or immediately revealing the full solution.
- Preserve learner code between navigation/reload where practical; Reset explicitly restores starter code after confirmation.

## Acceptance criteria

- A logged-out visitor cannot access the protected exercise workspace; sign-in returns the learner to the intended course location.
- A learner can load the lesson and edit starter Python in Monaco.
- Run displays bounded stdout/stderr and never marks progress complete.
- Submit runs hidden tests server-side and returns deterministic pass/fail feedback for the same input.
- Hidden tests and reference solutions are absent from browser-visible payloads and built client assets.
- A pass is persisted and unlocks the next item; a fail does not.
- Timeout or executor outage is shown as an operational error and cannot unlock content.
- Content schema/import validation rejects malformed course or exercise definitions before publication.
- Automated tests cover exercise schema validation, grading normalization, progression rules, hidden-test privacy, execution failures, and the end-to-end learner flow.

## Risks and decisions

- **Sandbox security is the critical risk.** The executor provider is intentionally not selected in this design; verify provider isolation and limits from authoritative documentation and validate them before connecting untrusted users.
- **Supabase SSR integration caveat:** current Supabase documentation describes `@supabase/ssr` as beta. Verify its status and supported setup at implementation time; keep auth behind an adapter boundary so an unstable integration can be replaced without changing learning-domain code.
- **First-course content quality:** one exercise proves infrastructure, not curriculum quality. Expand the course only after learner testing of this slice.
- **Mock fidelity:** tests should assert observable SDK calls and outputs without claiming the mock reproduces real provider behavior.

## Current references

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Server-Side Auth](https://supabase.com/docs/guides/auth/server-side)
- [Drizzle migrations](https://orm.drizzle.team/docs/migrations)
- [Next.js testing overview](https://nextjs.org/docs/app/guides/testing)
- [Playwright Test](https://playwright.dev/docs/next/intro)
