import Link from "next/link";
import { notFound } from "next/navigation";
import { findCertificate } from "@/lib/progress-store";

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const certificate = await findCertificate(id);
  if (!certificate) notFound();
  return (
    <main className="mx-auto grid min-h-screen max-w-2xl content-center px-6 py-16">
      <p className="text-sm text-muted">Public verification</p>
      <h1 className="mt-2 text-4xl font-semibold">{certificate.title}</h1>
      <p className="mt-4 text-lg">{certificate.holderName}</p>
      <p className="mt-1 font-mono text-sm">{certificate.id}</p>
      <p className="mt-1 text-sm text-muted">Issued {certificate.issuedAt.slice(0, 10)}</p>
      <ul className="mt-6 grid gap-1 text-sm">
        {certificate.skills.map((skill) => <li key={skill}>{skill}</li>)}
      </ul>
      <Link href="/catalog" className="mt-8 text-sm font-semibold">Back to catalog</Link>
    </main>
  );
}
