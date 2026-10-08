import Link from "next/link";
import { isCourseComplete, orderedModules, type PublishedCatalog } from "@academy/course-engine";
import type { getLearner } from "@/lib/progress-store";
import { formatDuration } from "@/lib/catalog";
import { EnrollButton } from "@/components/course/EnrollButton";
import { courseCertificate } from "@/lib/course-certificate";

type Learner = Awaited<ReturnType<typeof getLearner>>;

export function CourseOverview({ catalog, learner }: { catalog: PublishedCatalog; learner?: Learner }) {
  const courseId = catalog.course.id;
  const certificate = courseCertificate(learner, courseId);
  const enrolled = learner?.enrolledCourseIds.includes(courseId) ?? false;
  const lessonsDone = learner ? isCourseComplete(catalog, learner) : false;
  const projectDone = learner?.passedExerciseIds.includes(catalog.project?.id ?? "") ?? false;
  const signUpHref = `/auth/signup?next=${encodeURIComponent(`/courses/${courseId}`)}`;

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <p className="text-sm text-muted"><Link className="underline-offset-4 hover:underline" href="/catalog">Catalog</Link><span aria-hidden="true"> / </span>Course</p>
      <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-9">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-primary">{catalog.course.level} <span aria-hidden="true">·</span> {formatDuration(catalog.course.durationMinutes)}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">{catalog.course.title}</h1>
        <p className="mt-4 max-w-2xl leading-7 text-navy/80">{catalog.course.summary}</p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          {learner ? (enrolled
            ? <Link className="btn btn-primary" href={`/learn/${courseId}`}>Continue lessons</Link>
            : <EnrollButton courseId={courseId} />)
            : <Link className="btn btn-primary" href={signUpHref}>Sign up to enroll</Link>}
          <span className="text-sm text-muted">{orderedModules(catalog).length} modules · {formatDuration(catalog.course.durationMinutes)}</span>
        </div>
      </div>

      <section aria-labelledby="course-modules-title" className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-primary">Course outline</p>
            <h2 id="course-modules-title" className="mt-1 text-2xl font-semibold tracking-tight">Explore the modules</h2>
          </div>
          <p className="text-sm text-muted">Preview the learning path before enrolling</p>
        </div>
        <ol className="mt-4 divide-y divide-line rounded-xl border border-line bg-white">
          {orderedModules(catalog).map((courseModule, index) => (
            <li key={courseModule.id} className="flex items-start gap-4 px-4 py-4 sm:px-5">
              <span aria-hidden="true" className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-soft font-mono text-xs font-semibold text-primary">{String(index + 1).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-navy">{courseModule.title}</h3>
                <p className="mt-1 text-sm text-muted">{formatDuration(courseModule.durationMinutes)}</p>
              </div>
              <span aria-hidden="true" className="mt-2 text-muted">›</span>
            </li>
          ))}
        </ol>
      </section>

      {learner ? <section aria-label="Your course progress" className="mt-8 grid gap-3 rounded-xl border border-line bg-white p-5 text-sm sm:p-6">
        <p>{lessonsDone ? "Knowledge assessment is open." : "Finish every chapter to unlock the assessment."}</p>
        {lessonsDone ? <Link className="w-fit rounded-md border border-line px-4 py-2 font-semibold" href={`/courses/${courseId}/assessment`}>Open assessment</Link> : null}
        <p>{learner.assessmentCourseIds.includes(courseId) ? "Final project is open." : "Pass the assessment to unlock the project."}</p>
        {learner.assessmentCourseIds.includes(courseId) && catalog.project ? <Link className="w-fit rounded-md border border-line px-4 py-2 font-semibold" href={`/courses/${courseId}/project`}>Open final project</Link> : null}
        {certificate ? <Link className="w-fit font-semibold text-navy underline" href={`/certificate/${certificate.id}`}>Certificate {certificate.id}</Link> : <p className="text-muted">{projectDone ? "Certificate pending." : "Certificate unlocks after the project."}</p>}
      </section> : null}
    </main>
  );
}
