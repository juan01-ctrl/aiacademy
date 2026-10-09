import { describe, expect, it } from "vitest";
import { parseExecuteRequest } from "./execute-request";

const request = (body: string, headers: HeadersInit = { "content-type": "application/json" }) =>
  new Request("http://localhost/api/execute", { method: "POST", headers, body });

describe("parseExecuteRequest", () => {
  it("accepts a valid execution request", async () => {
    await expect(parseExecuteRequest(request(JSON.stringify({ mode: "run", exerciseId: "unit", source: "print(1)" }))))
      .resolves.toEqual({ data: { mode: "run", exerciseId: "unit", source: "print(1)" } });
  });

  it("rejects malformed JSON without throwing", async () => {
    await expect(parseExecuteRequest(request("{"))).resolves.toMatchObject({ error: "Invalid JSON request.", status: 400 });
  });

  it("rejects oversized bodies before JSON parsing", async () => {
    await expect(parseExecuteRequest(request(JSON.stringify({ mode: "run", exerciseId: "unit", source: "x".repeat(80_000) }))))
      .resolves.toMatchObject({ error: "Request body is too large.", status: 413 });
  });

  it("requires JSON content type", async () => {
    await expect(parseExecuteRequest(request("{}", { "content-type": "text/plain" })))
      .resolves.toMatchObject({ error: "Content-Type must be application/json.", status: 415 });
  });
});
