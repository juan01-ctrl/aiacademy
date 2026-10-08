import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => {
  const rows = new Map<string, Record<string, unknown>>();
  const transactions: string[] = [];
  const query = async (sql: string, params: unknown[] = []) => {
    const normalized = sql.trim().toLowerCase();
    transactions.push(normalized.split(" ")[0]);
    if (normalized.startsWith("insert into learner_progress")) {
      const [learnerId, state] = params as [string, string];
      if (!rows.has(learnerId)) rows.set(learnerId, JSON.parse(state));
      return { rows: [], rowCount: 1 };
    }
    if (normalized.startsWith("select state from learner_progress where learner_id")) {
      const row = rows.get(String(params[0]));
      return { rows: row ? [{ state: row }] : [], rowCount: row ? 1 : 0 };
    }
    if (normalized.startsWith("update learner_progress")) {
      rows.set(String(params[1]), JSON.parse(String(params[0])));
      return { rows: [], rowCount: 1 };
    }
    if (normalized.includes("jsonb_each")) {
      const id = String(params[0]);
      const row = [...rows.values()].find((state) => {
        const certificate = state.certificate as { id?: string } | null;
        const certificates = state.certificatesByCourseId as Record<string, { id?: string }> | undefined;
        return certificate?.id === id || Object.values(certificates ?? {}).some((item) => item.id === id);
      });
      return { rows: row ? [{ state: row }] : [], rowCount: row ? 1 : 0 };
    }
    return { rows: [], rowCount: 0 };
  };
  const client = { query, release: vi.fn() };
  return { rows, transactions, query, client };
});

vi.mock("./db", () => ({
  pool: {
    query: database.query,
    connect: async () => database.client,
  },
}));
vi.mock("node:fs/promises", () => ({
  readFile: async () => { throw new Error("legacy file storage must not be used"); },
}));

const certificate = { id: "cert-a", courseId: "course-a", holderName: "Learner", title: "AI", issuedAt: "2026-01-01", skills: ["Python"] };

beforeEach(() => {
  vi.resetModules();
  database.rows.clear();
  database.transactions.length = 0;
  database.client.release.mockClear();
});

describe("Postgres-backed learner progress", () => {
  it("returns an empty learner state when no row exists", async () => {
    const store = await import("./progress-store");
    await expect(store.getLearner("learner-1")).resolves.toMatchObject({
      enrolledCourseIds: [], passedExerciseIds: [], completedStepIds: [], drafts: {}, attempts: [],
      assessmentPassed: false, assessmentCourseIds: [], certificate: null, certificatesByCourseId: {},
    });
  });

  it("commits mutations and preserves enrollment, attempts, drafts, and certificates", async () => {
    const store = await import("./progress-store");
    await store.enroll("learner-1", "course-a");
    await store.saveDraft("learner-1", "exercise-a", "print('hello')");
    await store.recordAttempt("learner-1", "exercise-a", "passed");
    await store.markExplanationComplete("learner-1", "step-a");
    await store.saveAssessment("learner-1", "course-a", true);
    await store.saveCertificate("learner-1", certificate);

    const learner = await store.getLearner("learner-1");
    expect(learner).toMatchObject({
      enrolledCourseIds: ["course-a"], passedExerciseIds: ["exercise-a"], completedStepIds: ["step-a"],
      drafts: { "exercise-a": "print('hello')" }, assessmentPassed: true,
      assessmentCourseIds: ["course-a"], certificate, certificatesByCourseId: { "course-a": certificate },
    });
    expect(learner.attempts).toHaveLength(1);
    expect(await store.findCertificate("cert-a")).toEqual(certificate);
    expect(database.transactions.filter((command) => command === "begin").length).toBe(6);
    expect(database.transactions.filter((command) => command === "commit").length).toBe(6);
    expect(database.client.release).toHaveBeenCalledTimes(6);
  });

  it("rolls back and releases the connection when a transaction fails", async () => {
    const originalQuery = database.client.query;
    database.client.query = async (sql: string, params?: unknown[]) => {
      if (sql.trim().toLowerCase().startsWith("update learner_progress")) throw new Error("write failed");
      return originalQuery(sql, params);
    };
    const store = await import("./progress-store");
    await expect(store.saveDraft("learner-1", "exercise-a", "draft")).rejects.toThrow("write failed");
    expect(database.transactions).toContain("rollback");
    expect(database.client.release).toHaveBeenCalledOnce();
  });
});
