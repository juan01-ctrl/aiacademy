import { AuthPage } from "../AuthPage";

export default function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <AuthPage mode="sign-in" searchParams={searchParams} />;
}
