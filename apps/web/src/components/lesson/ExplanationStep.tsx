"use client";

import { useRef, useState } from "react";
import { MarkedText } from "./MarkedText";

export function ExplanationStep({
  stepId,
  title,
  body,
  takeaway,
  example,
  previousHref,
  nextHref,
}: {
  stepId: string;
  title: string;
  body: string[];
  takeaway: string;
  example: string;
  previousHref: string | null;
  nextHref: string | null;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const inFlight = useRef(false);

  async function continueStep() {
    if (!nextHref || inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/steps", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stepId }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        setError(body && typeof body === "object" && "error" in body && typeof body.error === "string" && body.error.trim()
          ? body.error : "Could not save this step. Please try again.");
        return;
      }
      if (!body || typeof body !== "object" || !("completed" in body) || body.completed !== true) {
        throw new Error("Invalid response");
      }
      window.location.href = nextHref;
    } catch {
      setError("Could not save this step. Please try again.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <section className="grid h-full lg:grid-cols-2">
      <div className="overflow-auto bg-white px-8 py-8">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">Theory · 4 min</p>
        <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
        <div className="mt-5 grid gap-4 text-[16px] leading-8 text-navy/90">
          {body.map((paragraph) => <p key={paragraph}><MarkedText text={paragraph} /></p>)}
        </div>
        <aside className="mt-6 border-l-4 border-mark bg-[#fbf6ea] px-4 py-3">
          <p className="text-xs font-semibold tracking-wide text-mark uppercase">Key idea</p>
          <p className="mt-1 text-sm leading-6"><MarkedText text={takeaway} /></p>
        </aside>
        {error ? <p role="alert" className="mt-3 text-sm text-incorrect">{error}</p> : null}
      </div>
      <div className="grid grid-rows-[1fr_auto] bg-editor text-white">
        <div className="overflow-auto px-6 py-6">
          <p className="text-xs font-semibold tracking-wide text-white/50 uppercase">Example</p>
          <pre className="mt-4 font-mono text-sm leading-7">{example}</pre>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 bg-white px-4 py-3 text-navy">
          {previousHref ? <a href={previousHref} className="btn btn-ghost">Previous</a> : <span />}
          {nextHref ? (
            <button type="button" className="btn btn-primary" disabled={pending} onClick={continueStep}>
              {pending ? "Saving" : "Continue"}
            </button>
          ) : <p className="text-sm">Course complete</p>}
        </div>
      </div>
    </section>
  );
}
