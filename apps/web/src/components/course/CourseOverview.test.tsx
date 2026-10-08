import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { PublishedCatalog } from "@academy/course-engine";
import { CourseOverview } from "./CourseOverview";

vi.stubGlobal("React", React);

const catalog = {
  course: { id: "sample-course", title: "Sample Course", summary: "A course summary.", level: "Basic", durationMinutes: 60, moduleIds: ["module-one"] },
  lessons: [],
  modules: [{ id: "module-one", title: "First module", durationMinutes: 20, lessonIds: [] }],
  exercises: [],
  assessments: [],
  project: null,
} as unknown as PublishedCatalog;

describe("CourseOverview", () => {
  it("shows only the current course credential, never another course legacy slot", () => {
    const certificate = { id: "OWN", courseId: "sample-course", holderName: "Synthetic", title: "Completion", issuedAt: "2020", skills: [] };
    const learner = { enrolledCourseIds: [], completedStepIds: [], passedExerciseIds: [], assessmentCourseIds: [], certificate: { ...certificate, id: "OTHER", courseId: "other-course" }, certificatesByCourseId: { "sample-course": certificate } };
    const own = renderToStaticMarkup(<CourseOverview catalog={catalog} learner={learner as never} />);
    expect(own).toContain('href="/certificate/OWN"');
    expect(own).not.toContain('/certificate/OTHER');
    const other = renderToStaticMarkup(<CourseOverview catalog={catalog} learner={{ ...learner, certificatesByCourseId: {} } as never} />);
    expect(other).not.toContain('/certificate/OTHER');
  });
  it("shows public course information and modules without learner-only data", () => {
    const html = renderToStaticMarkup(<CourseOverview catalog={catalog} />);
    expect(html).toContain("Sample Course");
    expect(html).toContain("First module");
    expect(html).toContain('href="/auth/signup?next=%2Fcourses%2Fsample-course"');
    expect(html).not.toContain("assessment");
    expect(html).not.toContain("Certificate");
    expect(html).not.toContain("Continue lessons");
  });

  it("retains learner actions and progress when learner data is present", () => {
    const learner = {
      enrolledCourseIds: ["sample-course"],
      completedStepIds: [],
      passedExerciseIds: [],
      assessmentCourseIds: [],
      certificate: null,
    } as never;
    const html = renderToStaticMarkup(<CourseOverview catalog={catalog} learner={learner} />);
    expect(html).toContain('href="/learn/sample-course"');
    expect(html).toContain("Continue lessons");
    expect(html).toContain("Finish every chapter to unlock the assessment.");
  });
});
