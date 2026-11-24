"use client";

import Link from "next/link";
import { Hero } from "@/components/Hero";
import { BankIllustration } from "@/components/Bank";
import { api, useApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmtPct } from "@/lib/format";
import { useLang } from "@/lib/i18n";

const FEATURES = {
  en: [
    { title: "Risk score for every payment", text: "An XGBoost model gives each transaction a 0–100 risk score in milliseconds." },
    { title: "Alerts with reasons", text: "Every alert shows what pushed its score up or down, using SHAP explanations." },
    { title: "What-if analysis", text: "Open a real alert, change the amount, email or device, and see how the risk moves." },
    { title: "Review workflow", text: "Analysts confirm fraud, mark alerts as legitimate or escalate them. Admins manage the team." },
  ],
  es: [
    { title: "Puntaje de riesgo para cada pago", text: "Un modelo XGBoost le da a cada transacción un puntaje de riesgo de 0 a 100 en milisegundos." },
    { title: "Alertas con razones", text: "Cada alerta muestra qué subió o bajó su puntaje, usando explicaciones SHAP." },
    { title: "Análisis de escenarios", text: "Abre una alerta real, cambia el monto, el correo o el dispositivo y mira cómo se mueve el riesgo." },
    { title: "Flujo de revisión", text: "Los analistas confirman fraudes, marcan alertas como legítimas o las escalan. Los administradores gestionan el equipo." },
  ],
};

const STEPS = {
  en: [
    { n: "01", title: "Score", text: "Transactions are scored with the same feature pipeline used in training." },
    { n: "02", title: "Alert", text: "Scores above a cost-based threshold go to the alert queue, riskiest first." },
    { n: "03", title: "Explain", text: "Each alert lists its main risk signals so analysts know where to look." },
    { n: "04", title: "Decide", text: "Analysts record a decision, and every prediction is saved to their history." },
  ],
  es: [
    { n: "01", title: "Evaluar", text: "Las transacciones se evalúan con el mismo pipeline de variables usado en el entrenamiento." },
    { n: "02", title: "Alertar", text: "Los puntajes sobre un umbral basado en costos van a la cola de alertas, las más riesgosas primero." },
    { n: "03", title: "Explicar", text: "Cada alerta muestra sus principales señales de riesgo para saber dónde mirar." },
    { n: "04", title: "Decidir", text: "Los analistas registran una decisión y cada predicción queda guardada en su historial." },
  ],
};

export default function HomePage() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const model = useApi(api.model);
  const test = model.data?.metrics.test;

  return (
    <>
      <Hero
        title={t("Where fraud gets caught", "Donde el fraude queda al descubierto")}
        text={t("A fraud detection platform for e-commerce payments: risk scores, an alert queue and clear reasons for every decision.", "Una plataforma de detección de fraude para pagos en línea: puntajes de riesgo, una cola de alertas y razones claras para cada decisión.")}
        cta={user ? { href: "/dashboard", label: t("Go to the dashboard", "Ir al dashboard") } : { href: "/register", label: t("Get started", "Empezar") }}
        secondary={user ? undefined : { href: "/login", label: t("Log in", "Iniciar sesión") }}
      />

      <section className="split">
        <div>
          <span className="eyebrow">{t("What is Fraud Radar?", "¿Qué es Fraud Radar?")}</span>
          <h2 className="display">{t("Fraud detection trained on real payments", "Detección de fraude entrenada con pagos reales")}</h2>
        </div>
        <p className="lead">
          {t("Fraud Radar is built on 590,540 real e-commerce transactions from Vesta Corporation (IEEE-CIS dataset). It helps a fraud team decide which payments to review first, and why.",
            "Fraud Radar está construido con 590.540 transacciones reales de comercio electrónico de Vesta Corporation (dataset IEEE-CIS). Ayuda a un equipo de fraude a decidir qué pagos revisar primero y por qué.")}
        </p>
      </section>

      <section className="feature-grid">
        <div className="feature dark big">
          <span className="eyebrow light">{t("Model performance (unseen period)", "Desempeño del modelo (periodo no visto)")}</span>
          <div className="stat-row">
            <div><b>{test ? fmtPct(test.recall, 0) : "—"}</b><span>{t("of fraud caught", "del fraude detectado")}</span></div>
            <div><b>{test?.fraud_captured_top_5pct != null ? fmtPct(test.fraud_captured_top_5pct, 0) : "—"}</b><span>{t("of fraud in the top 5% riskiest", "del fraude en el 5% más riesgoso")}</span></div>
            <div><b>{test ? test.pr_auc.toFixed(2) : "—"}</b><span>PR-AUC ({t("random", "aleatorio")} ≈ {test ? test.test_fraud_rate.toFixed(3) : "0.035"})</span></div>
          </div>
        </div>
        {FEATURES[lang].map((f) => (
          <div className="feature" key={f.title}>
            <h3 className="feature-title">{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </section>

      <section className="steps-wrap">
        <div>
          <span className="eyebrow">{t("How it works", "Cómo funciona")}</span>
          <h2 className="display">{t("From payment to decision", "Del pago a la decisión")}</h2>
        </div>
        <div className="steps">
          {STEPS[lang].map((s) => (
            <div className="step" key={s.n}>
              <span className="step-n">{s.n}</span>
              <h3 className="feature-title">{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-card">
        <div>
          <h2 className="display">{t("Built for fraud teams", "Hecho para equipos de fraude")}</h2>
          <p className="lead">{t("Analysts score and review transactions. Administrators manage users and follow the team's activity.", "Los analistas evalúan y revisan transacciones. Los administradores gestionan usuarios y siguen la actividad del equipo.")}</p>
          <div className="hero-actions" style={{ justifyContent: "flex-start" }}>
            {user ? <Link href="/dashboard" className="btn btn-primary">{t("Open the dashboard", "Abrir el dashboard")}</Link> : (
              <>
                <Link href="/register" className="btn btn-primary">{t("Create an analyst account", "Crear cuenta de analista")}</Link>
                <Link href="/about" className="btn btn-ghost">{t("About the project", "Sobre el proyecto")}</Link>
              </>
            )}
          </div>
        </div>
        <BankIllustration size={220} />
      </section>
    </>
  );
}
