"use client";

import { useLang } from "@/lib/i18n";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="footer">
      <span>{t("Fraud Radar · XGBoost model trained on the IEEE-CIS Fraud Detection dataset (Vesta Corporation)", "Fraud Radar · Modelo XGBoost entrenado con el dataset IEEE-CIS Fraud Detection (Vesta Corporation)")}</span>
      <span>{t("Educational project by María José Ospina Samboni", "Proyecto educativo de María José Ospina Samboni")}</span>
    </footer>
  );
}
