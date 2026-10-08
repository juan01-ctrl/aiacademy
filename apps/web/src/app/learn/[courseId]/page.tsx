import Link from "next/link";
import { redirect } from "next/navigation";
import { courseProgress, isLessonComplete, isStepComplete, orderedLessons, orderedModules, resumeCourse, resumeStep } from "@academy/course-engine";
import { EnrollButton } from "@/components/course/EnrollButton";
import { BackLink } from "@/components/nav/BackLink";
import { getSession } from "@/lib/auth";
import { formatDuration, getCatalog } from "@/lib/catalog";
import { getLearner } from "@/lib/progress-store";

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const session = await getSession();
  const { courseId } = await params;
  if (!session) redirect(`/auth/signin?next=${encodeURIComponent(`/learn/${courseId}`)}`);
  const catalog = await getCatalog(courseId);
  if (catalog.course.id !== courseId) redirect("/learn/openai-api-fundamentals");
  const learner = await getLearner(session.learnerId);
  const enrolled = learner.enrolledCourseIds.includes(catalog.course.id);
  const lessons = orderedLessons(catalog);
  const progress = courseProgress(catalog, learner);
  const percent = progress.total === 0 ? 0 : Math.round((progress.completed / progress.total) * 100);
  const resume = resumeCourse(catalog, learner);
  const xp = lessons.reduce((total, lesson) => total + lesson.steps.reduce((sum, step) => sum + (step.type === "explanation" ? 50 : 100), 0), 0);

  return (
    <main className="mx-auto grid max-w-3xl gap-8 px-6 py-10">
      <header>
        <BackLink href="/catalog" label="Catalog" />
        <p className="mt-3 text-sm text-muted">Course</p>
        <h1 className="mt-1 text-4xl font-semibold">{catalog.course.title}</h1>
        <p className="mt-3 max-w-2xl text-navy/80">{catalog.course.summary}</p>
        <p className="mt-4 text-sm text-muted">{catalog.course.level} · {formatDuration(catalog.course.durationMinutes)} · {percent}% complete</p>
        <div className="mt-2 h-2 rounded-full bg-line" aria-hidden="true">
          <div className="h-2 rounded-full bg-green" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-5">
          {enrolled ? (
            <Link className="btn btn-primary" href={`/learn/${courseId}/lessons/${resume.lesson.id}/${resume.step.id}`}>
              {progress.completed === 0 ? "Start course" : progress.completed === progress.total ? "Review course" : "Continue course"}
            </Link>
          ) : <EnrollButton courseId={catalog.course.id} />}
        </div>
      </header>
      <section>
        <h2 className="text-lg font-semibold">Course outline</h2>
        <ol className="mt-4 grid gap-6">
          {orderedModules(catalog).map((courseModule, index) => {
            const chapterLessons = courseModule.lessonIds.flatMap((id) => lessons.filter((lesson) => lesson.id === id));
            const previousDone = orderedModules(catalog).slice(0, index).every((item) =>
              item.lessonIds.every((id) => {
                const lesson = lessons.find((entry) => entry.id === id);
                return lesson ? isLessonComplete(lesson, learner) : false;
              }),
            );
            const open = enrolled && previousDone;
            const incomplete = chapterLessons.find((lesson) => !isLessonComplete(lesson, learner));
            const startLesson = incomplete ?? chapterLessons[0];
            const start = open && startLesson ? (isLessonComplete(startLesson, learner) ? startLesson.steps[0] : resumeStep(startLesson, learner)) : null;
            const started = chapterLessons.some((lesson) => lesson.steps.some((step) => isStepComplete(step, learner)));
            const done = chapterLessons.every((lesson) => isLessonComplete(lesson, learner));
            return (
              <li key={courseModule.id} className="rounded-lg border border-line">
                <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-4">
                  <div>
                    <p className="text-xs font-semibold text-muted">Chapter {index + 1}</p>
                    <h3 className="text-lg font-semibold">{courseModule.title}</h3>
                    <p className="text-xs text-muted">{formatDuration(courseModule.durationMinutes)}</p>
                  </div>
                  {start ? (
                    <Link className="btn btn-primary shrink-0" href={`/learn/${courseId}/lessons/${startLesson.id}/${start.id}`}>
                      {done ? "Review" : started ? "Continue chapter" : "Start chapter"}
                    </Link>
                  ) : <span className="text-sm text-muted">Locked</span>}
                </div>
                <ul>
                  {chapterLessons.flatMap((lesson) => lesson.steps).map((step) => {
                    const title = step.type === "explanation" ? step.title : catalog.exercises.find((item) => item.id === step.exerciseId)?.title;
                    const complete = isStepComplete(step, learner);
                    return (
                      <li key={step.id} className="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
                        <span className="flex items-center gap-3">
                          <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${complete ? "bg-pass text-white" : "bg-line text-muted"}`}>{complete ? "✓" : ""}</span>
                          {title}
                        </span>
                        <span className="text-muted">{step.type === "explanation" ? "Theory · 50 XP" : "Exercise · 100 XP"}</span>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
