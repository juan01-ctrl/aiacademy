import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { headers } from "next/headers";
import { db, schema } from "./db";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? "local-dev-better-auth-secret-32ch",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
});

export type Session = {
  learnerId: string;
  email: string;
  name: string;
};

export async function getSession(): Promise<Session | null> {
  const result = await auth.api.getSession({ headers: await headers() });
  if (!result) return null;
  return {
    learnerId: result.user.id,
    email: result.user.email,
    name: result.user.name,
  };
}
