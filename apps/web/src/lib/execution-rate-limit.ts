import { pool } from "./db";
import type { PoolClient } from "pg";

const LEARNER_REQUESTS_PER_MINUTE = 3;
const GLOBAL_REQUESTS_PER_MINUTE = 60;

export async function acquireExecutionPermit(learnerId: string): Promise<{ allowed: boolean; unavailable?: boolean }> {
  let client: PoolClient | undefined;
  try {
    const connection = await pool.connect();
    client = connection;
    await connection.query("BEGIN");
    // Expire a bounded batch of inactive windows; the index keeps this from scanning the full table.
    await connection.query(
      `DELETE FROM execution_rate_limits
       WHERE ctid IN (
         SELECT ctid FROM execution_rate_limits
         WHERE window_start < now() - interval '2 minutes'
         ORDER BY window_start
         LIMIT 100
       )`,
    );
    const reserve = async (scope: string, limit: number) => connection.query(
      `INSERT INTO execution_rate_limits (scope_key, window_start, request_count)
       VALUES ($1, date_trunc('minute', now()), 1)
       ON CONFLICT (scope_key) DO UPDATE SET
         window_start = EXCLUDED.window_start,
         request_count = CASE
           WHEN execution_rate_limits.window_start = EXCLUDED.window_start
             THEN execution_rate_limits.request_count + 1
           ELSE 1
         END
       WHERE execution_rate_limits.window_start <> EXCLUDED.window_start
          OR execution_rate_limits.request_count < $2
       RETURNING scope_key`,
      [scope, limit],
    );

    const learner = await reserve(`learner:${learnerId}`, LEARNER_REQUESTS_PER_MINUTE);
    if (learner.rowCount !== 1) {
      await connection.query("ROLLBACK");
      return { allowed: false };
    }
    const global = await reserve("global", GLOBAL_REQUESTS_PER_MINUTE);
    if (global.rowCount !== 1) {
      await connection.query("ROLLBACK");
      return { allowed: false };
    }
    await connection.query("COMMIT");
    return { allowed: true };
  } catch {
    if (client) await client.query("ROLLBACK").catch(() => undefined);
    return { allowed: false, unavailable: true };
  } finally {
    client?.release();
  }
}
