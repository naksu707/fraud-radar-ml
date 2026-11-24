"use client";

import { usePathname } from "next/navigation";

/** Pixel butterflies (storytelling style) recoloured for the light lavender theme. */

const WING = (
  <svg viewBox="0 0 34 30" shapeRendering="crispEdges" aria-hidden="true">
    <g className="wing">
      {/* outline */}
      <rect x="3" y="3" width="12" height="12" fill="#3d3580" />
      <rect x="1" y="5" width="4" height="8" fill="#3d3580" />
      <rect x="19" y="3" width="12" height="12" fill="#3d3580" />
      <rect x="29" y="5" width="4" height="8" fill="#3d3580" />
      <rect x="5" y="15" width="10" height="10" fill="#3d3580" />
      <rect x="19" y="15" width="10" height="10" fill="#3d3580" />
      {/* upper wings */}
      <rect x="4" y="4" width="10" height="10" fill="#7d95ee" />
      <rect x="2" y="6" width="4" height="6" fill="#5a78e0" />
      <rect x="20" y="4" width="10" height="10" fill="#7d95ee" />
      <rect x="28" y="6" width="4" height="6" fill="#5a78e0" />
      {/* lower wings */}
      <rect x="6" y="16" width="8" height="8" fill="#b7a3ee" />
      <rect x="20" y="16" width="8" height="8" fill="#b7a3ee" />
      {/* shine */}
      <rect x="8" y="6" width="4" height="4" fill="#ffffff" />
      <rect x="22" y="6" width="4" height="4" fill="#ffffff" />
      <rect x="8" y="18" width="2" height="2" fill="#efe9ff" />
      <rect x="24" y="18" width="2" height="2" fill="#efe9ff" />
    </g>
    {/* body */}
    <rect x="15" y="5" width="4" height="20" fill="#2a2457" />
    <rect x="14" y="2" width="2" height="3" fill="#2a2457" />
    <rect x="18" y="2" width="2" height="3" fill="#2a2457" />
  </svg>
);

type Spot = { left: string; top: string; scale?: number; delay?: number; duration?: number };

export function Butterfly({ left, top, scale = 1, delay = 0, duration = 16 }: Spot) {
  return (
    <div
      className="butterfly"
      style={{ left, top, width: 34 * scale, height: 30 * scale, animationDelay: `${-delay}s`, animationDuration: `${duration}s` }}
    >
      {WING}
    </div>
  );
}

const ALL: Spot[] = [
  { left: "2.5%", top: "22%", scale: 1.2, delay: 2, duration: 15 },
  { left: "94%", top: "30%", scale: 1, delay: 7, duration: 18 },
  { left: "4%", top: "68%", scale: 0.9, delay: 11, duration: 17 },
  { left: "91%", top: "74%", scale: 1.2, delay: 4, duration: 16 },
];

const FEW: Spot[] = [
  { left: "6%", top: "26%", scale: 1.1, delay: 3, duration: 17 },
  { left: "90%", top: "66%", scale: 1, delay: 9, duration: 19 },
];

/** Fixed layer behind the content. Login/register pages get only two. */
export function ButterflyLayer() {
  const path = usePathname() || "/";
  const spots = path.startsWith("/login") || path.startsWith("/register") ? FEW : ALL;
  return (
    <div className="butterflies" aria-hidden="true">
      {spots.map((s, i) => <Butterfly key={`${path}-${i}`} {...s} />)}
    </div>
  );
}
