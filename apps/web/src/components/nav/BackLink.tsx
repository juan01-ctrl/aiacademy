import Link from "next/link";

export function BackLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="btn btn-ghost w-fit px-2">← {label}</Link>;
}
