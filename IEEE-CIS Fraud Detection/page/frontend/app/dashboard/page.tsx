"use client";

import Link from "next/link";
import { useState } from "react";
import { api, useApi, type Transaction } from "@/lib/api";
import { fmtCompactMoney, fmtInt, fmtMoney, fmtPct, orDash } from "@/lib/format";
import { BarList, ColumnChart } from "@/components/charts";
import { Card, Kpi, RiskBadge, State } from "@/components/ui";
import { TxDrawer } from "@/components/TxDrawer";
import { Protected } from "@/components/Protected";
import { useAuth } from "@/lib/auth";
import { reasonText, useLang } from "@/lib/i18n";

export default function DashboardPage() {
  return <Protected><Dashboard /></Protected>;
}

function Dashboard() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const stats = useApi(api.stats);
  const model = useApi(api.model);
  const top = useApi(() => api.alerts(6, 0));
  const [selected, setSelected] = useState<Transaction | null>(null);

  if (stats.loading) return <State loading />;
  if (stats.error) return <State error={stats.error} onRetry={stats.reload} />;
  const s = stats.data!;
  if (!s.available)
    return (
      <div className="notice">
        {t("No demo data yet. In", "Aún no hay datos de demo. En")} <code>page/backend</code> {t("run", "ejecuta")} <code>python -m scripts.build_demo_data</code> {t("and restart the API.", "y reinicia la API.")}
      </div>
    );

  const avgFraud = s.confirmed_fraud / s.transactions;
  const test = model.data?.metrics.test;

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">{t("Welcome back", "Hola de nuevo")}, {user?.name.split(" ")[0]}</span>
          <h1>{t("Fraud monitoring", "Monitoreo de fraude")}</h1>
          <p>
            {t(`${fmtInt(s.transactions)} real e-commerce transactions from the most recent period of the dataset, scored by the model. None of them were used for training.`,
              `${fmtInt(s.transactions)} transacciones reales de comercio electrónico del periodo más reciente del dataset, evaluadas por el modelo. Ninguna se usó para entrenar.`)}
          </p>
        </div>
        <Link href="/alerts" className="btn btn-primary">{t(`Review ${fmtInt(s.alerts)} alerts`, `Revisar ${fmtInt(s.alerts)} alertas`)}</Link>
      </div>

      <div className="grid grid-kpi">
        <Kpi label={t("Transactions scored", "Transacciones evaluadas")} value={fmtInt(s.transactions)} hint={t(`${fmtCompactMoney(s.amount_total)} total volume`, `${fmtCompactMoney(s.amount_total)} en volumen total`)} />
        <Kpi label={t("Alerts raised", "Alertas generadas")} value={fmtInt(s.alerts)} hint={t(`${fmtPct(s.alert_rate)} of transactions`, `${fmtPct(s.alert_rate)} de las transacciones`)} tone="fraud" dark />
        <Kpi label={t("Fraud caught", "Fraude detectado")} value={fmtPct(s.recall)} hint={t(`${fmtInt(s.fraud_caught)} of ${fmtInt(s.confirmed_fraud)} confirmed frauds`, `${fmtInt(s.fraud_caught)} de ${fmtInt(s.confirmed_fraud)} fraudes confirmados`)} tone="fraud" dark />
        <Kpi label={t("Alert precision", "Precisión de alertas")} value={fmtPct(s.precision)} hint={t("Alerts that were real fraud", "Alertas que eran fraude real")} />
        <Kpi label={t("Alerts reviewed", "Alertas revisadas")} value={fmtInt(Object.values(s.reviews ?? {}).reduce((a, b) => a + (b ?? 0), 0))} hint={t(`${fmtCompactMoney(s.amount_flagged)} flagged · ${fmtInt(s.reviews?.confirmed_fraud ?? 0)} confirmed fraud`, `${fmtCompactMoney(s.amount_flagged)} marcados · ${fmtInt(s.reviews?.confirmed_fraud ?? 0)} fraude confirmado`)} tone="legit" />
      </div>

      <div className="grid grid-3-1">
        <Card title={t("Highest-risk transactions", "Transacciones de mayor riesgo")} subtitle={t("Click a row to see why it was flagged", "Haz clic en una fila para ver por qué se marcó")}
          action={<Link href="/alerts" className="btn btn-ghost">{t("Open queue", "Abrir cola")}</Link>}>
          {top.loading || top.error ? <State loading={top.loading} error={top.error} /> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>{t("Risk", "Riesgo")}</th><th className="num">{t("Amount", "Monto")}</th><th>{t("Product", "Producto")}</th><th>{t("Email", "Correo")}</th><th>{t("Main reason", "Razón principal")}</th></tr>
                </thead>
                <tbody>
                  {top.data!.items.map((tx) => (
                    <tr key={tx.transaction_id} onClick={() => setSelected(tx)}>
                      <td><RiskBadge level={tx.risk_level} score={tx.risk_score} /></td>
                      <td className="num">{fmtMoney(tx.amount)}</td>
                      <td>{orDash(tx.product)}</td>
                      <td>{orDash(tx.email_domain)}</td>
                      <td><span className="reason-chip">{reasonText(tx.reasons.find((r) => r.direction === "raises")?.reason, lang)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card dark title={t("Model", "Modelo")} subtitle={model.data ? `${model.data.model} · ${model.data.features} ${t("features", "variables")}` : undefined}>
          {model.loading || model.error ? <State loading={model.loading} error={model.error} /> : (
            <>
              <div className="model-metrics">
                <div><span>PR-AUC (test)</span><b>{test ? test.pr_auc.toFixed(3) : "—"}</b></div>
                <div><span>ROC-AUC (test)</span><b>{test ? test.roc_auc.toFixed(3) : "—"}</b></div>
                <div><span>Recall (test)</span><b>{fmtPct(test?.recall)}</b></div>
                <div><span>{t("Alert threshold", "Umbral de alerta")}</span><b>{model.data!.threshold}</b></div>
              </div>
              <p className="model-note">
                {t("A random model would score a PR-AUC of about", "Un modelo aleatorio tendría un PR-AUC de cerca de")} {test ? test.test_fraud_rate.toFixed(3) : "0.035"}.
                {" "}{t("Scores are risk scores (0–100), not probabilities.", "Los puntajes son de riesgo (0–100), no probabilidades.")}
              </p>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <Card title={t("Alerts by hour", "Alertas por hora")} subtitle={t("Hour is relative to the dataset's reference time", "La hora es relativa al punto de referencia del dataset")}>
          <ColumnChart
            data={s.by_hour.map((h) => ({ label: String(h.hour), value: h.alerts, note: `${fmtInt(h.transactions)} ${t("transactions", "transacciones")}` }))}
            format={(v) => fmtInt(Math.round(v))}
          />
        </Card>
        <Card title={t("Risk score distribution", "Distribución del puntaje de riesgo")} subtitle={t("How many transactions fall in each score band", "Cuántas transacciones caen en cada rango de puntaje")}>
          <ColumnChart
            data={s.score_distribution.map((b) => ({ label: b.band.replace(/[()[\]]/g, "").replace(", ", "–").replace("-0.001", "0"), value: b.transactions }))}
            format={(v) => fmtInt(Math.round(v))}
            color="var(--legit)"
          />
        </Card>
        <Card title={t("Fraud rate by product", "Tasa de fraude por producto")} subtitle={t("Confirmed fraud in the scored transactions", "Fraude confirmado en las transacciones evaluadas")}>
          <BarList
            data={s.by_product.map((b) => ({ label: `${t("Product", "Producto")} ${b.label}`, value: b.fraud_rate, note: `${fmtInt(b.transactions)} ${t("transactions", "transacciones")}` }))}
            format={(v) => fmtPct(v)}
            reference={avgFraud}
            referenceLabel={`${t("Average fraud rate", "Tasa promedio de fraude")} (${fmtPct(avgFraud)})`}
          />
        </Card>
        <Card title={t("Fraud rate by card type and device", "Tasa de fraude por tipo de tarjeta y dispositivo")}>
          <BarList
            data={[
              ...s.by_card_type.filter((b) => b.transactions >= 20).map((b) => ({ label: b.label, value: b.fraud_rate, note: `${fmtInt(b.transactions)} ${t("transactions", "transacciones")}` })),
              ...s.by_device.map((b) => ({ label: b.label === "missing" ? t("no device data", "sin datos de dispositivo") : b.label, value: b.fraud_rate, note: `${fmtInt(b.transactions)} ${t("transactions", "transacciones")}` })),
            ]}
            format={(v) => fmtPct(v)}
            reference={avgFraud}
            referenceLabel={`${t("Average fraud rate", "Tasa promedio de fraude")} (${fmtPct(avgFraud)})`}
          />
        </Card>
      </div>

      <TxDrawer tx={selected} onClose={() => setSelected(null)} />
    </>
  );
}
