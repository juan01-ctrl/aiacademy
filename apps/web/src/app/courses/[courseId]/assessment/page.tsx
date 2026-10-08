import Link from "next/link";
import { redirect } from "next/navigation";
import { isCourseComplete } from "@academy/course-engine";
import { publicAssessment } from "@academy/grading/assessment";
import { AssessmentForm } from "@/components/course/AssessmentForm";
import { getSession } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { getLearner } from "@/lib/progress-store";

export default async function AssessmentPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const session = await getSession();
  if (!session) redirect(`/auth/signin?next=${encodeURIComponent(`/courses/${courseId}/assessment`)}`);
  const catalog = await getCatalog(courseId);
  const learner = await getLearner(session.learnerId);
  if (!isCourseComplete(catalog, learner)) redirect(`/courses/${courseId}`);
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href={`/courses/${courseId}`} className="text-sm text-muted">← Course</Link>
      <h1 className="mt-3 text-3xl font-semibold">Knowledge assessment</h1>
      <p className="mt-2 text-sm text-muted">Pass mark is 75%. This does not grade your code.</p>
      {learner.assessmentCourseIds.includes(courseId) ? <p className="mt-4 rounded-md bg-pass/15 px-4 py-3 text-sm">Passed. The final project is open.</p> : null}
      <AssessmentForm courseId={courseId} questions={publicAssessment(courseId)} />
    </main>
  );
}
