"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { Role } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { State } from "./ui";
import { useLang } from "@/lib/i18n";

/** Renders children only for logged-in users (optionally with a given role). */
export function Protected({ children, role }: { children: ReactNode; role?: Role }) {
  const { user, ready } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(pathname ?? "/dashboard")}`);
  }, [ready, user, router, pathname]);

  if (!ready || !user) return <State loading />;
  if (role && user.role !== role)
    return (
      <div className="card center-card">
        <h2>{t("Access restricted", "Acceso restringido")}</h2>
        <p className="muted">{t("This section is only available to administrators.", "Esta sección solo está disponible para administradores.")}</p>
        <Link href="/dashboard" className="btn btn-primary" style={{ marginTop: 14 }}>{t("Back to the dashboard", "Volver al dashboard")}</Link>
      </div>
    );
  return <>{children}</>;
}
