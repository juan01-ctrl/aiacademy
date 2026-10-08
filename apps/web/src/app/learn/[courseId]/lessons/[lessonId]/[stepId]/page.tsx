import Link from "next/link";
import { redirect } from "next/navigation";
import { continueTarget, isStepComplete, isStepUnlocked, orderedLessons, previousTarget } from "@academy/course-engine";
import { ExplanationStep } from "@/components/lesson/ExplanationStep";
import { PlayerShell, type OutlineItem } from "@/components/lesson/PlayerShell";
import { Workspace } from "@/components/workspace/Workspace";
import { getSession } from "@/lib/auth";
import { findExercise, getCatalog } from "@/lib/catalog";
import { getLearner } from "@/lib/progress-store";

export default async function StepPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string; stepId: string }>;
}) {
  const session = await getSession();
  const { courseId, lessonId, stepId } = await params;
  if (!session) redirect(`/auth/signin?next=${encodeURIComponent(`/learn/${courseId}/lessons/${lessonId}/${stepId}`)}`);
  const catalog = await getCatalog(courseId);
  const lesson = catalog.lessons.find((item) => item.id === lessonId);
  const step = lesson?.steps.find((item) => item.id === stepId);
  if (!lesson || !step || catalog.course.id !== courseId) redirect(`/learn/${catalog.course.id}`);
  const learner = await getLearner(session.learnerId);
  if (!learner.enrolledCourseIds.includes(catalog.course.id)) redirect(`/learn/${courseId}`);
  const unlocked = isStepUnlocked(catalog, learner, lesson.id, step.id);
  const previous = previousTarget(catalog, lesson.id, step.id);
  const previousHref = previous ? `/learn/${courseId}/lessons/${previous.lessonId}/${previous.stepId}` : null;
  const following = continueTarget(catalog, lesson.id, step.id);
  const nextHref = following
    ? `/learn/${courseId}/lessons/${following.lessonId}/${following.stepId}`
    : `/learn/${courseId}`;
  const outline: OutlineItem[] = orderedLessons(catalog).flatMap((item) =>
    item.steps.map((lessonStep) => {
      const complete = isStepComplete(lessonStep, learner);
      const available = isStepUnlocked(catalog, learner, item.id, lessonStep.id);
      const title = lessonStep.type === "explanation"
        ? lessonStep.title
        : catalog.exercises.find((exercise) => exercise.id === lessonStep.exerciseId)?.title ?? "Exercise";
      return {
        id: lessonStep.id,
        lessonTitle: item.title,
        title,
        kind: lessonStep.type === "explanation" ? "Theory" : "Exercise",
        xp: lessonStep.type === "explanation" ? 50 : 100,
        href: available || complete ? `/learn/${courseId}/lessons/${item.id}/${lessonStep.id}` : null,
        state: lessonStep.id === step.id ? "current" : complete ? "done" : available ? "open" : "locked",
      };
    }),
  );

  return (
    <PlayerShell courseTitle={catalog.course.title} courseHref={`/learn/${courseId}`} items={outline}>
      {!unlocked ? (
        <section className="grid content-center px-6">
          <h1 className="text-3xl font-medium">This step is locked</h1>
          <p className="mt-2 max-w-lg">Finish the previous step first. A failed submit does not count.</p>
          <Link className="mt-4 w-fit rounded-md bg-green px-4 py-2 text-sm font-semibold text-navy" href={`/learn/${courseId}`}>Back to course</Link>
        </section>
      ) : step.type === "explanation" ? (
        <ExplanationStep
          stepId={step.id}
          title={step.title}
          body={step.body}
          takeaway={step.takeaway}
          example={step.example}
          previousHref={previousHref}
          nextHref={nextHref}
        />
      ) : (
        <Workspace
          exercise={findExercise(catalog, step.exerciseId)!}
          initialCode={learner.drafts[step.exerciseId] ?? findExercise(catalog, step.exerciseId)!.starterCode}
          passed={learner.passedExerciseIds.includes(step.exerciseId)}
          previousHref={previousHref}
          nextHref={nextHref}
        />
      )}
    </PlayerShell>
  );
}
