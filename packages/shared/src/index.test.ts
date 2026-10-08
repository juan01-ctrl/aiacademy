import { describe, expect, it } from "vitest";
import { credentialId } from "./index";

describe("credentialId", () => {
  it("is stable and public-shaped", () => {
    expect(credentialId("learner", "openai-api-fundamentals")).toMatch(/^AI-[0-9A-F]{6}$/);
    expect(credentialId("learner", "openai-api-fundamentals")).toBe(credentialId("learner", "openai-api-fundamentals"));
  });
});
