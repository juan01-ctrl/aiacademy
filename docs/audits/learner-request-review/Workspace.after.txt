"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { executionResultSchema, type ExecutionResult } from "@academy/contracts";
import type { PublicExercise } from "@academy/course-engine";
import { submissionNavigation } from "./workspace-navigation";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export function Workspace({
  exercise,
  initialCode,
  passed,
  previousHref,
  nextHref,
}: {
  exercise: PublicExercise;
  initialCode: string;
  passed: boolean;
  previousHref: string | null;
  nextHref: string | null;
}) {
  const [code, setCode] = useState(initialCode);
  const [pending, setPending] = useState<"run" | "submit" | null>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [navigation, setNavigation] = useState({ done: passed, nextHref });
  const [requestError, setRequestError] = useState("");
  const inFlight = useRef(false);
  const { done } = navigation;

  async function execute(mode: "run" | "submit") {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(mode);
    setRequestError("");
    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, exerciseId: exercise.id, source: code }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        setRequestError(body && typeof body === "object" && "error" in body && typeof body.error === "string" && body.error.trim()
          ? body.error : "Request failed. Please try again.");
        return;
      }
      if (!body || typeof body !== "object" || !("result" in body)) throw new Error("Invalid response");
      const parsed = executionResultSchema.strict().safeParse(body.result);
      const certificateHref = "certificateHref" in body ? body.certificateHref : undefined;
      if (!parsed.success || (certificateHref !== undefined && certificateHref !== null &&
          (typeof certificateHref !== "string" || !/^\/certificate\/[A-Za-z0-9_-]+$/.test(certificateHref)))) {
        throw new Error("Invalid response");
      }
      setResult(parsed.data);
      setNavigation((current) => submissionNavigation(current, mode, { result: parsed.data, certificateHref }));
    } catch {
      setRequestError("Could not complete the request. Please try again. Your code is unchanged.");
    } finally {
      inFlight.current = false;
      setPending(null);
    }
  }

  const failed = result && !done && result.status !== "ok";

  return (
    <section className="grid h-full lg:grid-cols-2">
      <div className="overflow-auto bg-white px-8 py-8">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Exercise · 100 XP</p>
        <h1 className="mt-2 text-2xl font-semibold">{exercise.title}</h1>
        <ol className="mt-4 grid list-decimal gap-2 pl-5 text-[15px] leading-7">
          {exercise.instructions.map((item) => <li key={item}>{item}</li>)}
        </ol>
        <button type="button" className="btn btn-ghost mt-5 px-0 underline" onClick={() => setHintsShown((count) => Math.min(count + 1, exercise.hints.length))}>
          Take hint
        </button>
        {exercise.hints.slice(0, hintsShown).map((hint) => <p key={hint} className="mt-3 rounded-md bg-soft px-4 py-3 text-sm">{hint}</p>)}
        {done ? <p role="status" className="mt-6 rounded-md bg-pass/15 px-4 py-3 text-sm font-medium">Great work. Your code stays. Continue when you are ready.</p> : null}
        {requestError ? <p role="alert" className="mt-3 text-sm text-incorrect">{requestError}</p> : null}
        {failed ? (
          <div role="status" className="mt-6 rounded-md border border-incorrect/30 bg-incorrect/5 px-4 py-3 text-sm">
            <p className="font-semibold text-incorrect">{result.status === "failed" ? "Not quite right" : result.status === "timeout" ? "Timed out" : "Could not grade"}</p>
            {result.feedback.map((item) => <p key={item.message} className="mt-1">{item.message}</p>)}
            {result.stderr ? <p className="mt-1 font-mono text-xs">{result.stderr}</p> : null}
          </div>
        ) : null}
      </div>
      <div className="grid min-h-0 grid-rows-[auto_1fr_auto_auto] bg-editor text-white">
        <p className="border-b border-white/10 px-4 py-2 font-mono text-xs">script.py</p>
        <Editor
          height="100%"
          defaultLanguage="python"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value ?? "")}
          options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: "IBM Plex Mono, ui-monospace, monospace", scrollBeyondLastLine: false }}
        />
        <pre className="max-h-36 overflow-auto border-t border-white/10 px-4 py-3 font-mono text-xs" aria-live="polite">
          <span className="mb-1 block text-white/50">Console</span>
          {result ? `${result.stdout}${result.stderr ? `\n${result.stderr}` : ""}` : "Run code to see output."}
        </pre>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-white px-4 py-3 text-navy">
          {previousHref ? <a href={previousHref} className="btn btn-ghost">Previous</a> : null}
          <button type="button" className="btn btn-ghost" onClick={() => { if (window.confirm("Reset this file to the starter code?")) setCode(exercise.starterCode); }}>
            Reset
          </button>
          <button type="button" className="btn btn-secondary ml-auto" disabled={pending !== null} onClick={() => execute("run")}>
            {pending === "run" ? "Running" : "Run code"}
          </button>
          {done && navigation.nextHref ? (
            <a href={navigation.nextHref} className="btn btn-primary">Continue</a>
          ) : (
            <button type="button" className="btn btn-primary" disabled={pending !== null} onClick={() => execute("submit")}>
              {pending === "submit" ? "Submitting" : "Submit answer"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
