import { describe, expect, it } from "vitest";
import { executeExercise } from "./grade";
const hasVercelAuth = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_OIDC_TOKEN);

describe("submission integrity", () => {
  it("fails closed for submits rather than trusting trace/result files writable by learner code", async () => {
    const response = await executeExercise({ exerciseId: "return-output-text", source: "forge the trace and result files", mode: "submit" });
    expect(response.status).toBe("unavailable");
    expect(response.stderr).toMatch(/cannot yet be attested/i);
  });
});

describe.skipIf(!hasVercelAuth)("Vercel Sandbox run integration", () => {
  it("runs code with mocked APIs without grading it", async () => {
    const ran = await executeExercise({
      exerciseId: "return-output-text",
      source: `from openai import OpenAI\nprint(OpenAI().responses.create(model="gpt-4.1-mini", input="ping").output_text)\n`,
      mode: "run",
    });
    expect(ran.status).toBe("ok");
    expect(ran.stdout).toContain("mocked-output");
    expect(ran.feedback).toEqual([]);
  }, 25_000);

  it("does not ship hidden grader tests into the learner sandbox", async () => {
    const ran = await executeExercise({
      exerciseId: "return-output-text",
      source: "open('/vercel/sandbox/tests/return-output-text.py').read()",
      mode: "run",
    });
    expect(ran.status).toBe("error");
    expect(`${ran.stdout}${ran.stderr}`).not.toContain("CANARY_HIDDEN_ASSERTION");
  }, 25_000);
});
