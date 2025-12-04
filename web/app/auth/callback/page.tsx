"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/useAuth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { reloadProfile } = useAuth();

  useEffect(() => {
    const completeAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        router.replace("/login");
        return;
      }

      const user = data.session?.user;
      if (!user) {
        router.replace("/login");
        return;
      }

      await reloadProfile();
      router.replace("/account");
    };

    completeAuth();
  }, [reloadProfile, router]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <p style={{ color: "#9ca3af" }}>Finishing sign-in, please wait...</p>
    </main>
  );
}
