import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { executionRequestSchema, executionResultSchema } from "@academy/contracts";
import { executeExercise } from "./grade";

const port = Number(process.env.EXECUTOR_PORT ?? 8787);
const token = process.env.EXECUTOR_TOKEN ?? "dev-executor-token";

function authorized(request: IncomingMessage): boolean {
  const header = request.headers.authorization ?? "";
  const expected = Buffer.from(`Bearer ${token}`);
  const actual = Buffer.from(header);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk);
    size += buffer.length;
    if (size > 80_000) throw new Error("Body too large");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function send(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

const server = createServer(async (request, response) => {
  if (request.url === "/health") {
    send(response, 200, { ok: true });
    return;
  }
  if (!authorized(request)) {
    send(response, 401, { status: "unavailable", stdout: "", stderr: "Unauthorized.", truncated: false, feedback: [] });
    return;
  }
  const mode = request.url === "/v1/run" ? "run" : request.url === "/v1/submit" ? "submit" : null;
  if (!mode || request.method !== "POST") {
    send(response, 404, { error: "Not found" });
    return;
  }
  try {
    const parsed = executionRequestSchema.safeParse(JSON.parse(await readBody(request)));
    if (!parsed.success) {
      send(response, 400, { status: "error", stdout: "", stderr: "Invalid execution request.", truncated: false, feedback: [] });
      return;
    }
    const result = await executeExercise({
      exerciseId: parsed.data.exerciseId,
      source: parsed.data.source,
      mode,
    });
    send(response, 200, executionResultSchema.parse(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Executor failed";
    send(response, 503, {
      status: "unavailable",
      stdout: "",
      stderr: message,
      truncated: false,
      feedback: [{ concept: "Executor", message: "The execution service is unavailable. This is not a wrong answer." }],
    });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`executor listening on 127.0.0.1:${port}`);
});
