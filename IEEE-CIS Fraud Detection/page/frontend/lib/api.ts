"use client";

import { useCallback, useEffect, useState } from "react";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
export const TOKEN_KEY = "fraud-radar-token";

// ---------- types (mirror the FastAPI schemas) ----------
export type Role = "ANALYST" | "ADMIN";

export type User = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  role: Role;
  active: number;
  created_at: string;
  last_login: string | null;
  predictions?: number;
  reviews?: number;
};

export type Session = { token: string; user: User };

export type Reason = {
  feature: string;
  reason: string;
  value: number | string | null;
  impact: number;
  direction: "raises" | "lowers";
};

export type RiskLevel = "low" | "medium" | "high";
export type Decision = "confirmed_fraud" | "legit" | "escalated";

export type Review = { transaction_id: number; decision: Decision; note: string | null; updated_at: string; reviewer: string };

export type ScoreResult = {
  risk_score: number;
  alert: boolean;
  risk_level: RiskLevel;
  threshold: number;
  filled_from_profile: number;
  prediction_id?: number | null;
  reasons: Reason[];
};

export type Transaction = {
  transaction_id: number;
  amount: number;
  product: string | null;
  card_network: string | null;
  card_type: string | null;
  email_domain: string | null;
  device_type: string | null;
  device_info: string | null;
  hour: number;
  day: number;
  is_fraud: number;
  risk_score: number;
  alert: boolean;
  risk_level: RiskLevel;
  reasons: Reason[];
  editable: boolean;
  review?: Review | null;
};

export type Page<T> = { total: number; items: T[] };

export type Breakdown = { label: string; transactions: number; alerts: number; fraud_rate: number; alert_rate: number };

export type Stats = {
  available: boolean;
  transactions: number;
  alerts: number;
  alert_rate: number;
  amount_total: number;
  amount_flagged: number;
  confirmed_fraud: number;
  fraud_caught: number;
  recall: number | null;
  precision: number | null;
  by_product: Breakdown[];
  by_card_type: Breakdown[];
  by_device: Breakdown[];
  by_hour: { hour: number; transactions: number; alerts: number }[];
  score_distribution: { band: string; transactions: number }[];
  reviews?: Partial<Record<Decision, number>>;
};

export type ModelInfo = {
  model: string;
  features: number;
  threshold: number;
  typical_profile_loaded: boolean;
  metrics: {
    validation?: Record<string, { "PR-AUC": number; "ROC-AUC": number }>;
    test?: {
      pr_auc: number;
      roc_auc: number;
      recall: number;
      precision: number;
      fraud_amount_caught: number;
      fraud_captured_top_5pct?: number;
      test_fraud_rate: number;
      alerts_per_1000?: number;
    };
  };
};

export type ScoreRequest = {
  base_transaction_id?: number;
  amount?: number;
  product_code?: string;
  card_network?: string;
  card_type?: string;
  purchaser_email_domain?: string;
  device_type?: string;
  hour?: number;
};

export type Prediction = {
  id: number;
  user_id: number;
  user_name: string;
  created_at: string;
  base_transaction_id: number | null;
  input: ScoreRequest;
  risk_score: number;
  alert: boolean;
  risk_level: RiskLevel;
  top_reason: string | null;
};

export type Activity = { id: number; action: string; detail: string | null; created_at: string; user_name: string | null; user_email: string | null };

// ---------- calls ----------
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const getToken = () => (typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY));

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(0, "Cannot reach the API. Is the backend running on port 8000?");
  }
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      detail = typeof body.detail === "string" ? body.detail : (body.detail?.[0]?.msg ?? JSON.stringify(body.detail));
    } catch {
      /* keep status text */
    }
    if (res.status === 401 && token) window.dispatchEvent(new Event("fraud-radar:unauthorized"));
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

const body = (data: unknown) => JSON.stringify(data);

export const api = {
  // public
  model: () => request<ModelInfo>("/model"),
  // auth
  login: (email: string, password: string) => request<Session>("/auth/login", { method: "POST", body: body({ email, password }) }),
  register: (data: { name: string; email: string; password: string; company?: string }) =>
    request<Session>("/auth/register", { method: "POST", body: body(data) }),
  me: () => request<User>("/auth/me"),
  updateMe: (data: { name: string; company?: string }) => request<User>("/auth/me", { method: "PATCH", body: body(data) }),
  changePassword: (current_password: string, new_password: string) =>
    request<{ ok: boolean }>("/auth/password", { method: "POST", body: body({ current_password, new_password }) }),
  // analyst
  stats: () => request<Stats>("/stats"),
  transactions: (limit = 50, offset = 0, onlyAlerts = false) =>
    request<Page<Transaction>>(`/transactions?limit=${limit}&offset=${offset}&only_alerts=${onlyAlerts}`),
  alerts: (limit = 50, offset = 0) => request<Page<Transaction>>(`/alerts?limit=${limit}&offset=${offset}`),
  transaction: (id: number) => request<Transaction>(`/transactions/${id}`),
  review: (id: number, decision: Decision, note?: string) =>
    request<Review>(`/transactions/${id}/review`, { method: "PUT", body: body({ decision, note }) }),
  score: (data: ScoreRequest) => request<ScoreResult>("/score", { method: "POST", body: body(data) }),
  predictions: (limit = 100) => request<Prediction[]>(`/predictions?limit=${limit}`),
  // admin
  users: () => request<User[]>("/admin/users"),
  updateUser: (id: number, data: { role?: Role; active?: boolean }) =>
    request<User>(`/admin/users/${id}`, { method: "PATCH", body: body(data) }),
  activity: (limit = 100) => request<Activity[]>(`/admin/activity?limit=${limit}`),
  allPredictions: (limit = 200) => request<Prediction[]>(`/admin/predictions?limit=${limit}`),
};

/** Small data-fetching hook: { data, error, loading, reload } */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(fetcher, deps);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    load()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(reload, [reload]);
  return { data, error, loading, reload, setData };
}
