import { NextResponse } from "next/server";
import { isStepUnlocked } from "@academy/course-engine";
import { getSession } from "@/lib/auth";
import { findCatalogByStep } from "@/lib/catalog";
import { getLearner, markExplanationComplete } from "@/lib/progress-store";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json();
  const stepId = String(body.stepId ?? "");
  const catalog = await findCatalogByStep(stepId);
  if (!catalog) return NextResponse.json({ error: "Unknown explanation." }, { status: 404 });
  const lesson = catalog.lessons.find((item) => item.steps.some((step) => step.id === stepId));
  const step = lesson?.steps.find((item) => item.id === stepId);
  if (!lesson || !step || step.type !== "explanation") {
    return NextResponse.json({ error: "Unknown explanation." }, { status: 404 });
  }
  const learner = await getLearner(session.learnerId);
  if (!isStepUnlocked(catalog, learner, lesson.id, step.id)) {
    return NextResponse.json({ error: "This step is locked." }, { status: 403 });
  }
  await markExplanationComplete(session.learnerId, step.id);
  return NextResponse.json({ completed: true });
}
