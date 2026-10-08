import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Navbar } from "./Navbar";

vi.mock("next/navigation", () => ({ usePathname: () => "/catalog" }));
vi.stubGlobal("React", React);

describe("Navbar", () => {
  it("does not show a logged-out sign-in CTA", () => {
    const html = renderToStaticMarkup(<Navbar user={null} />);
    expect(html).not.toContain(">Sign in</a>");
  });

  it("retains profile and logout controls for signed-in users", () => {
    const html = renderToStaticMarkup(<Navbar user={{ name: "Ada" }} />);
    expect(html).toContain('href="/profile"');
    expect(html).toContain("Ada");
    expect(html).toContain("Log out");
  });
});
