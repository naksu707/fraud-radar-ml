"use client";

import Link from "next/link";
import type { Prediction } from "@/lib/api";
import { fmtDate, fmtMoney } from "@/lib/format";
import { RiskBadge } from "./ui";
import { reasonText, useLang, type Lang } from "@/lib/i18n";

function describe(p: Prediction, lang: Lang) {
  const es = lang === "es";
  const i = p.input;
  const parts = [
    i.amount != null ? fmtMoney(i.amount) : null,
    i.product_code ? `${es ? "producto" : "product"} ${i.product_code}` : null,
    i.card_network, i.card_type, i.purchaser_email_domain, i.device_type,
    i.hour != null ? `${es ? "hora" : "hour"} ${i.hour}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : es ? "sin cambios" : "no changes";
}

export function PredictionTable({ rows, showUser = false }: { rows: Prediction[]; showUser?: boolean }) {
  const { t, lang } = useLang();
  if (rows.length === 0)
    return (
      <div className="result-empty" style={{ minHeight: 180 }}>
        <span>{t("No predictions yet.", "Aún no hay predicciones.")}</span>
        <Link href="/evaluate" className="btn btn-primary btn-sm">{t("Evaluate a transaction", "Evaluar una transacción")}</Link>
      </div>
    );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{t("Date", "Fecha")}</th>{showUser && <th>{t("Analyst", "Analista")}</th>}<th>{t("Risk", "Riesgo")}</th><th>{t("Alert", "Alerta")}</th><th>{t("Source", "Origen")}</th><th>{t("Input", "Datos")}</th><th>{t("Top risk signal", "Principal señal de riesgo")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="static">
              <td className="muted">{fmtDate(p.created_at, lang)}</td>
              {showUser && <td>{p.user_name}</td>}
              <td><RiskBadge level={p.risk_level} score={p.risk_score} /></td>
              <td>{p.alert ? <span className="tag tag-alert">{t("Alert", "Alerta")}</span> : <span className="tag">{t("No alert", "Sin alerta")}</span>}</td>
              <td>
                {p.base_transaction_id
                  ? <Link className="link" href={`/evaluate?base=${p.base_transaction_id}`}>{t("Edited", "Editada")} #{p.base_transaction_id}</Link>
                  : <span className="muted">{t("New transaction", "Transacción nueva")}</span>}
              </td>
              <td><span className="reason-chip">{describe(p, lang)}</span></td>
              <td><span className="reason-chip">{reasonText(p.top_reason, lang)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
