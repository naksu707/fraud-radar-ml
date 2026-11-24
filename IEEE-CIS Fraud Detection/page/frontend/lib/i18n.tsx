"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "es";
const LANG_KEY = "fraud-radar-lang";

type LangValue = { lang: Lang; setLang: (l: Lang) => void; t: (en: string, es: string) => string };
const LangContext = createContext<LangValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_KEY);
      if (saved === "en" || saved === "es") setLangState(saved);
    } catch { /* storage unavailable */ }
  }, []);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { window.localStorage.setItem(LANG_KEY, l); } catch { /* storage unavailable */ }
  }, []);

  const value = useMemo<LangValue>(() => ({ lang, setLang, t: (en, es) => (lang === "es" ? es : en) }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}

/** EN / ES switch shown in the navigation bar. */
export function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-switch" role="group" aria-label="Language / Idioma">
      {(["en", "es"] as Lang[]).map((l) => (
        <button key={l} type="button" className={lang === l ? "on" : ""} aria-pressed={lang === l} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/* ---------- texts that come from the API ---------- */

const REASONS_ES: Record<string, string> = {
  "Transaction amount": "Monto de la transacción",
  "Unusual cents in amount": "Centavos inusuales en el monto",
  "Tiny amount (card testing)": "Monto muy pequeño (prueba de tarjeta)",
  "Amount vs. card's usual amount": "Monto vs. el habitual de la tarjeta",
  "Product type": "Tipo de producto",
  "Card network": "Red de la tarjeta",
  "Card type": "Tipo de tarjeta",
  "How common the card is": "Qué tan común es la tarjeta",
  "How common the address is": "Qué tan común es la dirección",
  "Purchaser email domain": "Dominio del correo del comprador",
  "How common the email domain is": "Qué tan común es el dominio del correo",
  "Recipient email domain": "Dominio del correo del destinatario",
  "Purchaser and recipient emails match": "Correos de comprador y destinatario coinciden",
  "Device type": "Tipo de dispositivo",
  "Device": "Dispositivo",
  "How common the device is": "Qué tan común es el dispositivo",
  "Identity data present": "Hay datos de identidad",
  "Hour of day": "Hora del día",
  "Day of week": "Día de la semana",
  "Distance between addresses": "Distancia entre direcciones",
};

const FAMILIES_ES: [string, string][] = [
  ["Vesta risk signal", "Señal de riesgo de Vesta"],
  ["Linked cards/addresses count", "Conteo de tarjetas/direcciones vinculadas"],
  ["Time since previous activity", "Tiempo desde la actividad anterior"],
  ["Match check", "Verificación de coincidencia"],
  ["Device/identity signal", "Señal de dispositivo/identidad"],
];

export function reasonText(reason: string | null | undefined, lang: Lang): string {
  if (!reason) return "—";
  if (lang === "en") return reason;
  if (REASONS_ES[reason]) return REASONS_ES[reason];
  for (const [en, es] of FAMILIES_ES) if (reason.startsWith(en)) return es + reason.slice(en.length);
  return reason;
}

const MESSAGES_ES: Record<string, string> = {
  "The password must have at least 8 characters.": "La contraseña debe tener al menos 8 caracteres.",
  "There is already an account with that email.": "Ya existe una cuenta con ese correo.",
  "Wrong email or password.": "Correo o contraseña incorrectos.",
  "This account has been deactivated. Contact an administrator.": "Esta cuenta fue desactivada. Contacta a un administrador.",
  "The current password is not correct.": "La contraseña actual no es correcta.",
  "The new password must have at least 8 characters.": "La nueva contraseña debe tener al menos 8 caracteres.",
  "User not found.": "Usuario no encontrado.",
  "You cannot remove your own admin access.": "No puedes quitarte tu propio acceso de administrador.",
  "Please log in.": "Inicia sesión.",
  "Your session expired. Please log in again.": "Tu sesión expiró. Inicia sesión de nuevo.",
  "This account is not active.": "Esta cuenta no está activa.",
  "Only administrators can do this.": "Solo los administradores pueden hacer esto.",
  "Send 'amount' (or a base_transaction_id).": "Ingresa un monto (o parte de una transacción real).",
  "Transaction not found in the demo data.": "Transacción no encontrada en los datos de demo.",
  "Cannot reach the API. Is the backend running on port 8000?": "No se puede conectar con la API. ¿El backend está corriendo en el puerto 8000?",
};

export function msgText(msg: string | null | undefined, lang: Lang): string {
  if (!msg) return "";
  if (lang === "en") return msg;
  return MESSAGES_ES[msg] ?? msg;
}
