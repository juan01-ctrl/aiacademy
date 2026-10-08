import { describe, expect, it } from "vitest";
import type { ProgressState, PublishedCatalog } from "@academy/course-engine";
import { courseCompletionPercent } from "./course-completion";

const emptyLearner: ProgressState = { enrolledCourseIds: [], completedStepIds: [], passedExerciseIds: [] };
const catalog: PublishedCatalog = {
  course: { id: "sample-course", title: "Sample", summary: "Summary", level: "Basic", durationMinutes: 30, moduleIds: ["module"] },
  modules: [{ id: "module", title: "Module", durationMinutes: 30, lessonIds: ["lesson"] }],
  lessons: [{
    id: "lesson", title: "Lesson", summary: "Summary", durationMinutes: 30,
    steps: [
      { id: "intro", type: "explanation", title: "Intro", body: ["Body"], takeaway: "Takeaway", example: "Example" },
      { id: "practice-step", type: "exercise", exerciseId: "practice" },
    ],
  }],
  exercises: [{ id: "practice", title: "Practice", order: 1, instructions: ["Practice"], starterCode: "", hints: [], runtime: "python" }],
};

describe("courseCompletionPercent", () => {
  it("uses the course step count and rounds completion percentage", () => {
    expect(courseCompletionPercent(catalog, { ...emptyLearner, completedStepIds: ["intro"] })).toBe(50);
  });

  it("returns zero when the course has no steps", () => {
    expect(courseCompletionPercent({ ...catalog, course: { ...catalog.course, moduleIds: [] } }, emptyLearner)).toBe(0);
  });
});
