"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Logo } from "./Logo";
import { msgText, useLang } from "@/lib/i18n";

const DEMO = [
  { role: ["Administrator", "Administrador"], email: "admin@fraudradar.dev", password: "admin1234" },
  { role: ["Fraud analyst", "Analista de fraude"], email: "analyst@fraudradar.dev", password: "analyst1234" },
];

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { login, register, user, ready } = useAuth();
  const { t, lang } = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [form, setForm] = useState({ name: "", email: "", password: "", company: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => { if (ready && user) router.replace(next); }, [ready, user, router, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register({ name: form.name, email: form.email, password: form.password, company: form.company || undefined });
      router.replace(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <Logo size={40} />
        <h1>{mode === "login" ? t("Welcome back", "Bienvenida/o de nuevo") : t("Create your analyst account", "Crea tu cuenta de analista")}</h1>
        <p className="muted">
          {mode === "login" ? t("Log in to review alerts and score transactions.", "Inicia sesión para revisar alertas y evaluar transacciones.") : t("New accounts get the Fraud analyst role. An administrator can change it.", "Las cuentas nuevas tienen el rol de analista de fraude. Un administrador puede cambiarlo.")}
        </p>

        {mode === "register" && (
          <>
            <div className="field"><label>{t("Full name", "Nombre completo")}</label><input required minLength={2} value={form.name} onChange={set("name")} autoComplete="name" /></div>
            <div className="field"><label>{t("Company", "Empresa")} <small>({t("optional", "opcional")})</small></label><input value={form.company} onChange={set("company")} autoComplete="organization" /></div>
          </>
        )}
        <div className="field"><label>{t("Email", "Correo")}</label><input required type="email" placeholder={t("you@company.com", "tu@empresa.com")} value={form.email} onChange={set("email")} autoComplete="email" /></div>
        <div className="field">
          <label>{t("Password", "Contraseña")} {mode === "register" && <small>({t("at least 8 characters", "mínimo 8 caracteres")})</small>}</label>
          <input required type="password" minLength={mode === "register" ? 8 : undefined} placeholder="••••••••" value={form.password} onChange={set("password")}
            autoComplete={mode === "login" ? "current-password" : "new-password"} />
        </div>

        {error && <div className="form-error">{msgText(error, lang)}</div>}
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? t("Please wait…", "Un momento…") : mode === "login" ? t("Log in", "Iniciar sesión") : t("Create account", "Crear cuenta")}
        </button>
        {mode === "login" && (
          <div className="demo-accounts">
            <span>{t("Demo accounts · click to fill", "Cuentas de demo · clic para llenar")}</span>
            {DEMO.map((d) => (
              <button type="button" key={d.email} onClick={() => setForm((f) => ({ ...f, email: d.email, password: d.password }))}>
                <b>{t(d.role[0], d.role[1])}</b><code>{d.email} · {d.password}</code>
              </button>
            ))}
          </div>
        )}
        <p className="muted auth-switch">
          {mode === "login" ? <>{t("No account yet?", "¿No tienes cuenta?")} <Link href="/register">{t("Create one", "Crea una")}</Link></> : <>{t("Already have an account?", "¿Ya tienes cuenta?")} <Link href="/login">{t("Log in", "Inicia sesión")}</Link></>}
        </p>
      </form>
    </div>
  );
}
