"use client";

import Link from "next/link";
import { Butterfly } from "./Butterflies";

/** Lavender field + chrome coins + a small bank building, drawn in SVG. */
function Scene() {
  // deterministic pseudo-random so server and client render the same
  let seed = 11;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

  const colors = ["#7d6fc9", "#6a5bb8", "#9286d8", "#5a4ba3", "#a59be3", "#8a7ed4"];
  const bushes = Array.from({ length: 190 }, (_, i) => {
    const layer = i % 4;
    const x = rnd() * 1280 - 20;
    const y = 352 + layer * 16 + rnd() * 14;
    const r = 12 + rnd() * 16;
    return { x, y, r, c: colors[Math.floor(rnd() * colors.length)], o: 0.7 + layer * 0.08 };
  });
  const stalks = Array.from({ length: 60 }, () => {
    const x = rnd() * 1240;
    const h = 24 + rnd() * 46;
    return { x, h, y: 352 + rnd() * 20 };
  });

  return (
    <svg className="hero-scene" viewBox="0 0 1240 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <radialGradient id="coin" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#dfe3ee" />
          <stop offset="70%" stopColor="#9aa1b8" />
          <stop offset="100%" stopColor="#6b7290" />
        </radialGradient>
        <linearGradient id="coinEdge" x1="0" x2="1">
          <stop offset="0%" stopColor="#7d84a0" />
          <stop offset="50%" stopColor="#d9dceb" />
          <stop offset="100%" stopColor="#6b7290" />
        </linearGradient>
        <linearGradient id="marble" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#c9c6e6" />
        </linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
      </defs>

      {/* chrome coins resting on the field */}
      <g>
        <ellipse cx="250" cy="322" rx="62" ry="62" fill="url(#coinEdge)" transform="rotate(-18 250 322)" />
        <ellipse cx="242" cy="318" rx="58" ry="58" fill="url(#coin)" transform="rotate(-18 242 318)" />
        <circle cx="242" cy="318" r="40" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2" />
        <text x="242" y="331" textAnchor="middle" fontSize="38" fontWeight="600" fill="#7a809c" fontFamily="system-ui">$</text>

        <ellipse cx="985" cy="314" rx="70" ry="70" fill="url(#coinEdge)" transform="rotate(14 985 314)" />
        <ellipse cx="993" cy="310" rx="66" ry="66" fill="url(#coin)" transform="rotate(14 993 310)" />
        <circle cx="993" cy="310" r="46" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2" />
        <text x="993" y="324" textAnchor="middle" fontSize="42" fontWeight="600" fill="#7a809c" fontFamily="system-ui">$</text>
      </g>

      {/* flower stalks */}
      {stalks.map((s, i) => (
        <g key={`s${i}`}>
          <line x1={s.x} y1={s.y} x2={s.x + 4} y2={s.y - s.h} stroke="#5d6b4f" strokeWidth="2" opacity="0.6" />
          {Array.from({ length: 6 }, (_, k) => (
            <circle key={k} cx={s.x + 4 * (k / 6)} cy={s.y - s.h + k * 7} r={3.6 - k * 0.35} fill={k % 2 ? "#8b7fd9" : "#b3a9ee"} />
          ))}
        </g>
      ))}

      {/* lavender bushes */}
      <g filter="url(#soft)">
        {bushes.map((b, i) => <circle key={`b${i}`} cx={b.x} cy={b.y} r={b.r} fill={b.c} opacity={b.o} />)}
      </g>
      {bushes.filter((_, i) => i % 2 === 0).map((b, i) => (
        <circle key={`h${i}`} cx={b.x - b.r * 0.3} cy={b.y - b.r * 0.45} r={b.r * 0.35} fill="#c8c0f5" opacity="0.45" />
      ))}
      <rect x="0" y="404" width="1240" height="20" fill="#5a4ba3" opacity="0.9" />
    </svg>
  );
}

export function Hero({ title, text, cta, secondary }: {
  title: string; text: string; cta?: { href: string; label: string }; secondary?: { href: string; label: string };
}) {
  return (
    <section className="hero">
      <Scene />
      <Butterfly left="16%" top="30%" scale={1.3} delay={3} />
      <Butterfly left="78%" top="22%" scale={1.1} delay={8} />
      <Butterfly left="64%" top="50%" scale={0.9} delay={12} />
      <div className="hero-copy">
        <div className="hero-plus">+</div>
        <h1>{title}</h1>
        <p>{text}</p>
        <div className="hero-actions">
          {cta && <Link href={cta.href} className="btn btn-primary">{cta.label}</Link>}
          {secondary && <Link href={secondary.href} className="btn btn-ghost">{secondary.label}</Link>}
        </div>
      </div>
    </section>
  );
}
