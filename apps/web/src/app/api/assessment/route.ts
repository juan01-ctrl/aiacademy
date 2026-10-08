import { NextResponse } from "next/server";
import { isCourseComplete } from "@academy/course-engine";
import { gradeAssessment } from "@academy/grading/assessment";
import { getSession } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { getLearner, saveAssessment } from "@/lib/progress-store";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json();
  const catalog = await getCatalog(String(body.courseId ?? ""));
  const learner = await getLearner(session.learnerId);
  if (!isCourseComplete(catalog, learner)) {
    return NextResponse.json({ error: "Finish the course first." }, { status: 403 });
  }
  const answers = body.answers && typeof body.answers === "object" ? body.answers as Record<string, string> : {};
  const graded = gradeAssessment(catalog.course.id, answers);
  await saveAssessment(session.learnerId, catalog.course.id, graded.passed);
  return NextResponse.json({ score: graded.score, passed: graded.passed });
}
