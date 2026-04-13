"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function AdminIndexPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    router.replace(isAuthenticated ? "/admin/documents" : "/admin/login");
  }, [isAuthenticated, router]);

  return null;
}
