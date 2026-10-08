import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { agenticRoadmap } from "@/lib/roadmap";
import { Landing } from "./Landing";

// Next uses automatic JSX; this existing Vitest config uses classic JSX.
vi.stubGlobal("React", React);

// The fixture mirrors authored catalog content. Future roadmap steps deliberately
// have no published courses, so the page cannot infer availability from the plan.
const steps = agenticRoadmap.map((step) => ({
  ...step,
  courses: step.order === 1 ? [{
    id: "openai-api-fundamentals",
    title: "OpenAI API Fundamentals",
    summary: "Call the Responses API, control the response, and survive a bad prompt or a raised error.",
    level: "Basic",
    duration: "3 hr",
  }] : [],
}));

function render(signedIn = false) {
  return renderToStaticMarkup(<Landing signedIn={signedIn} startHref={signedIn ? "/catalog" : "/auth/signin?next=%2Fcatalog"} steps={steps} />);
}

function linkWithText(html: string, text: string) {
  return [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
    .find((match) => match[2].replace(/<[^>]+>/g, "").includes(text))?.[1];
}

describe("Landing", () => {
  it("explains the offer with one main heading and learning-focused sections", () => {
    const html = render();
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain("Build agents. Understand every step.");
    expect(html).toContain('id="main-content"');
    expect(html).toContain("Learn the foundations. Then connect the pieces.");
    expect(html).toContain("From an idea to working Python.");
    expect(html).toContain("Illustrative exercise");
  });

  it.each([false, true])("preserves primary and account destinations (signedIn=%s)", (signedIn) => {
    const html = render(signedIn);
    expect(linkWithText(html, signedIn ? "Continue the path" : "Start the path")).toBe(signedIn ? "/catalog" : "/auth/signin?next=%2Fcatalog");
    expect(linkWithText(html, signedIn ? "Dashboard" : "Sign in")).toBe(signedIn ? "/dashboard" : "/auth/signin");
    expect(linkWithText(html, signedIn ? "Start OpenAI API" : "Create your account")).toBe(signedIn ? "/courses/openai-api-fundamentals" : "/auth/signup?next=%2Fcourses%2Fopenai-api-fundamentals");
  });

  it("shows actual course metadata and defaults to the first roadmap step", () => {
    const html = render();
    expect(html).toContain('role="tablist"');
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(html).toContain('id="roadmap-tab-1"');
    expect(html).toContain('aria-controls="roadmap-panel-1"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain("OpenAI API Fundamentals");
    expect(html).toContain("Basic");
    expect(html).toContain("3 hr");
    expect(linkWithText(html, "See details")).toBe("/courses/openai-api-fundamentals");
    expect(html).not.toContain("Six courses, in order");
    expect(html).not.toContain("certificate");
  });

  it("provides an existing panel target for every roadmap tab", () => {
    const html = render();
    for (const order of [1, 2, 3, 4, 5, 6]) {
      expect(html).toContain(`id="roadmap-panel-${order}"`);
    }
    expect(html.match(/hidden=""/g)).toHaveLength(5);
  });

  it("gives a useful next action for a roadmap step without published courses", () => {
    const html = renderToStaticMarkup(<Landing signedIn={false} startHref="/auth/signin?next=%2Fcatalog" steps={[steps[1]]} />);
    expect(html).toContain("No courses are available in this step yet.");
    expect(linkWithText(html, "Browse available courses")).toBe("/catalog");
  });

  it("handles an empty roadmap without implying courses are available", () => {
    const html = renderToStaticMarkup(<Landing signedIn={false} startHref="/auth/signin?next=%2Fcatalog" steps={[]} />);
    expect(html).toContain("Browse the catalog for available courses.");
    expect(html).not.toContain('role="tablist"');
  });
});
