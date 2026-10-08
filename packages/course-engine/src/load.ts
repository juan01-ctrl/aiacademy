import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import {
  courseSchema,
  exerciseSchema,
  lessonSchema,
  moduleSchema,
  rejectPrivateKeys,
  type PublishedCatalog,
} from "./schema";

async function readYaml(filePath: string): Promise<unknown> {
  const raw = await readFile(filePath, "utf8");
  return parse(raw);
}

export async function loadCourseSource(courseDir: string): Promise<PublishedCatalog> {
  const courseRaw = await readYaml(path.join(courseDir, "course.yaml"));
  rejectPrivateKeys(courseRaw, "course.yaml");
  const course = courseSchema.parse(courseRaw);

  const moduleDirs = (await readdir(courseDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const modules = [];
  const lessons = [];
  const exercises = [];

  for (const moduleDirName of moduleDirs) {
    const moduleDir = path.join(courseDir, moduleDirName);
    const moduleRaw = await readYaml(path.join(moduleDir, "module.yaml"));
    rejectPrivateKeys(moduleRaw, `${moduleDirName}/module.yaml`);
    const courseModule = moduleSchema.parse(moduleRaw);
    modules.push(courseModule);

    const lessonFiles = (await readdir(moduleDir)).filter((file) => /^lesson.*\.yaml$/.test(file));
    const loadedLessons = new Map<string, ReturnType<typeof lessonSchema.parse>>();
    for (const file of lessonFiles) {
      const lessonRaw = await readYaml(path.join(moduleDir, file));
      rejectPrivateKeys(lessonRaw, `${moduleDirName}/${file}`);
      const lesson = lessonSchema.parse(lessonRaw);
      loadedLessons.set(lesson.id, lesson);
    }
    for (const lessonId of courseModule.lessonIds) {
      const lesson = loadedLessons.get(lessonId);
      if (!lesson) throw new Error(`Missing lesson ${lessonId}`);
      lessons.push(lesson);
    }

    const files = (await readdir(moduleDir)).filter((file) => file.startsWith("exercise-") && file.endsWith(".yaml"));
    for (const file of files) {
      const exerciseRaw = await readYaml(path.join(moduleDir, file));
      rejectPrivateKeys(exerciseRaw, file);
      exercises.push(exerciseSchema.parse(exerciseRaw));
    }
  }

  const projectPath = path.join(courseDir, "project.yaml");
  let project: PublishedCatalog["project"];
  try {
    const projectRaw = await readYaml(projectPath);
    rejectPrivateKeys(projectRaw, "project.yaml");
    project = exerciseSchema.parse(projectRaw);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const catalog = { course, modules, lessons, exercises, project };
  validateLinks(catalog);
  return catalog;
}

function validateLinks(catalog: PublishedCatalog): void {
  const moduleIds = new Set(catalog.modules.map((item) => item.id));
  const lessonIds = new Set(catalog.lessons.map((item) => item.id));
  const exerciseIds = new Set(catalog.exercises.map((item) => item.id));
  for (const id of catalog.course.moduleIds) {
    if (!moduleIds.has(id)) throw new Error(`Missing module ${id}`);
  }
  for (const courseModule of catalog.modules) {
    for (const id of courseModule.lessonIds) {
      if (!lessonIds.has(id)) throw new Error(`Missing lesson ${id}`);
    }
  }
  const referenced = new Set<string>();
  for (const lesson of catalog.lessons) {
    for (const step of lesson.steps) {
      if (step.type !== "exercise") continue;
      if (!exerciseIds.has(step.exerciseId)) throw new Error(`Missing exercise ${step.exerciseId}`);
      if (referenced.has(step.exerciseId)) throw new Error(`Exercise ${step.exerciseId} is used twice`);
      referenced.add(step.exerciseId);
    }
  }
  for (const id of exerciseIds) {
    if (!referenced.has(id)) throw new Error(`Exercise ${id} is not in a lesson step`);
  }
}

export async function publishCatalog(courseDir: string, outputPath: string): Promise<PublishedCatalog> {
  const catalog = await loadCourseSource(courseDir);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
  return catalog;
}
