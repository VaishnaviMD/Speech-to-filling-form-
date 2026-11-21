"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import BoloApp from "@/components/BoloApp";
import LandingHero from "@/components/LandingHero";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <p className="text-sm font-medium text-muted animate-pulse">Loading FormSathi AI...</p>
      </div>
    );
  }

  if (!user) {
    return <LandingHero />;
  }

  return <BoloApp />;
}
