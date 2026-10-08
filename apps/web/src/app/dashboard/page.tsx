import Link from "next/link";
import { redirect } from "next/navigation";
import { BackLink } from "@/components/nav/BackLink";
import { getSession } from "@/lib/auth";
import { formatDuration, getCatalog, listCourses } from "@/lib/catalog";
import { getLearner } from "@/lib/progress-store";
import { courseCompletionPercent } from "@/lib/course-completion";
import { CourseProgress } from "@/components/course/CourseProgress";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin?next=%2Fdashboard");
  const courses = await listCourses();
  const learner = await getLearner(session.learnerId);
  const progressByCourse = new Map(await Promise.all(courses.map(async (course) => [
    course.id,
    courseCompletionPercent(await getCatalog(course.id), learner),
  ] as const)));
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <BackLink href="/" label="Home" />
      <p className="mt-3 text-sm text-muted">Dashboard</p>
      <h1 className="mt-1 text-3xl font-semibold">{session.name}</h1>
      <div className="mt-6 grid gap-4">
        {courses.map((course) => (
          <article key={course.id} className="rounded-lg border border-line p-5">
            <p className="text-xs font-semibold text-muted">{course.level} · {formatDuration(course.durationMinutes)}</p>
            <h2 className="mt-1 text-lg font-semibold">{course.title}</h2>
            <p className="mt-2 text-sm text-muted">{learner.enrolledCourseIds.includes(course.id) ? "Enrolled" : "Not enrolled"}</p>
            <CourseProgress percent={progressByCourse.get(course.id) ?? 0} />
            <Link href={`/courses/${course.id}`} className="btn btn-primary mt-4">Open course</Link>
          </article>
        ))}
      </div>
    </main>
  );
}
