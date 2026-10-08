import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rmdir, unlink } from "node:fs/promises";
import path from "node:path";
import { applySubmission, completeExplanation, type ProgressState } from "@academy/course-engine";
import { operationalStatusSchema, type OperationalStatus } from "@academy/contracts";

type Attempt = {
  id: string;
  exerciseId: string;
  status: OperationalStatus;
  at: string;
};

export type CertificateRecord = {
  id: string;
  courseId: string;
  holderName: string;
  title: string;
  issuedAt: string;
  skills: string[];
};

type LearnerRecord = ProgressState & {
  drafts: Record<string, string>;
  attempts: Attempt[];
  assessmentPassed: boolean;
  assessmentCourseIds: string[];
  certificate: CertificateRecord | null;
  certificatesByCourseId: Record<string, CertificateRecord>;
};

type FileShape = {
  learners: Record<string, LearnerRecord>;
};

const filePath = path.resolve(process.cwd(), "data/progress.json");
const lockPath = `${filePath}.lock`;

function hasCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStrings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isCertificate(value: unknown): boolean {
  return isObject(value) && ["id", "courseId", "holderName", "title", "issuedAt"].every((key) => typeof value[key] === "string") && isStrings(value.skills);
}

// Validate known fields without stripping historical or future extension fields.
function assertStore(value: unknown): asserts value is FileShape {
  const invalid = () => { throw new Error("Invalid progress storage schema; refusing to overwrite learner data"); };
  if (!isObject(value) || !isObject(value.learners)) return invalid();
  for (const record of Object.values(value.learners)) {
    if (!isObject(record)) return invalid();
    for (const key of ["enrolledCourseIds", "passedExerciseIds", "completedStepIds", "assessmentCourseIds"]) {
      if (record[key] !== undefined && !isStrings(record[key])) return invalid();
    }
    if (record.drafts !== undefined && (!isObject(record.drafts) || !Object.values(record.drafts).every((draft) => typeof draft === "string"))) return invalid();
    if (record.assessmentPassed !== undefined && typeof record.assessmentPassed !== "boolean") return invalid();
    if (record.certificate !== undefined && record.certificate !== null && !isCertificate(record.certificate)) return invalid();
    if (record.certificatesByCourseId !== undefined && (!isObject(record.certificatesByCourseId) || !Object.values(record.certificatesByCourseId).every(isCertificate))) return invalid();
    if (record.attempts !== undefined && (!Array.isArray(record.attempts) || !record.attempts.every((attempt) =>
      isObject(attempt) && ["id", "exerciseId", "at"].every((key) => typeof attempt[key] === "string") && operationalStatusSchema.safeParse(attempt.status).success,
    ))) return invalid();
  }
}

function normalize(record: Partial<LearnerRecord> | undefined): LearnerRecord {
  const certificatesByCourseId = { ...record?.certificatesByCourseId };
  const legacy = record?.certificate;
  if (legacy && !certificatesByCourseId[legacy.courseId]) certificatesByCourseId[legacy.courseId] = legacy;
  return {
    ...record,
    enrolledCourseIds: record?.enrolledCourseIds ?? [],
    passedExerciseIds: record?.passedExerciseIds ?? [],
    completedStepIds: record?.completedStepIds ?? [],
    drafts: record?.drafts ?? {},
    attempts: record?.attempts ?? [],
    assessmentPassed: record?.assessmentPassed ?? false,
    assessmentCourseIds: record?.assessmentCourseIds ?? (record?.assessmentPassed ? ["openai-api-fundamentals"] : []),
    certificate: record?.certificate ?? null,
    certificatesByCourseId,
  };
}

async function readStore(): Promise<FileShape> {
  let text: string;
  try {
    text = await readFile(filePath, "utf8");
  } catch (error) {
    if (hasCode(error, "ENOENT")) return { learners: {} };
    throw error;
  }
  const store: unknown = JSON.parse(text);
  assertStore(store);
  return store;
}

async function writeStore(store: FileShape): Promise<void> {
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  // A failed exclusive open never grants ownership of an existing path.
  const handle = await open(temporaryPath, "wx", 0o600);
  try {
    try {
      await handle.writeFile(`${JSON.stringify(store, null, 2)}\n`, "utf8");
    } finally {
      await handle.close();
    }
    await rename(temporaryPath, filePath);
  } catch (error) {
    try {
      await unlink(temporaryPath);
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], "Progress write failed; own temporary-file cleanup also failed");
    }
    throw error;
  }
}

