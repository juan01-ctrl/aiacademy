import { z } from "zod";

const forbiddenKeys = [
  "solution",
  "solution_code",
  "solutionCode",
  "hidden_tests",
  "hiddenTests",
  "tests",
  "testSource",
];

export const exerciseSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(120),
  order: z.number().int().positive(),
  instructions: z.array(z.string().min(1)).min(1),
  starterCode: z.string().min(1).max(20_000),
  hints: z.array(z.string().min(1)).max(5),
  runtime: z.literal("python"),
}).strict();

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const explanationStepSchema = z.object({
  id: slug,
  type: z.literal("explanation"),
  title: z.string().min(1).max(120),
  body: z.array(z.string().min(1)).min(1).max(8),
  takeaway: z.string().min(1).max(400),
  example: z.string().min(1).max(2_000),
}).strict();

export const exerciseStepSchema = z.object({
  id: slug,
  type: z.literal("exercise"),
  exerciseId: slug,
}).strict();

export const stepSchema = z.discriminatedUnion("type", [explanationStepSchema, exerciseStepSchema]);

export const lessonSchema = z.object({
  id: slug,
  title: z.string().min(1),
  summary: z.string().min(1).max(280),
  durationMinutes: z.number().int().positive().default(15),
  steps: z.array(stepSchema).min(1),
}).strict();

export const moduleSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  durationMinutes: z.number().int().positive().default(30),
  lessonIds: z.array(z.string()).min(1),
}).strict();

export const courseSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  summary: z.string().min(1),
  level: z.enum(["Basic", "Intermediate", "Advanced"]),
  durationMinutes: z.number().int().positive(),
  moduleIds: z.array(z.string()).min(1),
}).strict();

export type PublicExercise = z.infer<typeof exerciseSchema>;
export type LessonStep = z.infer<typeof stepSchema>;
export type PublicLesson = z.infer<typeof lessonSchema>;
export type PublicModule = z.infer<typeof moduleSchema>;
export type PublicCourse = z.infer<typeof courseSchema>;

export type PublishedCatalog = {
  course: PublicCourse;
  modules: PublicModule[];
  lessons: PublicLesson[];
  exercises: PublicExercise[];
  project?: PublicExercise;
};

export function rejectPrivateKeys(value: unknown, label: string): void {
  if (!value || typeof value !== "object") return;
  for (const key of Object.keys(value)) {
    if (forbiddenKeys.includes(key)) {
      throw new Error(`${label} contains private authoring key "${key}"`);
    }
  }
}
