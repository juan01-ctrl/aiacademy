import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { PublishedCatalog, PublicExercise } from "@academy/course-engine";
import { roadmapCourseOrder } from "@/lib/roadmap";

const publishedDir = path.resolve(process.cwd(), "../../content/.published");

export type CourseCard = {
  id: string;
  title: string;
  summary: string;
  level: "Basic" | "Intermediate" | "Advanced";
  durationMinutes: number;
};

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return Number.isInteger(hours) ? `${hours} hr` : `${hours} hr`;
}

async function readCatalogFile(file: string): Promise<PublishedCatalog> {
  return JSON.parse(await readFile(path.join(publishedDir, file), "utf8")) as PublishedCatalog;
}

export async function listCourses(): Promise<CourseCard[]> {
  const files = (await readdir(publishedDir)).filter((file) => file.endsWith(".json") && file !== "catalog.json" && file !== "index.json");
  const catalogs = await Promise.all(files.map((file) => readCatalogFile(file)));
  return catalogs
    .map((catalog) => ({
      id: catalog.course.id,
      title: catalog.course.title,
      summary: catalog.course.summary,
      level: catalog.course.level,
      durationMinutes: catalog.course.durationMinutes,
    }))
    .sort((a, b) => {
      const order = roadmapCourseOrder();
      const left = order.indexOf(a.id);
      const right = order.indexOf(b.id);
      return (left === -1 ? order.length : left) - (right === -1 ? order.length : right);
    });
}

export async function getCatalog(courseId = "openai-api-fundamentals"): Promise<PublishedCatalog> {
  return readCatalogFile(`${courseId}.json`);
}

export async function findCatalogByStep(stepId: string): Promise<PublishedCatalog | undefined> {
  const files = (await readdir(publishedDir)).filter((file) => file.endsWith(".json") && file !== "catalog.json");
  for (const file of files) {
    const catalog = await readCatalogFile(file);
    if (catalog.lessons.some((lesson) => lesson.steps.some((step) => step.id === stepId))) return catalog;
  }
  return undefined;
}

export async function findCatalogByExercise(exerciseId: string): Promise<PublishedCatalog | undefined> {
  const files = (await readdir(publishedDir)).filter((file) => file.endsWith(".json") && file !== "catalog.json");
  for (const file of files) {
    const catalog = await readCatalogFile(file);
    if (findExercise(catalog, exerciseId)) return catalog;
  }
  return undefined;
}

export function findExercise(catalog: PublishedCatalog, exerciseId: string): PublicExercise | undefined {
  if (catalog.project?.id === exerciseId) return catalog.project;
  return catalog.exercises.find((exercise) => exercise.id === exerciseId);
}
