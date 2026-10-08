# Academy curriculum, learning integrity, and UX audit

Date: 2026-10-07 · Scope: all eight courses and the learner-facing website.

## Remediation progress — 2026-10-07

The findings below describe the **pre-repair audit snapshot**. Subsequent user-authorized repairs have been applied in bounded batches:

- **Grading contract repairs applied and independently reviewed:** Submit now validates strict harness success, not only process exit. Regression coverage rejects the reproduced missing-function and basic construction false positives; the API capstone checks simulated success/error calls and contrasting results. Offline verification: 17 Python contract tests, 12 executor boundary tests, and executor typecheck passed. [Exact scope and evidence](grading-repair-review/evidence.md).
- **Multi-course certificate repair applied and independently reviewed:** course-keyed certificates, backward-compatible legacy lookup, idempotent per-course issuance, course-specific completion metadata, own-course display, and freshly issued Continue destination. Historical passed-but-uncertified projects expose Submit for revalidation without clearing progress. Offline web suite: 61 tests passed; web typecheck passed. [Exact scope and evidence](certificate-repair-review/README.md).
- **Progress storage safety applied and independently reviewed:** only missing-file `ENOENT` initializes empty storage; corrupt/invalid/unreadable records fail closed. Exclusive same-directory temporary writes and atomic rename prevent partial-file replacement; a bounded cross-instance lock coordinates read-modify-write without automatically stealing locks. Legacy credentials/progress and extension fields remain preserved. Offline suite at this batch: 87 tests passed; typecheck passed. Scope is a cooperative trusted local filesystem—not power-loss or distributed durability. [Evidence and lock recovery guidance](progress-storage-review/README.md).
- **Core learner request recovery applied and independently reviewed:** Workspace, ExplanationStep, and EnrollButton now synchronously guard duplicate requests, reset pending state after failures, show retryable alerts, validate successful acknowledgments/results, and preserve existing navigation/completion semantics. Fresh offline full web suite: 123 tests passed across 13 files; non-incremental typecheck passed. Actual wired handlers and static markup were tested, not mounted browser interaction. [Commands, outputs, and limits](learner-request-review/commands.md).
- **Still unresolved:** learner-writable grading evidence and hidden-grader write isolation; return-object identity limitations; real-schema/SDK/persistence fidelity; deeper curriculum/projects; autosaved drafts; request recovery in assessment/profile/auth forms; unknown-course 404 handling; responsive/accessibility fixes and rendered QA. Storage power-loss/distributed durability and real process/crash testing remain outside the verified local repair scope. These repairs are not release approval or proof of hostile-learner sandbox safety.

Only source/tests and local planning/review evidence were changed for these repairs. No learner records, dependencies, accounts, live submissions, or deployment were modified. The original audit-only statement below refers to creation of the initial report.

## Verdict

The catalog is populated, but the academy is **not yet ready to support its broad engineering-certification claim**. The highest-priority problems are unreliable grading, incomplete end-to-end learning outcomes, and broken multi-course certification—not cosmetic polish.

This is an audit, not a release certification. No application code, curriculum, learner records, or dependencies were changed. Only this report was added.

## Evidence and limits

- **Source verified:** curriculum, roadmap, assessments, importer, executor, learner storage, and website components were independently reviewed.
- **Offline reproduced:** bounded Python harness/grader tests demonstrated unsupported passing results. These were not live API submissions or full sandbox exploits. No accounts or progress were mutated.
- **HTTP verified:** an existing server at `localhost:3000` returned the route results below. No server was started for the audit.
- **Rendered QA: not_verified.** Browser initialization failed because of a sandbox-blocked OpenSSL configuration read. Desktop/mobile appearance, keyboard behavior, and reduced-motion behavior therefore have not been independently demonstrated. Source-backed responsive risks are not screenshots.
- Published JSON inventory was compared with YAML filenames, IDs, and root metadata. Full nested YAML-to-JSON equality and the complete Vitest/executor sandbox suite are **not_verified**.
- Paths below are relative to `/Users/juanierace/Documents/Projects/AI Projects/ai-engineering-academy`. Line anchors refer to the inspected snapshot.

## 1. Learning integrity: release blockers

