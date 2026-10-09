import { Sandbox } from "@vercel/sandbox";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Writable } from "node:stream";
import { OUTPUT_CAP } from "@academy/contracts";
import { getGradingRoot } from "./grading-root";

const GRADING_ROOT = getGradingRoot();
const SANDBOX_TIMEOUT_MS = 8_000;
const SANDBOX_COMMAND_TIMEOUT_MS = 6_000;
const SOURCE_CAP = 50_000;
export type IsolatedRun = {
  status: "ok" | "timeout" | "error" | "unavailable";
  stdout: string;
  stderr: string;
  truncated: boolean;
};

function capture() {
  let text = "";
  let truncated = false;
  const stream = new Writable({
    write(chunk, _encoding, done) {
      const value = Buffer.from(chunk);
      const remaining = OUTPUT_CAP - Buffer.byteLength(text);
      if (value.length > remaining) truncated = true;
      if (remaining > 0) text += value.subarray(0, remaining).toString("utf8");
      done();
    },
  });
  return { stream, get text() { return text; }, get truncated() { return truncated; } };
}

function assertSandboxAuth(): void {
  if (process.env.VERCEL !== "1" && !process.env.VERCEL_OIDC_TOKEN) {
    throw new Error("Vercel Sandbox is not configured. Run this app on Vercel or link the project and provide VERCEL_OIDC_TOKEN for local development.");
  }
}

async function filesUnder(directory: string, sandboxDirectory: string) {
  const files: Array<{ path: string; content: Buffer }> = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const source = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(source, path.posix.join(sandboxDirectory, entry.name)));
    else files.push({ path: path.posix.join(sandboxDirectory, entry.name), content: await readFile(source) });
  }
  return files;
}

async function runPython(input: {
  files: Array<{ path: string; content: Buffer }>;
  script: string;
  args?: string[];
  env?: Record<string, string>;
  deadlineAt?: number;
}): Promise<{ status: "ok" | "timeout" | "error"; stdout: string; stderr: string; truncated: boolean }> {
  assertSandboxAuth();
  let sandbox: Awaited<ReturnType<typeof Sandbox.create>> | undefined;
  const deadline = new AbortController();
  const remainingBudget = input.deadlineAt === undefined ? 20_000 : Math.min(20_000, input.deadlineAt - Date.now());
  if (remainingBudget <= 0) return { status: "timeout", stdout: "", stderr: "Execution deadline exceeded before sandbox startup.", truncated: false };
  const timer = setTimeout(() => deadline.abort(new Error("Sandbox operation deadline exceeded.")), remainingBudget);
  const stdout = capture();
  const stderr = capture();
  try {
    sandbox = await Sandbox.create({
      image: "vercel/sandbox/universal", resources: { vcpus: 1 }, timeout: SANDBOX_TIMEOUT_MS,
      networkPolicy: "deny-all", persistent: false, signal: deadline.signal,
    });
    await sandbox.writeFiles(input.files, { signal: deadline.signal });
    const commandTimeoutMs = Math.min(SANDBOX_COMMAND_TIMEOUT_MS, remainingBudget);
    const command = await sandbox.runCommand({
      cmd: "python3", args: [input.script, ...(input.args ?? [])], cwd: "/vercel/sandbox",
      env: input.env ?? {}, stdout: stdout.stream, stderr: stderr.stream,
      signal: deadline.signal, timeoutMs: commandTimeoutMs,
    });
    // SDK v3.6.1 returns only exitCode and optional durationMs, not a timeout flag.
    // Its timeoutMs is enforced remotely with SIGKILL; a local AbortSignal would only
    // cancel the command request stream and cannot independently prove remote termination.
    // Best-effort classification therefore uses the exact reported-duration boundary;
    // missing duration evidence remains an ordinary error rather than an inferred timeout.
    const commandTimedOut = command.durationMs !== undefined && command.durationMs >= commandTimeoutMs;
    return { status: command.exitCode === 0 ? "ok" : commandTimedOut ? "timeout" : "error", stdout: stdout.text, stderr: stderr.text, truncated: stdout.truncated || stderr.truncated };
  } catch (error) {
    const timedOut = deadline.signal.aborted || (error instanceof Error && /timed? ?out|deadline/i.test(error.message));
    return { status: timedOut ? "timeout" : "error", stdout: stdout.text, stderr: stderr.text || (error instanceof Error ? error.message : "Sandbox execution failed."), truncated: stdout.truncated || stderr.truncated };
  } finally {
    clearTimeout(timer);
    if (sandbox) await sandbox.stop({ signal: AbortSignal.timeout(2_000) }).catch(() => undefined);
  }
}

export async function runIsolated(input: {
  source: string; mode: "run"; deadlineAt?: number;
}): Promise<IsolatedRun> {
  if (Buffer.byteLength(input.source, "utf8") > SOURCE_CAP) return { status: "error", stdout: "", stderr: "Source code is too large.", truncated: false };
  const result = await runPython({
    files: [
      { path: "workspace/harness.py", content: await readFile(path.join(GRADING_ROOT, "harness.py")) },
      { path: "workspace/solution.py", content: Buffer.from(input.source) },
      ...await filesUnder(path.join(GRADING_ROOT, "mocks"), "workspace/mocks"),
    ],
    script: "/vercel/sandbox/workspace/harness.py",
    deadlineAt: input.deadlineAt,
    env: {
      ACADEMY_MODE: input.mode, ACADEMY_WORKDIR: "/vercel/sandbox/workspace",
      ACADEMY_MOCKS: "/vercel/sandbox/workspace/mocks", ACADEMY_TRACE: "/dev/null",
      ACADEMY_ENTRY: "", ACADEMY_ARGS: "[]", ACADEMY_CALLS: "[]",
      PYTHONDONTWRITEBYTECODE: "1",
    },
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, truncated: result.truncated };
}
