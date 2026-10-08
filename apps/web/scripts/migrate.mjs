import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { loadNeonEnv } from "./load-neon-env.mjs";
import { loadEnvConfig } from "@next/env";

loadNeonEnv();
loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL_UNPOOLED;
if (!connectionString) throw new Error("DATABASE_URL_UNPOOLED is required for schema migrations");
if (new URL(connectionString).hostname.includes("-pooler")) {
  throw new Error("Schema migrations require the direct Neon connection, not the pooled endpoint");
}

const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../drizzle");
const migrations = (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort();
const pool = new pg.Pool({ connectionString, max: 1 });

try {
  const client = await pool.connect();
  try {
    await client.query("CREATE TABLE IF NOT EXISTS academy_schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
    for (const name of migrations) {
      await client.query("BEGIN");
      try {
        const applied = await client.query("SELECT 1 FROM academy_schema_migrations WHERE name = $1", [name]);
        if (applied.rowCount === 0) {
          await client.query(await readFile(path.join(directory, name), "utf8"));
          await client.query("INSERT INTO academy_schema_migrations (name) VALUES ($1)", [name]);
          console.info(`Applied database migration: ${name}`);
        } else {
          console.info(`Already applied: ${name}`);
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
