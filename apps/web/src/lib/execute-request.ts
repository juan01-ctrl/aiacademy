import { executionRequestSchema } from "@academy/contracts";

const MAX_REQUEST_BYTES = 80_000;

export type ExecuteRequest = {
  mode: "run" | "submit";
  exerciseId: string;
  source: string;
};

export type ExecuteRequestParse =
  | { data: ExecuteRequest }
  | { error: string; status: 400 | 413 | 415 };

export async function parseExecuteRequest(request: Request): Promise<ExecuteRequestParse> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return { error: "Content-Type must be application/json.", status: 415 };
  }
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return { error: "Request body is too large.", status: 413 };
  }
  let raw: string;
  try {
    const reader = request.body?.getReader();
    if (!reader) return { error: "Invalid request body.", status: 400 };
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return { error: "Request body is too large.", status: 413 };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return { error: "Invalid request body.", status: 400 };
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return { error: "Invalid JSON request.", status: 400 };
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Invalid execution request.", status: 400 };
  }
  const value = body as Record<string, unknown>;
  if (value.mode !== "run" && value.mode !== "submit") {
    return { error: "Choose run or submit.", status: 400 };
  }
  const parsed = executionRequestSchema.safeParse({
    exerciseId: value.exerciseId,
    source: value.source,
    learnerId: "request-validation",
  });
  if (!parsed.success) return { error: "Invalid execution request.", status: 400 };
  return { data: { mode: value.mode, exerciseId: parsed.data.exerciseId, source: parsed.data.source } };
}
