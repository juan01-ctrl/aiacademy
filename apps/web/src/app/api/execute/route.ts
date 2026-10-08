import { NextResponse } from "next/server";
import { executionResultSchema } from "@academy/contracts";
import { isCourseComplete, isUnlocked } from "@academy/course-engine";
import { shouldRecordAttempt } from "@academy/exercise-engine";
import { canIssueCertificate } from "@academy/grading";
import { certificateMetadata, credentialId } from "@academy/shared";
import { getSession } from "@/lib/auth";
import { findCatalogByExercise, findExercise } from "@/lib/catalog";
import { callExecutor } from "@/lib/executor";
import { getLearner, recordAttempt, saveCertificate, saveDraft } from "@/lib/progress-store";
import { courseCertificate } from "@/lib/course-certificate";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json();
  const mode = body.mode === "run" || body.mode === "submit" ? body.mode : null;
  const source = typeof body.source === "string" ? body.source : "";
  if (!mode) return NextResponse.json({ error: "Choose run or submit." }, { status: 400 });

  const catalog = await findCatalogByExercise(String(body.exerciseId ?? ""));
  if (!catalog) return NextResponse.json({ error: "Unknown exercise." }, { status: 404 });
  const exercise = findExercise(catalog, String(body.exerciseId ?? ""));
  if (!exercise) return NextResponse.json({ error: "Unknown exercise." }, { status: 404 });
  const learner = await getLearner(session.learnerId);
  const isProject = catalog.project?.id === exercise.id;
  const allowed = isProject
    ? isCourseComplete(catalog, learner) && learner.assessmentCourseIds.includes(catalog.course.id)
    : isUnlocked(catalog, learner, exercise.id);
  if (!allowed) return NextResponse.json({ error: "This exercise is locked." }, { status: 403 });

  await saveDraft(session.learnerId, exercise.id, source);
  const result = executionResultSchema.parse(await callExecutor({
    mode,
    exerciseId: exercise.id,
    source,
    learnerId: session.learnerId,
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
