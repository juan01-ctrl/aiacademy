import { afterEach, describe, expect, it, vi } from "vitest";
import { callExecutor } from "./executor";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("callExecutor", () => {
  it("uses the private executor binding and authenticates the service request", async () => {
    vi.stubEnv("EXECUTOR_URL", "https://internal-executor.example/base");
    vi.stubEnv("EXECUTOR_SERVICE_TOKEN", "shared-secret");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: "ok", stdout: "hello", stderr: "", truncated: false, feedback: [],
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await callExecutor({ mode: "run", exerciseId: "intro", source: "print('hello')", learnerId: "learner-1" });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://internal-executor.example/internal/execute");
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer shared-secret");
    expect(JSON.parse(String(init.body))).toMatchObject({ mode: "run", exerciseId: "intro", source: "print('hello')" });
    expect(result.status).toBe("ok");
  });

  it("fails closed when the runtime binding or shared secret is absent", async () => {
    vi.stubEnv("EXECUTOR_URL", "");
    vi.stubEnv("EXECUTOR_SERVICE_TOKEN", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await callExecutor({ mode: "run", exerciseId: "intro", source: "", learnerId: "learner-1" });

    expect(result.status).toBe("unavailable");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports an in-flight request deadline abort as a timeout", async () => {
    vi.stubEnv("EXECUTOR_URL", "https://internal-executor.example");
    vi.stubEnv("EXECUTOR_SERVICE_TOKEN", "shared-secret");
    vi.stubGlobal("fetch", async (_url: URL, init: RequestInit) => {
      const signal = init.signal as AbortSignal;
      await new Promise<void>((resolve) => signal.addEventListener("abort", () => resolve(), { once: true }));
      throw signal.reason;
    });

    const result = await callExecutor({ mode: "run", exerciseId: "intro", source: "", learnerId: "learner-1", deadlineAt: Date.now() + 5 });

    expect(result.status).toBe("timeout");
  });

  it("keeps ordinary network failures unavailable", async () => {
    vi.stubEnv("EXECUTOR_URL", "https://internal-executor.example");
    vi.stubEnv("EXECUTOR_SERVICE_TOKEN", "shared-secret");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network failed")));

    const result = await callExecutor({ mode: "run", exerciseId: "intro", source: "", learnerId: "learner-1" });

    expect(result.status).toBe("unavailable");
  });
});
