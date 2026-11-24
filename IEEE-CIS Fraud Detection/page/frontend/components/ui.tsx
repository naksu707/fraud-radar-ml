"use client";

import type { ReactNode } from "react";
import type { RiskLevel } from "@/lib/api";
import { fmtScore } from "@/lib/format";
import { msgText, useLang } from "@/lib/i18n";

export function Card({ title, subtitle, children, action, dark }: {
  title?: string; subtitle?: string; children: ReactNode; action?: ReactNode; dark?: boolean;
}) {
  return (
    <section className={dark ? "card dark" : "card"}>
      {(title || action) && (
        <div className="card-head">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, hint, tone, dark }: { label: string; value: string; hint?: string; tone?: "fraud" | "legit"; dark?: boolean }) {
  return (
    <div className={dark ? "kpi dark" : "kpi"}>
      <span className="kpi-label">{label}</span>
      <span className={`kpi-value ${tone ?? ""}`}>{value}</span>
      {hint && <span className="kpi-hint">{hint}</span>}
    </div>
  );
}

const LEVEL_TEXT: Record<RiskLevel, [string, string]> = { low: ["Low", "Bajo"], medium: ["Medium", "Medio"], high: ["High", "Alto"] };

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  const { t } = useLang();
  return (
    <span className={`badge badge-${level}`}>
      <i aria-hidden="true" />
      {t(...LEVEL_TEXT[level])}
      {score != null && <b>{fmtScore(score)}</b>}
    </span>
  );
}

export function FraudTag({ isFraud }: { isFraud: number }) {
  const { t } = useLang();
  return isFraud ? <span className="tag tag-fraud">{t("Confirmed fraud", "Fraude confirmado")}</span> : <span className="tag">{t("Legit", "Legítima")}</span>;
}

export function State({ loading, error, onRetry }: { loading?: boolean; error?: string | null; onRetry?: () => void }) {
  const { t, lang } = useLang();
  if (loading) return <div className="state"><span className="spinner" /> {t("Loading…", "Cargando…")}</div>;
  if (error)
    return (
      <div className="state state-error">
        <strong>{t("Something went wrong", "Algo salió mal")}</strong>
        <span>{msgText(error, lang)}</span>
        {onRetry && <button className="btn btn-ghost" onClick={onRetry}>{t("Retry", "Reintentar")}</button>}
      </div>
    );
  return null;
}
