import { describe, expect, it } from "vitest";
import { getSafeNextPath, getAuthMode, getAuthPath } from "./auth-routes";

describe("auth route parameters", () => {
  it("preserves a local course return path", () => {
    expect(getSafeNextPath("/courses/sample-course")).toBe("/courses/sample-course");
  });

  it("rejects external and protocol-relative return paths", () => {
    expect(getSafeNextPath("https://example.com")).toBe("/learn/openai-api-fundamentals");
    expect(getSafeNextPath("//example.com")).toBe("/learn/openai-api-fundamentals");
    expect(getSafeNextPath("/\\example.com")).toBe("/learn/openai-api-fundamentals");
  });

  it("accepts only known auth modes", () => {
    expect(getAuthMode("sign-up")).toBe("sign-up");
    expect(getAuthMode("other")).toBe("sign-in");
  });

  it("builds canonical auth paths and preserves only safe return paths", () => {
    expect(getAuthPath("sign-in")).toBe("/auth/signin");
    expect(getAuthPath("sign-up", "/courses/sample-course?from=catalog")).toBe(
      "/auth/signup?next=%2Fcourses%2Fsample-course%3Ffrom%3Dcatalog",
    );
    expect(getAuthPath("sign-in", "https://example.com")).toBe("/auth/signin");
    expect(getAuthPath("sign-up", "//example.com")).toBe("/auth/signup");
  });
});
