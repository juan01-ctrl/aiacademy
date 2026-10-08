import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import path from "node:path";

// Every filesystem call is synthetic: never open the application's learner file.
const disk = vi.hoisted(() => ({
  files: new Map<string, string>(), locks: new Set<string>(),
  readError: "", fault: "", leftovers: "",
}));
const failure = (code: string) => Object.assign(new Error(code), { code });
vi.mock("node:fs/promises", () => ({
  readFile: async (p: string) => {
    if (disk.readError) throw failure(disk.readError);
    if (!disk.files.has(p)) throw failure("ENOENT");
    return disk.files.get(p)!;
  },
  mkdir: async (p: string, options?: { recursive?: boolean }) => {
    if (options?.recursive) return;
    if (disk.fault === "lock") throw failure("EACCES");
    if (disk.locks.has(p)) throw failure("EEXIST");
    disk.locks.add(p);
  },
  rmdir: async (p: string) => {
    if (disk.fault === "release") throw failure("EACCES");
    if (!disk.locks.delete(p)) throw failure("ENOENT");
  },
  writeFile: async (p: string, text: string) => { disk.files.set(p, text); },
  open: async (p: string, flags: string) => {
    if (disk.fault === "open") throw failure("EACCES");
    if (flags !== "wx") throw new Error("Must create exclusively");
    if (disk.fault === "collision") { disk.files.set(p, "someone else's temp"); disk.leftovers = p; }
    if (disk.files.has(p)) throw failure("EEXIST");
    disk.files.set(p, "");
    return {
      writeFile: async (text: string) => {
        if (disk.fault === "write") { disk.files.set(p, "partial"); throw failure("ENOSPC"); }
        disk.files.set(p, text);
      },
      close: async () => { if (disk.fault === "close") throw failure("EIO"); },
    };
  },
  rename: async (from: string, to: string) => {
    if (disk.fault === "rename" || disk.fault === "cleanup") throw failure("EIO");
    if (path.dirname(from) !== path.dirname(to)) throw new Error("Not same directory");
    disk.files.set(to, disk.files.get(from)!); disk.files.delete(from);
  },
  unlink: async (p: string) => {
    if (disk.fault === "cleanup") throw failure("EACCES");
    if (!disk.files.delete(p)) throw failure("ENOENT");
  },
}));

const file = path.resolve(process.cwd(), "data/progress.json");
const lock = `${file}.lock`;
const a = { id: "A", courseId: "courseA", holderName: "History", title: "Original", issuedAt: "2020", skills: ["Historical skill"], extra: "keep" };
const b = { ...a, id: "B", courseId: "courseB" };
const original = () => ({ metadata: { version: "keep" }, learners: { learner: {
  enrolledCourseIds: ["courseA"], passedExerciseIds: ["old-pass"], completedStepIds: ["old-step"],
  drafts: { old: "saved" }, attempts: [{ id: "old", exerciseId: "old-pass", status: "passed", at: "2020" }],
  assessmentPassed: true, certificate: a, certificatesByCourseId: { courseB: b }, custom: { retained: true },
} } });
beforeEach(() => { vi.resetModules(); disk.files.clear(); disk.locks.clear(); disk.readError = ""; disk.fault = ""; disk.leftovers = ""; disk.files.set(file, JSON.stringify(original())); });
afterEach(() => { vi.useRealTimers(); });

