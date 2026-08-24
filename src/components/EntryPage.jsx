import { PageInput, PageTextarea, SectionHeading } from './PageField.jsx';
import { RepeatableFields, RepeatableStrings } from './RepeatableFields.jsx';
import { setPath } from '../utils/schema.js';
import { ALL_CATEGORIES, ALL_CATEGORY_LABELS, convertEntryCategory } from '../utils/categoryConvert.js';
import Divider from './Divider.jsx';
import EntryImages from './EntryImages.jsx';
import DMNotesSection from './DMNotesSection.jsx';

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

// Renders one field, either as an inline-editable page field or as static text.
function Field({ editable, value, onChange, placeholder, textarea, rows, className = '' }) {
  if (editable) {
    return textarea ? (
      <PageTextarea value={value || ''} onChange={onChange} placeholder={placeholder} rows={rows || 3} className={className} />
    ) : (
      <PageInput value={value || ''} onChange={onChange} placeholder={placeholder} className={className} />
    );
  }
  if (!value) return <span className="italic text-ink/30">—</span>;
  return textarea ? (
    <div className={`whitespace-pre-wrap leading-relaxed ${className}`}>{value}</div>
  ) : (
    <span className={className}>{value}</span>
  );
}

function TraitList({ items, label }) {
  if (!items?.length) return null;
  return (
    <>
      {label && <div className="font-display text-base text-maroon-dark uppercase tracking-wide mt-6 mb-2">{label}</div>}
      {items.map((it, idx) => (
        <p key={idx} className="leading-relaxed text-[16px] mb-3">
          <span className="font-bold italic">{it.name || 'Untitled'}.</span> {it.desc}
        </p>
      ))}
    </>
  );
}

