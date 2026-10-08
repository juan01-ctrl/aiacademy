import Link from "next/link";
import { redirect } from "next/navigation";
import { isCourseComplete } from "@academy/course-engine";
import { Workspace } from "@/components/workspace/Workspace";
import { getSession } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { getLearner } from "@/lib/progress-store";
import { courseCertificate } from "@/lib/course-certificate";

export default async function ProjectPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const session = await getSession();
  if (!session) redirect(`/auth/signin?next=${encodeURIComponent(`/courses/${courseId}/project`)}`);
  const catalog = await getCatalog(courseId);
  const learner = await getLearner(session.learnerId);
  if (!catalog.project || !isCourseComplete(catalog, learner) || !learner.assessmentCourseIds.includes(courseId)) redirect(`/courses/${courseId}`);
  const passed = learner.passedExerciseIds.includes(catalog.project.id);
  const certificate = courseCertificate(learner, courseId);
  return (
    <main className="h-screen">
      <Workspace
        exercise={catalog.project}
        initialCode={learner.drafts[catalog.project.id] ?? catalog.project.starterCode}
        // Historical progress stays intact; missing credentials require a graded resubmission.
        passed={passed && certificate !== null}
        previousHref={`/courses/${courseId}`}
        nextHref={certificate ? `/certificate/${certificate.id}` : `/courses/${courseId}`}
      />
      <p className="sr-only"><Link href={`/courses/${courseId}`}>Back</Link></p>
    </main>
  );
}
