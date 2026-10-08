"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./LogoutButton";

const links = [
  { href: "/catalog", label: "Catalog" },
  { href: "/dashboard", label: "Dashboard", signedIn: true },
];

export function Navbar({ user }: { user: { name: string } | null }) {
  const pathname = usePathname();
  if (pathname === "/" || pathname.includes("/lessons/") || pathname.endsWith("/project")) return null;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-paper/95 px-4 backdrop-blur">
      <Link href="/" className="mr-2 font-display text-lg">Ailearnia</Link>
      <nav className="flex items-center gap-1" aria-label="Main">
        {links.filter((link) => !link.signedIn || user).map((link) => {
          const current = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link key={link.href} href={link.href} className={`btn ${current ? "btn-active" : "btn-ghost"}`} aria-current={current ? "page" : undefined}>
              {link.label}
            </Link>
          );
        })}
      </nav>
      {user ? (
        <div className="ml-auto flex items-center gap-2">
          <Link href="/profile" className={`btn ${pathname === "/profile" ? "btn-active" : "btn-ghost"}`}>{user.name}</Link>
          <LogoutButton />
        </div>
      ) : null}
    </header>
  );
}