export default function EntryPage({ entry, editable = false, onChange }) {
  const set = (path, value) => onChange?.(setPath(entry, path, value));

  const vaultTagsText = (entry.vault_tags || []).join(', ');

  return (
    <div>
      {/* Identity */}
      <div className="text-center">
        {editable ? (
          <div className="inline-flex items-center gap-3 mb-4 justify-center">
            <select
              value={entry.category}
              onChange={(e) => onChange?.(convertEntryCategory(entry, e.target.value))}
              className="bg-transparent border-0 border-b border-dashed border-ink/20 outline-none text-[11px] font-display uppercase tracking-widest text-ink/60"
            >
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {ALL_CATEGORY_LABELS[c] || c}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="text-[10px] font-display uppercase tracking-widest text-ink/50 mb-3">{entry.category}</div>
        )}

        <Field
          editable={editable}
          value={entry.title}
          onChange={(e) => set(['title'], e.target.value)}
          placeholder="Entry Title"
          className="font-deco text-[38px] text-maroon-dark block w-full text-center"
        />
        <Field
          editable={editable}
          value={entry.subtitle}
          onChange={(e) => set(['subtitle'], e.target.value)}
          placeholder="Subtitle or epithet"
          className="italic text-ink/60 block w-full text-center mt-2"
        />
        <div className="mt-2">
          <Field
            editable={editable}
            value={entry.source_franchise}
            onChange={(e) => set(['source_franchise'], e.target.value)}
            placeholder="Source franchise"
            className="text-[13px] text-ink/50 block w-full text-center"
          />
        </div>

        <div className="mt-4">
          {editable ? (
            <PageInput
              value={vaultTagsText}
              onChange={(e) =>
                set(
                  ['vault_tags'],
                  e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                )
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

      {/* Character — mainly for NPCs (a shopkeeper, a villain, a converted
          hero with a full stat block below), but available on any entry.
          Whole section hides itself when nothing's filled in and the page
          isn't in edit mode, so a plain combat-only monster isn't cluttered
          by empty "Role"/"Personality" fields. */}
      {(() => {
        const character = entry.character || {};
        const glanceFields = [
          { key: 'role', label: 'Role', placeholder: 'Quest Giver, Shopkeeper, Villain, Ally…' },
          { key: 'occupation', label: 'Occupation' },
          { key: 'usually_found', label: 'Usually Found' },
        ];
        const hasGlance = glanceFields.some((f) => character[f.key]);
        const hasAny =
          hasGlance ||
          character.appearance ||
          character.personality ||
          character.voice_and_mannerisms ||
          character.motives_and_goals ||
          character.attitude_to_party ||
          character.combat_note ||
          character.relationships?.length ||
          character.hooks?.length;
        if (!editable && !hasAny) return null;

        return (
          <>
            <SectionHeading>Character</SectionHeading>

            {(editable || hasGlance) && (
              <div className="relative bg-maroon/[0.03] border border-ink/15 rounded-sm p-6 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {glanceFields.map((f) => (
                    <div key={f.key}>
                      <div className="text-[10px] font-display uppercase tracking-wider text-ink/50 mb-1">{f.label}</div>
                      <Field
                        editable={editable}
                        value={character[f.key]}
                        onChange={(e) => set(['character', f.key], e.target.value)}
                        placeholder={f.placeholder || f.label}
                        className="text-[15px]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {[
              ['appearance', 'Appearance'],
              ['personality', 'Personality'],
              ['voice_and_mannerisms', 'Voice & Mannerisms'],
              ['motives_and_goals', 'Motives & Goals'],
              ['attitude_to_party', 'Attitude to the Party'],
            ].map(([key, label]) =>
              !editable && !character[key] ? null : (
                <div key={key} className="mb-5">
                  <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-1.5">{label}</div>
                  <Field editable={editable} value={character[key]} onChange={(e) => set(['character', key], e.target.value)} placeholder={label} textarea rows={3} />
                </div>
              )
            )}

            {(editable || character.relationships?.length) && (
              <div className="mb-5">
                <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-2">Relationships</div>
                {editable ? (
                  <RepeatableFields
                    items={character.relationships || []}
                    onChange={(items) => set(['character', 'relationships'], items)}
                    fields={[
                      { key: 'name', placeholder: 'Name' },
                      { key: 'relationship', placeholder: 'Relationship (e.g. Old rival)' },
                    ]}
                    addLabel="+ Add Relationship"
                  />
                ) : (
                  <div className="flex gap-3 flex-wrap">
                    {character.relationships.map((rel, idx) => (
                      <div key={idx} className="border border-ink/20 rounded-sm px-4 py-2 min-w-[180px]">
                        <div className="font-bold text-[15px]">{rel.name}</div>
                        {rel.relationship ? <div className="italic text-[13px] text-ink/60">{rel.relationship}</div> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(!editable && !character.combat_note) ? null : (
              <div className="mb-5">
                <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-1.5">Combat Notes</div>
                <Field
                  editable={editable}
                  value={character.combat_note}
                  onChange={(e) => set(['character', 'combat_note'], e.target.value)}
                  placeholder={'Only needed if this NPC has no real stat block below — e.g. "flees at the first sign of danger."'}
                  textarea
                  rows={2}
                />
              </div>
            )}

            {(editable || character.hooks?.length) && (
              <div className="mb-2">
                <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-2">Hooks</div>
                {editable ? (
                  <RepeatableStrings items={character.hooks || []} onChange={(items) => set(['character', 'hooks'], items)} placeholder="A hook involving this character" addLabel="+ Add Hook" />
                ) : (
                  character.hooks.map((hook, idx) => (
                    <p key={idx} className="italic text-[15px] mb-2">{hook}</p>
                  ))
                )}
              </div>
            )}
          </>
        );
      })()}

      {/* Mechanics */}
      <div className="relative bg-maroon/[0.03] border border-ink/15 rounded-sm p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <Field editable={editable} value={entry.mechanics.size} onChange={(e) => set(['mechanics', 'size'], e.target.value)} placeholder="Size" />
          <Field
            editable={editable}
            value={entry.mechanics.creature_type}
            onChange={(e) => set(['mechanics', 'creature_type'], e.target.value)}
            placeholder="Creature type"
          />
          <Field
            editable={editable}
            value={entry.mechanics.alignment}
            onChange={(e) => set(['mechanics', 'alignment'], e.target.value)}
            placeholder="Alignment"
          />
        </div>

        <Divider />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex gap-2 items-baseline">
            <span className="font-bold whitespace-nowrap">Armor Class</span>
            <Field editable={editable} value={entry.mechanics.armor_class} onChange={(e) => set(['mechanics', 'armor_class'], e.target.value)} placeholder="16" />
          </div>
          <div className="flex gap-2 items-baseline">
            <span className="font-bold whitespace-nowrap">Hit Points</span>
            <Field
              editable={editable}
              value={entry.mechanics.hit_points.average}
              onChange={(e) => set(['mechanics', 'hit_points', 'average'], e.target.value)}
              placeholder="127"
              className="w-16"
            />
            <span className="text-ink/40">/</span>
            <Field
              editable={editable}
              value={entry.mechanics.hit_points.formula}
              onChange={(e) => set(['mechanics', 'hit_points', 'formula'], e.target.value)}
              placeholder="15d8 + 60"
            />
          </div>
          <div className="sm:col-span-2 flex gap-4 items-baseline flex-wrap">
            <span className="font-bold whitespace-nowrap">Speed</span>
            <span className="flex items-baseline gap-1">
              walk <Field editable={editable} value={entry.mechanics.speed.walk} onChange={(e) => set(['mechanics', 'speed', 'walk'], e.target.value)} placeholder="30" className="w-12" />
            </span>
            <span className="flex items-baseline gap-1">
              fly <Field editable={editable} value={entry.mechanics.speed.fly} onChange={(e) => set(['mechanics', 'speed', 'fly'], e.target.value)} placeholder="0" className="w-12" />
            </span>
            <span className="flex items-baseline gap-1">
              swim <Field editable={editable} value={entry.mechanics.speed.swim} onChange={(e) => set(['mechanics', 'speed', 'swim'], e.target.value)} placeholder="0" className="w-12" />
            </span>
          </div>
        </div>

        <Divider />

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
          {ABILITIES.map((ab) => (
            <div key={ab}>
              <div className="text-[10px] font-display uppercase tracking-wider text-ink/50">{ab}</div>
              <Field
                editable={editable}
                value={entry.mechanics.ability_scores[ab]}
                onChange={(e) => set(['mechanics', 'ability_scores', ab], e.target.value)}
                placeholder="10"
                className="font-display text-center block w-full"
              />
            </div>
          ))}
        </div>

        <Divider />

        <div className="mb-4">
          <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-2">Saving Throws</div>
          {editable ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              {ABILITIES.map((ab) => (
                <div key={ab}>
                  <div className="text-[10px] font-display uppercase tracking-wider text-ink/40">{ab}</div>
                  <Field
                    editable
                    value={entry.mechanics.saving_throws[ab]}
                    onChange={(e) => set(['mechanics', 'saving_throws', ab], e.target.value)}
                    placeholder="—"
                    className="text-center block w-full"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[15px]">
              {ABILITIES.filter((ab) => entry.mechanics.saving_throws[ab]).length ? (
                ABILITIES.filter((ab) => entry.mechanics.saving_throws[ab])
                  .map((ab) => `${ab.charAt(0).toUpperCase()}${ab.slice(1)} ${entry.mechanics.saving_throws[ab]}`)
                  .join(', ')
              ) : (
                <span className="italic text-ink/30">—</span>
              )}
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-2">Skills</div>
          {editable ? (
            <RepeatableFields
              items={entry.mechanics.skills}
              onChange={(items) => set(['mechanics', 'skills'], items)}
              fields={[
                { key: 'skill', placeholder: 'Skill (e.g. Perception)' },
                { key: 'bonus', placeholder: '+4' },
              ]}
              addLabel="+ Add Skill"
            />
          ) : entry.mechanics.skills.filter((s) => s.skill).length ? (
            <div className="text-[15px]">{entry.mechanics.skills.filter((s) => s.skill).map((s) => `${s.skill} ${s.bonus}`).join(', ')}</div>
          ) : (
            <div className="italic text-ink/30 text-[15px]">—</div>
          )}
        </div>

        <div className="flex flex-col gap-2 text-[15px]">
          <div className="flex gap-2">
            <span className="font-bold whitespace-nowrap">Resistances</span>
            <Field editable={editable} value={entry.mechanics.damage_resistances} onChange={(e) => set(['mechanics', 'damage_resistances'], e.target.value)} placeholder="fire, cold" />
          </div>
          <div className="flex gap-2">
            <span className="font-bold whitespace-nowrap">Immunities</span>
            <Field editable={editable} value={entry.mechanics.damage_immunities} onChange={(e) => set(['mechanics', 'damage_immunities'], e.target.value)} placeholder="poison" />
          </div>
          <div className="flex gap-2">
            <span className="font-bold whitespace-nowrap">Condition Immunities</span>
            <Field
              editable={editable}
              value={entry.mechanics.condition_immunities}
              onChange={(e) => set(['mechanics', 'condition_immunities'], e.target.value)}
              placeholder="poisoned, charmed"
            />
          </div>
          <div className="flex gap-2">
            <span className="font-bold whitespace-nowrap">Senses</span>
            <Field editable={editable} value={entry.mechanics.senses} onChange={(e) => set(['mechanics', 'senses'], e.target.value)} placeholder="darkvision 120 ft." />
          </div>
          <div className="flex gap-2">
            <span className="font-bold whitespace-nowrap">Languages</span>
            <Field editable={editable} value={entry.mechanics.languages} onChange={(e) => set(['mechanics', 'languages'], e.target.value)} placeholder="Common" />
          </div>
          <div className="flex gap-4">
            <span className="flex gap-2">
              <span className="font-bold whitespace-nowrap">Challenge</span>
              <Field editable={editable} value={entry.mechanics.challenge_rating} onChange={(e) => set(['mechanics', 'challenge_rating'], e.target.value)} placeholder="7" className="w-10" />
            </span>
            <span className="flex gap-2">
              <span className="font-bold whitespace-nowrap">XP</span>
              <Field editable={editable} value={entry.mechanics.experience_points} onChange={(e) => set(['mechanics', 'experience_points'], e.target.value)} placeholder="2900" className="w-16" />
            </span>
          </div>
        </div>

        {editable ? (
          <>
            <SectionHeading>Traits</SectionHeading>
            <RepeatableFields
              items={entry.mechanics.traits}
              onChange={(items) => set(['mechanics', 'traits'], items)}
              fields={[
                { key: 'name', placeholder: 'Trait name' },
                { key: 'desc', placeholder: 'What it does', type: 'textarea', rows: 2 },
              ]}
              addLabel="+ Add Trait"
            />

            <SectionHeading>Actions</SectionHeading>
            <RepeatableFields
              items={entry.mechanics.actions}
              onChange={(items) => set(['mechanics', 'actions'], items)}
              fields={[
                { key: 'name', placeholder: 'Action name' },
                { key: 'desc', placeholder: 'Attack / effect', type: 'textarea', rows: 2 },
              ]}
              addLabel="+ Add Action"
            />

            <SectionHeading>Legendary Actions</SectionHeading>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[13px]">Uses per round:</span>
              <PageInput
                value={entry.mechanics.legendary_actions.per_round}
                onChange={(e) => set(['mechanics', 'legendary_actions', 'per_round'], e.target.value)}
                placeholder="3"
                className="w-12"
              />
            </div>
            <RepeatableFields
              items={entry.mechanics.legendary_actions.actions}
              onChange={(items) => set(['mechanics', 'legendary_actions', 'actions'], items)}
              fields={[
                { key: 'name', placeholder: 'Legendary action name' },
                { key: 'desc', placeholder: 'Effect', type: 'textarea', rows: 2 },
              ]}
              addLabel="+ Add Legendary Action"
            />
          </>
        ) : (
          <>
            <TraitList items={entry.mechanics.traits} />
            <TraitList items={entry.mechanics.actions} label="Actions" />
            {entry.mechanics.legendary_actions.actions?.length > 0 && (
              <>
                <div className="font-display text-base text-maroon-dark uppercase tracking-wide mt-6 mb-2">Legendary Actions</div>
                {entry.mechanics.legendary_actions.per_round && (
                  <p className="italic text-[14px] text-ink/60 mb-2">
                    Can take {entry.mechanics.legendary_actions.per_round} legendary actions, choosing from the options below.
                  </p>
                )}
                <TraitList items={entry.mechanics.legendary_actions.actions} />
              </>
            )}
          </>
        )}
      </div>

      {/* Lore */}
      <SectionHeading>Canon Overview</SectionHeading>
      <Field
        editable={editable}
        value={entry.lore.canon_overview}
        onChange={(e) => set(['lore', 'canon_overview'], e.target.value)}
        placeholder="What this is, in its native universe."
        textarea
        rows={4}
      />

      <div className="mt-8 bg-gold/[0.08] border-l-4 border-gold rounded-r-sm p-5">
        <div className="font-display text-sm font-bold text-maroon-dark uppercase tracking-wide mb-2">Designer's Notes</div>
        <Field
          editable={editable}
          value={entry.lore.translation_notes}
          onChange={(e) => set(['lore', 'translation_notes'], e.target.value)}
          placeholder="Why it's statted this way — balance calls, what maps to what."
          textarea
          rows={3}
          className="text-[15px]"
        />
      </div>

      <div className="mt-6 bg-[#241611] text-[#d8c39a] rounded-sm p-5">
        <div className="font-display text-sm font-bold text-[#e0a05a] uppercase tracking-wide mb-2">DM Eyes Only</div>
        <Field
          editable={editable}
          value={entry.lore.dm_secrets}
          onChange={(e) => set(['lore', 'dm_secrets'], e.target.value)}
          placeholder="Hidden agendas, weaknesses, plot hooks — never shown to players."
          textarea
          rows={3}
          className="text-[15px] italic"
        />
      </div>

      {/* Flavor & Presentation */}
      <SectionHeading>Flavor &amp; Presentation</SectionHeading>
      <div className="bg-ink/[0.04] border-y border-ink/15 p-5 italic">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-[11px] font-display not-italic uppercase tracking-wider text-ink/50 mb-1">Sight</div>
            <Field
              editable={editable}
              value={entry.flavor_and_presentation.sensory_profile.sight}
              onChange={(e) => set(['flavor_and_presentation', 'sensory_profile', 'sight'], e.target.value)}
              placeholder="What you see"
              textarea
              rows={2}
            />
          </div>
          <div>
            <div className="text-[11px] font-display not-italic uppercase tracking-wider text-ink/50 mb-1">Sound</div>
            <Field
              editable={editable}
              value={entry.flavor_and_presentation.sensory_profile.sound}
              onChange={(e) => set(['flavor_and_presentation', 'sensory_profile', 'sound'], e.target.value)}
              placeholder="What you hear"
              textarea
              rows={2}
            />
          </div>
          <div>
            <div className="text-[11px] font-display not-italic uppercase tracking-wider text-ink/50 mb-1">Smell</div>
            <Field
              editable={editable}
              value={entry.flavor_and_presentation.sensory_profile.smell}
              onChange={(e) => set(['flavor_and_presentation', 'sensory_profile', 'smell'], e.target.value)}
              placeholder="What you smell"
              textarea
              rows={2}
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-2">Flavor Quotes</div>
        {editable ? (
          <RepeatableStrings
            items={entry.flavor_and_presentation.flavor_quotes}
            onChange={(items) => set(['flavor_and_presentation', 'flavor_quotes'], items)}
            placeholder="Something it says in combat or roleplay"
            addLabel="+ Add Quote"
          />
        ) : (
          entry.flavor_and_presentation.flavor_quotes.map((q, idx) => (
            <p key={idx} className="italic text-[16px] text-center my-2">
              "{q}"
            </p>
          ))
        )}
      </div>

      <div className="mt-6">
        <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-2">Custom Moves</div>
        {editable ? (
          <RepeatableFields
            items={entry.flavor_and_presentation.custom_moves}
            onChange={(items) => set(['flavor_and_presentation', 'custom_moves'], items)}
            fields={[
              { key: 'trigger', placeholder: 'When... (the trigger)', type: 'textarea', rows: 2 },
              { key: 'effect', placeholder: 'Then... (the effect)', type: 'textarea', rows: 2 },
            ]}
            addLabel="+ Add Custom Move"
          />
        ) : (
          entry.flavor_and_presentation.custom_moves.map((m, idx) => (
            <div key={idx} className="border border-ink/15 rounded-sm p-4 mb-3">
              <div className="text-[15px] leading-relaxed">
                <span className="font-display text-maroon-dark uppercase text-[12px]">When</span> {m.trigger} —{' '}
                <span className="font-display text-maroon-dark uppercase text-[12px]">Then</span> {m.effect}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Image Prompt */}
      <SectionHeading>Image Prompt</SectionHeading>
      <div className="border border-ink/15 rounded-sm p-5 flex flex-col gap-4">
        <div>
          <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-1">Prompt</div>
          <Field
            editable={editable}
            value={entry.image_prompt.prompt}
            onChange={(e) => set(['image_prompt', 'prompt'], e.target.value)}
            placeholder="A visual description for the image generator"
            textarea
            rows={3}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-1">Style</div>
            <Field
              editable={editable}
              value={entry.image_prompt.style}
              onChange={(e) => set(['image_prompt', 'style'], e.target.value)}
              placeholder="e.g. painterly fantasy portrait, muted palette"
            />
          </div>
          <div>
            <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-1">Negative Prompt</div>
            <Field
              editable={editable}
              value={entry.image_prompt.negative_prompt}
              onChange={(e) => set(['image_prompt', 'negative_prompt'], e.target.value)}
              placeholder="What to avoid"
            />
          </div>
        </div>
      </div>

      {/* Cross-Vault Linkages */}
      <SectionHeading>Cross-Vault Linkages</SectionHeading>
      <div className="mb-2 text-[11px] font-display uppercase tracking-wider text-ink/50">Related Entries</div>
      {editable ? (
        <RepeatableFields
          items={entry.links.related_entries}
          onChange={(items) => set(['links', 'related_entries'], items)}
          fields={[
            { key: 'id', placeholder: 'Related entry slug / name' },
            { key: 'relationship', placeholder: 'Relationship (e.g. Origin Point)' },
          ]}
          addLabel="+ Add Related Entry"
        />
      ) : entry.links.related_entries.length ? (
        <div className="flex gap-3 flex-wrap mb-4">
          {entry.links.related_entries.map((rel, idx) => (
            <div key={idx} className="border border-ink/20 rounded-sm px-4 py-2 min-w-[200px]">
              <div className="font-bold text-[15px]">{rel.id}</div>
              <div className="italic text-[13px] text-ink/60">{rel.relationship}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="italic text-ink/40 text-[13px] mb-4">None yet.</div>
      )}

      <div className="mb-2 mt-6 text-[11px] font-display uppercase tracking-wider text-ink/50">Quest Hooks</div>
      {editable ? (
        <RepeatableStrings
          items={entry.links.quest_hooks}
          onChange={(items) => set(['links', 'quest_hooks'], items)}
          placeholder="Where/how this gets discovered"
          addLabel="+ Add Quest Hook"
        />
      ) : entry.links.quest_hooks.length ? (
        entry.links.quest_hooks.map((hook, idx) => (
          <p key={idx} className="italic text-[15px] mb-2">
            {hook}
          </p>
        ))
      ) : (
        <div className="italic text-ink/40 text-[13px]">None yet.</div>
      )}

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
