import { NextResponse } from "next/server";
import { executionResultSchema } from "@academy/contracts";
import { isCourseComplete, isUnlocked } from "@academy/course-engine";
import { shouldRecordAttempt } from "@academy/exercise-engine";
import { canIssueCertificate } from "@academy/grading";
import { certificateMetadata, credentialId } from "@academy/shared";
import { getSession } from "@/lib/auth";
import { findCatalogByExercise, findExercise } from "@/lib/catalog";
import { callExecutor } from "@/lib/executor";
import { parseExecuteRequest } from "@/lib/execute-request";
import { getLearner, recordAttempt, saveCertificate, saveDraft } from "@/lib/progress-store";
import { courseCertificate } from "@/lib/course-certificate";
import { acquireExecutionPermit } from "@/lib/execution-rate-limit";

export const maxDuration = 30;

export async function POST(request: Request) {
  // Leave 10 seconds of the platform's 30-second route budget for persistence and response work.
  const deadlineAt = Date.now() + 20_000;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsedRequest = await parseExecuteRequest(request);
  if ("error" in parsedRequest) {
    return NextResponse.json({ error: parsedRequest.error }, { status: parsedRequest.status });
  }
  const { mode, source, exerciseId } = parsedRequest.data;

  const catalog = await findCatalogByExercise(exerciseId);
  if (!catalog) return NextResponse.json({ error: "Unknown exercise." }, { status: 404 });
  const exercise = findExercise(catalog, exerciseId);
  if (!exercise) return NextResponse.json({ error: "Unknown exercise." }, { status: 404 });
  const learner = await getLearner(session.learnerId);
  const isProject = catalog.project?.id === exercise.id;
  const allowed = isProject
    ? isCourseComplete(catalog, learner) && learner.assessmentCourseIds.includes(catalog.course.id)
    : isUnlocked(catalog, learner, exercise.id);
  if (!allowed) return NextResponse.json({ error: "This exercise is locked." }, { status: 403 });

  const permit = await acquireExecutionPermit(session.learnerId);
  if (permit.unavailable) return NextResponse.json({ error: "Execution capacity is temporarily unavailable." }, { status: 503 });
  if (!permit.allowed) return NextResponse.json({ error: "Execution limit reached. Please wait before trying again." }, { status: 429 });
  await saveDraft(session.learnerId, exercise.id, source);
  const result = executionResultSchema.parse(await callExecutor({
    mode,
    exerciseId: exercise.id,
    source,
    learnerId: session.learnerId,
    deadlineAt,
  }));
  const progress = shouldRecordAttempt(mode)
    ? await recordAttempt(session.learnerId, exercise.id, result.status)
    : learner;
  let certificateHref: string | null = null;
  if (mode === "submit" && isProject && result.status === "passed" && canIssueCertificate({
    courseComplete: isCourseComplete(catalog, progress),
    assessmentPassed: progress.assessmentCourseIds.includes(catalog.course.id),
    projectPassed: true,
  })) {
    const persisted = courseCertificate(progress, catalog.course.id) ? progress : await saveCertificate(session.learnerId, {
      id: credentialId(session.learnerId, catalog.course.id),
      courseId: catalog.course.id,
      holderName: session.name,
      ...certificateMetadata(catalog.course.id, catalog.course.title),
      issuedAt: new Date().toISOString(),
    });
    const certificate = courseCertificate(persisted, catalog.course.id);
    certificateHref = certificate ? `/certificate/${certificate.id}` : null;
  }
  return NextResponse.json({ result, passedExerciseIds: progress.passedExerciseIds, certificateHref });
}
