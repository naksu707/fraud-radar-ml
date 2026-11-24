"use client";

import type { Reason } from "@/lib/api";
import { fmtValue } from "@/lib/format";
import { reasonText, useLang } from "@/lib/i18n";

/** Diverging bars: what pushed the score up (right, pink) or down (left, blue). */
export function Reasons({ reasons }: { reasons: Reason[] }) {
  const { t, lang } = useLang();
  const max = Math.max(...reasons.map((r) => Math.abs(r.impact)), 0.01);
  return (
    <div className="reasons">
      <div className="reasons-legend">
        <span><i className="dot legit" /> {t("lowers risk", "baja el riesgo")}</span>
        <span><i className="dot fraud" /> {t("raises risk", "sube el riesgo")}</span>
      </div>
      {reasons.map((r) => {
        const w = (Math.abs(r.impact) / max) * 50;
        const up = r.direction === "raises";
        return (
          <div className="reason" key={r.feature}>
            <div className="reason-text">
              <strong>{reasonText(r.reason, lang)}</strong>
              <span className="muted">{fmtValue(r.value, lang)}</span>
            </div>
            <div className="reason-bar" aria-label={`${r.direction} risk by ${Math.abs(r.impact).toFixed(2)}`}>
              <div className="axis-mid" />
              <div className={`reason-fill ${up ? "fraud" : "legit"}`}
                style={up ? { left: "50%", width: `${w}%` } : { right: "50%", width: `${w}%` }} />
            </div>
          </div>
        );
      })}
      <p className="chart-caption">{t("Bar length = contribution to the score (SHAP value).", "Largo de la barra = aporte al puntaje (valor SHAP).")}</p>
    </div>
  );
}
