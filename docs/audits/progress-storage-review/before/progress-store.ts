import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { applySubmission, completeExplanation, type ProgressState } from "@academy/course-engine";
import type { OperationalStatus } from "@academy/contracts";

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
let queue: Promise<unknown> = Promise.resolve();

function normalize(record: Partial<LearnerRecord> | undefined): LearnerRecord {
  const certificatesByCourseId = { ...record?.certificatesByCourseId };
  const legacy = record?.certificate;
  if (legacy && !certificatesByCourseId[legacy.courseId]) certificatesByCourseId[legacy.courseId] = legacy;
  return {
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
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as FileShape;
  } catch {
    return { learners: {} };
  }
}

async function writeStore(store: FileShape): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(store, null, 2)}\n`);
}

function withLock<T>(work: () => Promise<T>): Promise<T> {
  const run = queue.then(work, work);
  queue = run.then(() => undefined, () => undefined);
  return run;
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
