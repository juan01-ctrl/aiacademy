import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ProjectPage from "./page";
import { Workspace } from "@/components/workspace/Workspace";

vi.stubGlobal("React", React);
const fixture = vi.hoisted(() => ({ certificatesByCourseId: {} as Record<string, unknown>, legacyCourseId: "other-course" }));
vi.mock("@/lib/auth", () => ({ getSession: async () => ({ learnerId: "synthetic", name: "Synthetic" }) }));
vi.mock("@/lib/catalog", () => ({ getCatalog: async () => ({
  course: { id: "sample-course", title: "Synthetic", moduleIds: ["module"] },
  modules: [{ id: "module", lessonIds: ["lesson"] }],
  lessons: [{ id: "lesson", steps: [{ id: "intro", type: "explanation" }] }],
  exercises: [],
  project: { id: "project", title: "Synthetic", order: 2, instructions: [], starterCode: "", hints: [], runtime: "python" },
}) }));
vi.mock("@/lib/progress-store", () => ({ getLearner: async () => ({
  enrolledCourseIds: ["sample-course"], completedStepIds: ["intro"], passedExerciseIds: ["project"],
  assessmentCourseIds: ["sample-course"], drafts: {},
  certificate: { id: "LEGACY", courseId: fixture.legacyCourseId },
  certificatesByCourseId: fixture.certificatesByCourseId,
}) }));
// Keep the actual Workspace controls; only the external Monaco loader is replaced.
vi.mock("next/dynamic", () => ({ default: () => () => null }));

describe("project page credential destination", () => {
  it("renders only its own mapped credential", async () => {
    fixture.legacyCourseId = "other-course";
    fixture.certificatesByCourseId = { "sample-course": { id: "OWN", courseId: "sample-course" } };
    const html = renderToStaticMarkup(await ProjectPage({ params: Promise.resolve({ courseId: "sample-course" }) }));
    expect(html).toContain('href="/certificate/OWN"');
    expect(html).toContain('>Continue</a>');
    expect(html).not.toContain('>Submit answer</button>');
    expect(html).not.toContain('/certificate/LEGACY');
  });
  it("falls back to the course overview rather than another course credential", async () => {
    fixture.legacyCourseId = "other-course";
    fixture.certificatesByCourseId = {};
    const html = renderToStaticMarkup(await ProjectPage({ params: Promise.resolve({ courseId: "sample-course" }) }));
    expect(html).toContain('href="/courses/sample-course"');
    expect(html).not.toContain('/certificate/LEGACY');
    expect(html).toContain('>Submit answer</button>');
    expect(html).not.toContain('>Continue</a>');
  });
  it("retains an own-course legacy destination", async () => {
    fixture.legacyCourseId = "sample-course";
    fixture.certificatesByCourseId = {};
    const html = renderToStaticMarkup(await ProjectPage({ params: Promise.resolve({ courseId: "sample-course" }) }));
    expect(html).toContain('href="/certificate/LEGACY"');
  });
  it("retains Continue for an ordinary historically passed exercise", () => {
    const html = renderToStaticMarkup(<Workspace exercise={{ id: "ordinary", title: "Practice", order: 1, instructions: [], starterCode: "", hints: [], runtime: "python" }} initialCode="" passed={true} previousHref={null} nextHref="/learn/sample-course/next" />);
    expect(html).toContain('href="/learn/sample-course/next"');
    expect(html).toContain('>Continue</a>');
    expect(html).not.toContain('>Submit answer</button>');
  });
});
