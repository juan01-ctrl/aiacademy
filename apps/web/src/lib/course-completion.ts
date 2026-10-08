import { courseProgress, type ProgressState, type PublishedCatalog } from "@academy/course-engine";

export function courseCompletionPercent(catalog: PublishedCatalog, learner: ProgressState): number {
  const progress = courseProgress(catalog, learner);
  return progress.total === 0 ? 0 : Math.round((progress.completed / progress.total) * 100);
}
