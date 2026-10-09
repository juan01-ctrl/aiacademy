import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ permit: { allowed: false } as { allowed: boolean; unavailable?: boolean }, saveDraft: vi.fn(), acquire: vi.fn(), execute: vi.fn(), getLearner: vi.fn(), recordAttempt: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getSession: async () => ({ learnerId: "learner-1", name: "Learner" }) }));
vi.mock("@/lib/catalog", () => ({
  findCatalogByExercise: async () => ({ course: { id: "course-1", title: "Course" }, project: { id: "project-1" }, exercises: [{ id: "exercise-1" }] }),
  findExercise: () => ({ id: "exercise-1" }),
}));
vi.mock("@/lib/execution-rate-limit", () => ({ acquireExecutionPermit: state.acquire }));
vi.mock("@/lib/executor", () => ({ callExecutor: state.execute }));
vi.mock("@/lib/progress-store", () => ({
  getLearner: state.getLearner,
  recordAttempt: state.recordAttempt,
  saveDraft: state.saveDraft,
  saveCertificate: vi.fn(),
}));
vi.mock("@/lib/course-certificate", () => ({ courseCertificate: () => null }));
vi.mock("@academy/course-engine", () => ({ isCourseComplete: () => false, isUnlocked: () => true }));
vi.mock("@academy/exercise-engine", () => ({ shouldRecordAttempt: (mode: string) => mode === "submit" }));
vi.mock("@academy/grading", () => ({ canIssueCertificate: () => false }));
vi.mock("@academy/shared", () => ({ certificateMetadata: () => ({}), credentialId: () => "unused" }));
import { POST } from "@/app/api/execute/route";

function request(mode: "run" | "submit") {
  return new Request("https://academy.example/api/execute", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode, exerciseId: "exercise-1", source: "print('draft')" }),
  });
}

describe("execution route rate-limit draft consistency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.permit = { allowed: false };
    state.acquire.mockImplementation(async () => state.permit);
    state.execute.mockResolvedValue({ status: "unavailable", stdout: "", stderr: "Sandbox unavailable", truncated: false, feedback: [] });
    state.getLearner.mockResolvedValue({ passedExerciseIds: [], assessmentCourseIds: [], completedStepIds: [] });
    state.recordAttempt.mockResolvedValue({ passedExerciseIds: [], assessmentCourseIds: [], completedStepIds: [] });
    state.saveDraft.mockResolvedValue(undefined);
  });

  it.each([
    [{ allowed: false }, 429],
    [{ allowed: false, unavailable: true }, 503],
  ])("does not write a draft when execution capacity is denied: %j", async (permit, expectedStatus) => {
    state.permit = permit;
    const response = await POST(request("run"));
    expect(response.status).toBe(expectedStatus);
    expect(state.saveDraft).not.toHaveBeenCalled();
  });

  it("persists a permitted Submit draft even when grading safely returns unavailable", async () => {
    state.permit = { allowed: true };
    const response = await POST(request("submit"));
    expect(state.saveDraft).toHaveBeenCalledWith("learner-1", "exercise-1", "print('draft')");
    expect((await response.json()).result.status).toBe("unavailable");
  });
});
