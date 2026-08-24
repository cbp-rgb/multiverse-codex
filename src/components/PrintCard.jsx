// A player-facing summary card sized for a 4x6" label printer — deliberately
// monochrome (thermal printers can't do color/gradients) and stripped of
// anything DM-only (secrets, design notes, ongoing DM notes, GM tools).
// Rendered off-screen at all times; only visible via the print stylesheet.

const cardStyle = {
  fontFamily: "'EB Garamond', Garamond, serif",
  color: '#000',
  padding: '0.15in',
  boxSizing: 'border-box',
  height: '100%',
};
const nameStyle = { fontFamily: "'Cinzel', Georgia, serif", fontWeight: 700, fontSize: '20pt', textAlign: 'center', marginBottom: '2pt' };
const subtitleStyle = { fontStyle: 'italic', textAlign: 'center', fontSize: '10pt', marginBottom: '6pt' };
const ruleStyle = { border: 0, borderTop: '1.5pt solid #000', margin: '4pt 0' };
const labelStyle = { fontFamily: "'Cinzel', Georgia, serif", fontWeight: 700, fontSize: '9pt', textTransform: 'uppercase', letterSpacing: '0.05em' };
const bodyTextStyle = { fontSize: '10.5pt', lineHeight: 1.35 };

function Line({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ ...bodyTextStyle, marginBottom: '2pt' }}>
      <span style={labelStyle}>{label} </span>
      {value}
    </div>
  );
}

function Prose({ children }) {
  if (!children) return null;
  return <div style={{ ...bodyTextStyle, marginBottom: '5pt', whiteSpace: 'pre-wrap' }}>{children}</div>;
}

function ItemCard({ entry }) {
  const item = entry.item || {};
  const m = item.mechanics || {};
  const lore = item.lore || {};
  return (
    <div style={cardStyle}>
      <div style={nameStyle}>{entry.title || 'Untitled Item'}</div>
      <div style={subtitleStyle}>
        {[item.rarity, item.item_category].filter(Boolean).join(' ')}
        {item.attunement ? ' (requires attunement)' : ''}
      </div>
      <hr style={ruleStyle} />
      <Line label="Weight" value={item.weight} />
      <Line label="Value" value={item.value} />
      {m.properties?.length ? <Line label="Properties" value={m.properties.join(', ')} /> : null}
      {m.weapon_stats?.damage ? (
        <Line label="Damage" value={`${m.weapon_stats.damage} ${m.weapon_stats.damage_type}${m.weapon_stats.bonus ? `, ${m.weapon_stats.bonus}` : ''}`} />
      ) : null}
      {m.armor_stats?.ac_bonus ? <Line label="AC Bonus" value={`+${m.armor_stats.ac_bonus}`} /> : null}
      {m.charges?.max ? <Line label="Charges" value={`${m.charges.max}, recharges ${m.charges.recharge_formula || '?'} ${m.charges.recharge_timing || ''}`} /> : null}
      {(m.effects?.length || m.charges?.abilities?.length) && <hr style={ruleStyle} />}
      {m.effects?.map((e, i) => (
        <Prose key={i}>
          <b>{e.name}.</b> {e.desc}
        </Prose>
      ))}
      {m.charges?.abilities?.map((a, i) => (
        <Prose key={i}>
          <b>{a.name}.</b> {a.desc}
        </Prose>
      ))}
      {lore.description && <hr style={ruleStyle} />}
      <Prose>{lore.description}</Prose>
    </div>
  );
}

function SpellCard({ entry }) {
  const d = entry.details || {};
  return (
    <div style={cardStyle}>
      <div style={nameStyle}>{entry.title || 'Untitled Spell'}</div>
      <div style={subtitleStyle}>
        {d.level === '0' || d.level === 0 ? 'Cantrip' : d.level ? `Level ${d.level}` : ''}
        {d.school ? ` ${d.school}` : ''}
      </div>
      <hr style={ruleStyle} />
      <Line label="Casting Time" value={d.casting_time} />
      <Line label="Range" value={d.range} />
      <Line label="Components" value={d.components} />
      <Line label="Duration" value={d.duration} />
      {d.classes?.length ? <Line label="Classes" value={d.classes.join(', ')} /> : null}
      <hr style={ruleStyle} />
      <Prose>{d.description}</Prose>
      {d.at_higher_levels && (
        <>
          <div style={labelStyle}>At Higher Levels</div>
          <Prose>{d.at_higher_levels}</Prose>
        </>
      )}
    </div>
  );
}

function GenericCard({ entry }) {
  const d = entry.details || {};
  // A conservative, public-facing subset — skip anything secret/DM-only.
  const publicFields = {
    npc: ['role', 'occupation', 'appearance', 'personality'],
    location: ['location_type', 'region', 'overview', 'appearance_and_atmosphere'],
    faction: ['faction_type', 'overview', 'goals'],
    mechanic: ['mechanic_type', 'summary', 'full_rules_text'],
  }[entry.category] || [];

  return (
    <div style={cardStyle}>
      <div style={nameStyle}>{entry.title || 'Untitled'}</div>
      {entry.source_franchise && <div style={subtitleStyle}>{entry.source_franchise}</div>}
      <hr style={ruleStyle} />
      {publicFields.map((key) =>
        typeof d[key] === 'string' && d[key] ? <Prose key={key}>{d[key]}</Prose> : null
      )}
    </div>
  );
}

function MonsterCard({ entry }) {
  const m = entry.mechanics || {};
  const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  return (
    <div style={cardStyle}>
      <div style={nameStyle}>{entry.title || 'Untitled Monster'}</div>
      <div style={subtitleStyle}>
        {[m.size, m.creature_type].filter(Boolean).join(' ')}
        {m.alignment ? `, ${m.alignment}` : ''}
      </div>
      <hr style={ruleStyle} />
      <Line label="Armor Class" value={m.armor_class} />
      <Line label="Hit Points" value={[m.hit_points?.average, m.hit_points?.formula].filter(Boolean).join(' / ')} />
      <Line label="Speed" value={['walk ' + (m.speed?.walk || '0'), m.speed?.fly && `fly ${m.speed.fly}`, m.speed?.swim && `swim ${m.speed.swim}`].filter(Boolean).join(', ')} />
      <hr style={ruleStyle} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt', marginBottom: '4pt' }}>
        {ABILITIES.map((a) => (
          <div key={a} style={{ textAlign: 'center' }}>
            <div style={labelStyle}>{a}</div>
            <div>{m.ability_scores?.[a] || '—'}</div>
          </div>
        ))}
      </div>
      <Line label="Challenge" value={m.challenge_rating} />
      <hr style={ruleStyle} />
      {(m.traits || []).map((t, i) => (
        <Prose key={i}>
          <b>{t.name}.</b> {t.desc}
        </Prose>
      ))}
      {(m.actions || []).map((a, i) => (
        <Prose key={i}>
          <b>{a.name}.</b> {a.desc}
        </Prose>
      ))}
    </div>
  );
}

export default function PrintCard({ entry }) {
  if (!entry) return null;
  let Card = MonsterCard;
  if (entry.category === 'item') Card = ItemCard;
  else if (entry.category === 'spell') Card = SpellCard;
  else if (['npc', 'location', 'faction', 'mechanic'].includes(entry.category)) Card = GenericCard;

  return (
    <div className="print-card">
      <Card entry={entry} />
    </div>
  );
}
