import { describe, expect, it } from "vitest";
import { isAuthorizedServiceRequest } from "./service-auth";

describe("executor service authentication", () => {
  it("rejects requests when the shared service secret is missing", () => {
    expect(isAuthorizedServiceRequest("Bearer secret", undefined)).toBe(false);
  });

  it("accepts only the exact configured bearer secret", () => {
    expect(isAuthorizedServiceRequest("Bearer secret", "secret")).toBe(true);
    expect(isAuthorizedServiceRequest("Bearer wrong", "secret")).toBe(false);
    expect(isAuthorizedServiceRequest("secret", "secret")).toBe(false);
  });
});