async function withLock<T>(work: () => Promise<T>): Promise<T> {
  await mkdir(path.dirname(filePath), { recursive: true });
  // All writers must share this local path/protocol. Never reclaim a lock by age.
  for (let retry = 0; ; retry++) {
    try {
      await mkdir(lockPath);
      break;
    } catch (error) {
      if (!hasCode(error, "EEXIST")) throw error;
      if (retry >= 100) throw new Error("Progress storage lock wait timed out; check offline recovery instructions");
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
    }
  }
  let workError: unknown;
  try {
    return await work();
  } catch (error) {
    workError = error;
    throw error;
  } finally {
    try {
      await rmdir(lockPath);
    } catch (releaseError) {
      if (workError !== undefined) throw new AggregateError([workError, releaseError], "Progress operation failed; lock release also failed");
      throw releaseError;
    }
  }
}

export async function getLearner(learnerId: string): Promise<LearnerRecord> {
  const store = await readStore();
  return normalize(store.learners[learnerId]);
}

export async function enroll(learnerId: string, courseId: string): Promise<LearnerRecord> {
  return withLock(async () => {
    const store = await readStore();
    const current = normalize(store.learners[learnerId]);
    if (!current.enrolledCourseIds.includes(courseId)) {
      current.enrolledCourseIds.push(courseId);
    }
    store.learners[learnerId] = current;
    await writeStore(store);
    return current;
  });
}

export async function saveDraft(learnerId: string, exerciseId: string, source: string): Promise<void> {
  await withLock(async () => {
    const store = await readStore();
    const current = normalize(store.learners[learnerId]);
    current.drafts[exerciseId] = source;
    store.learners[learnerId] = current;
    await writeStore(store);
  });
}

export async function recordAttempt(
  learnerId: string,
  exerciseId: string,
  status: OperationalStatus,
): Promise<LearnerRecord> {
  return withLock(async () => {
    const store = await readStore();
    const current = normalize(store.learners[learnerId]);
    current.attempts.push({ id: randomUUID(), exerciseId, status, at: new Date().toISOString() });
    const next = applySubmission(current, exerciseId, status);
    store.learners[learnerId] = { ...current, ...next, attempts: current.attempts, drafts: current.drafts };
    await writeStore(store);
    return store.learners[learnerId];
  });
}

export async function markExplanationComplete(learnerId: string, stepId: string): Promise<LearnerRecord> {
  return withLock(async () => {
    const store = await readStore();
    const current = normalize(store.learners[learnerId]);
    const next = completeExplanation(current, stepId);
    store.learners[learnerId] = { ...current, ...next };
    await writeStore(store);
    return store.learners[learnerId];
  });
}

export async function saveAssessment(learnerId: string, courseId: string, passed: boolean): Promise<LearnerRecord> {
  return withLock(async () => {
    const store = await readStore();
    const current = normalize(store.learners[learnerId]);
    current.assessmentPassed = passed;
    if (passed && !current.assessmentCourseIds.includes(courseId)) current.assessmentCourseIds.push(courseId);
    store.learners[learnerId] = current;
    await writeStore(store);
    return current;
  });
}

export async function saveCertificate(learnerId: string, certificate: CertificateRecord): Promise<LearnerRecord> {
  return withLock(async () => {
    const store = await readStore();
    const current = normalize(store.learners[learnerId]);
    if (current.certificatesByCourseId[certificate.courseId]) return current;
    current.certificatesByCourseId[certificate.courseId] = certificate;
    current.certificate ??= certificate;
    store.learners[learnerId] = current;
    await writeStore(store);
    return current;
  });
}

export async function findCertificate(id: string): Promise<CertificateRecord | null> {
  const store = await readStore();
  for (const learner of Object.values(store.learners)) {
    for (const certificate of Object.values(learner.certificatesByCourseId ?? {})) {
      if (certificate.id === id) return certificate;
    }
    if (learner.certificate?.id === id) return learner.certificate;
  }
  return null;
}
