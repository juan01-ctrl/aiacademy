import { Landing } from "@/components/home/Landing";
import { formatDuration, getCatalog, listCourses } from "@/lib/catalog";
import { getSession } from "@/lib/auth";
import { getLearner } from "@/lib/progress-store";
import { courseCompletionPercent } from "@/lib/course-completion";
import { agenticRoadmap } from "@/lib/roadmap";

export default async function HomePage() {
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
  const startHref = session ? "/catalog" : "/auth/signin?next=%2Fcatalog";
  return (
    <Landing
      signedIn={Boolean(session)}
      startHref={startHref}
      steps={agenticRoadmap.map((step) => ({
        order: step.order,
        title: step.title,
        summary: step.summary,
        courses: step.courseIds.flatMap((id) => {
          const course = byId.get(id);
          return course ? [{
            ...course,
            duration: formatDuration(course.durationMinutes),
            ...(progressByCourse ? { completionPercent: progressByCourse.get(course.id) ?? 0 } : {}),
          }] : [];
        }),
      }))}
    />
  );
}
