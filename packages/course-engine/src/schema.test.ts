import { mkdtemp, readFile, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { publishCatalog } from "./load";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

describe("course import", () => {
  it("publishes the sample course without hidden-test canaries", async () => {
    const output = path.join(os.tmpdir(), `academy-catalog-${Date.now()}.json`);
    const catalog = await publishCatalog(path.join(root, "content/courses/openai-api-fundamentals"), output);
    const published = await readFile(output, "utf8");
    expect(catalog.course.level).toBe("Basic");
    expect(catalog.exercises.map((item) => item.id)).toContain("pass-json-schema");
    expect(catalog.lessons.map((item) => item.id)).toContain("structured-json");
    expect(published).not.toContain("CANARY_HIDDEN_ASSERTION");
    expect(published).not.toContain("solutionCode");
  });

  it("rejects public files that try to ship hidden tests", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "academy-course-"));
    await writeFile(path.join(dir, "course.yaml"), "id: demo\ntitle: Demo\nsummary: Demo\nmoduleIds: [mod]\nhiddenTests: [secret]\n");
    await expect(publishCatalog(dir, path.join(dir, "out.json"))).rejects.toThrow(/private authoring key/);
    await mkdir(path.join(dir, "01"), { recursive: true });
  });
});
