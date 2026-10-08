import { executionResultSchema, type ExecutionResult } from "@academy/contracts";

export async function callExecutor(input: {
  mode: "run" | "submit";
  exerciseId: string;
  source: string;
  learnerId: string;
}): Promise<ExecutionResult> {
  const baseUrl = process.env.EXECUTOR_URL ?? "http://127.0.0.1:8787";
  const token = process.env.EXECUTOR_TOKEN ?? "dev-executor-token";
  try {
    const response = await fetch(`${baseUrl}/v1/${input.mode}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        exerciseId: input.exerciseId,
        source: input.source,
        learnerId: input.learnerId,
      }),
    });
    const body = await response.json();
    return executionResultSchema.parse(body);
  } catch {
    return {
      status: "unavailable",
      stdout: "",
      stderr: "Execution service is unavailable.",
      truncated: false,
      feedback: [{ concept: "Executor", message: "The execution service is unavailable. This is not a wrong answer." }],
    };
  }
}
