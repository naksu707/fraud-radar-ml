"use client";

import { api, useApi } from "@/lib/api";
import { fmtPct } from "@/lib/format";
import { Card } from "@/components/ui";
import { useLang } from "@/lib/i18n";

export default function AboutPage() {
  const model = useApi(api.model);
  const { t, lang } = useLang();
  const es = lang === "es";
  const m = model.data?.metrics;
  const validation = m?.validation ? Object.entries(m.validation).filter(([k]) => !k.startsWith("Random")) : [];

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">{t("About the project", "Sobre el proyecto")}</span>
          <h1>{t("How Fraud Radar works", "Cómo funciona Fraud Radar")}</h1>
          <p>{t("An end-to-end machine learning project: data analysis, a leakage-safe model, an API and a platform for fraud analysts.", "Un proyecto de machine learning de principio a fin: análisis de datos, un modelo sin fuga de información, una API y una plataforma para analistas de fraude.")}</p>
        </div>
      </div>

      <div className="grid grid-2">
        <Card title={t("Data", "Datos")}>
          {es ? (
            <>
              <p className="body-text">
                <b>IEEE-CIS Fraud Detection</b>: transacciones reales y anonimizadas de comercio electrónico que Vesta Corporation
                publicó para una competencia de Kaggle. 590.540 transacciones, 20.663 de ellas fraudulentas (3,5%), unidas a partir
                de una tabla de transacciones y una de identidad/dispositivo.
              </p>
              <p className="body-text">
                Los datos se dividen <b>por tiempo</b>: el primer 70% entrena el modelo, el siguiente 15% sirve para comparar modelos y
                elegir el umbral de alerta, y el último 15% se guarda para la evaluación final. El dashboard solo muestra
                transacciones de ese último periodo.
              </p>
            </>
          ) : (
            <>
              <p className="body-text">
                <b>IEEE-CIS Fraud Detection</b>: real, anonymized e-commerce transactions provided by Vesta Corporation for a
                Kaggle competition. 590,540 transactions, 20,663 of them fraudulent (3.5%), joined from a transaction table and
                an identity/device table.
              </p>
              <p className="body-text">
                The data is split <b>by time</b>: the first 70% trains the model, the next 15% is used to compare models and
                pick the alert threshold, and the last 15% is kept for the final evaluation. The dashboard only shows
                transactions from that last period.
              </p>
            </>
          )}
        </Card>

        <Card title={t("Model", "Modelo")}>
          {es ? (
            <p className="body-text">
              <b>XGBoost</b> con {model.data?.features ?? 432} variables, comparado con Regresión Logística y Random Forest.
              No se usa accuracy porque el 96,5% de las transacciones son legítimas: el modelo se evalúa con <b>PR-AUC</b>,
              recall y precisión.
            </p>
          ) : (
            <p className="body-text">
              <b>XGBoost</b> with {model.data?.features ?? 432} features, compared against Logistic Regression and Random Forest.
              Accuracy is not used because 96.5% of transactions are legitimate: the model is judged with <b>PR-AUC</b>,
              recall and precision.
            </p>
          )}
          {validation.length > 0 && (
            <table className="mini-table">
              <thead><tr><th>{t("Model (validation)", "Modelo (validación)")}</th><th className="num">PR-AUC</th><th className="num">ROC-AUC</th></tr></thead>
              <tbody>
                {validation.sort((a, b) => b[1]["PR-AUC"] - a[1]["PR-AUC"]).map(([name, v]) => (
                  <tr key={name}><td>{name}</td><td className="num">{v["PR-AUC"].toFixed(3)}</td><td className="num">{v["ROC-AUC"].toFixed(3)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title={t("Alert threshold", "Umbral de alerta")}>
          <p className="body-text">
            {es
              ? `El modelo entrega un puntaje de riesgo, no una probabilidad calibrada. El umbral de alerta (${model.data?.threshold ?? "—"} / 100) se eligió para minimizar el costo total en el periodo de validación, suponiendo que un fraude no detectado cuesta su monto completo y cada falsa alarma cuesta $10 en revisión.`
              : `The model returns a risk score, not a calibrated probability. The alert threshold (${model.data?.threshold ?? "—"} / 100) was chosen to minimize total cost on the validation period, assuming a missed fraud costs its full amount and each false alarm costs $10 to review.`}
          </p>
          {m?.test && (
            <div className="model-metrics light">
              <div><span>{t("Fraud caught", "Fraude detectado")}</span><b>{fmtPct(m.test.recall)}</b></div>
              <div><span>{t("Alerts that are fraud", "Alertas que son fraude")}</span><b>{fmtPct(m.test.precision)}</b></div>
            </div>
          )}
        </Card>

        <Card title={t("Avoiding data leakage", "Cómo se evita la fuga de datos")}>
          <ul className="body-list">
            <li>{t("Time-based split instead of a random one, so the model never sees the future.", "División por tiempo en vez de aleatoria, para que el modelo nunca vea el futuro.")}</li>
            <li>{t("Frequencies and averages are learned on the training period only.", "Las frecuencias y promedios se aprenden solo con el periodo de entrenamiento.")}</li>
            <li>{t("The raw card ID is removed so the model learns patterns instead of memorizing cards.", "Se elimina el ID de la tarjeta para que el modelo aprenda patrones en vez de memorizar tarjetas.")}</li>
            <li>{t("Results are also checked on cards never seen during training.", "Los resultados también se revisan con tarjetas que nunca vio en el entrenamiento.")}</li>
          </ul>
        </Card>

        <Card title={t("Limitations", "Limitaciones")}>
          <ul className="body-list">
            <li>{t("Most features are anonymized by Vesta, so some reasons can only be described by family (for example \"Vesta risk signal\").", "Vesta anonimizó la mayoría de las variables, así que algunas razones solo se pueden describir por familia (por ejemplo \"Señal de riesgo de Vesta\").")}</li>
            <li>{t("The hour of day is relative to an undisclosed reference time.", "La hora del día es relativa a un punto de referencia que no se publicó.")}</li>
            <li>{t("Fraud patterns change over time; a production model would need monitoring and retraining.", "Los patrones de fraude cambian con el tiempo; un modelo en producción necesitaría monitoreo y reentrenamiento.")}</li>
          </ul>
        </Card>

        <Card title={t("Stack", "Tecnologías")}>
          <ul className="body-list">
            <li><b>{t("Model", "Modelo")}:</b> Python, pandas, scikit-learn, XGBoost, SHAP</li>
            <li><b>API:</b> FastAPI, SQLite, {t("token-based sessions with hashed passwords", "sesiones con tokens y contraseñas cifradas")}</li>
            <li><b>{t("Platform", "Plataforma")}:</b> Next.js, React, TypeScript</li>
            <li><b>{t("Deployment", "Despliegue")}:</b> Docker Compose</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
