"use client";

import { useState } from "react";
import { api, useApi, type Role, type User } from "@/lib/api";
import { roleLabel, useAuth } from "@/lib/auth";
import { msgText, useLang } from "@/lib/i18n";
import { decisionLabel, fmtDate, fmtInt } from "@/lib/format";
import { Card, Kpi, State } from "@/components/ui";
import { PredictionTable } from "@/components/PredictionTable";
import { Protected } from "@/components/Protected";

const ACTION_LABEL: Record<string, [string, string]> = {
  login: ["logged in", "inició sesión"], register: ["created an account", "creó una cuenta"], review: ["reviewed an alert", "revisó una alerta"],
  update_user: ["updated a user", "actualizó un usuario"], change_password: ["changed their password", "cambió su contraseña"],
};

export default function AdminPage() {
  return <Protected role="ADMIN"><Admin /></Protected>;
}

function Admin() {
  const { user: me } = useAuth();
  const { t, lang } = useLang();
  const [tab, setTab] = useState<"users" | "predictions" | "activity">("users");
  const users = useApi(api.users);
  const preds = useApi(() => api.allPredictions(200));
  const activity = useApi(() => api.activity(150));
  const [error, setError] = useState<string | null>(null);

  const update = async (u: User, data: { role?: Role; active?: boolean }) => {
    setError(null);
    try {
      const updated = await api.updateUser(u.id, data);
      users.setData((list) => list && list.map((x) => (x.id === u.id ? { ...x, ...updated } : x)));
      activity.reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const list = users.data ?? [];
  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">{t("Administration", "Administración")}</span>
          <h1>{t("Team & activity", "Equipo y actividad")}</h1>
          <p>{t("Manage who can use the platform and follow what the fraud team is doing.", "Gestiona quién puede usar la plataforma y sigue lo que hace el equipo de fraude.")}</p>
        </div>
        <div className="segmented" role="tablist">
          <button className={tab === "users" ? "on" : ""} onClick={() => setTab("users")}>{t("Users", "Usuarios")}</button>
          <button className={tab === "predictions" ? "on" : ""} onClick={() => setTab("predictions")}>{t("All predictions", "Todas las predicciones")}</button>
          <button className={tab === "activity" ? "on" : ""} onClick={() => setTab("activity")}>{t("Activity log", "Registro de actividad")}</button>
        </div>
      </div>

      <div className="grid grid-kpi">
        <Kpi label={t("Users", "Usuarios")} value={fmtInt(list.length)} hint={`${fmtInt(list.filter((u) => u.active).length)} ${t("active", "activos")}`} />
        <Kpi label={t("Administrators", "Administradores")} value={fmtInt(list.filter((u) => u.role === "ADMIN").length)} dark />
        <Kpi label={t("Predictions", "Predicciones")} value={fmtInt(list.reduce((a, u) => a + (u.predictions ?? 0), 0))} />
        <Kpi label={t("Alerts reviewed", "Alertas revisadas")} value={fmtInt(list.reduce((a, u) => a + (u.reviews ?? 0), 0))} tone="fraud" />
      </div>

      {error && <div className="form-error" style={{ marginBottom: 14 }}>{msgText(error, lang)}</div>}

      {tab === "users" && (
        <Card title={t("Users", "Usuarios")}>
          {users.loading || users.error ? <State loading={users.loading} error={users.error} onRetry={users.reload} /> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>{t("Name", "Nombre")}</th><th>{t("Email", "Correo")}</th><th>{t("Company", "Empresa")}</th><th>{t("Role", "Rol")}</th><th className="num">{t("Predictions", "Predicciones")}</th><th className="num">{t("Reviews", "Revisiones")}</th><th>{t("Last login", "Último ingreso")}</th><th>{t("Status", "Estado")}</th></tr>
                </thead>
                <tbody>
                  {list.map((u) => {
                    const self = u.id === me?.id;
                    return (
                      <tr key={u.id} className="static">
                        <td><strong>{u.name}</strong>{self && <span className="muted"> ({t("you", "tú")})</span>}</td>
                        <td className="muted">{u.email}</td>
                        <td>{u.company ?? "—"}</td>
                        <td>
                          <select className="inline-select" value={u.role} disabled={self} onChange={(e) => update(u, { role: e.target.value as Role })}>
                            {(["ANALYST", "ADMIN"] as Role[]).map((r) => <option key={r} value={r}>{roleLabel(r, lang)}</option>)}
                          </select>
                        </td>
                        <td className="num">{fmtInt(u.predictions ?? 0)}</td>
                        <td className="num">{fmtInt(u.reviews ?? 0)}</td>
                        <td className="muted">{fmtDate(u.last_login, lang)}</td>
                        <td>
                          <button className={`btn btn-sm ${u.active ? "btn-ghost" : "btn-primary"}`} disabled={self} onClick={() => update(u, { active: !u.active })}>
                            {u.active ? t("Deactivate", "Desactivar") : t("Activate", "Activar")}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === "predictions" && (
        <Card title={t("All predictions", "Todas las predicciones")} subtitle={t("Latest 200 across the team", "Últimas 200 de todo el equipo")}>
          {preds.loading || preds.error ? <State loading={preds.loading} error={preds.error} /> : <PredictionTable rows={preds.data!} showUser />}
        </Card>
      )}

      {tab === "activity" && (
        <Card title={t("Activity log", "Registro de actividad")} subtitle={t("Latest 150 events", "Últimos 150 eventos")}>
          {activity.loading || activity.error ? <State loading={activity.loading} error={activity.error} /> : (
            <ul className="timeline">
              {activity.data!.map((a) => (
                <li key={a.id}>
                  <span className={`tl-dot ${a.action}`} />
                  <div>
                    <strong>{a.user_name ?? t("System", "Sistema")}</strong> {ACTION_LABEL[a.action] ? t(...ACTION_LABEL[a.action]) : a.action}
                    {a.detail && a.action !== "login" && <span className="muted"> · {a.detail.replace(/confirmed_fraud|legit|escalated/, (d) => decisionLabel(d as "legit", lang))}</span>}
                  </div>
                  <span className="muted">{fmtDate(a.created_at, lang)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </>
  );
}
