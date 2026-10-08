import { redirect } from "next/navigation";
import { getCatalog } from "@/lib/catalog";

export default async function ExercisePage({ params }: { params: Promise<{ courseId: string; exerciseId: string }> }) {
  const { courseId, exerciseId } = await params;
  const catalog = await getCatalog(courseId);
  const lesson = catalog.lessons.find((item) => item.steps.some((step) => step.type === "exercise" && step.exerciseId === exerciseId));
  const step = lesson?.steps.find((item) => item.type === "exercise" && item.exerciseId === exerciseId);
  if (!lesson || !step) redirect(`/learn/${courseId}`);
  redirect(`/learn/${courseId}/lessons/${lesson.id}/${step.id}`);
}
