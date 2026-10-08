import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CourseProgress } from "./CourseProgress";

vi.stubGlobal("React", React);

describe("CourseProgress", () => {
  it("shows an accessible completion label and progress value", () => {
    const html = renderToStaticMarkup(<CourseProgress percent={45} />);
    expect(html).toContain("45% complete");
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="45"');
  });

  it("shows zero progress for signed-in learners without completed steps", () => {
    const html = renderToStaticMarkup(<CourseProgress percent={0} />);
    expect(html).toContain("0% complete");
    expect(html).toContain('aria-valuenow="0"');
  });

  it("omits personal progress when no learner progress is provided", () => {
    const html = renderToStaticMarkup(<CourseProgress />);
    expect(html).toBe("");
  });
});
