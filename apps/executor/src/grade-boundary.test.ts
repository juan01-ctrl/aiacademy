import { beforeEach, describe, expect, it, vi } from "vitest";
import { runIsolated } from "./isolate";
import { executeExercise } from "./grade";

vi.mock("./isolate", () => ({ runIsolated: vi.fn() }));
const run = vi.mocked(runIsolated);
const submit = () => executeExercise({ exerciseId: "adk-project", source: "", mode: "submit" });
const evidence = [{ name: "Agent", arguments: { name: "researcher", model: "gemini-flash-latest", tools: 1 } }];

beforeEach(() => run.mockReset());
describe("submit harness success boundary", () => {
  it.each([null, {}, { ok: false }, { ok: "true" }, { ok: 1 }, [], "true", { ok: true, results: [{ ok: false }] }, { ok: true, results: [] }, { ok: true, results: "malformed" }])("rejects malformed or failed success %j", async (result) => {
    run.mockResolvedValue({ status: "ok", stdout: "output", stderr: "", truncated: false, trace: evidence, result } as never);
    const response = await submit();
    expect(response.status).toBe("failed");
    expect(response.feedback[0]?.concept).toBe("Function execution");
  });
  it("grades a successful harness result", async () => {
    run.mockResolvedValue({ status: "ok", stdout: "", stderr: "", truncated: false, trace: evidence, result: { ok: true } });
    expect((await submit()).status).toBe("passed");
  });
  it("keeps Run ungraded even without a harness payload", async () => {
    run.mockResolvedValue({ status: "ok", stdout: "output", stderr: "", truncated: false, trace: [], result: null });
    const response = await executeExercise({ exerciseId: "adk-project", source: "", mode: "run" });
    expect(response.status).toBe("ok");
    expect(response.stdout).toBe("output");
    expect(response.feedback).toEqual([]);
  });
});
