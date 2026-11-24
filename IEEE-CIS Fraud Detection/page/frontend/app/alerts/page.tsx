"use client";

import { useState } from "react";
import { api, useApi, type Review, type Transaction } from "@/lib/api";
import { fmtInt, fmtMoney, orDash } from "@/lib/format";
import { Card, RiskBadge, State } from "@/components/ui";
import { ReviewTag, TxDrawer } from "@/components/TxDrawer";
import { Protected } from "@/components/Protected";
import { reasonText, useLang } from "@/lib/i18n";

const PAGE = 25;

export default function AlertsPage() {
  return <Protected><Alerts /></Protected>;
}

function Alerts() {
  const { t, lang } = useLang();
  const [onlyAlerts, setOnlyAlerts] = useState(true);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const list = useApi(() => api.transactions(PAGE, offset, onlyAlerts), [offset, onlyAlerts]);

  const setFilter = (v: boolean) => { setOnlyAlerts(v); setOffset(0); };
  const total = list.data?.total ?? 0;

  const onReviewed = (id: number, review: Review) => {
    list.setData((d) => d && { ...d, items: d.items.map((x) => (x.transaction_id === id ? { ...x, review } : x)) });
  };

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">{t("Investigations", "Investigaciones")}</span>
          <h1>{t("Alert queue", "Cola de alertas")}</h1>
          <p>{t("Transactions sorted by risk score, highest first. Open one to see its reasons and record your decision.", "Transacciones ordenadas por puntaje de riesgo, de mayor a menor. Abre una para ver sus razones y registrar tu decisión.")}</p>
        </div>
        <div className="segmented" role="tablist">
          <button className={onlyAlerts ? "on" : ""} onClick={() => setFilter(true)}>{t("Alerts only", "Solo alertas")}</button>
          <button className={!onlyAlerts ? "on" : ""} onClick={() => setFilter(false)}>{t("All transactions", "Todas las transacciones")}</button>
        </div>
      </div>

      <Card>
        {list.loading || list.error ? <State loading={list.loading} error={list.error} onRetry={list.reload} /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("Risk", "Riesgo")}</th><th>ID</th><th className="num">{t("Amount", "Monto")}</th><th>{t("Product", "Producto")}</th><th>{t("Card", "Tarjeta")}</th>
                    <th>{t("Email domain", "Dominio del correo")}</th><th>{t("Device", "Dispositivo")}</th><th>{t("Top reason", "Razón principal")}</th><th>{t("Status", "Estado")}</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data!.items.map((tx) => (
                    <tr key={tx.transaction_id} onClick={() => setSelected(tx)}>
                      <td><RiskBadge level={tx.risk_level} score={tx.risk_score} /></td>
                      <td className="muted">{tx.transaction_id}</td>
                      <td className="num">{fmtMoney(tx.amount)}</td>
                      <td>{orDash(tx.product)}</td>
                      <td>{orDash(tx.card_network)} · {orDash(tx.card_type)}</td>
                      <td>{orDash(tx.email_domain)}</td>
                      <td>{orDash(tx.device_type)}</td>
                      <td><span className="reason-chip">{reasonText(tx.reasons.find((r) => r.direction === "raises")?.reason, lang)}</span></td>
                      <td><ReviewTag review={tx.review} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <span>{fmtInt(total === 0 ? 0 : offset + 1)}–{fmtInt(Math.min(offset + PAGE, total))} {t("of", "de")} {fmtInt(total)}</span>
              <div>
                <button className="btn btn-ghost btn-sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>← {t("Previous", "Anterior")}</button>
                <button className="btn btn-ghost btn-sm" disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}>{t("Next", "Siguiente")} →</button>
              </div>
            </div>
          </>
        )}
      </Card>

      <TxDrawer tx={selected} onClose={() => setSelected(null)} onReviewed={onReviewed} />
    </>
  );
}
