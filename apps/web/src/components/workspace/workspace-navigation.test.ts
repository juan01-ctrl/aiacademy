import { describe, expect, it } from "vitest";
import { submissionNavigation } from "./workspace-navigation";

describe("explicit Continue destination", () => {
  const state = { done: false, nextHref: "/courses/course" };
  it("uses the issued credential only after successful submission", () => {
    expect(submissionNavigation(state, "submit", { result: { status: "passed" }, certificateHref: "/certificate/OWN" })).toEqual({ done: true, nextHref: "/certificate/OWN" });
  });
  it("keeps ordinary lesson fallback when no credential is returned", () => {
    expect(submissionNavigation(state, "submit", { result: { status: "passed" } })).toEqual({ ...state, done: true });
  });
  it("does not complete or redirect on Run or failed Submit", () => {
    expect(submissionNavigation(state, "run", { result: { status: "passed" }, certificateHref: "/certificate/OTHER" })).toEqual(state);
    expect(submissionNavigation(state, "submit", { result: { status: "failed" }, certificateHref: "/certificate/OTHER" })).toEqual(state);
  });
});
