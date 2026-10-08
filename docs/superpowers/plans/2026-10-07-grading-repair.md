# Grading contract repair — 2026-10-07

Scope: offline simulated graders only. No curriculum, certificates, web, dependencies, live submissions, or isolation-policy changes.

1. Capture executor/grading before snapshots for independent review (target has no Git).
2. RED: add isolated-run boundary regressions for absent/non-object/non-boolean/false harness success, failed nested calls, valid submission and unchanged Run semantics. Mock only process isolation; use the real grading dispatcher.
3. RED: run supplied benign learner fixtures through the real Python harness and grader. Contrast fixed capstone outputs with genuine simulated success/exception calls; invalid vs registered/entered/compiled graphs; wrong-order/non-agent ADK pipelines; unrelated SDK handoffs; schema-name-only vs supplied-format passthrough; empty graph vs draft/entry/checkpointer construction.
4. GREEN: reject submit unless harness success is exactly true (and all included call results succeeded); gate Python dispatcher likewise. Enrich simulation evidence and reject only violations of existing taught contracts. Preserve Run semantics.
5. Verify offline Python suite and isolated boundary Vitest suite. Record actual unavailable broader/sandbox checks; do not replace security testing with non-isolated harness execution.
6. Produce exact file list, before/after hashes, textual patch, evidence and residual blockers for fresh review.

Limitations: learner-writable traces/results and writable hidden-grader assets remain a release blocker requiring isolation architecture. SDK/graph mocks are construction simulations, not real orchestration/persistence. The schema fixture has no real schema and saver is boolean true: enforce supplied-value passthrough and documented construction, not new curriculum outcomes.
