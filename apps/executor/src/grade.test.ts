import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { executeExercise } from "./grade";

const passing = `from openai import OpenAI

def ask_llm(prompt: str) -> str:
    client = OpenAI()
    response = client.responses.create(model="gpt-4.1-mini", input=prompt)
    return response.output_text
`;

describe("executor grading", () => {
  it("returns deterministic feedback and does not leak the hidden canary", async () => {
    const failed = await executeExercise({
      exerciseId: "return-output-text",
      source: passing.replace("return response.output_text", "return response"),
      mode: "submit",
    });
    const passed = await executeExercise({
      exerciseId: "return-output-text",
      source: passing,
      mode: "submit",
    });
    expect(failed.status).toBe("failed");
    expect(passed.status).toBe("passed");
    expect(JSON.stringify(passed)).not.toContain("CANARY_HIDDEN_ASSERTION");
    expect(JSON.stringify(failed.feedback)).toContain("output_text");
  }, 20_000);

  it("does not treat a run as a grade", async () => {
    const ran = await executeExercise({
      exerciseId: "return-output-text",
      source: `${passing}\nprint(ask_llm("ping"))\n`,
      mode: "run",
    });
    expect(ran.status).toBe("ok");
    expect(ran.stdout).toContain("mocked-output");
    expect(ran.feedback).toEqual([]);
  }, 20_000);

  it("accepts a caught API failure and still returns text on success", async () => {
    const passed = await executeExercise({
      exerciseId: "catch-api-error",
      source: `from openai import OpenAI

def ask_llm(prompt: str) -> str:
    try:
        response = OpenAI().responses.create(model="gpt-4.1-mini", input=prompt)
        return response.output_text
    except Exception:
        return ""
`,
      mode: "submit",
    });
    expect(passed.status).toBe("passed");
  }, 20_000);

  it("requires instructions and input to stay separate", async () => {
    const passed = await executeExercise({
      exerciseId: "pass-instructions",
      source: `from openai import OpenAI

def ask_with_instructions(prompt: str, instructions: str) -> str:
    response = OpenAI().responses.create(model="gpt-4.1-mini", instructions=instructions, input=prompt)
    return response.output_text
`,
      mode: "submit",
    });
    expect(passed.status).toBe("passed");
  }, 20_000);

  it("grades a blank prompt without a second API call", async () => {
    const passed = await executeExercise({
      exerciseId: "skip-blank-prompt",
      source: `from openai import OpenAI

def ask_llm(prompt: str) -> str:
    if not prompt.strip():
        return ""
    response = OpenAI().responses.create(model="gpt-4.1-mini", input=prompt)
    return response.output_text
`,
      mode: "submit",
    });
    expect(passed.status).toBe("passed");
    expect(JSON.stringify(passed)).not.toContain("CANARY_HIDDEN_ASSERTION");
  }, 20_000);

  it("blocks learner code from reading hidden tests", async () => {
    const testPath = fileURLToPath(new URL("../grading/tests/return-output-text.py", import.meta.url));
    const result = await executeExercise({
      exerciseId: "return-output-text",
      source: `print(open(${JSON.stringify(testPath)}).read())\n`,
      mode: "run",
    });
    expect(result.status).toBe("error");
    expect(`${result.stdout}${result.stderr}`).not.toContain("CANARY_HIDDEN_ASSERTION");
  }, 20_000);

  it("reports timeouts as operational failures", async () => {
    const result = await executeExercise({
      exerciseId: "return-output-text",
      source: "import time\ntime.sleep(30)\n",
      mode: "run",
    });
    expect(result.status).toBe("timeout");
    expect(result.feedback[0]?.concept).toBe("Execution limit");
  }, 20_000);
});
