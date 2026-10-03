export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" className="fill-primary" />
      <rect x="15" y="15" width="34" height="34" rx="6" className="fill-card" />
      <path d="M23 32.5l6.5 6.5L41.5 26" fill="none" className="stroke-success" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-2xl font-bold tracking-tight">
        List<span className="text-primary">ta</span>
      </span>
    </div>
  );
}