### P1 — Learner-controlled traces can manufacture a passing result

`apps/executor/src/isolate.ts:50–59,116–120` exposes trace/result paths to submitted code and then trusts their JSON. `apps/executor/src/grade.ts:100–102` grades that evidence.

**Reproduced:** a function wrote a fabricated `responses.create` record to `ACADEMY_TRACE`, returned the expected fixed string, and passed `return-output-text` without importing or calling OpenAI. Evidence: `apps/executor/grading/tests/return-output-text.py:12–29` and the real harness.

**Separate source-only security risk:** `apps/executor/src/isolate.ts:20–26` uses `allow default` and denies hidden-test reads, but not writes. Hidden grader write protection is missing in the inspected policy. No overwrite or live exploit was attempted.

**Required:** isolate the learner process from grader assets and trusted results; reject malformed/failed execution centrally; derive behavioral evidence outside learner-writable files. Treat this as a boundary redesign, not merely another trace assertion.

### P1 — Failed or absent implementations receive success feedback

**Reproduced:** the LangGraph project registered `draft` and an edge from an unregistered `missing` node to an unregistered `review`, without defining `build_graph`. The harness reported `result.ok=false` and “Define build_graph before submitting”; the grader still passed and claimed the graph compiled.

Evidence: `apps/executor/grading/harness.py:24–45`; `apps/executor/grading/tests/lg-project.py:3–8`.

Pure grader calls also accepted failed-function results in `crew-project.py:3–7`, `adk-project.py:3–9`, `mcp-project.py:3–8`, and `agents-build.py:3–12` under `apps/executor/grading/tests/`.

**Required:** a central `result.ok === true` harness-success gate, then task-specific behavioral assertions. `apps/executor/src/grade.ts:78–88` already rejects non-`ok` process statuses, but `:100` grades without validating harness success: a successful process exit is not a successful learner implementation. Success feedback must describe only behavior actually verified.

### P1 — OpenAI capstone passes without an API call

**Reproduced:** a function returning `"mocked-output"` for `"ping"` and `""` otherwise passed with an empty trace. It made no API call and caught no exception, but received feedback claiming both API output and failed-call handling.

Evidence: `apps/executor/grading/tests/responses-capstone.py:3–15`.

Other offline counterexamples passed for ADK order, LangGraph checkpointer setup, SDK research-team orchestration, and Structured Outputs without the claimed behavior. Their graders check counts, names, truthy objects, or fixed strings rather than the learning contract:

- `adk-sequence.py:3–9`: count two does not prove identities or order.
- `lg-checkpointer.py:3–7`: truthy saver does not prove a valid executable graph or persistence.
- `agents-research.py:3–11`: declarations do not prove planning, search, or writing.
- `pass-json-schema.py:3–9`: schema name does not prove a schema exists.

**Required:** contrasting inputs, wrong-order cases, missing-object cases, malformed results, hard-coded solutions, and negative controls. A broken implementation must reliably fail before any project is considered validated.

### P1 — Multi-course certificates are broken and mislabelled

- `apps/web/src/lib/progress-store.ts:23–28,137–143`: one global certificate per learner.
- `apps/web/src/app/api/execute/route.ts:41–53`: existing certificate suppresses later issuance.
- `apps/web/src/components/course/CourseOverview.tsx:59`: certificate displayed without matching its course.
- `apps/web/src/app/courses/[courseId]/project/page.tsx:24`: another project can link to the first certificate.
- `packages/shared/src/index.ts:8–15`: every course uses “Certified Applied AI Engineer” and the same OpenAI-only skills.

**Required:** certificates keyed by course, course-specific evidenced competencies, correct post-issuance destination, and an integration test completing two distinct courses. Use a course-completion credential until an integrative engineering assessment actually supports the broader title.

### P1 — Progress storage can silently replace existing learner data

`apps/web/src/lib/progress-store.ts:51–61` converts any read/parse error into an empty store and directly overwrites the whole file. Its queue at `:35–36,64–67` is process-local, not cross-worker locking.

**Source-verified risk, not a reproduced live loss:** partial writes or competing instances can cause an empty/stale read followed by destructive persistence.

