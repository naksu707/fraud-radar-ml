export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="none" stroke="var(--line-strong)" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="9" fill="none" stroke="var(--line-strong)" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="4" fill="none" stroke="var(--line-strong)" strokeWidth="1.5" />
      <path d="M16 16 L28 9 A14 14 0 0 1 30 16 Z" fill="var(--fraud)" opacity="0.35" className="radar-sweep" />
      <line x1="16" y1="16" x2="28" y2="9" stroke="var(--fraud)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="22" cy="21" r="2.2" fill="var(--fraud)" />
      <circle cx="16" cy="16" r="1.6" fill="var(--ink)" />
    </svg>
  );
}
