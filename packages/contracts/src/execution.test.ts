import { describe, expect, it } from "vitest";
import { assertNoPrivateFields, executionRequestSchema, executionResultSchema } from "./execution";

describe("execution contracts", () => {
  it("rejects oversized source and unsafe exercise ids", () => {
    expect(executionRequestSchema.safeParse({
      exerciseId: "../secrets",
      source: "print(1)",
      learnerId: "learner-1",
    }).success).toBe(false);
    expect(executionRequestSchema.safeParse({
      exerciseId: "return-output-text",
      source: "x".repeat(50_001),
      learnerId: "learner-1",
    }).success).toBe(false);
  });

  it("accepts a bounded result and refuses private fields", () => {
    const parsed = executionResultSchema.parse({
      status: "failed",
      stdout: "",
      stderr: "",
      truncated: false,
      feedback: [{ concept: "Responses API", message: "Return output_text." }],
    });
    expect(parsed.status).toBe("failed");
    expect(() => assertNoPrivateFields({ solution: "print(1)" })).toThrow(/Private field/);
  });
});
