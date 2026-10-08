import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";

vi.stubGlobal("React", React);

function render(initialMode: "sign-in" | "sign-up") {
  return renderToStaticMarkup(<LoginForm nextPath="/courses/sample-course" initialMode={initialMode} />);
}

describe("LoginForm", () => {
  it.each([
    ["sign-in", "Sign in"],
    ["sign-up", "Create your account"],
  ] as const)("shows the matching title for %s mode", (mode, title) => {
    const html = render(mode);
    expect(html).toContain(`<h1`);
    expect(html).toContain(`>${title}</h1>`);
  });

  it("places the account-mode switch before the title", () => {
    const html = render("sign-in");
    expect(html.indexOf('aria-label="Account action"')).toBeLessThan(html.indexOf("<h1"));
  });

  it("centers both account-mode labels inside their links", () => {
    const html = render("sign-in");
    const modeLinks = (html.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) ?? []).filter((link) =>
      link.includes("Sign in") || link.includes("Create account"),
    );

    expect(modeLinks).toHaveLength(2);
    for (const link of modeLinks) {
      expect(link).toMatch(/class="[^"]*\bflex\b[^"]*items-center[^"]*justify-center[^"]*"/);
    }
  });

  it("uses canonical mode links and keeps the safe next path", () => {
    const html = render("sign-in");
    expect(html).toContain('href="/auth/signin?next=%2Fcourses%2Fsample-course"');
    expect(html).toContain('href="/auth/signup?next=%2Fcourses%2Fsample-course"');
  });

  it("places Google first, then the email divider, then email credentials", () => {
    const html = render("sign-in");
    const googleButton = html.indexOf("Continue with Google");
    const emailDivider = html.indexOf("or continue with email");
    const emailField = html.indexOf('name="email"');

    expect(googleButton).toBeGreaterThan(-1);
    expect(googleButton).toBeLessThan(emailDivider);
    expect(emailDivider).toBeLessThan(emailField);
    expect(html).toMatch(/class="btn btn-secondary mt-5 w-full gap-2"/);
  });
});
