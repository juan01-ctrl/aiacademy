"use client";

import { useState, type FormEvent } from "react";

export function AssessmentForm({ courseId, questions }: { courseId: string; questions: Array<{ id: string; prompt: string; choices: string[] }> }) {
  const [result, setResult] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const answers = Object.fromEntries(questions.map((question) => [question.id, String(form.get(question.id) ?? "")]));
    const response = await fetch("/api/assessment", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId, answers }),
    });
    const body = await response.json();
    if (!response.ok) {
      setResult(body.error ?? "Could not grade.");
      return;
    }
    setResult(body.passed ? `Passed · ${Math.round(body.score * 100)}%` : `Not passed · ${Math.round(body.score * 100)}%`);
    if (body.passed) window.setTimeout(() => window.location.reload(), 400);
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-5">
      {questions.map((question) => (
        <fieldset key={question.id} className="grid gap-2">
          <legend className="font-medium">{question.prompt}</legend>
          {question.choices.map((choice) => (
            <label key={choice} className="flex gap-2 text-sm">
              <input type="radio" name={question.id} value={choice} required />
              {choice}
            </label>
          ))}
        </fieldset>
      ))}
      <button type="submit" className="btn btn-primary w-fit">Submit assessment</button>
      {result ? <p role="status">{result}</p> : null}
    </form>
  );
}
