import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublishedCatalog } from "@academy/course-engine";
import { certificateMetadata } from "@academy/shared";
import { getLearner, saveCertificate, findCertificate, type CertificateRecord } from "./progress-store";
import { POST } from "@/app/api/execute/route";

// No disk, accounts, or executor access: the real storage and route code use synthetic IO.
const io = vi.hoisted(() => ({ text: "", session: true, status: "passed" }));
const database = vi.hoisted(() => {
  const query = async (sql: string, params: unknown[] = []) => {
    const text = sql.trim().toLowerCase();
    const store = JSON.parse(io.text || "{\"learners\":{}}") as { learners: Record<string, Record<string, unknown>> };
    if (text.startsWith("insert into learner_progress")) {
      const [learnerId, state] = params as [string, string];
      store.learners[learnerId] ??= JSON.parse(state);
      io.text = JSON.stringify(store);
      return { rows: [], rowCount: 1 };
    }
    if (text.startsWith("select state from learner_progress where learner_id")) {
      const state = store.learners[String(params[0])];
      return { rows: state ? [{ state }] : [], rowCount: state ? 1 : 0 };
    }
    if (text.includes("jsonb_each")) {
      const id = String(params[0]);
      const state = Object.values(store.learners).find((learner) => {
        const legacy = learner.certificate as { id?: string } | null;
        const certificates = learner.certificatesByCourseId as Record<string, { id?: string }> | undefined;
        return legacy?.id === id || Object.values(certificates ?? {}).some((item) => item.id === id);
      });
      return { rows: state ? [{ state }] : [], rowCount: state ? 1 : 0 };
    }
    if (text.startsWith("update learner_progress")) {
      store.learners[String(params[1])] = JSON.parse(String(params[0]));
      io.text = JSON.stringify(store);
      return { rows: [], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  };
  return { query, client: { query, release: vi.fn() } };
});
vi.mock("./db", () => ({ pool: { query: database.query, connect: async () => database.client } }));
vi.mock("@/lib/auth", () => ({ getSession: async () => io.session ? { learnerId: "synthetic", name: "Synthetic Learner" } : null }));
vi.mock("@/lib/executor", () => ({ callExecutor: async () => ({ status: io.status, stdout: "", stderr: "", truncated: false, feedback: [] }) }));
vi.mock("@/lib/execution-rate-limit", () => ({ acquireExecutionPermit: async () => ({ allowed: true }) }));
vi.mock("@/lib/catalog", () => ({
  findCatalogByExercise: async (id: string) => catalogs.find((catalog) => catalog.project?.id === id || catalog.exercises.some((exercise) => exercise.id === id)),
  findExercise: (catalog: PublishedCatalog, id: string) => catalog.project?.id === id ? catalog.project : catalog.exercises.find((exercise) => exercise.id === id),
}));

const catalogs: PublishedCatalog[] = ["openai-api-fundamentals", "agent-foundations"].map((id) => ({
  course: { id, title: id, summary: "Synthetic", level: "Basic", durationMinutes: 1, moduleIds: [`${id}-module`] },
  modules: [{ id: `${id}-module`, title: "Synthetic", durationMinutes: 1, lessonIds: [`${id}-lesson`] }],
  lessons: [{ id: `${id}-lesson`, title: "Synthetic", summary: "Synthetic", durationMinutes: 1, steps: [{ id: `${id}-intro`, type: "explanation", title: "Synthetic", body: [], takeaway: "", example: "" }] }],
  exercises: [{ id: `${id}-exercise`, title: "Practice", order: 1, instructions: [], starterCode: "", hints: [], runtime: "python" }],
  project: { id: `${id}-project`, title: "Project", order: 2, instructions: [], starterCode: "", hints: [], runtime: "python" },
}));
const a: CertificateRecord = { id: "HISTORICAL-A", courseId: "openai-api-fundamentals", holderName: "Original Holder", title: "Original Title", issuedAt: "2020-01-01", skills: ["Original Skill"] };
const b: CertificateRecord = { ...a, id: "B", courseId: "agent-foundations" };
function seed(certificate: CertificateRecord | null = null) {
  return { enrolledCourseIds: catalogs.map((c) => c.course.id), completedStepIds: catalogs.map((c) => `${c.course.id}-intro`), passedExerciseIds: ["existing-pass"], drafts: { existing: "untouched" }, attempts: [{ id: "old", exerciseId: "existing", status: "passed", at: "2020" }], assessmentPassed: true, assessmentCourseIds: catalogs.map((c) => c.course.id), certificate };
}
async function execute(id: string, mode = "submit") {
  return POST(new Request("http://synthetic.test/api/execute", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ exerciseId: id, mode, source: "synthetic" }) }));
}
beforeEach(() => { io.text = JSON.stringify({ learners: { synthetic: seed() } }); io.session = true; io.status = "passed"; });

