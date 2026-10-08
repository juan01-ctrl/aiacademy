import Link from "next/link";
import { BackLink } from "@/components/nav/BackLink";
import { formatDuration, getCatalog, listCourses } from "@/lib/catalog";
import { agenticRoadmap } from "@/lib/roadmap";
import { getSession } from "@/lib/auth";
import { getLearner } from "@/lib/progress-store";
import { courseCompletionPercent } from "@/lib/course-completion";
import { CourseProgress } from "@/components/course/CourseProgress";

export default async function CatalogPage() {
  const session = await getSession();
  const courses = await listCourses();
  const learner = session ? await getLearner(session.learnerId) : undefined;
  const progressByCourse = learner
    ? new Map(await Promise.all(courses.map(async (course) => [
      course.id,
      courseCompletionPercent(await getCatalog(course.id), learner),
    ] as const)))
    : undefined;
  const byId = new Map(courses.map((course) => [course.id, course]));
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <BackLink href="/" label="Home" />
      <p className="mt-3 text-sm text-muted">Catalog</p>
      <h1 className="mt-1 text-3xl font-semibold">Agentic AI Engineer Roadmap</h1>
      <p className="mt-3 text-sm text-muted">Six courses, in the same order as the agentic track. A module there is a course here.</p>
      <ol className="mt-6 grid gap-4">
        {agenticRoadmap.map((step) => {
          const published = step.courseIds.flatMap((id) => {
            const course = byId.get(id);
            return course ? [course] : [];
          });
          return (
            <li key={step.order} className="rounded-lg border border-line p-5">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">Course {step.order}</p>
              <h2 className="mt-1 text-xl font-semibold">{step.title}</h2>
              <p className="mt-2 text-sm text-muted">{step.summary}</p>
              {published.length > 0 ? (
                <div className="mt-4 grid gap-3">
                  {published.map((course) => (
                    <div key={course.id} className="flex items-start justify-between gap-4 rounded-md border border-line px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{course.title}</p>
                        <p className="text-xs text-muted">{course.level} · {formatDuration(course.durationMinutes)}</p>
                        {progressByCourse ? <CourseProgress percent={progressByCourse.get(course.id) ?? 0} /> : null}
                      </div>
                      <Link href={`/courses/${course.id}`} className="btn btn-primary shrink-0">View course</Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted">Not published yet.</p>
              )}
            </li>
          );
        })}
      </ol>
    </main>
  );
}
