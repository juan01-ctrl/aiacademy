import { existsSync } from "node:fs";
import { readFile as readText } from "node:fs/promises";
import path from "node:path";
import Database from "better-sqlite3";
import pg from "pg";
import { loadNeonEnv } from "./load-neon-env.mjs";
import { loadEnvConfig } from "@next/env";

loadNeonEnv();
loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL_UNPOOLED;
if (!connectionString) throw new Error("DATABASE_URL_UNPOOLED is required to import local data");
if (new URL(connectionString).hostname.includes("-pooler")) {
  throw new Error("Data import requires the direct Neon connection, not the pooled endpoint");
}

const authPath = path.resolve("data/auth.sqlite");
const progressPath = path.resolve("data/progress.json");
const auth = existsSync(authPath) ? new Database(authPath, { readonly: true, fileMustExist: true }) : null;
const progressText = existsSync(progressPath) ? await readText(progressPath, "utf8") : null;
const progress = progressText ? JSON.parse(progressText) : null;
if (progress && (!progress.learners || typeof progress.learners !== "object" || Array.isArray(progress.learners))) {
  throw new Error("Local learner progress file has an invalid top-level structure; import stopped without changing Neon");
}

const pool = new pg.Pool({ connectionString, max: 1 });
const counts = { users: 0, sessions: 0, accounts: 0, verifications: 0, learners: 0 };
const asDate = (value) => value === null || value === undefined ? null : new Date(Number(value));

try {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (auth) {
      for (const row of auth.prepare("SELECT * FROM user").all()) {
        await client.query(
          `INSERT INTO "user" (id, name, email, email_verified, image, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
          [row.id, row.name, row.email, Boolean(row.email_verified), row.image, asDate(row.created_at), asDate(row.updated_at)],
        );
        counts.users++;
      }
      for (const row of auth.prepare("SELECT * FROM session").all()) {
        await client.query(
          `INSERT INTO "session" (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`,
          [row.id, asDate(row.expires_at), row.token, asDate(row.created_at), asDate(row.updated_at), row.ip_address, row.user_agent, row.user_id],
        );
        counts.sessions++;
      }
      for (const row of auth.prepare("SELECT * FROM account").all()) {
        await client.query(
          `INSERT INTO "account" (id, account_id, provider_id, user_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (id) DO NOTHING`,
          [row.id, row.account_id, row.provider_id, row.user_id, row.access_token, row.refresh_token, row.id_token, asDate(row.access_token_expires_at), asDate(row.refresh_token_expires_at), row.scope, row.password, asDate(row.created_at), asDate(row.updated_at)],
        );
        counts.accounts++;
      }
      for (const row of auth.prepare("SELECT * FROM verification").all()) {
        await client.query(
          `INSERT INTO "verification" (id, identifier, value, expires_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
          [row.id, row.identifier, row.value, asDate(row.expires_at), asDate(row.created_at), asDate(row.updated_at)],
        );
        counts.verifications++;
      }
    }
    for (const [learnerId, state] of Object.entries(progress?.learners ?? {})) {
      if (!state || typeof state !== "object" || Array.isArray(state)) throw new Error("Local learner progress contains an invalid record; import stopped");
      await client.query(
        "INSERT INTO learner_progress (learner_id, state) VALUES ($1, $2::jsonb) ON CONFLICT (learner_id) DO NOTHING",
        [learnerId, JSON.stringify(state)],
      );
      counts.learners++;
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
} finally {
  auth?.close();
  await pool.end();
}

console.info("Local import completed; conflicting Neon records were preserved.", counts);
