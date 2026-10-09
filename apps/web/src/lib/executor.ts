import { executionResultSchema, type ExecutionResult } from "@academy/contracts";

const unavailable: ExecutionResult = {
  status: "unavailable",
  stdout: "",
  stderr: "Execution service is unavailable.",
  truncated: false,
  feedback: [{ concept: "Executor", message: "The execution service is unavailable. This is not a wrong answer." }],
};

export async function callExecutor(input: {
  mode: "run" | "submit";
  exerciseId: string;
  source: string;
  learnerId: string;
  deadlineAt?: number;
}): Promise<ExecutionResult> {
  const serviceUrl = process.env.EXECUTOR_URL;
  const serviceToken = process.env.EXECUTOR_SERVICE_TOKEN;
  if (!serviceUrl || !serviceToken) return unavailable;

  const remainingMs = input.deadlineAt === undefined ? 20_000 : Math.min(20_000, input.deadlineAt - Date.now());
  if (remainingMs <= 0) return { ...unavailable, status: "timeout", stderr: "Execution deadline exceeded." };

  const signal = AbortSignal.timeout(remainingMs);
  try {
    const endpoint = new URL("/internal/execute", serviceUrl);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${serviceToken}` },
      body: JSON.stringify({
        exerciseId: input.exerciseId,
        source: input.source,
        mode: input.mode,
        deadlineAt: input.deadlineAt,
      }),
      cache: "no-store",
      signal,
    });
    if (!response.ok) return unavailable;
    return executionResultSchema.parse(await response.json());
  } catch {
    if (signal.aborted && signal.reason?.name === "TimeoutError") {
      return { ...unavailable, status: "timeout", stderr: "Execution deadline exceeded." };
    }
    return unavailable;
  }
}
