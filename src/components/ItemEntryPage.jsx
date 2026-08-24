import { PageInput, PageTextarea, SectionHeading } from './PageField.jsx';
import { RepeatableFields, RepeatableStrings } from './RepeatableFields.jsx';
import { ITEM_TYPES, ITEM_RARITIES, ITEM_CATEGORIES } from '../utils/itemSchema.js';
import { setPath } from '../utils/schema.js';
import { ALL_CATEGORIES, ALL_CATEGORY_LABELS, convertEntryCategory } from '../utils/categoryConvert.js';
import Divider from './Divider.jsx';
import EntryImages from './EntryImages.jsx';
import DMNotesSection from './DMNotesSection.jsx';

function Field({ editable, value, onChange, placeholder, textarea, rows, className = '' }) {
  if (editable) {
    return textarea ? (
      <PageTextarea value={value || ''} onChange={onChange} placeholder={placeholder} rows={rows || 3} className={className} />
    ) : (
      <PageInput value={value || ''} onChange={onChange} placeholder={placeholder} className={className} />
    );
  }
  if (!value && value !== 0) return <span className="italic text-ink/30">—</span>;
  return textarea ? (
    <div className={`whitespace-pre-wrap leading-relaxed ${className}`}>{value}</div>
  ) : (
    <span className={className}>{value}</span>
  );
}

function ProseSection({ label, value, editable, onChange }) {
  if (!editable && !value) return null;
  return (
    <div className="mb-5">
      <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-1.5">{label}</div>
      <Field editable={editable} value={value} onChange={onChange} placeholder={label} textarea rows={3} />
    </div>
  );
}

