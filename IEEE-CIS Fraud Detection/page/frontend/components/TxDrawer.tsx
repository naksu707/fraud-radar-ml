"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Decision, type Review, type Transaction } from "@/lib/api";
import { decisionLabel, fmtDate, fmtMoney, orDash } from "@/lib/format";
import { msgText, useLang } from "@/lib/i18n";
import { Reasons } from "./Reasons";
import { FraudTag, RiskBadge } from "./ui";

const DECISIONS: Decision[] = ["confirmed_fraud", "legit", "escalated"];

export function ReviewTag({ review }: { review?: Review | null }) {
  const { t, lang } = useLang();
  if (!review) return <span className="tag">{t("Pending", "Pendiente")}</span>;
  return <span className={`tag review-${review.decision}`}>{decisionLabel(review.decision, lang)}</span>;
}

export function TxDrawer({ tx, onClose, onReviewed }: {
  tx: Transaction | null; onClose: () => void; onReviewed?: (id: number, review: Review) => void;
}) {
  const { t, lang } = useLang();
  const [note, setNote] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReview(tx?.review ?? null);
    setNote(tx?.review?.note ?? "");
    setError(null);
  }, [tx]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!tx) return null;

  const decide = async (decision: Decision) => {
    setBusy(true); setError(null);
    try {
      const r = await api.review(tx.transaction_id, decision, note || undefined);
      setReview(r);
      onReviewed?.(tx.transaction_id, r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()} aria-label={`${t("Transaction", "Transacción")} ${tx.transaction_id}`}>
        <div className="drawer-head">
          <div>
            <span className="muted">{t("Transaction", "Transacción")}</span>
            <h2>#{tx.transaction_id}</h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label={t("Close", "Cerrar")}>✕</button>
        </div>

        <div className="drawer-score">
          <RiskBadge level={tx.risk_level} score={tx.risk_score} />
          {tx.alert && <span className="tag tag-alert">{t("Alert raised", "Alerta generada")}</span>}
          <ReviewTag review={review} />
        </div>

        <dl className="facts">
          <div><dt>{t("Amount", "Monto")}</dt><dd>{fmtMoney(tx.amount)}</dd></div>
          <div><dt>{t("Product", "Producto")}</dt><dd>{orDash(tx.product)}</dd></div>
          <div><dt>{t("Card", "Tarjeta")}</dt><dd>{orDash(tx.card_network)} · {orDash(tx.card_type)}</dd></div>
          <div><dt>{t("Email domain", "Dominio del correo")}</dt><dd>{orDash(tx.email_domain)}</dd></div>
          <div><dt>{t("Device", "Dispositivo")}</dt><dd>{orDash(tx.device_type)}{tx.device_info ? ` · ${tx.device_info}` : ""}</dd></div>
          <div><dt>{t("Hour (relative)", "Hora (relativa)")}</dt><dd>{tx.hour}:00</dd></div>
        </dl>

        <h3>{t("Why this score", "Por qué este puntaje")}</h3>
        <Reasons reasons={tx.reasons} />

        <h3>{t("Your decision", "Tu decisión")}</h3>
        <div className="review-box">
          <textarea placeholder={t("Add a note for the team (optional)", "Agrega una nota para el equipo (opcional)")} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} />
          <div className="decisions">
            {DECISIONS.map((d) => (
              <button key={d} className={`btn btn-sm decision-${d} ${review?.decision === d ? "on" : ""}`} disabled={busy} onClick={() => decide(d)}>
                {decisionLabel(d, lang)}
              </button>
            ))}
          </div>
          {review && <p className="muted">{t("Last decision by", "Última decisión de")} {review.reviewer} · {fmtDate(review.updated_at, lang)}</p>}
          {error && <div className="form-error">{msgText(error, lang)}</div>}
        </div>

        <details className="ground-truth">
          <summary>{t("Show the dataset label", "Ver la etiqueta del dataset")}</summary>
          <p>{t("In the dataset this transaction is:", "En el dataset esta transacción es:")} <FraudTag isFraud={tx.is_fraud} /></p>
          <p className="muted">{t("In production this would be unknown when the alert is raised. It is shown here to check the model.", "En producción esto no se sabría al generar la alerta. Se muestra aquí para verificar el modelo.")}</p>
        </details>

        {tx.editable && (
          <Link href={`/evaluate?base=${tx.transaction_id}`} className="btn btn-ghost btn-block">
            {t("Try changes on this transaction", "Probar cambios en esta transacción")} →
          </Link>
        )}
      </aside>
    </div>
  );
}
