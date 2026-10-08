import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { enroll } from "@/lib/progress-store";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json();
  let catalog;
  try {
    catalog = await getCatalog(String(body.courseId ?? ""));
  } catch {
    return NextResponse.json({ error: "Unknown course." }, { status: 404 });
  }
  const learner = await enroll(session.learnerId, catalog.course.id);
  return NextResponse.json({ enrolled: learner.enrolledCourseIds.includes(catalog.course.id) });
}
