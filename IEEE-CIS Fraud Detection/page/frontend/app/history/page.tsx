"use client";

import Link from "next/link";
import { api, useApi } from "@/lib/api";
import { fmtInt, fmtPct } from "@/lib/format";
import { Card, Kpi, State } from "@/components/ui";
import { PredictionTable } from "@/components/PredictionTable";
import { Protected } from "@/components/Protected";
import { useLang } from "@/lib/i18n";

export default function HistoryPage() {
  return <Protected><History /></Protected>;
}

function History() {
  const { t } = useLang();
  const list = useApi(() => api.predictions(200));
  const rows = list.data ?? [];
  const alerts = rows.filter((p) => p.alert).length;
  const avg = rows.length ? rows.reduce((a, p) => a + p.risk_score, 0) / rows.length : 0;

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">{t("Your work", "Tu trabajo")}</span>
          <h1>{t("Prediction history", "Historial de predicciones")}</h1>
          <p>{t("Every transaction you score is saved here, with its result and main risk signal.", "Cada transacción que evalúas queda guardada aquí, con su resultado y su principal señal de riesgo.")}</p>
        </div>
        <Link href="/evaluate" className="btn btn-primary">{t("New evaluation", "Nueva evaluación")}</Link>
      </div>

      <div className="grid grid-kpi">
        <Kpi label={t("Predictions", "Predicciones")} value={fmtInt(rows.length)} />
        <Kpi label={t("Alerts raised", "Alertas generadas")} value={fmtInt(alerts)} hint={rows.length ? t(`${fmtPct(alerts / rows.length)} of your predictions`, `${fmtPct(alerts / rows.length)} de tus predicciones`) : undefined} tone="fraud" dark />
        <Kpi label={t("Average risk score", "Puntaje de riesgo promedio")} value={rows.length ? avg.toFixed(1) : "—"} />
      </div>

      <Card>
        {list.loading || list.error ? <State loading={list.loading} error={list.error} onRetry={list.reload} /> : <PredictionTable rows={rows} />}
      </Card>
    </>
  );
}
