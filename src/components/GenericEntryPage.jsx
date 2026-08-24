import { PageInput, PageTextarea, SectionHeading } from './PageField.jsx';
import { RepeatableFields, RepeatableStrings } from './RepeatableFields.jsx';
import { getGenericSchema } from '../utils/genericSchema.js';
import { setPath } from '../utils/schema.js';
import { ALL_CATEGORIES, ALL_CATEGORY_LABELS, convertEntryCategory } from '../utils/categoryConvert.js';
import Divider from './Divider.jsx';
import EntryImages from './EntryImages.jsx';
import DMNotesSection from './DMNotesSection.jsx';

// A small typographic ornament per category — purely decorative, but it's
// the cheapest way to make each category tab feel like its own chapter of a
// sourcebook rather than the same template reskinned seven times over.
const CATEGORY_ICONS = {
  npc: '★',
  spell: '✦',
  location: '◈',
  faction: '⚜',
  mechanic: '⚙',
  lore: '†',
  session: '✧',
  table: '§',
};

// A handful of field keys recur across categories with the same *meaning*
// (a secret, a DM-only note, an image prompt) even though the schema system
// doesn't tag them as such. Recognizing them by name lets those fields get
// the same distinct treatment EntryPage.jsx gives their monster equivalents,
// instead of every field — secrets and stat lines alike — looking identical.
const isSecretField = (key) => /secret/i.test(key);
const isDmNotesField = (key) => /dm_notes|translation_notes/i.test(key);
const isImagePromptField = (key) => /image_prompt/i.test(key);
const isHookField = (key) => /hook/i.test(key);

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

