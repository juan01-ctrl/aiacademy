import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { executionResultSchema, type ExecutionResult } from "@academy/contracts";
import { runIsolated, type IsolatedRun } from "./isolate";

const GRADING_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../grading");
const PYTHON = process.env.ACADEMY_PYTHON ?? "/opt/homebrew/opt/python@3.14/bin/python3.14";

type Manifest = Record<string, { entry: string; args?: unknown[]; calls?: Array<{ args: unknown[] }> }>;

export async function loadManifest(): Promise<Manifest> {
  return JSON.parse(await readFile(path.join(GRADING_ROOT, "manifest.json"), "utf8")) as Manifest;
}

async function gradeTrace(exerciseId: string, trace: IsolatedRun["trace"], result: IsolatedRun["result"]): Promise<{ passed: boolean; feedback: ExecutionResult["feedback"] }> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "academy-grade-"));
  const tracePath = path.join(dir, "trace.json");
  const resultPath = path.join(dir, "result.json");
  await writeFile(tracePath, JSON.stringify(trace));
  await writeFile(resultPath, JSON.stringify(result ?? { ok: false, error: "No result." }));
  const testPath = path.join(GRADING_ROOT, "tests", `${exerciseId}.py`);
  try {
    const output = await new Promise<string>((resolve, reject) => {
      const child = spawn(PYTHON, [path.join(GRADING_ROOT, "grader.py"), exerciseId, tracePath, resultPath, testPath], {
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8");
      });
      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString("utf8");
      });
      child.on("close", (code) => {
        if (code === 0) resolve(stdout);
        else reject(new Error(stderr || "Grader failed"));
      });
    });
    const parsed = JSON.parse(output) as { passed: boolean; feedback: ExecutionResult["feedback"] };
    return {
      passed: parsed.passed === true,
      feedback: parsed.feedback.map((item) => ({ concept: item.concept, message: item.message })),
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function executeExercise(input: {
  exerciseId: string;
  source: string;
  mode: "run" | "submit";
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

  const isolated = await runIsolated({
    source: input.source,
    mode: input.mode,
    entry: exercise.entry,
    args: exercise.args,
    calls: exercise.calls ?? [{ args: exercise.args ?? [] }],
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

  if (input.mode === "run") {
    return executionResultSchema.parse({
      status: "ok",
      stdout: isolated.stdout,
      stderr: isolated.stderr,
      truncated: isolated.truncated,
      feedback: [],
    });
  }

  // Process exit success alone does not prove that the entry function succeeded.
  const result: unknown = isolated.result;
  const payload = result && typeof result === "object" && !Array.isArray(result)
    ? result as Record<string, unknown> : null;
  const calls = payload?.results;
  if (payload?.ok !== true || (calls !== undefined && (
    !Array.isArray(calls) || calls.length === 0 || calls.some((call) =>
      !call || typeof call !== "object" || Array.isArray(call) || call.ok !== true
    )
  ))) {
    return executionResultSchema.parse({
      status: "failed",
      stdout: isolated.stdout,
      stderr: isolated.stderr,
      truncated: isolated.truncated,
      feedback: [{ concept: "Function execution", message: "The submitted function did not complete successfully. Define the required function and fix execution errors before submitting." }],
    });
  }

  const graded = await gradeTrace(input.exerciseId, isolated.trace, isolated.result);
  return executionResultSchema.parse({
    status: graded.passed ? "passed" : "failed",
    stdout: isolated.stdout,
    stderr: isolated.stderr,
    truncated: isolated.truncated,
    feedback: graded.feedback,
  });
}
