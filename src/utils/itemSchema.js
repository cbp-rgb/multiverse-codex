export const ITEM_TYPES = ['weapon', 'armor', 'wondrous-item', 'consumable', 'artifact', 'tool'];
export const ITEM_RARITIES = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact'];
export const ITEM_CATEGORIES = ['Weapon', 'Armor', 'Wondrous Item', 'Potion', 'Ring', 'Rod', 'Scroll', 'Staff', 'Wand'];

function safeArr(x) {
  return Array.isArray(x) ? x : [];
}
function safeObj(x) {
  return x && typeof x === 'object' && !Array.isArray(x) ? x : {};
}
function safeStr(x) {
  return typeof x === 'string' ? x : '';
}

// Snaps an AI-supplied value onto the canonically-cased option it matches
// case/whitespace-insensitively (e.g. "very rare" -> "Very Rare") — without
// this, a <select> bound to the raw value silently shows the wrong option
// (the browser just falls back to the first one) even though the underlying
// data isn't lost. Falls back to fallback (usually the blank/first option)
// when nothing matches at all.
function normalizeEnum(value, options, fallback) {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const squash = (s) => s.trim().toLowerCase().replace(/[\s-]+/g, ' ');
  const target = squash(value);
  const match = options.find((o) => squash(o) === target);
  return match || fallback;
}

// plot_hooks may still arrive as the old { hook_1, hook_2, hook_3 } shape from
// an earlier draft — normalized to a plain array either way.
function normalizeHooks(x) {
  if (Array.isArray(x)) return x.filter(Boolean);
  if (x && typeof x === 'object') return Object.values(x).filter((v) => typeof v === 'string' && v.trim());
  return [];
}

export function makeBlankItemPayload() {
  return {
    item_class: '', // weapon | armor | wondrous-item | consumable | artifact | tool
    rarity: 'Common',
    attunement: false,
    item_category: 'Wondrous Item', // Weapon | Armor | Wondrous Item | Potion | Ring | Rod | Scroll | Staff | Wand
    weight: '',
    value: '',

    mechanics: {
      item_type: '',
      properties: [],
      weapon_stats: { damage: '', damage_type: '', bonus: '' },
      armor_stats: { ac_bonus: '', dex_bonus_cap: '', strength_requirement: '', stealth_disadvantage: false },
      effects: [],
      charges: { max: '', recharge_formula: '', recharge_timing: '', abilities: [] },
    },

    // Applies to every item, however ordinary.
    lore: {
      summary: '',
      description: '',
      translation_notes: '',
      image_prompt: '',
    },

    // Only meaningful for a significant/sentient/narratively-important item —
    // leave `significant: false` and this whole block blank for an ordinary
    // +1 sword or potion rather than forcing a personality onto it.
    significant: false,
    character: {
      personality: '',
      motives: '',
      secrets: '',
      quirks: [],
      voice_and_mannerisms: '',
      reputation: '',
      faction_standing: '',
      plot_hooks: [],
      dm_notes: '',
    },
  };
}

// entry.item — merges a raw AI-shaped item YAML block into this app's
// internal item payload shape, defensively coercing every array/object field
// so a wrong type from the model can't crash rendering.
export function mergeItemPayload(raw = {}) {
  const blank = makeBlankItemPayload();
  const m = safeObj(raw.mechanics);
  const lore = safeObj(raw.lore);
  const character = safeObj(raw.character);

  return {
    ...blank,
    item_class: normalizeEnum(raw.type, ITEM_TYPES, blank.item_class),
    rarity: normalizeEnum(raw.rarity, ITEM_RARITIES, blank.rarity),
    attunement: typeof raw.attunement === 'boolean' ? raw.attunement : Boolean(raw.attunement),
    item_category: normalizeEnum(raw.category, ITEM_CATEGORIES, blank.item_category),
    weight: safeStr(raw.weight),
    value: safeStr(raw.value),

    mechanics: {
      item_type: safeStr(m.item_type),
      properties: safeArr(m.properties),
      weapon_stats: { ...blank.mechanics.weapon_stats, ...safeObj(m.weapon_stats) },
      armor_stats: { ...blank.mechanics.armor_stats, ...safeObj(m.armor_stats) },
      effects: safeArr(m.effects),
      charges: {
        ...blank.mechanics.charges,
        ...safeObj(m.charges),
        abilities: safeArr(safeObj(m.charges).abilities),
      },
    },

    lore: {
      summary: safeStr(lore.summary),
      description: safeStr(lore.description),
      translation_notes: safeStr(lore.translation_notes),
      image_prompt: safeStr(lore.image_prompt),
    },

    significant: typeof raw.significant === 'boolean' ? raw.significant : Boolean(raw.significant),
    character: {
      personality: safeStr(character.personality),
      motives: safeStr(character.motives),
      secrets: safeStr(character.secrets),
      quirks: safeArr(character.quirks),
      voice_and_mannerisms: safeStr(character.voice_and_mannerisms),
      reputation: safeStr(character.reputation),
      faction_standing: safeStr(character.faction_standing),
      plot_hooks: normalizeHooks(character.plot_hooks),
      dm_notes: safeStr(character.dm_notes),
    },
  };
}

// Builds a full app entry (universal envelope + item payload) from a raw
// AI-shaped item YAML block.
export function mergeWithBlankItemEntry(raw = {}, extra = {}) {
  return {
    title: safeStr(raw.name),
    subtitle: '',
    source_franchise: safeStr(raw.canon_universe),
    category: 'item',
    vault_tags: safeArr(raw.vault_tags),
    images: [],
    dm_notes: '',
    item: mergeItemPayload(raw),
    notes: '',
    ...extra,
  };
}