export default function GenericEntryPage({ entry, editable = false, onChange }) {
  const schema = getGenericSchema(entry.category);
  const set = (path, value) => onChange?.(setPath(entry, path, value));
  const details = entry.details || {};
  const vaultTagsText = (entry.vault_tags || []).join(', ');

  if (!schema) {
    return <div className="italic text-ink/50">Unknown entry type: {entry.category}</div>;
  }

  const icon = CATEGORY_ICONS[entry.category] || '✦';
  const textFields = schema.fields.filter((f) => f.type === 'text');
  const otherFields = schema.fields.filter((f) => f.type !== 'text');
  const hasAnyTextValue = textFields.some((f) => details[f.key]);

  return (
    <div>
      {/* Identity */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-1">
          <span className="text-gold text-base leading-none" aria-hidden="true">{icon}</span>
          {editable ? (
            <select
              value={entry.category}
              onChange={(e) => onChange?.(convertEntryCategory(entry, e.target.value))}
              className="bg-transparent border-0 border-b border-dashed border-ink/20 outline-none text-[10px] font-display uppercase tracking-widest text-ink/60"
            >
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {ALL_CATEGORY_LABELS[c] || c}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-[10px] font-display uppercase tracking-widest text-ink/50">{schema.label}</span>
          )}
          <span className="text-gold text-base leading-none" aria-hidden="true">{icon}</span>
        </div>
        {schema.subtitle && <div className="italic text-[12px] text-ink/40 mb-3">{schema.subtitle}</div>}

        <Field editable={editable} value={entry.title} onChange={(e) => onChange?.({ ...entry, title: e.target.value })} placeholder={`${schema.label} Name`} className="font-deco text-[38px] text-maroon-dark block w-full text-center" />
        <div className="mt-2">
          <Field editable={editable} value={entry.source_franchise} onChange={(e) => onChange?.({ ...entry, source_franchise: e.target.value })} placeholder="Source franchise" className="text-[13px] text-ink/50 block w-full text-center italic" />
        </div>
        <div className="mt-4">
          {editable ? (
            <PageInput value={vaultTagsText} onChange={(e) => onChange?.({ ...entry, vault_tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} placeholder="tags, comma, separated" className="text-center text-[12px]" />
          ) : entry.vault_tags?.length ? (
            <div className="flex justify-center gap-2 flex-wrap">
              {entry.vault_tags.map((tag) => (
                <span key={tag} className="text-[10px] font-display uppercase tracking-wider text-ink/50 border border-ink/20 rounded-full px-3 py-1">{tag}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <EntryImages images={entry.images || []} editable={editable} onChange={(imgs) => onChange?.({ ...entry, images: imgs })} />
      <Divider className="max-w-xs mx-auto my-8" />

      {/* At a glance — the short, single-line facts (level/school, role/occupation,
          region/type…) grouped into one compact panel instead of a long stack of
          one-per-row fields, so the page reads as a stat block, not a form. */}
      {(editable || hasAnyTextValue) && textFields.length > 0 && (
        <div className="relative bg-maroon/[0.03] border border-ink/15 rounded-sm p-6 mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5">
            {textFields.map((field) => (
              <div key={field.key}>
                <div className="text-[10px] font-display uppercase tracking-wider text-ink/50 mb-1">{field.label}</div>
                <Field
                  editable={editable}
                  value={details[field.key]}
                  onChange={(e) => set(['details', field.key], e.target.value)}
                  placeholder={field.placeholder || field.label}
                  className="text-[15px]"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {otherFields.map((field) => {
        const value = details[field.key];

        if (field.type === 'list') {
          if (!editable && !(value || []).length) return null;
          const hookStyle = isHookField(field.key);
          return (
            <div key={field.key} className="mb-6">
              <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-2">{field.label}</div>
              {editable ? (
                <RepeatableStrings items={value || []} onChange={(items) => set(['details', field.key], items)} placeholder={field.placeholder || field.label} addLabel={`+ Add ${field.label}`} />
              ) : hookStyle ? (
                value.map((v, idx) => (<p key={idx} className="italic text-[15px] mb-2">{v}</p>))
              ) : (
                value.map((v, idx) => (
                  <p key={idx} className="text-[15px] mb-1.5">
                    <span className="text-maroon/60 mr-1.5" aria-hidden="true">{icon}</span>{v}
                  </p>
                ))
              )}
            </div>
          );
        }

        if (field.type === 'table') {
          if (!editable && !(value || []).length) return null;
          const [rollKey, resultKey] = field.pairFields;
          return (
            <div key={field.key} className="mb-6">
              <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-2">{field.label}</div>
              {editable ? (
                <RepeatableFields
                  items={value || []}
                  onChange={(items) => set(['details', field.key], items)}
                  fields={[
                    { key: rollKey, placeholder: 'Roll (e.g. 1-3, 14)' },
                    { key: resultKey, placeholder: 'Result', type: 'textarea', rows: 2 },
                  ]}
                  addLabel={`+ Add Row`}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[15px]">
                    <thead>
                      <tr className="border-b-2 border-maroon/30">
                        <th className="text-left font-display text-[11px] uppercase tracking-wider text-ink/50 py-1.5 pr-4 w-20">Roll</th>
                        <th className="text-left font-display text-[11px] uppercase tracking-wider text-ink/50 py-1.5">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {value.map((row, idx) => (
                        <tr key={idx} className="border-b border-ink/10">
                          <td className="py-1.5 pr-4 font-bold align-top whitespace-nowrap">{row[rollKey]}</td>
                          <td className="py-1.5 align-top">{row[resultKey]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        }

        if (field.type === 'pairs') {
          if (!editable && !(value || []).length) return null;
          return (
            <div key={field.key} className="mb-6">
              <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-2">{field.label}</div>
              {editable ? (
                <RepeatableFields items={value || []} onChange={(items) => set(['details', field.key], items)} fields={field.pairFields.map((k) => ({ key: k, placeholder: k }))} addLabel={`+ Add ${field.label}`} />
              ) : (
                <div className="flex gap-3 flex-wrap">
                  {value.map((v, idx) => (
                    <div key={idx} className="border border-ink/20 rounded-sm px-4 py-2 min-w-[180px]">
                      <div className="font-bold text-[15px]">{v[field.pairFields[0]]}</div>
                      {v[field.pairFields[1]] ? <div className="italic text-[13px] text-ink/60">{v[field.pairFields[1]]}</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // textarea — most of a category's narrative content lives here, so a
        // few semantically-recognized keys get their own callout treatment
        // instead of all blurring into one long scroll of identical boxes.
        if (!editable && !value) return null;

        if (isSecretField(field.key)) {
          return (
            <div key={field.key} className="mb-6 bg-[#241611] text-[#d8c39a] rounded-sm p-5">
              <div className="font-display text-sm font-bold text-[#e0a05a] uppercase tracking-wide mb-2">{field.label}</div>
              <Field editable={editable} value={value} onChange={(e) => set(['details', field.key], e.target.value)} placeholder={field.placeholder || field.label} textarea rows={3} className="text-[15px] italic" />
            </div>
          );
        }

        if (isDmNotesField(field.key)) {
          return (
            <div key={field.key} className="mb-6 bg-gold/[0.08] border-l-4 border-gold rounded-r-sm p-5">
              <div className="font-display text-sm font-bold text-maroon-dark uppercase tracking-wide mb-2">{field.label}</div>
              <Field editable={editable} value={value} onChange={(e) => set(['details', field.key], e.target.value)} placeholder={field.placeholder || field.label} textarea rows={3} className="text-[15px]" />
            </div>
          );
        }

        if (isImagePromptField(field.key)) {
          return (
            <div key={field.key} className="mb-6 border border-ink/15 rounded-sm p-5">
              <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-1.5">{field.label}</div>
              <Field editable={editable} value={value} onChange={(e) => set(['details', field.key], e.target.value)} placeholder={field.placeholder || field.label} textarea rows={3} />
            </div>
          );
        }

        return (
          <div key={field.key} className="mb-6">
            <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-1.5">{field.label}</div>
            <Field editable={editable} value={value} onChange={(e) => set(['details', field.key], e.target.value)} placeholder={field.placeholder || field.label} textarea rows={3} />
          </div>
        );
      })}

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
