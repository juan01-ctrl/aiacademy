import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { getLearner } from "@/lib/progress-store";
import { CourseOverview } from "@/components/course/CourseOverview";

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(courseId)) redirect("/catalog");
  const catalog = await getCatalog(courseId);
  if (catalog.course.id !== courseId) redirect("/catalog");

  const session = await getSession();
  const learner = session ? await getLearner(session.learnerId) : undefined;
  return <CourseOverview catalog={catalog} learner={learner} />;
}