describe("fail-closed progress storage", () => {
  it.each(["EACCES", "EIO"])("surfaces %s without replacing storage", async (code) => {
    const store = await import("./progress-store"); const before = disk.files.get(file); disk.readError = code;
    await expect(store.getLearner("learner")).rejects.toThrow(code);
    await expect(store.enroll("learner", "new")).rejects.toThrow(code);
    expect(disk.files.get(file)).toBe(before); expect(disk.locks.size).toBe(0);
  });
  it.each(["{bad", "null", "[]", "{}", '{"learners":[]}', '{"learners":{"x":null}}',
    '{"learners":{"x":{"drafts":[]}}}', '{"learners":{"x":{"passedExerciseIds":[1]}}}',
    '{"learners":{"x":{"certificate":{}}}}', '{"learners":{"x":{"certificatesByCourseId":{"a":null}}}}',
    '{"learners":{"x":{"attempts":[{}]}}}', '{"learners":{"x":{"assessmentPassed":"yes"}}}',
  ])("rejects malformed storage %s without a write", async (text) => {
    disk.files.set(file, text); const store = await import("./progress-store");
    await expect(store.enroll("learner", "new")).rejects.toThrow();
    expect(disk.files.get(file)).toBe(text); expect(disk.files.size).toBe(1); expect(disk.locks.size).toBe(0);
  });
  it("initializes only absent storage and persists a readable enrollment", async () => {
    disk.files.delete(file); const store = await import("./progress-store");
    expect((await store.getLearner("new")).enrolledCourseIds).toEqual([]);
    await store.enroll("new", "courseA");
    expect((await store.getLearner("new")).enrolledCourseIds).toEqual(["courseA"]);
    expect(disk.files.size).toBe(1); expect(disk.locks.size).toBe(0);
  });
  it.each(["open", "write", "close", "rename", "cleanup"])("leaves committed data intact on %s failure", async (fault) => {
    const before = disk.files.get(file); disk.fault = fault; const store = await import("./progress-store");
    await expect(store.saveDraft("learner", "new", "source")).rejects.toThrow();
    expect(disk.files.get(file)).toBe(before); expect(disk.locks.size).toBe(0);
    expect(disk.files.size).toBe(fault === "cleanup" ? 2 : 1);
  });
  it("does not delete an unowned temporary file when exclusive creation fails", async () => {
    disk.fault = "collision"; const before = disk.files.get(file); const store = await import("./progress-store");
    await expect(store.enroll("learner", "new")).rejects.toThrow("EEXIST");
    expect(disk.files.get(disk.leftovers)).toBe("someone else's temp"); expect(disk.files.get(file)).toBe(before);
  });
  it("preserves both course credentials, unknown fields and prior progress across all mutations", async () => {
    const store = await import("./progress-store");
    await store.enroll("learner", "courseB"); await store.saveDraft("learner", "new", "source");
    await store.recordAttempt("learner", "new-pass", "passed"); await store.markExplanationComplete("learner", "new-step");
    await store.saveAssessment("learner", "courseB", true); await store.saveCertificate("learner", b);
    const saved = JSON.parse(disk.files.get(file)!);
    expect(saved.metadata).toEqual({ version: "keep" });
    expect(saved.learners.learner).toMatchObject({ custom: { retained: true }, certificate: a, certificatesByCourseId: { courseA: a, courseB: b }, drafts: { old: "saved", new: "source" }, assessmentCourseIds: ["openai-api-fundamentals", "courseB"] });
    expect(saved.learners.learner.passedExerciseIds).toEqual(["old-pass", "new-pass"]);
    expect(saved.learners.learner.completedStepIds).toEqual(["old-step", "new-step"]);
    expect(saved.learners.learner.attempts).toHaveLength(2);
    expect(await store.findCertificate("A")).toEqual(a); expect(await store.findCertificate("B")).toEqual(b);
    expect(disk.files.size).toBe(1); expect(disk.locks.size).toBe(0);
  });
  it("coordinates independent module instances without losing either mutation", async () => {
    vi.useFakeTimers(); const one = await import("./progress-store"); vi.resetModules(); const two = await import("./progress-store");
    const work = Promise.all([one.enroll("learner", "one"), two.enroll("learner", "two")]);
    await vi.runAllTimersAsync(); await work;
    expect((await two.getLearner("learner")).enrolledCourseIds).toEqual(["courseA", "one", "two"]);
    expect(disk.locks.size).toBe(0);
  });
  it("times out without removing a potentially live lock or changing data", async () => {
    vi.useFakeTimers(); disk.locks.add(lock); const before = disk.files.get(file); const store = await import("./progress-store");
    const result = store.enroll("learner", "new").then(() => null, (error: Error) => error);
    await vi.runAllTimersAsync(); expect(await result).toBeInstanceOf(Error);
    expect((await result)?.message).toMatch(/lock.*timed out/i);
    expect(disk.locks.has(lock)).toBe(true); expect(disk.files.get(file)).toBe(before);
  });
  it.each(["lock", "release"])("surfaces %s errors and never removes another owner's lock", async (fault) => {
    disk.fault = fault; const store = await import("./progress-store");
    await expect(store.enroll("learner", "new")).rejects.toThrow("EACCES");
    expect(disk.locks.size).toBe(fault === "release" ? 1 : 0);
    expect(JSON.parse(disk.files.get(file)!).learners.learner.enrolledCourseIds).toEqual(fault === "release" ? ["courseA", "new"] : ["courseA"]);
  });
});
