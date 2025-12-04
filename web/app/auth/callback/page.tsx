"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase-client";
import { useAuth } from "@/components/auth/auth-provider";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { reloadProfile } = useAuth();

  useEffect(() => {
    const finalize = async () => {
      await supabaseClient.auth.getSession();
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
