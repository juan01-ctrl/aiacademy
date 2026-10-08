import { AuthPage } from "../AuthPage";

export default function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <AuthPage mode="sign-up" searchParams={searchParams} />;
}
