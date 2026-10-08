import type { OperationalStatus } from "@academy/contracts";
import type { LessonStep, PublishedCatalog, PublicLesson } from "./schema";

export type ProgressState = {
  enrolledCourseIds: string[];
  passedExerciseIds: string[];
  completedStepIds: string[];
};

export function orderedExerciseIds(catalog: PublishedCatalog): string[] {
  return catalog.lessons.flatMap((lesson) =>
    lesson.steps.flatMap((step) => (step.type === "exercise" ? [step.exerciseId] : [])),
  );
}

export function isStepComplete(step: LessonStep, state: ProgressState): boolean {
  if (step.type === "explanation") return state.completedStepIds.includes(step.id);
  return state.passedExerciseIds.includes(step.exerciseId);
}

export function orderedModules(catalog: PublishedCatalog) {
  const byId = new Map(catalog.modules.map((item) => [item.id, item]));
  return catalog.course.moduleIds.flatMap((id) => {
    const courseModule = byId.get(id);
    return courseModule ? [courseModule] : [];
  });
}

export function orderedLessons(catalog: PublishedCatalog): PublicLesson[] {
  const byId = new Map(catalog.lessons.map((lesson) => [lesson.id, lesson]));
  return orderedModules(catalog).flatMap((courseModule) =>
    courseModule.lessonIds.flatMap((id) => {
      const lesson = byId.get(id);
      return lesson ? [lesson] : [];
    }),
  );
}

export function isLessonComplete(lesson: PublicLesson, state: ProgressState): boolean {
  return lesson.steps.every((step) => isStepComplete(step, state));
}

export function isStepUnlocked(catalog: PublishedCatalog, state: ProgressState, lessonId: string, stepId: string): boolean {
  if (!state.enrolledCourseIds.includes(catalog.course.id)) return false;
  const lessons = orderedLessons(catalog);
  const lessonIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
  const lesson = lessons[lessonIndex];
  if (!lesson) return false;
  if (!lessons.slice(0, lessonIndex).every((item) => isLessonComplete(item, state))) return false;
  const index = lesson.steps.findIndex((step) => step.id === stepId);
  if (index < 0) return false;
  return lesson.steps.slice(0, index).every((step) => isStepComplete(step, state));
}

export function isUnlocked(catalog: PublishedCatalog, state: ProgressState, exerciseId: string): boolean {
  for (const lesson of catalog.lessons) {
    const step = lesson.steps.find((item) => item.type === "exercise" && item.exerciseId === exerciseId);
    if (step) return isStepUnlocked(catalog, state, lesson.id, step.id);
  }
  return false;
}

export function previousTarget(
  catalog: PublishedCatalog,
  lessonId: string,
  stepId: string,
): { lessonId: string; stepId: string } | null {
  const lessons = orderedLessons(catalog);
  const lesson = lessons.find((item) => item.id === lessonId);
  if (!lesson) return null;
  const index = lesson.steps.findIndex((step) => step.id === stepId);
  if (index > 0) return { lessonId: lesson.id, stepId: lesson.steps[index - 1].id };
  const lessonIndex = lessons.findIndex((item) => item.id === lessonId);
  const previous = lessons[lessonIndex - 1];
  if (!previous) return null;
  return { lessonId: previous.id, stepId: previous.steps[previous.steps.length - 1].id };
}

export function continueTarget(
  catalog: PublishedCatalog,
  lessonId: string,
  stepId: string,
): { lessonId: string; stepId: string } | null {
  const lessons = orderedLessons(catalog);
  const lesson = lessons.find((item) => item.id === lessonId);
  if (!lesson) return null;
  const following = nextStep(lesson, stepId);
  if (following) return { lessonId: lesson.id, stepId: following.id };
  const index = lessons.findIndex((item) => item.id === lessonId);
  const nextLesson = lessons[index + 1];
  if (!nextLesson) return null;
  return { lessonId: nextLesson.id, stepId: nextLesson.steps[0].id };
}

export function isCourseComplete(catalog: PublishedCatalog, state: ProgressState): boolean {
  const lessons = orderedLessons(catalog);
  return lessons.length > 0 && lessons.every((lesson) => isLessonComplete(lesson, state));
}

export function courseProgress(catalog: PublishedCatalog, state: ProgressState): { completed: number; total: number } {
  const steps = orderedLessons(catalog).flatMap((lesson) => lesson.steps);
  return {
    completed: steps.filter((step) => isStepComplete(step, state)).length,
    total: steps.length,
  };
}

export function resumeCourse(catalog: PublishedCatalog, state: ProgressState): { lesson: PublicLesson; step: LessonStep } {
  const lessons = orderedLessons(catalog);
  for (const lesson of lessons) {
    if (!isLessonComplete(lesson, state)) return { lesson, step: resumeStep(lesson, state) };
  }
  const last = lessons[lessons.length - 1];
  return { lesson: last, step: last.steps[last.steps.length - 1] };
}

export function nextStep(lesson: PublicLesson, stepId: string): LessonStep | undefined {
  const index = lesson.steps.findIndex((step) => step.id === stepId);
  return index >= 0 ? lesson.steps[index + 1] : undefined;
}

export function resumeStep(lesson: PublicLesson, state: ProgressState): LessonStep {
  return lesson.steps.find((step) => !isStepComplete(step, state)) ?? lesson.steps[lesson.steps.length - 1];
}

export function applySubmission(
  state: ProgressState,
  exerciseId: string,
  status: OperationalStatus,
): ProgressState {
  if (status !== "passed") return state;
  if (state.passedExerciseIds.includes(exerciseId)) return state;
  return {
    ...state,
    passedExerciseIds: [...state.passedExerciseIds, exerciseId],
  };
}

export function completeExplanation(state: ProgressState, stepId: string): ProgressState {
  if (state.completedStepIds.includes(stepId)) return state;
  return { ...state, completedStepIds: [...state.completedStepIds, stepId] };
}
