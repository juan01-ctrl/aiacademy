import { z } from "zod";

export const exerciseIdSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Exercise id must be a slug");

export const executionRequestSchema = z.object({
  exerciseId: exerciseIdSchema,
  source: z.string().max(50_000),
  learnerId: z.string().min(1).max(200),
});

export type ExecutionRequest = z.infer<typeof executionRequestSchema>;

export const operationalStatusSchema = z.enum([
  "ok",
  "passed",
  "failed",
  "timeout",
  "error",
  "unavailable",
]);

export type OperationalStatus = z.infer<typeof operationalStatusSchema>;

export const feedbackItemSchema = z.object({
  concept: z.string().max(120),
  message: z.string().max(500),
});

export const executionResultSchema = z.object({
  status: operationalStatusSchema,
  stdout: z.string().max(8_000),
  stderr: z.string().max(8_000),
  truncated: z.boolean(),
  feedback: z.array(feedbackItemSchema).max(8),
});

export type ExecutionResult = z.infer<typeof executionResultSchema>;

export const OUTPUT_CAP = 8_000;
export const SOURCE_CAP = 50_000;

const privateKeys = ["solution", "solutionCode", "hiddenTests", "assertions", "testSource"] as const;

export function assertNoPrivateFields(value: unknown): void {
  if (!value || typeof value !== "object") return;
  for (const key of Object.keys(value)) {
    if ((privateKeys as readonly string[]).includes(key)) {
      throw new Error(`Private field leaked: ${key}`);
    }
  }
}
