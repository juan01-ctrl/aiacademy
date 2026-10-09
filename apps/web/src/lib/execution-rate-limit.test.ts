import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ connect: vi.fn(), client: { query: vi.fn(), release: vi.fn() } }));
vi.mock("./db", () => ({ pool: { connect: database.connect } }));
import { acquireExecutionPermit } from "./execution-rate-limit";

describe("durable execution throttling", () => {
  beforeEach(() => { vi.clearAllMocks(); database.connect.mockResolvedValue(database.client); });

  it("atomically reserves both learner and shared capacity in Postgres", async () => {
    database.client.query.mockResolvedValue({ rowCount: 1 });
    await expect(acquireExecutionPermit("learner-1")).resolves.toEqual({ allowed: true });
    expect(database.client.query).toHaveBeenCalledWith("BEGIN");
    const updates = database.client.query.mock.calls.filter(([sql]) => String(sql).includes("INSERT INTO execution_rate_limits"));
    expect(updates).toHaveLength(2);
    expect(updates[0]?.[1]?.[0]).toBe("learner:learner-1");
    expect(updates[1]?.[1]?.[0]).toBe("global");
    const cleanup = database.client.query.mock.calls.find(([sql]) => String(sql).includes("DELETE FROM execution_rate_limits"));
    expect(cleanup?.[0]).toContain("LIMIT 100");
    expect(cleanup?.[0]).toContain("window_start < now() - interval '2 minutes'");
    expect(database.client.query).toHaveBeenLastCalledWith("COMMIT");
    expect(database.client.release).toHaveBeenCalledOnce();
  });

  it("rolls back the per-learner reservation if the shared budget is exhausted", async () => {
    database.client.query.mockImplementation(async (sql: string) =>
      sql.includes("INSERT INTO execution_rate_limits")
        ? { rowCount: database.client.query.mock.calls.filter(([entry]) => String(entry).includes("INSERT INTO execution_rate_limits")).length === 1 ? 1 : 0 }
        : { rowCount: 1 },
    );
    await expect(acquireExecutionPermit("learner-1")).resolves.toEqual({ allowed: false });
    expect(database.client.query).toHaveBeenCalledWith("ROLLBACK");
  });

  it("fails closed when the shared database is unavailable", async () => {
    database.connect.mockRejectedValue(new Error("database offline"));
    await expect(acquireExecutionPermit("learner-1")).resolves.toEqual({ allowed: false, unavailable: true });
  });
});
