import { describe, expect, it } from "vitest";
import { canIssueCertificate } from "./index";
import { gradeAssessment, publicAssessment } from "./assessment";

describe("certification", () => {
  it("keeps course completion separate from the certificate", () => {
    expect(canIssueCertificate({ courseComplete: true, assessmentPassed: false, projectPassed: true })).toBe(false);
    expect(canIssueCertificate({ courseComplete: true, assessmentPassed: true, projectPassed: true })).toBe(true);
  });

  it("does not publish answers", () => {
    expect(publicAssessment("openai-api-fundamentals").every((question) => !("answer" in question))).toBe(true);
    expect(gradeAssessment("openai-api-fundamentals", { "output-text": "response.output_text", blank: "Return an empty string and do not call the API", instructions: "instructions", errors: "An empty string" }).passed).toBe(true);
  });
});
