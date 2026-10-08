import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publishCatalog } from "./load";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const coursesRoot = path.join(root, "content/courses");
const publishedRoot = path.join(root, "content/.published");
const dirs = (await readdir(coursesRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();

for (const dir of dirs) {
  const catalog = await publishCatalog(path.join(coursesRoot, dir), path.join(publishedRoot, `${dir}.json`));
  if (catalog.course.id === "openai-api-fundamentals") {
    await publishCatalog(path.join(coursesRoot, dir), path.join(publishedRoot, "catalog.json"));
  }
  console.log(`Published ${catalog.course.id} · ${catalog.course.level} · ${catalog.course.durationMinutes} min · ${catalog.exercises.length} exercises`);
}
