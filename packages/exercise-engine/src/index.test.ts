import { describe, expect, it } from "vitest";
import { shouldRecordAttempt } from "./index";

describe("run vs submit", () => {
  it("never records a run as an attempt", () => {
    expect(shouldRecordAttempt("run")).toBe(false);
    expect(shouldRecordAttempt("submit")).toBe(true);
  });
});