**Required:** distinguish missing storage from corruption, fail safely, atomic writes, and a durable transaction/concurrency strategy appropriate to deployment. Add recovery and concurrent-mutation tests before scaling.

## 2. Course inventory and completeness

| Course | Modules | Lessons | Theory steps | Exercises | Quiz questions | Projects | Claimed minutes |
|---|---:|---:|---:|---:|---:|---:|---:|
| OpenAI API Fundamentals | 3 | 10 | 28 | 11 | 4 | 1 | 180 |
| What an agent is | 3 | 3 | 8 | 3 | 3 | 1 | 62 |
| RAG Fundamentals | 3 | 4 | 12 | 3 | 3 | 1 | 72 |
| OpenAI Agents SDK | 4 | 4 | 10 | 4 | 3 | 1 | 70 |
| CrewAI Fundamentals | 4 | 5 | 13 | 4 | 3 | 1 | 82 |
| LangGraph Fundamentals | 4 | 5 | 13 | 4 | 3 | 1 | 82 |
| Google ADK | 3 | 3 | 8 | 2 | 3 | 1 | 50 |
| MCP | 3 | 3 | 8 | 2 | 3 | 1 | 50 |
| **Total** | **27** | **37** | **100** | **33** | **25** | **8** | **648** |

All eight courses exist. There are 113 YAML objects and 133 lesson steps (theory plus exercises). Current exercise/project IDs have manifest coverage and no observed cross-course collisions. These counts demonstrate structure, not depth or educational effectiveness. Durations are author estimates; every YAML duration equals lesson estimates plus six project minutes, not measured completion time.

### Per-course outcome alignment

| Course | What currently works as instruction | Important gap | Minimum credible final project |
|---|---|---|---|
| OpenAI API | Incremental request arguments, output extraction, blank/error guards | Real JSON schema, schema consumption, returned tool-call/result cycle, refusal/incomplete branches | A bounded API function with valid structured output, contrasting inputs and genuine failure handling |
| Agent foundations | Workflow/agent distinction, chaining, routing, loop vocabulary | Tool evidence is described but not actually fed through a complete model/tool loop; project repeats the loop instead of integrating concepts | Bounded loop validating tool arguments, executing tools, supplying correlated results, and stopping safely |
| RAG | Chunking, retrieval order, sources and abstention vocabulary | Project returns a source, not a grounded answer; retrieval mock stores nothing or embeds nothing | Retrieve passages, generate an evidence-grounded answer with citations, abstain when evidence is absent |
| Agents SDK | Agent/Runner construction, tool and handoff declarations | Tools/handoffs not behaviorally executed; project repeats initial Assistant run; research manager confuses handoff with retained orchestration | Executed tool-using agent, bounded run and trace; explicit specialist pattern if included |
| CrewAI | Roles, tasks, processes, kickoff, context | Real SDK required fields masked by mocks; project omits later writer/context lesson; routing prerequisite conflicts with roadmap | Research → report crew using complete objects and verified propagation of research output |
| LangGraph | Nodes, edges, routing, checkpointer vocabulary | No invoked stateful graph, proven updates, interrupt/resume activity; invalid graph can pass | Runnable typed-state graph, both routes tested, checkpointed thread and one safe pause/resume |
| Google ADK | Agent/search-tool declaration, sequential-agent construction | Project repeats declaration and excludes pipeline; no Runner/session execution or verified output handoff | Executed agent and sequence with explicit state/output keys and verified downstream use |
| MCP | Server/tool/resource declarations | No server/client roundtrip, transport/configuration or agent consumption; project omits resource | Local tool/resource server, connected client and actual calls; then integrate a known agent tool |

### Correctness fixes in supplied teaching

