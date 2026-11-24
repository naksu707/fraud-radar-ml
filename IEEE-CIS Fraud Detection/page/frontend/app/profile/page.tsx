"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { roleLabel, useAuth } from "@/lib/auth";
import { msgText, useLang } from "@/lib/i18n";
import { fmtDate } from "@/lib/format";
import { Card } from "@/components/ui";
import { Protected } from "@/components/Protected";

export default function ProfilePage() {
  return <Protected><Profile /></Protected>;
}

function Profile() {
  const { user, setUser } = useAuth();
  const { t, lang } = useLang();
  const [info, setInfo] = useState({ name: user!.name, company: user!.company ?? "" });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try { setUser(await api.updateMe({ name: info.name, company: info.company || undefined })); setMsg({ ok: true, text: t("Profile saved.", "Perfil guardado.") }); }
    catch (err) { setMsg({ ok: false, text: (err as Error).message }); }
  };
  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.changePassword(pw.current, pw.next); setPw({ current: "", next: "" }); setPwMsg({ ok: true, text: t("Password updated.", "Contraseña actualizada.") }); }
    catch (err) { setPwMsg({ ok: false, text: (err as Error).message }); }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">{t("Account", "Cuenta")}</span>
          <h1>{user!.name}</h1>
          <p>{user!.email} · <span className={`role-chip ${user!.role === "ADMIN" ? "admin" : ""}`}>{roleLabel(user!.role, lang)}</span></p>
        </div>
      </div>

      <div className="grid grid-2">
        <Card title={t("Profile", "Perfil")} subtitle={`${t("Member since", "Miembro desde")} ${fmtDate(user!.created_at, lang)}`}>
          <form className="form" onSubmit={save}>
            <div className="field full"><label>{t("Full name", "Nombre completo")}</label><input required minLength={2} value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} /></div>
            <div className="field full"><label>{t("Company", "Empresa")}</label><input value={info.company} onChange={(e) => setInfo({ ...info, company: e.target.value })} /></div>
            <div className="field full"><label>{t("Email", "Correo")}</label><input value={user!.email} disabled /></div>
            <div className="form-actions"><button className="btn btn-primary" type="submit">{t("Save changes", "Guardar cambios")}</button></div>
          </form>
          {msg && <div className={msg.ok ? "form-ok" : "form-error"}>{msgText(msg.text, lang)}</div>}
        </Card>

        <Card title={t("Password", "Contraseña")}>
          <form className="form" onSubmit={changePw}>
            <div className="field full"><label>{t("Current password", "Contraseña actual")}</label><input type="password" required value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" /></div>
            <div className="field full"><label>{t("New password", "Nueva contraseña")} <small>({t("at least 8 characters", "mínimo 8 caracteres")})</small></label><input type="password" required minLength={8} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" /></div>
            <div className="form-actions"><button className="btn btn-primary" type="submit">{t("Update password", "Actualizar contraseña")}</button></div>
          </form>
          {pwMsg && <div className={pwMsg.ok ? "form-ok" : "form-error"}>{msgText(pwMsg.text, lang)}</div>}
        </Card>
      </div>
    </>
  );
}
