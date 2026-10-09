import { afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "./server";

describe("executor HTTP service", () => {
  let server: ReturnType<typeof app.listen>;
  let origin: string;

  beforeEach(async () => {
    process.env.EXECUTOR_SERVICE_TOKEN = "test-service-secret";
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected a TCP listener.");
    origin = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    delete process.env.EXECUTOR_SERVICE_TOKEN;
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("rejects unauthenticated calls before dispatching execution", async () => {
    const response = await fetch(`${origin}/internal/execute`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ exerciseId: "intro", source: "print(1)", mode: "run" }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized service request." });
  });

  it("rejects malformed authenticated execution requests", async () => {
    const response = await fetch(`${origin}/internal/execute`, {
      method: "POST",
      headers: { authorization: "Bearer test-service-secret", "content-type": "application/json" },
      body: JSON.stringify({ exerciseId: "intro", source: "print(1)", mode: "grade" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid execution request." });
  });
});
