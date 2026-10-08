import { randomUUID } from "node:crypto";
import { applySubmission, completeExplanation, type ProgressState } from "@academy/course-engine";
import { operationalStatusSchema, type OperationalStatus } from "@academy/contracts";
import { pool } from "./db";

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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStrings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isCertificate(value: unknown): value is CertificateRecord {
  return isObject(value)
    && ["id", "courseId", "holderName", "title", "issuedAt"].every((key) => typeof value[key] === "string")
    && isStrings(value.skills);
}

function validateLearner(value: unknown): asserts value is Partial<LearnerRecord> {
  const invalid = () => { throw new Error("Invalid learner progress schema; refusing to overwrite learner data"); };
  if (!isObject(value)) return invalid();
  for (const key of ["enrolledCourseIds", "passedExerciseIds", "completedStepIds", "assessmentCourseIds"]) {
    if (value[key] !== undefined && !isStrings(value[key])) return invalid();
  }
  if (value.drafts !== undefined && (!isObject(value.drafts) || !Object.values(value.drafts).every((draft) => typeof draft === "string"))) return invalid();
  if (value.assessmentPassed !== undefined && typeof value.assessmentPassed !== "boolean") return invalid();
  if (value.certificate !== undefined && value.certificate !== null && !isCertificate(value.certificate)) return invalid();
  if (value.certificatesByCourseId !== undefined && (!isObject(value.certificatesByCourseId) || !Object.values(value.certificatesByCourseId).every(isCertificate))) return invalid();
  if (value.attempts !== undefined && (!Array.isArray(value.attempts) || !value.attempts.every((attempt) =>
    isObject(attempt) && ["id", "exerciseId", "at"].every((key) => typeof attempt[key] === "string") && operationalStatusSchema.safeParse(attempt.status).success,
  ))) return invalid();
}

function normalize(value: unknown): LearnerRecord {
  if (value !== undefined && value !== null) validateLearner(value);
  const record = (value ?? {}) as Partial<LearnerRecord>;
  const certificatesByCourseId = { ...record.certificatesByCourseId };
  const legacy = record.certificate;
  if (legacy && !certificatesByCourseId[legacy.courseId]) certificatesByCourseId[legacy.courseId] = legacy;
  return {
    ...record,
    enrolledCourseIds: record.enrolledCourseIds ?? [],
    passedExerciseIds: record.passedExerciseIds ?? [],
    completedStepIds: record.completedStepIds ?? [],
    drafts: record.drafts ?? {},
    attempts: record.attempts ?? [],
    assessmentPassed: record.assessmentPassed ?? false,
    assessmentCourseIds: record.assessmentCourseIds ?? (record.assessmentPassed ? ["openai-api-fundamentals"] : []),
    certificate: record.certificate ?? null,
    certificatesByCourseId,
  };
}

async function mutateLearner(learnerId: string, update: (current: LearnerRecord) => LearnerRecord): Promise<LearnerRecord> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO learner_progress (learner_id, state)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (learner_id) DO NOTHING`,
      [learnerId, JSON.stringify(normalize(undefined))],
    );
    const result = await client.query<{ state: unknown }>(
      "SELECT state FROM learner_progress WHERE learner_id = $1 FOR UPDATE",
      [learnerId],
    );
    const next = update(normalize(result.rows[0]?.state));
    await client.query(
      "UPDATE learner_progress SET state = $1::jsonb, updated_at = now() WHERE learner_id = $2",
      [JSON.stringify(next), learnerId],
    );
    await client.query("COMMIT");
    return next;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      throw new AggregateError([error, rollbackError], "Progress update failed and transaction rollback also failed");
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function getLearner(learnerId: string): Promise<LearnerRecord> {
  const result = await pool.query<{ state: unknown }>(
    "SELECT state FROM learner_progress WHERE learner_id = $1",
    [learnerId],
  );
  return normalize(result.rows[0]?.state);
}

export async function enroll(learnerId: string, courseId: string): Promise<LearnerRecord> {
  return mutateLearner(learnerId, (current) => {
    if (!current.enrolledCourseIds.includes(courseId)) current.enrolledCourseIds.push(courseId);
    return current;
  });
}

export async function saveDraft(learnerId: string, exerciseId: string, source: string): Promise<void> {
  await mutateLearner(learnerId, (current) => {
    current.drafts[exerciseId] = source;
    return current;
  });
}

export async function recordAttempt(
  learnerId: string,
  exerciseId: string,
  status: OperationalStatus,
): Promise<LearnerRecord> {
  return mutateLearner(learnerId, (current) => {
    current.attempts.push({ id: randomUUID(), exerciseId, status, at: new Date().toISOString() });
    const next = applySubmission(current, exerciseId, status);
    return { ...current, ...next, attempts: current.attempts, drafts: current.drafts };
  });
}

export async function markExplanationComplete(learnerId: string, stepId: string): Promise<LearnerRecord> {
  return mutateLearner(learnerId, (current) => ({ ...current, ...completeExplanation(current, stepId) }));
}

export async function saveAssessment(learnerId: string, courseId: string, passed: boolean): Promise<LearnerRecord> {
  return mutateLearner(learnerId, (current) => {
    current.assessmentPassed = passed;
    if (passed && !current.assessmentCourseIds.includes(courseId)) current.assessmentCourseIds.push(courseId);
    return current;
  });
}

export async function saveCertificate(learnerId: string, certificate: CertificateRecord): Promise<LearnerRecord> {
  return mutateLearner(learnerId, (current) => {
    if (current.certificatesByCourseId[certificate.courseId]) return current;
    current.certificatesByCourseId[certificate.courseId] = certificate;
    current.certificate ??= certificate;
    return current;
  });
}

export async function findCertificate(id: string): Promise<CertificateRecord | null> {
  const result = await pool.query<{ state: Record<string, unknown> }>(
    `SELECT state FROM learner_progress
     WHERE state->'certificate'->>'id' = $1
       OR EXISTS (
         SELECT 1 FROM jsonb_each(COALESCE(state->'certificatesByCourseId', '{}'::jsonb)) AS item(value)
         WHERE item.value->>'id' = $1
       )
     LIMIT 1`,
    [id],
  );
  const state = result.rows[0]?.state;
  if (!state) return null;
  const legacy = state.certificate;
  if (isCertificate(legacy) && legacy.id === id) return legacy;
  if (isObject(state.certificatesByCourseId)) {
    return Object.values(state.certificatesByCourseId).find((value) => isCertificate(value) && value.id === id) as CertificateRecord | undefined ?? null;
  }
  return null;
}
