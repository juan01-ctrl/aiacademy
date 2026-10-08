import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthPage } from "./AuthPage";

const { getSession, redirect } = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getSession }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirect(path),
}));
vi.stubGlobal("React", React);

describe("AuthPage", () => {
  beforeEach(() => {
    getSession.mockResolvedValue(null);
    redirect.mockImplementation((path: string) => {
      throw new Error(`redirect:${path}`);
    });
  });

  it.each([
    ["sign-in", "Sign in"],
    ["sign-up", "Create your account"],
  ] as const)("renders the %s mode title", async (mode, title) => {
    const html = renderToStaticMarkup(await AuthPage({ mode, searchParams: Promise.resolve({}) }));
    expect(html).toContain(`>${title}</h1>`);
  });

  it("redirects signed-in users to a validated local next path", async () => {
    getSession.mockResolvedValue({ learnerId: "learner-1" });
    await expect(AuthPage({
      mode: "sign-in",
      searchParams: Promise.resolve({ next: "https://example.com" }),
    })).rejects.toThrow("redirect:/learn/openai-api-fundamentals");
    expect(redirect).toHaveBeenCalledWith("/learn/openai-api-fundamentals");
  });
});
