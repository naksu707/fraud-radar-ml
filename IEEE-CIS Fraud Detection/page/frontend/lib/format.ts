export const fmtInt = (n: number) => n.toLocaleString("en-US");

export const fmtPct = (n: number | null | undefined, digits = 1) =>
  n == null ? "—" : `${(n * 100).toFixed(digits)}%`;

export const fmtMoney = (n: number, digits = 2) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtCompactMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });

export const fmtScore = (n: number) => (n >= 10 ? n.toFixed(0) : n.toFixed(1));

export const fmtValue = (v: number | string | null, lang: "en" | "es" = "en") => {
  if (v == null) return lang === "es" ? "vacío" : "empty";
  if (typeof v === "number") return Number.isInteger(v) ? fmtInt(v) : v.toLocaleString("en-US", { maximumFractionDigits: 3 });
  if (v === "missing") return lang === "es" ? "sin dato" : "missing";
  return v;
};

export const orDash = (v: string | null | undefined) => (v == null || v === "" ? "—" : v);

export const DECISION_LABEL = { confirmed_fraud: "Confirmed fraud", legit: "Legitimate", escalated: "Escalated" } as const;
export const DECISION_LABEL_ES = { confirmed_fraud: "Fraude confirmado", legit: "Legítima", escalated: "Escalada" } as const;
export const decisionLabel = (d: keyof typeof DECISION_LABEL, lang: "en" | "es") => (lang === "es" ? DECISION_LABEL_ES : DECISION_LABEL)[d];

export const fmtDate = (iso: string | null | undefined, lang: "en" | "es" = "en") => {
  if (!iso) return "—";
  const d = new Date(iso.replace(" ", "T") + (iso.endsWith("Z") ? "" : "Z"));
  return d.toLocaleString(lang === "es" ? "es-CO" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};
