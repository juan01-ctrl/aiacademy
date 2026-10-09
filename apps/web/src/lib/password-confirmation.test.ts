import { describe, expect, it } from "vitest";
import { passwordsMatch } from "./password-confirmation";

describe("passwordsMatch", () => {
  it("accepts a confirmation that matches the password", () => {
    expect(passwordsMatch("secure-password", "secure-password")).toBe(true);
  });

  it("rejects a confirmation that differs from the password", () => {
    expect(passwordsMatch("secure-password", "different-password")).toBe(false);
  });
});
