"use client";

import { useState } from "react";

type Datum = { label: string; value: number; note?: string };

/** Vertical columns with a hover tooltip. One series. */
export function ColumnChart({ data, format, color = "var(--fraud)", height = 200, xLabel }: {
  data: Datum[]; format: (v: number) => string; color?: string; height?: number; xLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 0) || 1;
  const W = 640, H = height, top = 18, bottom = 26;
  const band = W / data.length;
  const bw = Math.max(Math.min(band * 0.68, 46), 3);
  const y = (v: number) => top + (1 - v / max) * (H - top - bottom);
  const ticks = [0, 0.5, 1].map((t) => t * max);

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={xLabel ?? "Column chart"}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={0} x2={W} y1={y(t)} y2={y(t)} className="grid" />
            <text x={0} y={y(t) - 4} className="axis">{format(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = band * i + (band - bw) / 2;
          const h = Math.max(y(0) - y(d.value), d.value > 0 ? 2 : 0);
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={band * i} y={top} width={band} height={H - top - bottom} fill="transparent" />
              <rect x={x} y={y(0) - h} width={bw} height={h} rx={3} fill={color}
                opacity={hover == null || hover === i ? 1 : 0.45} />
              {(data.length <= 12 || i % 3 === 0) && (
                <text x={band * i + band / 2} y={H - 8} className="axis" textAnchor="middle">{d.label}</text>
              )}
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <div className="tooltip" style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}>
          <strong>{data[hover].label}</strong>
          <span>{format(data[hover].value)}</span>
          {data[hover].note && <em>{data[hover].note}</em>}
        </div>
      )}
      {xLabel && <p className="chart-caption">{xLabel}</p>}
    </div>
  );
}

/** Horizontal bars, sorted as given, with direct value labels and an optional reference line. */
export function BarList({ data, format, color = "var(--fraud)", reference, referenceLabel }: {
  data: Datum[]; format: (v: number) => string; color?: string; reference?: number; referenceLabel?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), reference ?? 0) || 1;
  return (
    <div className="barlist">
      {data.map((d) => (
        <div className="barlist-row" key={d.label} title={d.note}>
          <span className="barlist-label">{d.label}</span>
          <div className="barlist-track">
            <div className="barlist-fill" style={{ width: `${(d.value / max) * 100}%`, background: color }} />
            {reference != null && <div className="barlist-ref" style={{ left: `${(reference / max) * 100}%` }} />}
          </div>
          <span className="barlist-value">{format(d.value)}</span>
        </div>
      ))}
      {reference != null && referenceLabel && (
        <p className="chart-caption"><span className="ref-key" /> {referenceLabel}</p>
      )}
    </div>
  );
}

/** Semicircle gauge for a 0–100 risk score with the alert threshold marked. */
export function ScoreGauge({ score, threshold, alert, label = "risk score / 100" }: { score: number; threshold: number; alert: boolean; label?: string }) {
  const r = 80, cx = 100, cy = 96;
  const angle = (v: number) => Math.PI * (1 - Math.min(Math.max(v, 0), 100) / 100);
  const point = (v: number, rad = r) => [cx + rad * Math.cos(angle(v)), cy - rad * Math.sin(angle(v))];
  const [sx, sy] = point(score);
  const [t1x, t1y] = point(threshold, r - 14);
  const [t2x, t2y] = point(threshold, r + 14);
  const large = 0;
  return (
    <svg viewBox="0 0 200 118" className="gauge" role="img" aria-label={`Risk score ${score.toFixed(1)} of 100`}>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} className="gauge-track" />
      {score > 0 && (
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${large} 1 ${sx} ${sy}`}
          className={alert ? "gauge-fill fraud" : "gauge-fill legit"} />
      )}
      <line x1={t1x} y1={t1y} x2={t2x} y2={t2y} className="gauge-threshold" />
      <text x={cx} y={cy - 18} textAnchor="middle" className="gauge-value">{score >= 10 ? score.toFixed(0) : score.toFixed(1)}</text>
      <text x={cx} y={cy} textAnchor="middle" className="gauge-label">{label}</text>
    </svg>
  );
}
