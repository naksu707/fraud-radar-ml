"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { api, type ScoreRequest, type ScoreResult, type Transaction } from "@/lib/api";
import { fmtMoney } from "@/lib/format";
import { ScoreGauge } from "@/components/charts";
import { Reasons } from "@/components/Reasons";
import { BankIllustration } from "@/components/Bank";
import { Protected } from "@/components/Protected";
import { Card, FraudTag, RiskBadge, State } from "@/components/ui";
import { msgText, useLang } from "@/lib/i18n";

type Form = {
  amount: string; product_code: string; card_network: string; card_type: string;
  purchaser_email_domain: string; device_type: string; hour: string;
};

const EMPTY: Form = { amount: "", product_code: "", card_network: "", card_type: "", purchaser_email_domain: "", device_type: "", hour: "" };
const PRESET_LABEL: Record<string, string> = { "Everyday purchase": "Compra cotidiana", "Risky pattern": "Patrón riesgoso" };
const PRESETS: Record<string, Form> = {
  "Everyday purchase": { amount: "50", product_code: "W", card_network: "visa", card_type: "debit", purchaser_email_domain: "gmail.com", device_type: "", hour: "15" },
  "Risky pattern": { amount: "500", product_code: "C", card_network: "discover", card_type: "credit", purchaser_email_domain: "outlook.com", device_type: "mobile", hour: "7" },
};

const PRODUCTS = ["W", "H", "C", "S", "R"];
const NETWORKS = ["visa", "mastercard", "american express", "discover"];
const CARD_TYPES = ["debit", "credit"];
const EMAILS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "anonymous.com", "aol.com", "icloud.com", "comcast.net", "msn.com", "live.com", "att.net"];

function fromTx(t: Transaction): Form {
  return {
    amount: String(t.amount), product_code: t.product ?? "", card_network: t.card_network ?? "",
    card_type: t.card_type ?? "", purchaser_email_domain: t.email_domain ?? "", device_type: t.device_type ?? "",
    hour: String(t.hour),
  };
}

function toRequest(form: Form, original: Form | null, baseId: number | null): ScoreRequest {
  const body: ScoreRequest = baseId != null ? { base_transaction_id: baseId } : {};
  (Object.keys(form) as (keyof Form)[]).forEach((k) => {
    const v = form[k];
    if (v === "" || (original && original[k] === v)) return; // in base mode, send only what changed
    if (k === "amount") body.amount = Number(v);
    else if (k === "hour") body.hour = Number(v);
    else body[k] = v;
  });
  return body;
}

