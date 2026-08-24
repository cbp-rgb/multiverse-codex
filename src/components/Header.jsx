const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'search', label: 'Search' },
  { id: 'quarantine', label: 'Quarantine' },
  { id: 'codex', label: 'Codex' },
  { id: 'npc', label: 'NPCs' },
  { id: 'item', label: 'Items' },
  { id: 'spell', label: 'Spells' },
  { id: 'location', label: 'Locations' },
  { id: 'faction', label: 'Factions' },
  { id: 'mechanic', label: 'Mechanics' },
  { id: 'lore', label: 'Lore' },
  { id: 'session', label: 'Sessions' },
  { id: 'table', label: 'Tables' },
];

const PLACEHOLDER_TABS = [];

export default function Header({ active, onChange, quarantineCount, onSignOut }) {
  return (
    <header className="ornate-texture relative bg-gradient-to-b from-maroon-dark to-maroon-darker border-b-4 border-double border-gold shadow-[0_6px_18px_-6px_rgba(58,9,16,0.5)]">
      <div className="max-w-6xl mx-auto px-10 pt-6 pb-3 flex items-center justify-between relative">
        <div className="flex items-center gap-4">
          <svg width="46" height="46" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="17" stroke="#a9862f" strokeWidth="1" opacity="0.5" />
            <circle cx="20" cy="20" r="16" stroke="#a9862f" strokeWidth="1.4" />
            <circle cx="20" cy="20" r="10" stroke="#a9862f" strokeWidth="1.4" opacity="0.7" />
            <circle cx="20" cy="20" r="3.5" fill="#9e1b2e" />
            <path d="M20 2 L20 7 M20 33 L20 38 M2 20 L7 20 M33 20 L38 20" stroke="#a9862f" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M20 9 L20 14 M20 26 L20 31 M9 20 L14 20 M26 20 L31 20" stroke="#a9862f" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
          </svg>
          <div>
            <div className="font-deco text-[28px] text-parchment leading-none" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.35)' }}>
              The Multiverse Codex
            </div>
            <div className="text-[10.5px] text-gold tracking-widest mt-1" style={{ fontVariant: 'small-caps' }}>
              A Chronicle Beyond Worlds
            </div>
          </div>
        </div>
        <button
          onClick={onSignOut}
          title="Sign out"
          className="w-9 h-9 rounded-full border border-gold flex items-center justify-center text-[13px] text-parchment font-display hover:bg-gold/10 shadow-[0_0_0_1px_rgba(169,134,47,0.25)]"
        >
          DM
        </button>
      </div>
      <nav className="max-w-6xl mx-auto px-10 flex flex-wrap gap-0.5 border-t border-gold/25 relative">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative px-5 pt-2.5 pb-3.5 font-display text-[12.5px] tracking-wide uppercase transition ${
                isActive ? 'text-white opacity-100' : 'text-parchment/70 opacity-70 hover:opacity-95'
              }`}
            >
              {tab.label}
              {tab.id === 'quarantine' && quarantineCount > 0 ? ` (${quarantineCount})` : ''}
              <span
                className={`absolute left-1/2 -translate-x-1/2 bottom-1 w-1.5 h-1.5 rotate-45 transition-all ${
                  isActive ? 'bg-gold opacity-100' : 'bg-gold opacity-0'
                }`}
              />
            </button>
          );
        })}
        {PLACEHOLDER_TABS.map((label) => (
          <div key={label} className="px-5 py-2.5 font-display text-[12.5px] tracking-wide uppercase text-parchment/30 cursor-default">
            {label}
          </div>
        ))}
      </nav>
    </header>
  );
}
