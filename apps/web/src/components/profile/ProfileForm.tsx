"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export function ProfileForm({ name }: { name: string }) {
  const [status, setStatus] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = String(new FormData(event.currentTarget).get("name") ?? "");
    const result = await authClient.updateUser({ name: nextName });
    setStatus(result.error ? result.error.message ?? "Could not save." : "Saved.");
    if (!result.error) window.setTimeout(() => window.location.reload(), 300);
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-3">
      <label className="grid gap-1 text-sm" htmlFor="name">
        Name
        <input id="name" name="name" defaultValue={name} required className="rounded-md border border-line px-3 py-2" />
      </label>
      <button type="submit" className="btn btn-primary w-fit">Save profile</button>
      {status ? <p role="status" className="text-sm">{status}</p> : null}
    </form>
  );
}
