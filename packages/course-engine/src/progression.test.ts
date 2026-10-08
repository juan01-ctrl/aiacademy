import { describe, expect, it } from "vitest";
import { applySubmission, completeExplanation, continueTarget, isLessonComplete, isStepUnlocked, isUnlocked, nextStep } from "./progression";
import type { PublishedCatalog } from "./schema";

const catalog: PublishedCatalog = {
  course: { id: "openai-api-fundamentals", title: "OpenAI API", summary: "Call the API.", level: "Basic", durationMinutes: 180, moduleIds: ["responses-api"] },
  modules: [{ id: "responses-api", title: "Responses", durationMinutes: 45, lessonIds: ["first-call"] }],
  lessons: [{
    id: "first-call",
    title: "First call",
    summary: "Return the text.",
    steps: [
      { id: "why", type: "explanation", title: "Why", body: ["A call returns an object."], takeaway: "Read the object.", example: "response" },
      { id: "where", type: "explanation", title: "Where", body: ["The string is output_text."], takeaway: "Return output_text.", example: "response.output_text" },
      { id: "do-return", type: "exercise", exerciseId: "return-output-text" },
      { id: "model", type: "explanation", title: "Model", body: ["The caller passes the model."], takeaway: "Pass it through.", example: "model=model" },
      { id: "keywords", type: "explanation", title: "Keywords", body: ["Name the arguments."], takeaway: "Use keywords.", example: "input=prompt" },
      { id: "do-model", type: "exercise", exerciseId: "pass-the-model" },
    ],
  }],
  exercises: [
    { id: "return-output-text", title: "Return text", order: 1, instructions: ["Return the text."], starterCode: "pass", hints: [], runtime: "python" },
    { id: "pass-the-model", title: "Pass model", order: 2, instructions: ["Pass model."], starterCode: "pass", hints: [], runtime: "python" },
  ],
};

const enrolled = {
  enrolledCourseIds: ["openai-api-fundamentals"],
  passedExerciseIds: [],
  completedStepIds: [],
};

describe("lesson steps", () => {
  it("requires the two explanations before the first exercise", () => {
    const lesson = catalog.lessons[0];
    expect(isStepUnlocked(catalog, enrolled, "first-call", "why")).toBe(true);
    expect(isUnlocked(catalog, enrolled, "return-output-text")).toBe(false);
    const afterFirst = completeExplanation(enrolled, "why");
    expect(isUnlocked(catalog, afterFirst, "return-output-text")).toBe(false);
    const ready = completeExplanation(afterFirst, "where");
    expect(isUnlocked(catalog, ready, "return-output-text")).toBe(true);
    expect(isUnlocked(catalog, ready, "pass-the-model")).toBe(false);
  });

  it("does not unlock the next exercise on fail or timeout", () => {
    const ready = completeExplanation(completeExplanation(enrolled, "why"), "where");
    expect(isUnlocked(catalog, applySubmission(ready, "return-output-text", "failed"), "pass-the-model")).toBe(false);
    expect(isUnlocked(catalog, applySubmission(ready, "return-output-text", "timeout"), "pass-the-model")).toBe(false);
    const passed = applySubmission(ready, "return-output-text", "passed");
    expect(isStepUnlocked(catalog, passed, "first-call", "model")).toBe(true);
    expect(continueTarget(catalog, "first-call", "do-model")).toBeNull();
    expect(isLessonComplete(catalog.lessons[0], passed)).toBe(false);
    expect(isUnlocked(catalog, passed, "pass-the-model")).toBe(false);
    expect(nextStep(catalog.lessons[0], "do-return")?.id).toBe("model");
  });
});
