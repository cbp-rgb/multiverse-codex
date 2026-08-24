function Corner({ className }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className={className} aria-hidden="true">
      <path d="M2 42 L2 13 Q2 2 13 2 L42 2" stroke="#a9862f" strokeWidth="1.3" opacity="0.55" />
      <path d="M2 27 Q2 2 27 2" stroke="#a9862f" strokeWidth="0.9" opacity="0.3" />
      <circle cx="2" cy="42" r="2" fill="#9e1b2e" opacity="0.55" />
    </svg>
  );
}

// Four matching corner brackets around whatever wraps this — the parent
// needs `relative` positioning. Purely decorative page-framing, the kind of
// detail a plain flat webpage never has but a real printed sourcebook page
// always does.
export default function CornerFlourish() {
  return (
    <>
      <Corner className="absolute -top-4 -left-4 pointer-events-none" />
      <Corner className="absolute -top-4 -right-4 pointer-events-none rotate-90" />
      <Corner className="absolute -bottom-4 -right-4 pointer-events-none rotate-180" />
      <Corner className="absolute -bottom-4 -left-4 pointer-events-none -rotate-90" />
    </>
  );
}
