import { describe, expect, it } from "vitest";
import { explainFailure } from "./index";

describe("tutor", () => {
  it("explains a failure without deciding the grade", () => {
    expect(explainFailure([{ concept: "output_text", message: "Return the string." }])).toContain("output_text");
  });
});