function Select({ label, value, options, onChange, changed, hint }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; changed: boolean; hint?: string;
}) {
  const { t } = useLang();
  return (
    <div className={`field ${changed ? "changed" : ""}`}>
      <label>{label} {hint && <small>{hint}</small>}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">— {t("not specified", "sin especificar")} —</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Evaluate() {
  const { t, lang } = useLang();
  const params = useSearchParams();
  const baseId = params.get("base") ? Number(params.get("base")) : null;

  const [base, setBase] = useState<Transaction | null>(null);
  const [baseError, setBaseError] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (baseId == null) { setBase(null); setForm(EMPTY); setResult(null); return; }
    api.transaction(baseId)
      .then((t) => { setBase(t); setForm(fromTx(t)); setResult(null); })
      .catch((e: Error) => setBaseError(e.message));
  }, [baseId]);

  const original = useMemo(() => (base ? fromTx(base) : null), [base]);
  const set = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const changed = (k: keyof Form) => !!original && original[k] !== form[k];
  const nChanged = original ? (Object.keys(form) as (keyof Form)[]).filter(changed).length : 0;

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (baseId == null && !form.amount) { setError(t("Enter an amount.", "Ingresa un monto.")); return; }
    setBusy(true); setError(null);
    try { setResult(await api.score(toRequest(form, original, baseId))); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">{t("Scoring", "Evaluación")}</span>
          <h1>{t("Evaluate a transaction", "Evaluar una transacción")}</h1>
          <p>
            {base
              ? t("You are editing a real transaction. Change any field and re-score it to see how the risk moves.", "Estás editando una transacción real. Cambia cualquier campo y vuelve a evaluarla para ver cómo se mueve el riesgo.")
              : t("Describe a transaction and get its risk score. Fields you leave empty take the values of a typical transaction.", "Describe una transacción y obtén su puntaje de riesgo. Los campos que dejes vacíos toman los valores de una transacción típica.")}
          </p>
        </div>
        {base && <Link href="/evaluate" className="btn btn-ghost">{t("Start from scratch", "Empezar desde cero")}</Link>}
      </div>

      {baseError && <div className="notice" style={{ marginBottom: 16 }}>{t("Could not load transaction", "No se pudo cargar la transacción")} {baseId}: {msgText(baseError, lang)}</div>}

      <div className="grid grid-2">
        <Card title={base ? `${t("Transaction", "Transacción")} #${base.transaction_id}` : t("Transaction details", "Datos de la transacción")}
          subtitle={base ? t(`Original score ${base.risk_score.toFixed(1)} · ${nChanged} field(s) changed`, `Puntaje original ${base.risk_score.toFixed(1)} · ${nChanged} campo(s) cambiado(s)`) : undefined}
          action={base ? <FraudTag isFraud={base.is_fraud} /> : (
            <div className="presets">
              {Object.keys(PRESETS).map((p) => (
                <button key={p} className="btn btn-ghost" type="button" onClick={() => { setForm(PRESETS[p]); setResult(null); }}>{t(p, PRESET_LABEL[p])}</button>
              ))}
            </div>
          )}>
          <form className="form" onSubmit={submit}>
            <div className={`field ${changed("amount") ? "changed" : ""}`}>
              <label>{t("Amount (USD)", "Monto (USD)")}</label>
              <input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => set("amount")(e.target.value)} placeholder={t("e.g. 49.99", "ej. 49.99")} />
            </div>
            <div className={`field ${changed("hour") ? "changed" : ""}`}>
              <label>{t("Hour", "Hora")} <small>(0–23, {t("relative", "relativa")})</small></label>
              <input type="number" min="0" max="23" value={form.hour} onChange={(e) => set("hour")(e.target.value)} placeholder={t("e.g. 14", "ej. 14")} />
            </div>
            <Select label={t("Product code", "Código de producto")} value={form.product_code} options={PRODUCTS} onChange={set("product_code")} changed={changed("product_code")} />
            <Select label={t("Card network", "Red de la tarjeta")} value={form.card_network} options={NETWORKS} onChange={set("card_network")} changed={changed("card_network")} />
            <Select label={t("Card type", "Tipo de tarjeta")} value={form.card_type} options={CARD_TYPES} onChange={set("card_type")} changed={changed("card_type")} />
            <Select label={t("Device type", "Tipo de dispositivo")} value={form.device_type} options={["mobile", "desktop"]} onChange={set("device_type")} changed={changed("device_type")} />
            <div className="field full">
              <Select label={t("Purchaser email domain", "Dominio del correo del comprador")} value={form.purchaser_email_domain}
                options={Array.from(new Set([...(original?.purchaser_email_domain ? [original.purchaser_email_domain] : []), ...EMAILS]))}
                onChange={set("purchaser_email_domain")} changed={changed("purchaser_email_domain")} />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? t("Scoring…", "Evaluando…") : t("Score transaction", "Evaluar transacción")}</button>
              {base && nChanged > 0 && (
                <button className="btn btn-ghost" type="button" onClick={() => { setForm(original!); setResult(null); }}>{t("Reset changes", "Deshacer cambios")}</button>
              )}
            </div>
          </form>
          {error && <div className="notice" style={{ marginTop: 14 }}>{msgText(error, lang)}</div>}
        </Card>

        <Card title={t("Result", "Resultado")}>
          {busy ? <State loading /> : result ? (
            <>
              <ScoreGauge score={result.risk_score} threshold={result.threshold} alert={result.alert} label={t("risk score / 100", "puntaje de riesgo / 100")} />
              <div className="result-head">
                <RiskBadge level={result.risk_level} />
                <span className={`tag ${result.alert ? "tag-alert" : ""}`}>{result.alert ? t("Alert raised", "Alerta generada") : t("No alert", "Sin alerta")}</span>
                <span className="tag">{t("Threshold", "Umbral")} {result.threshold}</span>
              </div>
              {base && (
                <p className="muted" style={{ textAlign: "center" }}>
                  {t("Original", "Original")} {base.risk_score.toFixed(1)} → {t("now", "ahora")} {result.risk_score.toFixed(1)}
                  {" "}({result.risk_score - base.risk_score >= 0 ? "+" : ""}{(result.risk_score - base.risk_score).toFixed(1)})
                </p>
              )}
              <h3>{t("Why this score", "Por qué este puntaje")}</h3>
              <Reasons reasons={result.reasons} />
              {result.prediction_id && (
                <p className="saved-note">✓ {t("Saved to your", "Guardado en tu")} <Link href="/history">{t("prediction history", "historial de predicciones")}</Link></p>
              )}
              {!base && result.filled_from_profile > 0 && (
                <p className="muted" style={{ marginTop: 12 }}>
                  {t(`${result.filled_from_profile} fields you did not set were filled with a typical transaction. The strongest signals in this model are behavioral, so try starting from a real alert in the queue.`,
                    `${result.filled_from_profile} campos que no llenaste se completaron con una transacción típica. Las señales más fuertes de este modelo son de comportamiento, así que prueba partir de una alerta real de la cola.`)}
                </p>
              )}
            </>
          ) : (
            <div className="result-empty">
              <BankIllustration />
              <span>{base ? `${t("Original score", "Puntaje original")}: ${base.risk_score.toFixed(1)} · ${fmtMoney(base.amount)}` : t("Fill in the form and score the transaction.", "Llena el formulario y evalúa la transacción.")}</span>
              {base && <RiskBadge level={base.risk_level} score={base.risk_score} />}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

export default function EvaluatePage() {
  return (
    <Protected>
      <Suspense fallback={<State loading />}>
        <Evaluate />
      </Suspense>
    </Protected>
  );
}
