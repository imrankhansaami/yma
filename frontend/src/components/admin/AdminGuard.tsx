"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  selectIsAuthenticated,
  selectUser,
  useAuthStore,
} from "@/store/useAuthStore";

type AdminGuardProps = {
  children: React.ReactNode;
};

const allowedRoles = new Set(["admin", "superadmin"]);

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const [checked, setChecked] = useState(false);

  const isAdmin = useMemo(
    () => Boolean(user?.role && allowedRoles.has(user.role)),
    [user?.role],
  );

  useEffect(() => {
    let mounted = true;

    const ensureAuth = async () => {
      await checkAuth();
      if (mounted) {
        setChecked(true);
      }
    };

    ensureAuth();

    return () => {
      mounted = false;
    };
  }, [checkAuth]);

  useEffect(() => {
    if (!checked) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!isAdmin) {
      router.replace("/");
    }
  }, [checked, isAdmin, isAuthenticated, router]);

  if (!checked || !isAuthenticated || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
