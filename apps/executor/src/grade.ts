import { readFile } from "node:fs/promises";
import path from "node:path";
import { executionResultSchema, type ExecutionResult } from "@academy/contracts";
import { runIsolated } from "./isolate";
import { getGradingRoot } from "./grading-root";

const GRADING_ROOT = getGradingRoot();

type Manifest = Record<string, { entry: string; args?: unknown[]; calls?: Array<{ args: unknown[] }> }>;

export async function loadManifest(): Promise<Manifest> {
  return JSON.parse(await readFile(path.join(GRADING_ROOT, "manifest.json"), "utf8")) as Manifest;
}

export async function executeExercise(input: {
  exerciseId: string;
  source: string;
  mode: "run" | "submit";
  deadlineAt?: number;
}): Promise<ExecutionResult> {
  const manifest = await loadManifest();
  const exercise = manifest[input.exerciseId];
  if (!exercise) {
    return executionResultSchema.parse({
      status: "error",
      stdout: "",
      stderr: "Unknown exercise.",
      truncated: false,
      feedback: [],
    });
  }

  if (input.mode === "submit") {
    return executionResultSchema.parse({
      status: "unavailable",
      stdout: "",
      stderr: "Automated submission is disabled because grading evidence cannot yet be attested independently of learner-controlled execution.",
      truncated: false,
      feedback: [{ concept: "Submission integrity", message: "Your code was saved as a draft, but this submission was not graded or counted as a pass." }],
    });
  }

  const isolated = await runIsolated({
    source: input.source,
    mode: "run",
    deadlineAt: input.deadlineAt,
  });

  if (isolated.status !== "ok") {
    return executionResultSchema.parse({
      status: isolated.status,
      stdout: isolated.stdout,
      stderr: isolated.stderr,
      truncated: isolated.truncated,
      feedback: isolated.status === "timeout"
        ? [{ concept: "Execution limit", message: "The run exceeded the time limit. This is not a wrong answer." }]
        : [],
    });
  }

  return executionResultSchema.parse({
    status: "ok",
    stdout: isolated.stdout,
    stderr: isolated.stderr,
    truncated: isolated.truncated,
    feedback: [],
  });
}
