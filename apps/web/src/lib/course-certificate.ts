import type { CertificateRecord } from "./progress-store";

export function courseCertificate(
  learner: { certificate?: CertificateRecord | null; certificatesByCourseId?: Record<string, CertificateRecord> } | undefined,
  courseId: string,
): CertificateRecord | null {
  const certificate = learner?.certificatesByCourseId?.[courseId];
  if (certificate?.courseId === courseId) return certificate;
  return learner?.certificate?.courseId === courseId ? learner.certificate : null;
}
