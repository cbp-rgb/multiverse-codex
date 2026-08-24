import yaml from 'js-yaml';
import { makeBlankEntry } from './schema.js';
import { makeBlankItemPayload } from './itemSchema.js';
import { GENERIC_CATEGORIES, GENERIC_SCHEMAS, makeBlankGenericPayload } from './genericSchema.js';

// Monster/item/generic entries are three genuinely different payload shapes
// (mechanics+lore+... / item / details) — switching an entry's category is
// not just changing a label, since the old renderer's fields don't exist in
// the new one. This is the single place that knows how to move an entry
// between all nine categories without silently dropping its content.

export const ALL_CATEGORIES = ['monster', 'item', ...GENERIC_CATEGORIES];

export const ALL_CATEGORY_LABELS = {
  monster: 'Monster',
  item: 'Item',
  ...Object.fromEntries(GENERIC_CATEGORIES.map((c) => [c, GENERIC_SCHEMAS[c].label])),
};

export function getEntryKind(category) {
  if (category === 'item') return 'item';
  if (GENERIC_CATEGORIES.includes(category)) return 'generic';
  return 'monster';
}

function extractPayload(entry, kind) {
  if (kind === 'item') return entry.item;
  if (kind === 'generic') return entry.details;
  const { mechanics, lore, flavor_and_presentation, image_prompt, links } = entry;
  return { mechanics, lore, flavor_and_presentation, image_prompt, links };
}

// Returns a new entry with the same universal envelope (title, images, DM
// notes, etc.) but a fresh blank payload shaped for newCategory. Nothing is
// silently lost: the old category's whole payload is dumped as readable YAML
// into `notes`, above whatever was already there, so a DM can hand-copy or
// send it to Jarvis to rebuild rather than having it vanish.
export function convertEntryCategory(entry, newCategory) {
  if (newCategory === entry.category) return entry;

  const oldKind = getEntryKind(entry.category);
  const newKind = getEntryKind(newCategory);
  const oldLabel = ALL_CATEGORY_LABELS[entry.category] || entry.category;

  const oldPayload = extractPayload(entry, oldKind);
  const dump = yaml.dump(oldPayload || {});
  const conversionNote = `— Converted from ${oldLabel} on ${new Date().toLocaleDateString()}, previous data below (may need manual re-entry into the new fields) —\n\n${dump}`;
  const notes = entry.notes ? `${entry.notes}\n\n${conversionNote}` : conversionNote;

  const base = {
    title: entry.title,
    subtitle: entry.subtitle,
    source_franchise: entry.source_franchise,
    vault_tags: entry.vault_tags,
    images: entry.images,
    dm_notes: entry.dm_notes,
    category: newCategory,
    notes,
  };

  if (newKind === 'item') {
    return { ...base, item: makeBlankItemPayload() };
  }
  if (newKind === 'generic') {
    return { ...base, details: makeBlankGenericPayload(newCategory) };
  }
  const blankMonster = makeBlankEntry();
  return {
    ...base,
    mechanics: blankMonster.mechanics,
    lore: blankMonster.lore,
    flavor_and_presentation: blankMonster.flavor_and_presentation,
    image_prompt: blankMonster.image_prompt,
    links: blankMonster.links,
  };
}
