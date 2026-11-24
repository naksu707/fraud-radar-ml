/** Marble bank building with chrome coins — used for empty states. */
export function BankIllustration({ size = 150 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 150 120" aria-hidden="true">
      <defs>
        <linearGradient id="bk-marble" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#c9c4ea" />
        </linearGradient>
        <radialGradient id="bk-coin" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#b9bed0" />
          <stop offset="100%" stopColor="#737a96" />
        </radialGradient>
      </defs>
      <ellipse cx="75" cy="110" rx="62" ry="8" fill="#b9b2ec" opacity="0.5" />
      <polygon points="20,40 75,12 130,40" fill="url(#bk-marble)" stroke="#d8d3f0" />
      <rect x="24" y="40" width="102" height="7" fill="#ece9fa" />
      {[32, 52, 72, 92, 112].map((x) => <rect key={x} x={x} y="49" width="8" height="44" rx="1.5" fill="url(#bk-marble)" stroke="#dcd7f2" />)}
      <rect x="18" y="93" width="114" height="8" fill="#e3dff6" />
      <rect x="12" y="101" width="126" height="7" fill="#d4cff0" />
      <circle cx="18" cy="96" r="12" fill="url(#bk-coin)" />
      <circle cx="134" cy="92" r="9" fill="url(#bk-coin)" />
    </svg>
  );
}
