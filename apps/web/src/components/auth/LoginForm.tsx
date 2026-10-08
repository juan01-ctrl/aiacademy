"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { getAuthPath, type AuthMode } from "@/lib/auth-routes";

export function LoginForm({ nextPath, initialMode = "sign-in" }: { nextPath: string; initialMode?: AuthMode }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const isSignUp = initialMode === "sign-up";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "");
    setPending(true);
    setError("");
    try {
      const result = isSignUp
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message ?? (isSignUp ? "Could not create your account." : "Could not sign in."));
        return;
      }
      window.location.href = nextPath;
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  async function onGoogleSignIn() {
    setPending(true);
    setError("");
    try {
      await authClient.signIn.social({ provider: "google", callbackURL: nextPath });
    } catch {
      setError("Google sign-in could not start. Please try again.");
      setPending(false);
    }
  }

  const fieldClass = "min-h-11 rounded-lg border border-line bg-white px-3.5 text-sm text-navy shadow-sm transition placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-line bg-white p-5 text-left shadow-[0_16px_48px_-32px_rgba(20,40,60,0.4)] sm:p-8" aria-labelledby="auth-title">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-soft p-1" role="group" aria-label="Account action">
        <Link href={getAuthPath("sign-in", nextPath)} className={`flex min-h-10 items-center justify-center rounded-lg px-3 text-center text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${!isSignUp ? "bg-white text-navy shadow-sm" : "text-muted hover:text-navy"}`} aria-current={!isSignUp ? "page" : undefined}>
          Sign in
        </Link>
        <Link href={getAuthPath("sign-up", nextPath)} className={`flex min-h-10 items-center justify-center rounded-lg px-3 text-center text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${isSignUp ? "bg-white text-navy shadow-sm" : "text-muted hover:text-navy"}`} aria-current={isSignUp ? "page" : undefined}>
          Create account
        </Link>
      </div>

      <p className="mt-7 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary">Ailearnia</p>
      <h1 id="auth-title" className="mt-2 text-3xl font-semibold tracking-tight text-navy">{isSignUp ? "Create your account" : "Sign in"}</h1>
      <p className="mt-2 text-sm leading-6 text-muted">{isSignUp ? "Create an account to enroll and keep your learning progress." : "Welcome back. Continue where your learning left off."}</p>

      <button type="button" className="btn btn-secondary mt-5 w-full gap-2" disabled={pending} onClick={() => { void onGoogleSignIn(); }}>
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
          <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" />
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
        </svg>
        Continue with Google
      </button>
      <div className="my-5 flex items-center gap-3 text-xs font-medium text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span>or continue with email</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <form onSubmit={onSubmit} className="grid gap-4">
        {isSignUp ? <label className="grid gap-1.5 text-sm font-medium text-navy" htmlFor="name">
          Name
          <input id="name" name="name" autoComplete="name" required className={fieldClass} />
        </label> : null}
        <label className="grid gap-1.5 text-sm font-medium text-navy" htmlFor="email">
          Email address
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className={fieldClass} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-navy" htmlFor="password">
          Password
          <input id="password" name="password" type="password" required minLength={8} autoComplete={isSignUp ? "new-password" : "current-password"} className={fieldClass} />
          <span className="text-xs font-normal text-muted">{isSignUp ? "Use at least 8 characters." : "At least 8 characters."}</span>
        </label>
        <button type="submit" disabled={pending} className="btn btn-primary mt-1 w-full">
          {pending ? (isSignUp ? "Creating account…" : "Signing in…") : isSignUp ? "Create account" : "Sign in"}
        </button>
        {error ? <p role="alert" className="rounded-lg border border-incorrect/20 bg-incorrect/5 px-3 py-2 text-center text-sm text-incorrect">{error}</p> : null}
      </form>
    </section>
  );
}
