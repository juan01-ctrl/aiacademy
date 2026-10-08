"use client";

import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  return (
    <button
      type="button"
      className="btn btn-secondary"
      onClick={async () => {
        await authClient.signOut();
        window.location.href = "/";
      }}
    >
      Log out
    </button>
  );
}