export default function ItemEntryPage({ entry, editable = false, onChange }) {
  const set = (path, value) => onChange?.(setPath(entry, path, value));
  const item = entry.item || {};
  const m = item.mechanics || {};
  const lore = item.lore || {};
  const character = item.character || {};

  const vaultTagsText = (entry.vault_tags || []).join(', ');

  return (
    <div>
      {/* Identity */}
      <div className="text-center">
        {editable ? (
          <select
            value={entry.category}
            onChange={(e) => onChange?.(convertEntryCategory(entry, e.target.value))}
            className="bg-transparent border-0 border-b border-dashed border-ink/20 outline-none text-[10px] font-display uppercase tracking-widest text-ink/60 mb-3"
          >
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {ALL_CATEGORY_LABELS[c] || c}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-[10px] font-display uppercase tracking-widest text-ink/50 mb-3">Item</div>
        )}
        <Field
          editable={editable}
          value={entry.title}
          onChange={(e) => onChange?.({ ...entry, title: e.target.value })}
          placeholder="Item Name"
          className="font-deco text-[38px] text-maroon-dark block w-full text-center"
        />
        <div className="mt-2">
          <Field
            editable={editable}
            value={entry.source_franchise}
            onChange={(e) => onChange?.({ ...entry, source_franchise: e.target.value })}
            placeholder="Source franchise"
            className="text-[13px] text-ink/50 block w-full text-center italic"
          />
        </div>

        <div className="mt-4">
          {editable ? (
            <PageInput
              value={vaultTagsText}
              onChange={(e) =>
                onChange?.({ ...entry, vault_tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })
              }
              placeholder="tags, comma, separated"
              className="text-center text-[12px]"
            />
          ) : entry.vault_tags?.length ? (
            <div className="flex justify-center gap-2 flex-wrap">
              {entry.vault_tags.map((tag) => (
                <span key={tag} className="text-[10px] font-display uppercase tracking-wider text-ink/50 border border-ink/20 rounded-full px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <EntryImages images={entry.images || []} editable={editable} onChange={(imgs) => onChange?.({ ...entry, images: imgs })} />

      <Divider className="max-w-xs mx-auto my-8" />

      {/* Stat block */}
      <div className="relative bg-maroon/[0.03] border border-ink/15 rounded-sm p-6">
        <div className="flex flex-wrap gap-3 mb-4">
          {editable ? (
            <>
              <select
                value={item.item_category}
                onChange={(e) => set(['item', 'item_category'], e.target.value)}
                className="bg-transparent border-0 border-b border-dashed border-ink/20 outline-none text-[13px]"
              >
                {ITEM_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={item.item_class}
                onChange={(e) => set(['item', 'item_class'], e.target.value)}
                className="bg-transparent border-0 border-b border-dashed border-ink/20 outline-none text-[13px]"
              >
                {ITEM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={item.rarity}
                onChange={(e) => set(['item', 'rarity'], e.target.value)}
                className="bg-transparent border-0 border-b border-dashed border-ink/20 outline-none text-[13px]"
              >
                {ITEM_RARITIES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-[13px]">
                <input type="checkbox" checked={!!item.attunement} onChange={(e) => set(['item', 'attunement'], e.target.checked)} />
                Requires Attunement
              </label>
            </>
          ) : (
            <div className="text-[15px] italic">
              {item.rarity} {item.item_category}
              {item.attunement ? ' (requires attunement)' : ''}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="flex gap-2 items-baseline">
            <span className="font-bold whitespace-nowrap">Weight</span>
            <Field editable={editable} value={item.weight} onChange={(e) => set(['item', 'weight'], e.target.value)} placeholder="3 lbs." />
          </div>
          <div className="flex gap-2 items-baseline">
            <span className="font-bold whitespace-nowrap">Value</span>
            <Field editable={editable} value={item.value} onChange={(e) => set(['item', 'value'], e.target.value)} placeholder="500 gp" />
          </div>
        </div>

        <div className="flex gap-2 items-baseline mb-3">
          <span className="font-bold whitespace-nowrap">Description</span>
          <Field editable={editable} value={m.item_type} onChange={(e) => set(['item', 'mechanics', 'item_type'], e.target.value)} placeholder="Weapon (Longsword), Very Rare" />
        </div>

        <div className="mb-4">
          <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-2">Properties</div>
          {editable ? (
            <RepeatableStrings items={m.properties || []} onChange={(items) => set(['item', 'mechanics', 'properties'], items)} placeholder="Versatile (1d10)" addLabel="+ Add Property" />
          ) : m.properties?.length ? (
            <div className="text-[15px]">{m.properties.join(', ')}</div>
          ) : (
            <div className="italic text-ink/30 text-[15px]">—</div>
          )}
        </div>

        {(editable || m.weapon_stats?.damage) && (
          <div className="mb-3">
            <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-2">Weapon Stats</div>
            <div className="flex flex-wrap gap-4 text-[15px]">
              <span className="flex items-baseline gap-1.5">
                Damage <Field editable={editable} value={m.weapon_stats?.damage} onChange={(e) => set(['item', 'mechanics', 'weapon_stats', 'damage'], e.target.value)} placeholder="1d8" className="w-14" />
              </span>
              <span className="flex items-baseline gap-1.5">
                Type <Field editable={editable} value={m.weapon_stats?.damage_type} onChange={(e) => set(['item', 'mechanics', 'weapon_stats', 'damage_type'], e.target.value)} placeholder="Slashing" className="w-24" />
              </span>
              <span className="flex items-baseline gap-1.5">
                Bonus <Field editable={editable} value={m.weapon_stats?.bonus} onChange={(e) => set(['item', 'mechanics', 'weapon_stats', 'bonus'], e.target.value)} placeholder="+2" className="w-12" />
              </span>
            </div>
          </div>
        )}

        {(editable || m.armor_stats?.ac_bonus) && (
          <div className="mb-3">
            <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-2">Armor Stats</div>
            <div className="flex flex-wrap gap-4 text-[15px]">
              <span className="flex items-baseline gap-1.5">
                AC Bonus <Field editable={editable} value={m.armor_stats?.ac_bonus} onChange={(e) => set(['item', 'mechanics', 'armor_stats', 'ac_bonus'], e.target.value)} placeholder="1" className="w-10" />
              </span>
              <span className="flex items-baseline gap-1.5">
                Dex Cap <Field editable={editable} value={m.armor_stats?.dex_bonus_cap} onChange={(e) => set(['item', 'mechanics', 'armor_stats', 'dex_bonus_cap'], e.target.value)} placeholder="—" className="w-10" />
              </span>
              <span className="flex items-baseline gap-1.5">
                Str Req <Field editable={editable} value={m.armor_stats?.strength_requirement} onChange={(e) => set(['item', 'mechanics', 'armor_stats', 'strength_requirement'], e.target.value)} placeholder="—" className="w-10" />
              </span>
              {editable && (
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={!!m.armor_stats?.stealth_disadvantage}
                    onChange={(e) => set(['item', 'mechanics', 'armor_stats', 'stealth_disadvantage'], e.target.checked)}
                  />
                  Stealth Disadvantage
                </label>
              )}
            </div>
          </div>
        )}

        <SectionHeading>Effects</SectionHeading>
        {editable ? (
          <RepeatableFields
            items={m.effects || []}
            onChange={(items) => set(['item', 'mechanics', 'effects'], items)}
            fields={[
              { key: 'name', placeholder: 'Effect name' },
              { key: 'desc', placeholder: 'What it does', type: 'textarea', rows: 2 },
            ]}
            addLabel="+ Add Effect"
          />
        ) : m.effects?.length ? (
          m.effects.map((eff, idx) => (
            <p key={idx} className="leading-relaxed text-[16px] mb-3">
              <span className="font-bold italic">{eff.name || 'Untitled'}.</span> {eff.desc}
            </p>
          ))
        ) : (
          <div className="italic text-ink/30 text-[15px] mb-3">None.</div>
        )}

        <SectionHeading>Charges</SectionHeading>
        <div className="flex flex-wrap gap-4 text-[15px] mb-3">
          <span className="flex items-baseline gap-1.5">
            Max <Field editable={editable} value={m.charges?.max} onChange={(e) => set(['item', 'mechanics', 'charges', 'max'], e.target.value)} placeholder="7" className="w-10" />
          </span>
          <span className="flex items-baseline gap-1.5">
            Recharge <Field editable={editable} value={m.charges?.recharge_formula} onChange={(e) => set(['item', 'mechanics', 'charges', 'recharge_formula'], e.target.value)} placeholder="1d6 + 1" className="w-20" />
          </span>
          <span className="flex items-baseline gap-1.5">
            Timing <Field editable={editable} value={m.charges?.recharge_timing} onChange={(e) => set(['item', 'mechanics', 'charges', 'recharge_timing'], e.target.value)} placeholder="at dawn" className="w-24" />
          </span>
        </div>
        {editable ? (
          <RepeatableFields
            items={m.charges?.abilities || []}
            onChange={(items) => set(['item', 'mechanics', 'charges', 'abilities'], items)}
            fields={[
              { key: 'name', placeholder: 'Charged ability name' },
              { key: 'desc', placeholder: 'Effect', type: 'textarea', rows: 2 },
            ]}
            addLabel="+ Add Charged Ability"
          />
        ) : (
          (m.charges?.abilities || []).map((a, idx) => (
            <p key={idx} className="leading-relaxed text-[16px] mb-3">
              <span className="font-bold italic">{a.name || 'Untitled'}.</span> {a.desc}
            </p>
          ))
        )}
      </div>

      {/* Lore — applies to every item */}
      <SectionHeading>Lore &amp; Design</SectionHeading>
      <ProseSection label="Summary" value={lore.summary} editable={editable} onChange={(e) => set(['item', 'lore', 'summary'], e.target.value)} />
      <ProseSection label="Appearance" value={lore.description} editable={editable} onChange={(e) => set(['item', 'lore', 'description'], e.target.value)} />
      <div className="mb-5 bg-gold/[0.08] border-l-4 border-gold rounded-r-sm p-5">
        <div className="font-display text-sm font-bold text-maroon-dark uppercase tracking-wide mb-2">Designer's Notes</div>
        <Field editable={editable} value={lore.translation_notes} onChange={(e) => set(['item', 'lore', 'translation_notes'], e.target.value)} placeholder="Why it's statted this way." textarea rows={3} className="text-[15px]" />
      </div>

      {/* Significant / sentient items only */}
      <div className="flex items-center gap-2 mb-5">
        {editable ? (
          <label className="flex items-center gap-2 text-[13px] font-display uppercase tracking-wide text-ink/60">
            <input type="checkbox" checked={!!item.significant} onChange={(e) => set(['item', 'significant'], e.target.checked)} />
            Significant / Sentient Item
          </label>
        ) : item.significant ? (
          <div className="text-[11px] font-display uppercase tracking-wider text-gold-dark border border-gold rounded-full px-3 py-1">Significant Item</div>
        ) : null}
      </div>

      {(editable || item.significant) && (
        <>
          <SectionHeading>Character</SectionHeading>
          <ProseSection label="Personality" value={character.personality} editable={editable} onChange={(e) => set(['item', 'character', 'personality'], e.target.value)} />
          <ProseSection label="Motives" value={character.motives} editable={editable} onChange={(e) => set(['item', 'character', 'motives'], e.target.value)} />
          <ProseSection label="Secrets" value={character.secrets} editable={editable} onChange={(e) => set(['item', 'character', 'secrets'], e.target.value)} />
          <div className="mb-5">
            <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-2">Quirks</div>
            {editable ? (
              <RepeatableStrings items={character.quirks || []} onChange={(items) => set(['item', 'character', 'quirks'], items)} placeholder="A quirk" addLabel="+ Add Quirk" />
            ) : character.quirks?.length ? (
              character.quirks.map((q, idx) => (
                <p key={idx} className="text-[15px] mb-1">
                  • {q}
                </p>
              ))
            ) : (
              <div className="italic text-ink/30 text-[15px]">—</div>
            )}
          </div>
          <ProseSection label="Voice & Mannerisms" value={character.voice_and_mannerisms} editable={editable} onChange={(e) => set(['item', 'character', 'voice_and_mannerisms'], e.target.value)} />
          <ProseSection label="Reputation" value={character.reputation} editable={editable} onChange={(e) => set(['item', 'character', 'reputation'], e.target.value)} />
          <ProseSection label="Faction Standing" value={character.faction_standing} editable={editable} onChange={(e) => set(['item', 'character', 'faction_standing'], e.target.value)} />

          <div className="mb-5">
            <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-2">Plot Hooks</div>
            {editable ? (
              <RepeatableStrings items={character.plot_hooks || []} onChange={(items) => set(['item', 'character', 'plot_hooks'], items)} placeholder="A quest hook" addLabel="+ Add Hook" />
            ) : character.plot_hooks?.length ? (
              character.plot_hooks.map((h, idx) => (
                <p key={idx} className="italic text-[15px] mb-2">
                  {h}
                </p>
              ))
            ) : (
              <div className="italic text-ink/30 text-[15px]">—</div>
            )}
          </div>

          <ProseSection label="DM Notes" value={character.dm_notes} editable={editable} onChange={(e) => set(['item', 'character', 'dm_notes'], e.target.value)} />
        </>
      )}

      {/* Image Prompt */}
      <SectionHeading>Image Prompt</SectionHeading>
      <Field editable={editable} value={lore.image_prompt} onChange={(e) => set(['item', 'lore', 'image_prompt'], e.target.value)} placeholder="A visual description for the image generator" textarea rows={3} />

      <DMNotesSection entry={entry} onChange={onChange} />

      {entry.notes ? (
        <>
          <SectionHeading>Original Notes</SectionHeading>
          <div className="text-[14px] italic text-ink/50 whitespace-pre-wrap leading-relaxed border-t border-ink/10 pt-4">{entry.notes}</div>
        </>
      ) : null}
    </div>
  );
}
