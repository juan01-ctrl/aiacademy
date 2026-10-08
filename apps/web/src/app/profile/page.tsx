import { redirect } from "next/navigation";
import { BackLink } from "@/components/nav/BackLink";
import { LogoutButton } from "@/components/nav/LogoutButton";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { getSession } from "@/lib/auth";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin?next=%2Fprofile");
  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mt-3 text-3xl font-semibold">Profile</h1>
      <p className="mt-2 text-sm text-muted">{session.email}</p>
      <ProfileForm name={session.name} />
      <div className="mt-6"><LogoutButton /></div>
    </main>
  );
}
