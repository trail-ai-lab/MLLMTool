// app/(protected)/layout.tsx
"use client";

import { useAuth } from "@/lib/useAuth";
import { redirect } from "next/navigation";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!user) return redirect("/login");

  return <>{children}</>;
}
