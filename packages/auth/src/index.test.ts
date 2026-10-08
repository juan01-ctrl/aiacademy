import { describe, expect, it } from "vitest";
import { learnerIdFromEmail, readSessionToken, signSession } from "./index";

describe("session", () => {
  it("round-trips and rejects tampering", () => {
    const token = signSession({ learnerId: learnerIdFromEmail("ada@example.com"), email: "ada@example.com", name: "Ada" });
    expect(readSessionToken(token)?.name).toBe("Ada");
    expect(readSessionToken(`${token}x`)).toBeNull();
  });
});