describe("per-course certificate storage", () => {
  it("normalizes legacy credentials without changing history or progress", async () => {
    const original = seed(a);
    io.text = JSON.stringify({ learners: { synthetic: original } });
    const learner = await getLearner("synthetic");
    expect(learner).toMatchObject(original);
    expect(learner.certificatesByCourseId).toEqual({ "openai-api-fundamentals": a });
  });
  it("saves B preserving A and every progress field, then finds both publicly", async () => {
    const original = seed(a);
    io.text = JSON.stringify({ learners: { synthetic: original } });
    const saved = await saveCertificate("synthetic", b);
    expect(saved).toMatchObject(original);
    expect(saved.certificatesByCourseId).toEqual({ "openai-api-fundamentals": a, "agent-foundations": b });
    expect(await findCertificate("HISTORICAL-A")).toEqual(a);
    expect(await findCertificate("B")).toEqual(b);
  });
  it("retains first issuance date and metadata on repeated saves", async () => {
    await saveCertificate("synthetic", a);
    const saved = await saveCertificate("synthetic", { ...a, id: "REPLACEMENT", issuedAt: "2099", title: "Changed", holderName: "Changed", skills: [] });
    expect(saved.certificate).toEqual(a);
    expect(saved.certificatesByCourseId[a.courseId]).toEqual(a);
  });
  it("finds legacy fallback even when a mixed record map has its own credential", async () => {
    io.text = JSON.stringify({ learners: { synthetic: { ...seed(a), certificatesByCourseId: { [a.courseId]: { ...a, id: "MAP-A" }, [b.courseId]: b } } } });
    expect(await findCertificate("HISTORICAL-A")).toEqual(a);
    expect(await findCertificate("MAP-A")).toEqual({ ...a, id: "MAP-A" });
    expect(await findCertificate("B")).toEqual(b);
    expect(await findCertificate("missing")).toBeNull();
  });
});

describe("new credential metadata", () => {
  it.each([
    ["openai-api-fundamentals", "API request configuration"], ["agent-foundations", "Chaining and routing concepts"],
    ["rag-fundamentals", "Retrieval and source selection"], ["openai-agents-sdk", "Agent and Runner declarations"],
    ["crewai-fundamentals", "Role and task declarations"], ["langgraph-fundamentals", "Node, edge, and routing configuration"],
    ["google-adk-fundamentals", "Agent, tool, and sequence configuration"], ["mcp-fundamentals", "Server, tool, and resource declarations"],
  ])("scopes %s to simulated practice", (id, topic) => {
    const metadata = certificateMetadata(id, "Course Title");
    expect(metadata.title).toBe("Course Title — Course Completion");
    expect(metadata.skills.join(" ")).toContain(topic);
    expect(metadata.skills.every((skill) => skill.startsWith("Simulated practice: "))).toBe(true);
    expect(metadata.skills.join(" ")).not.toMatch(/mastery|production|real execution|persistence/i);
  });
  it("does not invent skills for unknown courses", () => {
    expect(certificateMetadata("unknown", "Unknown")).toEqual({ title: "Unknown — Course Completion", skills: [] });
  });
  it.each(["constructor", "__proto__", "toString"])("treats inherited key %s as an unknown course", (id) => {
    expect(certificateMetadata(id, "Unknown")).toEqual({ title: "Unknown — Course Completion", skills: [] });
  });
});

describe("project issuance route", () => {
  it("revalidates historically passed B without replacing legacy A or granting through Run", async () => {
    const original = { ...seed(a), passedExerciseIds: ["existing-pass", "agent-foundations-project"] };
    io.text = JSON.stringify({ learners: { synthetic: original } });
    await execute("agent-foundations-project", "run");
    const beforeSubmit = await getLearner("synthetic");
    expect(beforeSubmit.certificatesByCourseId).toEqual({ "openai-api-fundamentals": a });
    expect(beforeSubmit.passedExerciseIds).toEqual(original.passedExerciseIds);
    const submitted = await (await execute("agent-foundations-project")).json();
    const saved = await getLearner("synthetic");
    expect(submitted.certificateHref).toBe(`/certificate/${saved.certificatesByCourseId["agent-foundations"].id}`);
    expect(saved.certificate).toEqual(a);
    expect(saved.passedExerciseIds).toEqual(original.passedExerciseIds);
  });
  it("submits A then B and returns each actually persisted credential", async () => {
    const first = await (await execute("openai-api-fundamentals-project")).json();
    const second = await (await execute("agent-foundations-project")).json();
    expect(first.certificateHref).toMatch(/^\/certificate\/AI-/);
    expect(second.certificateHref).toMatch(/^\/certificate\/AI-/);
    expect(second.certificateHref).not.toBe(first.certificateHref);
    const learner = await getLearner("synthetic");
    expect(Object.keys(learner.certificatesByCourseId)).toHaveLength(2);
    expect(await findCertificate(second.certificateHref.split("/").pop())).toEqual(learner.certificatesByCourseId["agent-foundations"]);
    expect(learner.certificate).toEqual(learner.certificatesByCourseId["openai-api-fundamentals"]);
    const repeated = await (await execute("agent-foundations-project")).json();
    expect(repeated.certificateHref).toBe(second.certificateHref);
  });
  it.each(["run", "failed", "locked", "unauthenticated", "exercise"])("does not issue for %s", async (reason) => {
    if (reason === "failed") io.status = "failed";
    if (reason === "locked") io.text = JSON.stringify({ learners: { synthetic: { ...seed(), assessmentCourseIds: [] } } });
    if (reason === "unauthenticated") io.session = false;
    const response = await execute(reason === "exercise" ? "openai-api-fundamentals-exercise" : "openai-api-fundamentals-project", reason === "run" ? "run" : "submit");
    const body = await response.json();
    expect(body.certificateHref ?? null).toBeNull();
    expect((await getLearner("synthetic")).certificate).toBeNull();
    if (reason === "locked") expect(response.status).toBe(403);
    if (reason === "unauthenticated") expect(response.status).toBe(401);
    if (reason === "run") expect((await getLearner("synthetic")).passedExerciseIds).toEqual(["existing-pass"]);
  });
  it("does not issue when lesson prerequisites are incomplete", async () => {
    io.text = JSON.stringify({ learners: { synthetic: { ...seed(), completedStepIds: [] } } });
    expect((await execute("openai-api-fundamentals-project")).status).toBe(403);
    expect((await getLearner("synthetic")).certificate).toBeNull();
  });
});