1. **Structured Outputs:** `content/courses/openai-api-fundamentals/02-control/lesson-json.yaml:10–20` supplies only format type/name, not an actual schema. The grading fixture repeats this (`apps/executor/grading/manifest.json:18–20`). Teach properties, types, required fields, parsing, and refusal/incomplete handling; qualify the absolute schema guarantee. [Official guide](https://developers.openai.com/api/docs/guides/structured-outputs).
2. **CrewAI:** `content/courses/crewai-fundamentals/02-process/exercise-01.yaml:12–13` omits Agent `backstory` and Task `expected_output`, masked by defaults in `apps/executor/grading/mocks/crewai/__init__.py:19–26`. Make starters valid for the real library; qualify the README’s absolute “no agent cannot run” claim to this sequential exercise. [Agent docs](https://docs.crewai.com/en/concepts/agents), [Task docs](https://docs.crewai.com/en/concepts/tasks), [Task implementation](https://github.com/crewAIInc/crewAI/blob/main/lib/crewai/src/crewai/task.py).
3. **Agents SDK:** `content/courses/openai-agents-sdk/04-research/lesson.yaml:10–24` declares handoffs but describes a research manager. Handoffs transfer control; manager-retained specialist work uses a different pattern, such as agents-as-tools. Relabel the declaration drill or implement the actual orchestration. [Official handoffs](https://openai.github.io/openai-agents-python/handoffs/).
4. **LangGraph:** `content/courses/langgraph-fundamentals/README.md:36–38` needs precise resume semantics: the interrupted node starts again, not from an arbitrary paused line. Teach same-thread resume and idempotent preceding effects. [Official interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts), [persistence](https://docs.langchain.com/oss/python/langgraph/persistence).
5. **MCP:** `content/courses/mcp-fundamentals/02-server/lesson.yaml:10` suggests the server name is how clients find it. Explain connection/transport configuration, initialization, discovery and calls. [Official server guide](https://modelcontextprotocol.io/docs/develop/build-server).

### Simulation must be explicit

`apps/executor/grading/harness.py:11` shadows SDK imports with mocks. OpenAI, Agents SDK and CrewAI return fixed output; LangGraph records operations without running nodes; retrieval stores no documents and returns a fixed passage. Network access is denied.

No learner-facing mock disclosure was located in inspected course/web content. Label these as **simulated construction/request drills**. Explain what a pass proves and what it does not. Retain deterministic mocks for introductory practice, but add real-library conformance tests and a safe end-to-end project track. Do not require learners to incur API costs unexpectedly.

## 3. Sequence, topics, and roadmap promises

The existing roadmap already puts API, agent foundations, and RAG before frameworks. Preserve this useful foundation; the problem is insufficient behavioral depth and duplicated constructor projects, not a missing API/RAG starting point.

### Recommended progression—not an approved migration

1. Explicit entry prerequisites: Python functions, imports, dictionaries/lists, exceptions and decorators; a diagnostic and concise bridge material.
2. API requests and usable results → structured results → model/tool boundary.
3. Complete evidence-fed agent loop → chaining/routing → bounded termination.
4. Retrieval → grounded generation/citations → abstention and relevance checks.
5. One primary orchestration framework (Agents SDK), distinguishing handoffs from retained manager control.
6. State, persistence and human approval (LangGraph), demonstrated through execution.
7. CrewAI and ADK as comparative electives solving the same reference task, rather than repeating introductory constructors.
8. MCP roundtrip and integration with an already understood agent.

Add a cross-cutting **evaluation, reliability and safety spine** after the first end-to-end task: test datasets/rubrics, typical/edge/adversarial cases, cost/latency budgets, bounded retries/timeouts, tool permissions, untrusted retrieved/tool content, secrets handling and trace observability. These are recommended applied-engineering outcomes, not claims that every introductory course promised them. Advanced ML training, fine-tuning, Realtime, RAGAS, deployment platforms and every framework are not required to fix the present scope.

Evaluation should be objective → dataset → metric → iteration, not a few predictable returned strings. [OpenAI evaluation guidance](https://developers.openai.com/api/docs/guides/evaluation-best-practices). Keep workflows simpler than agents when sufficient, and measure before adding complexity; this stable design principle is supported by the dated [Anthropic agent guide](https://www.anthropic.com/engineering/building-effective-agents). Add appropriately scoped client/server security concepts to MCP, rather than treating decorators as the whole protocol. [MCP security guidance](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices).

### Promise/content drift

`apps/web/src/lib/roadmap.ts` promises a stock picker/software engineering team (`:24`), a working pausing sidekick (`:30`), AWS Strands (`:36`), and agents calling MCP server tools (`:42`). These learning activities are not supplied. Either implement the outcome or narrow the published promise; do not imply availability through marketing copy.

CrewAI README requires graph routing (`content/courses/crewai-fundamentals/README.md:5`), but CrewAI precedes LangGraph. Remove the unnecessary prerequisite or align its teaching location. Cross-course prerequisites are not modeled or enforced (`packages/course-engine/src/schema.ts:57–64`, `apps/web/src/app/api/enroll/route.ts:9–16`); the roadmap is presentation, not a learning-path policy.

Six duration values differ between YAML and README (Agent foundations, Agents SDK, CrewAI, LangGraph, ADK, MCP). API’s README outline differs from its actual three module groups; CrewAI/LangGraph README outlines omit added team/chain material. Generate derived outlines and durations from one canonical source.

### Course release standard

For each course, require a traceable **objective → taught explanation → guided practice → independent project → verified rubric**. A recall quiz does not establish build competence. [CMU assessment alignment](https://www.cmu.edu/teaching/assessment/basics/alignment.html).

- State prerequisites, scope, observable outcomes and simulation limitations.
- Sequence concepts before framework syntax; include failure paths and worked examples.
- Ensure each promised skill appears in practice and assessment; final projects integrate later lessons.
- Keep starters runnable and aligned with pinned real SDK versions.
- Test good solutions, plausible wrong solutions, hard-coding, failed execution and forged evidence.
- Validate lesson ordering/uniqueness and executor coverage at import time; current importer validates references but lacks these broader authoring checks (`packages/course-engine/src/load.ts:76–99`). No current ID collision was observed.
- Validate two-course progression/certification, refresh/resume, corrupted storage and interrupted requests.
- Review final credential wording against proven competencies.
- Pilot completion time and comprehension; do not label author estimates as measured.

## 4. UX/UI inconsistencies

| Priority | Finding and impact | Evidence | Required direction |
|---|---|---|---|
| P1 | Fetch/JSON failures leave Run/Submit or Saving permanently pending | `apps/web/src/components/workspace/Workspace.tsx:29–44`; `apps/web/src/components/lesson/ExplanationStep.tsx:26–39` | `try/catch/finally`, recoverable errors and retry; distinguish auth/order/server failures |
| P1 | Unsubmitted editor changes disappear on navigation/reload | `apps/web/src/components/workspace/Workspace.tsx:23,75–76,84–92`; `apps/web/src/app/api/execute/route.ts:31` | Autosaved drafts with visible status, plus dirty-navigation protection |
| P1 | Unknown valid course slugs crash instead of showing not-found | `apps/web/src/lib/catalog.ts:45–46`; `apps/web/src/app/courses/[courseId]/page.tsx:9–11` | Typed missing-course handling before file read; consistent 404 |
| P1 risk | Inline 320px lesson drawer can consume the whole mobile viewport | `apps/web/src/components/lesson/PlayerShell.tsx:50–86` | Mobile overlay/drawer or responsive layout; verify rendered behavior |
| P2 | Enroll, assessment and profile mutations lack reliable pending/error feedback | `apps/web/src/components/course/EnrollButton.tsx:8–15`; `apps/web/src/components/course/AssessmentForm.tsx:8–23,39`; `apps/web/src/components/profile/ProfileForm.tsx:9–14,23` | Prevent duplicate actions, announce status, retain input, show recovery; enroll should lead clearly into learning |
| P2 | Google authentication failures can be silent/stuck | `apps/web/src/components/auth/LoginForm.tsx:37–45`; `apps/web/src/components/home/Landing.tsx:44` | Handle returned errors as well as exceptions; consistent pending/retry states |
| P2 risk | Signed-in navbar has no mobile treatment for full name and links | `apps/web/src/components/nav/Navbar.tsx:17–32` | Responsive nav, truncation and keyboard-accessible menu; long-name QA |
| P2 | Theory “Key idea” normal text contrast is 2.856:1 | `apps/web/src/components/lesson/ExplanationStep.tsx:50–51` (`#c9842a` / `#fbf6ea`) | Meet 4.5:1 for normal text |
| P2 | Lesson shell lacks main landmark; completion checkmarks lack textual status; shared skip link absent | `apps/web/src/components/lesson/PlayerShell.tsx:35–88`; `apps/web/src/app/layout.tsx:21–22` | Main landmark, skip link and programmatic completed state |
| P2 | Unlayered `.btn` padding overrides layered Tailwind utilities | `apps/web/src/app/globals.css:66–76`; `apps/web/src/components/workspace/Workspace.tsx:56`; `apps/web/src/components/nav/BackLink.tsx:4` | One intentional cascade/component spacing strategy |
| P3 | Catalog says six courses and uses unexplained “module there is a course here” copy despite eight courses | `apps/web/src/app/catalog/page.tsx:26,35` | Derive count from catalog; distinguish six stages from eight courses; remove external-reference copy |
| P3 | Reduced-motion still permits immediate shared button hover translation | `apps/web/src/app/globals.css:79–80,130–136,328–331` | Disable nonessential transforms consistently, not only landing animation |

Additional recommendations: prioritize enrolled/in-progress courses and direct resume on dashboard; avoid decorative chevrons that imply interactive module rows; label step-only percentages **Lesson progress** when they exclude assessment/project. Percentages are currently consistent across surfaces—this is a clarity recommendation, not a mismatched-calculation defect.

Preserve approved behavior: Google-first auth, switch above title, canonical `/auth/signin` and `/auth/signup`, no legacy `/login` redirect, no navbar Sign in CTA, public module previews, and signed-in course-card progress. These are not audit defects.

### Required rendered checks (all not_verified)

320/768/1024/1440px; long names/course titles; mobile lesson drawer/editor; keyboard-only routes and Monaco escape; focus visibility and announcements; reduced motion; failed/slow requests; editor reload/navigation; post-assessment/project transitions. Existing native links/buttons, focus outlines, roadmap keyboard handling and semantic assessment fields are useful foundations to retain. Audit basis: [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md).

## 5. Route verification

| Guest GET | Result |
|---|---|
| `/`, `/catalog`, `/auth/signin`, `/auth/signup` | 200 |
| All eight known `/courses/{slug}` previews | 200 |
| `/courses/unknown-course`, `/courses/definitely-missing` | **500** (missing catalog file) |
| Invalid-format `/courses/Bad_Slug` and encoded invalid slug | 307 → `/catalog` |
| Known learn outline/theory lesson, assessment, project | 307 → sign-in with preserved `next` |
| `/dashboard`, `/profile` | 307 → sign-in with preserved `next` |
| Legacy exercise alias | 307 → canonical lesson → sign-in |

Known published slugs: `openai-api-fundamentals`, `agent-foundations`, `rag-fundamentals`, `openai-agents-sdk`, `crewai-fundamentals`, `langgraph-fundamentals`, `google-adk-fundamentals`, `mcp-fundamentals`.

No assessment answer leakage was found in the inspected public payload builder: `packages/grading/src/assessment.ts` strips answers. No Run-to-certificate bypass was found: `apps/executor/src/grade.ts:90–97` returns `ok` for Run, while issuance requires `passed`. Dev error HTML exposes the missing absolute catalog path; this is not proof of a production information leak.

## 6. Remediation order

1. **Trustworthy learning foundation:** executor trust boundary, central failed-execution gate, adversarial grader tests, durable progress, per-course certificates. Do not expand credential claims before this passes.
2. **Complete the three foundations:** API schema/tool boundary; actual bounded agent loop; grounded RAG generation. Disclose mocks and align teaching with real SDKs.
3. **Rebuild project outcomes:** one primary agent framework, runnable state/HITL, framework comparison electives, real MCP roundtrip. Correct roadmap promises and documentation drift.
4. **Reliable learner UX:** draft preservation, request recovery, clear progression/credential destinations, missing-course handling.
5. **Visual/accessibility QA:** responsive shell/navbar, contrast/landmarks/status, shared spacing cascade and reduced motion. Confirm through rendered independent testing—not source or HTTP alone.

The highest-value next implementation is a small **grading-integrity and multi-course-completion repair**, followed by foundational curriculum completion. Adding more frameworks or animations first would increase surface area without fixing the educational product.
