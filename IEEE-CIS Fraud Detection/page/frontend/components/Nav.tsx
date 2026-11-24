"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { roleLabel, useAuth } from "@/lib/auth";
import { LangSwitch, useLang } from "@/lib/i18n";
import { Logo } from "./Logo";

const PUBLIC = [
  { href: "/", label: ["Home", "Inicio"] },
  { href: "/about", label: ["Project", "Proyecto"] },
];
const ANALYST = [
  { href: "/dashboard", label: ["Dashboard", "Dashboard"] },
  { href: "/alerts", label: ["Alert queue", "Alertas"] },
  { href: "/evaluate", label: ["Evaluate", "Evaluar"] },
  { href: "/history", label: ["History", "Historial"] },
];
const ADMIN = [...ANALYST, { href: "/admin", label: ["Admin", "Admin"] }];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const { t, lang } = useLang();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const links = !user ? PUBLIC : user.role === "ADMIN" ? ADMIN : ANALYST;

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const initials = user?.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header className="nav">
      <Link href={user ? "/dashboard" : "/"} className="brand">
        <Logo />
        <span>
          Fraud Radar
          <small>IEEE-CIS · Vesta</small>
        </span>
      </Link>
      <nav>
        {links.map((l) => {
          const active = l.href === "/" ? pathname === "/" : pathname?.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} className={active ? "active" : undefined}>
              {t(l.label[0], l.label[1])}
            </Link>
          );
        })}
      </nav>
      <div className="nav-user" ref={ref}>
        <LangSwitch />
        {!ready ? null : user ? (
          <>
            <button className="avatar-btn" onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu}>
              <span className="avatar">{initials}</span>
              <span className="avatar-name">{user.name.split(" ")[0]}</span>
            </button>
            {menu && (
              <div className="menu" role="menu">
                <div className="menu-head">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                  <span className={`role-chip ${user.role === "ADMIN" ? "admin" : ""}`}>{roleLabel(user.role, lang)}</span>
                </div>
                <Link href="/profile" onClick={() => setMenu(false)}>{t("Profile", "Perfil")}</Link>
                <Link href="/about" onClick={() => setMenu(false)}>{t("About the project", "Sobre el proyecto")}</Link>
                <button onClick={() => { logout(); setMenu(false); router.push("/"); }}>{t("Log out", "Cerrar sesión")}</button>
              </div>
            )}
          </>
        ) : (
          <>
            <Link href="/login" className="btn btn-ghost btn-sm">{t("Log in", "Iniciar sesión")}</Link>
            <Link href="/register" className="btn btn-primary btn-sm">{t("Get started", "Empezar")}</Link>
          </>
        )}
      </div>
    </header>
  );
}
