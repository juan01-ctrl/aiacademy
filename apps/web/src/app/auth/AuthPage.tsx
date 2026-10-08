import { redirect } from "next/navigation";
import { BackLink } from "@/components/nav/BackLink";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSession } from "@/lib/auth";
import { getSafeNextPath, type AuthMode } from "@/lib/auth-routes";

export async function AuthPage({
  mode,
  searchParams,
}: {
  mode: AuthMode;
  searchParams: Promise<{ next?: string }>;
}) {
  const [session, params] = await Promise.all([getSession(), searchParams]);
  const nextPath = getSafeNextPath(params.next);
  if (session) redirect(nextPath);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-3xl flex-col items-center justify-center px-5 py-10 sm:px-8">
      <div className="mb-4 w-full max-w-md"><BackLink href="/" label="Home" /></div>
      <LoginForm nextPath={nextPath} initialMode={mode} />
    </main>
  );
}
