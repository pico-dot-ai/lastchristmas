"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase-client";
import { useAuth } from "@/components/auth/auth-provider";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { reloadProfile } = useAuth();

  useEffect(() => {
    const finalize = async () => {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.auth.exchangeCodeForSession(window.location.href);
        }
      } catch (error) {
        console.error("Failed to exchange code for session", error);
      }

      await reloadProfile();
      router.replace("/account");
    };

    finalize();
  }, [reloadProfile, router]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", color: "#374151" }}>
      Completing sign-in...
    </main>
  );
}
