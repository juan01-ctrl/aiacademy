"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

export type OutlineItem = {
  id: string;
  lessonTitle: string;
  title: string;
  kind: "Theory" | "Exercise";
  xp: number;
  href: string | null;
  state: "done" | "current" | "open" | "locked";
};

export function PlayerShell({
  courseTitle,
  courseHref,
  items,
  children,
}: {
  courseTitle: string;
  courseHref: string;
  items: OutlineItem[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const current = items.findIndex((item) => item.state === "current");
  const lessons = items.reduce<string[]>((names, item) => {
    if (!names.includes(item.lessonTitle)) names.push(item.lessonTitle);
    return names;
  }, []);

  return (
    <div className="flex h-screen flex-col bg-canvas text-navy">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-3">
        <button type="button" className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-soft" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          Exercises
        </button>
        <Link href={courseHref} className="truncate text-sm text-muted">{courseTitle}</Link>
        <ol className="mx-auto hidden max-w-md flex-1 gap-1 sm:flex" aria-label="Step progress">
          {items.map((item) => (
            <li key={item.id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <span className={`block h-full ${item.state === "done" || item.state === "current" ? "bg-green" : ""}`} />
            </li>
          ))}
        </ol>
        <p className="font-mono text-xs text-muted">{current + 1} / {items.length}</p>
      </header>
      <div className="flex min-h-0 flex-1">
        {open ? (
          <aside className="w-80 shrink-0 overflow-auto border-r border-line bg-white">
            <p className="px-4 pt-4 text-xs font-semibold tracking-wide text-muted uppercase">Course outline</p>
            {lessons.map((lessonTitle) => (
              <section key={lessonTitle} className="mt-3">
                <h2 className="px-4 py-2 text-sm font-semibold">{lessonTitle}</h2>
                <ul>
                  {items.filter((item) => item.lessonTitle === lessonTitle).map((item) => {
                    const row = `${item.state === "current" ? "bg-soft border-l-green" : "border-l-transparent"} flex items-start gap-3 border-l-4 px-4 py-2.5 text-sm`;
                    const body = (
                      <>
                        <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${item.state === "done" ? "bg-pass text-white" : "bg-line text-muted"}`} aria-hidden="true">
                          {item.state === "done" ? "✓" : item.kind === "Theory" ? "T" : "E"}
                        </span>
                        <span>
                          <span className="block font-medium">{item.title}</span>
                          <span className="text-xs text-muted">{item.kind} · {item.xp} XP{item.state === "locked" ? " · Locked" : ""}</span>
                        </span>
                      </>
                    );
                    return (
                      <li key={item.id}>
                        {item.href ? (
                          <Link href={item.href} className={row} aria-current={item.state === "current" ? "step" : undefined} onClick={() => setOpen(false)}>{body}</Link>
                        ) : (
                          <div className={`${row} text-muted`}>{body}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </aside>
        ) : null}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
