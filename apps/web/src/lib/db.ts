import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./auth-schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to connect to the Academy database");
}

const globalDb = globalThis as unknown as { academyPostgresPool?: Pool };
const pool = globalDb.academyPostgresPool ?? new Pool({
  connectionString: databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
});

if (process.env.NODE_ENV !== "production") globalDb.academyPostgresPool = pool;

export const db = drizzle(pool, { schema });
export { pool, schema };
