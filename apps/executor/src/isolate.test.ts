import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@vercel/sandbox", () => ({ Sandbox: { create: mocks.create } }));
import { runIsolated } from "./isolate";

const sandbox = () => ({
  writeFiles: vi.fn().mockResolvedValue(undefined),
  runCommand: vi.fn(async (input: { args: string[]; env?: Record<string, string>; stdout: { write(value: string): void }; signal: AbortSignal; timeoutMs: number }) => {
    return { exitCode: 0 };
  }),
  stop: vi.fn().mockResolvedValue(undefined),
});

describe("Vercel Sandbox execution isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.VERCEL_OIDC_TOKEN = "test-oidc";
    mocks.create.mockResolvedValue(sandbox());
  });

  it("creates non-persistent sandboxes with no network egress and stops them", async () => {
    await runIsolated({ source: "print('safe')", mode: "run" });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      networkPolicy: "deny-all", persistent: false, timeout: expect.any(Number), resources: { vcpus: 1 },
    }));
    const created = await mocks.create.mock.results[0]?.value;
    expect(created.stop).toHaveBeenCalledOnce();
  });

  it("does not provide hidden test fixtures or host environment secrets to learner execution", async () => {
    const hostSecret = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "host-secret";
    await runIsolated({ source: "print('learner')", mode: "run" });
    const created = await mocks.create.mock.results[0]?.value;
    const paths = created.writeFiles.mock.calls[0]?.[0].map((file: { path: string }) => file.path);
    expect(paths.some((file: string) => file.includes("tests/"))).toBe(false);
    expect(created.runCommand.mock.calls[0]?.[0].env).not.toHaveProperty("OPENAI_API_KEY");
    if (hostSecret === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = hostSecret;
  });

  it("never reads learner-writable trace or result artifacts back into the trusted process", async () => {
    const created = sandbox();
    mocks.create.mockResolvedValue(created);
    await runIsolated({ source: "print('learner')", mode: "run" });
    expect(created.runCommand).toHaveBeenCalledOnce();
    expect(created.runCommand.mock.calls[0]?.[0].args[0]).not.toContain("grader.py");
    expect(created.runCommand.mock.calls[0]?.[0].env?.ACADEMY_TRACE).toBe("/dev/null");
    expect(created.runCommand.mock.calls[0]?.[0].env).not.toHaveProperty("ACADEMY_RESULT");
    expect(created).not.toHaveProperty("readFileToBuffer");
    expect(created.stop).toHaveBeenCalledOnce();
  });

  it("caps captured command output by bytes", async () => {
    const created = sandbox();
    created.runCommand.mockImplementationOnce(async (input: { args: string[]; env?: Record<string, string>; stdout: { write(value: string): void }; signal: AbortSignal; timeoutMs: number }) => {
      input.stdout.write("x".repeat(20_000));
      return { exitCode: 0 };
    });
    mocks.create.mockResolvedValue(created);
    const result = await runIsolated({ source: "pass", mode: "run" });
    expect(Buffer.byteLength(result.stdout)).toBeLessThanOrEqual(8_000);
    expect(result.truncated).toBe(true);
  });

  it("classifies an SDK command result at the configured timeout as timed out", async () => {
    const created = sandbox();
    created.runCommand.mockResolvedValueOnce({ exitCode: 137, durationMs: 6_000 } as never);
    mocks.create.mockResolvedValue(created);

    const result = await runIsolated({ source: "pass", mode: "run" });

    expect(result.status).toBe("timeout");
  });

  it("keeps a near-boundary ordinary nonzero exit as an error", async () => {
    const created = sandbox();
    created.runCommand.mockResolvedValueOnce({ exitCode: 1, durationMs: 5_950 } as never);
    mocks.create.mockResolvedValue(created);

    const result = await runIsolated({ source: "raise SystemExit(1)", mode: "run" });

    expect(result.status).toBe("error");
  });

  it("keeps a nonzero exit without SDK duration evidence as an error", async () => {
    const created = sandbox();
    created.runCommand.mockResolvedValueOnce({ exitCode: 137 } as never);
    mocks.create.mockResolvedValue(created);

    const result = await runIsolated({ source: "pass", mode: "run" });

    expect(result.status).toBe("error");
  });

  it("bounds startup, upload, command execution, and cleanup", async () => {
    const created = sandbox();
    mocks.create.mockResolvedValue(created);
    await runIsolated({ source: "pass", mode: "run", deadlineAt: Date.now() + 12_000 });
    const createOptions = mocks.create.mock.calls[0]?.[0];
    expect(createOptions.signal).toBeInstanceOf(AbortSignal);
    expect(created.writeFiles.mock.calls[0]?.[1].signal).toBe(createOptions.signal);
    expect(created.runCommand.mock.calls[0]?.[0].signal).toBe(createOptions.signal);
    expect(created.runCommand.mock.calls[0]?.[0].timeoutMs).toBeLessThanOrEqual(6_000);
    expect(created.stop.mock.calls[0]?.[0].signal).toBeInstanceOf(AbortSignal);
  });

  it("fails closed outside Vercel when OIDC is missing", async () => {
    delete process.env.VERCEL_OIDC_TOKEN;
    const vercel = process.env.VERCEL;
    delete process.env.VERCEL;
    await expect(runIsolated({ source: "print(1)", mode: "run" })).rejects.toThrow(/VERCEL_OIDC_TOKEN/);
    expect(mocks.create).not.toHaveBeenCalled();
    if (vercel !== undefined) process.env.VERCEL = vercel;
  });
});
