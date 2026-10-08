import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OUTPUT_CAP } from "@academy/contracts";

const PYTHON = process.env.ACADEMY_PYTHON ?? "/opt/homebrew/opt/python@3.14/bin/python3.14";
const GRADING_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../grading");

export type IsolatedRun = {
  status: "ok" | "timeout" | "error" | "unavailable";
  stdout: string;
  stderr: string;
  truncated: boolean;
  result: { ok?: boolean; error?: string; value?: string | null; valueType?: string } | null;
  trace: Array<{ name: string; arguments: Record<string, string | number | boolean> }>;
};

function seatbelt(): string {
  const tests = path.join(GRADING_ROOT, "tests");
  return `(version 1)
(allow default)
(deny network*)
(deny file-read* (subpath "${tests.replaceAll('"', "")}"))
`;
}

function clip(value: string): { text: string; truncated: boolean } {
  if (value.length <= OUTPUT_CAP) return { text: value, truncated: false };
  return { text: value.slice(0, OUTPUT_CAP), truncated: true };
}

export async function runIsolated(input: {
  source: string;
  mode: "run" | "submit";
  entry?: string;
  args?: unknown[];
  calls?: Array<{ args: unknown[] }>;
  timeoutMs?: number;
}): Promise<IsolatedRun> {
  const workdir = await mkdtemp(path.join(os.tmpdir(), "academy-run-"));
  const profilePath = path.join(workdir, "seatbelt.sb");
  const tracePath = path.join(workdir, "trace.json");
  const resultPath = path.join(workdir, "result.json");
  await writeFile(path.join(workdir, "solution.py"), input.source);
  await writeFile(tracePath, "[]\n");
  await writeFile(profilePath, seatbelt());

  const env = {
    PATH: "/usr/bin:/bin:/opt/homebrew/bin",
    ACADEMY_MODE: input.mode,
    ACADEMY_WORKDIR: workdir,
    ACADEMY_MOCKS: path.join(GRADING_ROOT, "mocks"),
    ACADEMY_TRACE: tracePath,
    ACADEMY_RESULT: resultPath,
    ACADEMY_ENTRY: input.entry ?? "",
    ACADEMY_ARGS: JSON.stringify(input.args ?? []),
    ACADEMY_CALLS: JSON.stringify(input.calls ?? []),
    PYTHONDONTWRITEBYTECODE: "1",
  };

  try {
    const child = spawn(
      "/usr/bin/sandbox-exec",
      ["-f", profilePath, PYTHON, path.join(GRADING_ROOT, "harness.py")],
      { env, cwd: workdir, stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    let truncated = false;
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
      if (stdout.length > OUTPUT_CAP) {
        truncated = true;
        stdout = stdout.slice(0, OUTPUT_CAP);
        child.kill("SIGKILL");
      }
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
      if (stderr.length > OUTPUT_CAP) {
        truncated = true;
        stderr = stderr.slice(0, OUTPUT_CAP);
        child.kill("SIGKILL");
      }
    });

    const timeoutMs = input.timeoutMs ?? 3_000;
    let timedOut = false;
    const exitCode = await new Promise<number | null>((resolve) => {
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
      }, timeoutMs);
      child.on("error", () => {
        clearTimeout(timer);
        resolve(-1);
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        resolve(code);
      });
    });

    const out = clip(stdout);
    const err = clip(stderr);
    truncated = truncated || out.truncated || err.truncated;
    if (exitCode === -1) {
      return { status: "unavailable", stdout: out.text, stderr: "Isolated runner failed to start.", truncated, result: null, trace: [] };
    }
    if (timedOut) {
      return { status: "timeout", stdout: out.text, stderr: err.text || "Execution timed out.", truncated, result: null, trace: [] };
    }

    const trace = JSON.parse(await readFile(tracePath, "utf8")) as IsolatedRun["trace"];
    let result: IsolatedRun["result"] = null;
    if (input.mode === "submit") {
      try {
        result = JSON.parse(await readFile(resultPath, "utf8"));
      } catch {
        result = { ok: false, error: err.text || "Learner code did not produce a result." };
      }
    }
    if (exitCode !== 0) {
      return { status: "error", stdout: out.text, stderr: err.text || "Python exited with an error.", truncated, result, trace };
    }
    return { status: "ok", stdout: out.text, stderr: err.text, truncated, result, trace };
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}
