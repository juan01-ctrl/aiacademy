"use client";

import { useRef, useState } from "react";

export function EnrollButton({ courseId }: { courseId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);

  async function enroll() {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/enroll", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        setError(body && typeof body === "object" && "error" in body && typeof body.error === "string" && body.error.trim()
          ? body.error : "Could not enroll. Please try again.");
        return;
      }
      if (!body || typeof body !== "object" || !("enrolled" in body) || body.enrolled !== true) {
        throw new Error("Invalid response");
      }
      window.location.reload();
    } catch {
      setError("Could not enroll. Please try again.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <>
      <button type="button" className="btn btn-primary w-fit" disabled={pending} onClick={enroll}>
        {pending ? "Enrolling…" : "Enroll and start"}
      </button>
      {error ? <p role="alert" className="mt-3 text-sm text-incorrect">{error}</p> : null}
    </>
  );
}
