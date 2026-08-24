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
    <header className="relative bg-gradient-to-b from-maroon-dark to-maroon-darker border-b-4 border-double border-gold">
      <div className="max-w-6xl mx-auto px-10 pt-6 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <svg width="42" height="42" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="16" stroke="#a9862f" strokeWidth="1.4" />
            <circle cx="20" cy="20" r="10" stroke="#a9862f" strokeWidth="1.4" opacity="0.7" />
            <circle cx="20" cy="20" r="3.5" fill="#9e1b2e" />
            <path d="M20 2 L20 7 M20 33 L20 38 M2 20 L7 20 M33 20 L38 20" stroke="#a9862f" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <div>
            <div className="font-deco text-[28px] text-parchment leading-none">The Multiverse Codex</div>
            <div className="text-[10.5px] text-gold tracking-widest mt-1" style={{ fontVariant: 'small-caps' }}>
              A Chronicle Beyond Worlds
            </div>
          </div>
        </div>
        <button
          onClick={onSignOut}
          title="Sign out"
          className="w-9 h-9 rounded-full border border-gold flex items-center justify-center text-[13px] text-parchment font-display hover:bg-gold/10"
        >
          DM
        </button>
      </div>
      <nav className="max-w-6xl mx-auto px-10 flex flex-wrap gap-0.5 border-t border-gold/25">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-5 py-2.5 font-display text-[12.5px] tracking-wide uppercase border-b-[3px] transition ${
              active === tab.id
                ? 'border-gold text-white opacity-100'
                : 'border-transparent text-parchment/70 opacity-70 hover:opacity-90'
            }`}
          >
            {tab.label}
            {tab.id === 'quarantine' && quarantineCount > 0 ? ` (${quarantineCount})` : ''}
          </button>
        ))}
        {PLACEHOLDER_TABS.map((label) => (
          <div key={label} className="px-5 py-2.5 font-display text-[12.5px] tracking-wide uppercase text-parchment/30 cursor-default">
            {label}
          </div>
        ))}
      </nav>
    </header>
  );
}
