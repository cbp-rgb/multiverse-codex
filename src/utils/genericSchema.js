// A single data-driven schema for the categories that don't need a bespoke
// mechanical layout (unlike monster/item, which have real stat blocks).
// Add a category here and it automatically gets a form, a read-only render,
// a YAML template for Jarvis, and markdown export — see GenericEntryPage.jsx
// and exportMarkdown.js.

function safeArr(x) {
  return Array.isArray(x) ? x : [];
}
function safeStr(x) {
  return typeof x === 'string' ? x : '';
}

export const GENERIC_SCHEMAS = {
  npc: {
    label: 'NPC',
    subtitle: 'The people of your worlds.',
    fields: [
      { key: 'role', label: 'Role', type: 'text', placeholder: 'Quest Giver, Shopkeeper, Villain, Ally…' },
      { key: 'occupation', label: 'Occupation', type: 'text' },
      { key: 'usually_found', label: 'Usually Found', type: 'text' },
      { key: 'appearance', label: 'Appearance', type: 'textarea' },
      { key: 'personality', label: 'Personality', type: 'textarea' },
      { key: 'voice_and_mannerisms', label: 'Voice & Mannerisms', type: 'textarea' },
      { key: 'motives_and_goals', label: 'Motives & Goals', type: 'textarea' },
      { key: 'secrets', label: 'Secrets', type: 'textarea' },
      { key: 'attitude_to_party', label: 'Attitude to the Party', type: 'textarea' },
      { key: 'relationships', label: 'Relationships', type: 'pairs', pairFields: ['name', 'relationship'] },
      { key: 'combat_note', label: 'Combat Notes', type: 'textarea', placeholder: "Can they fight? Rough stats, or \"flees at the first sign of danger.\"" },
      { key: 'hooks', label: 'Hooks', type: 'list' },
      { key: 'dm_notes', label: 'DM Notes', type: 'textarea' },
      { key: 'image_prompt', label: 'Image Prompt', type: 'textarea' },
    ],
  },
  spell: {
    label: 'Spell',
    subtitle: 'Magic, canon and homebrew.',
    fields: [
      { key: 'level', label: 'Level', type: 'text', placeholder: '0 (cantrip) – 20' },
      { key: 'school', label: 'School', type: 'text', placeholder: 'Evocation, Necromancy…' },
      { key: 'casting_time', label: 'Casting Time', type: 'text' },
      { key: 'range', label: 'Range', type: 'text' },
      { key: 'components', label: 'Components', type: 'text', placeholder: 'V, S, M (a pinch of ash)' },
      { key: 'duration', label: 'Duration', type: 'text' },
      { key: 'classes', label: 'Classes', type: 'list' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'What it does, in rules text.' },
      { key: 'at_higher_levels', label: 'At Higher Levels', type: 'textarea' },
      { key: 'canon_origin', label: 'Canon Origin', type: 'textarea' },
      { key: 'translation_notes', label: "Designer's Notes", type: 'textarea' },
      { key: 'image_prompt', label: 'Image Prompt', type: 'textarea' },
    ],
  },
  location: {
    label: 'Location',
    subtitle: 'Places across the multiverse.',
    fields: [
      { key: 'region', label: 'Region', type: 'text' },
      { key: 'location_type', label: 'Type', type: 'text', placeholder: 'City, Dungeon, Wilderness, Plane…' },
      { key: 'overview', label: 'Overview', type: 'textarea' },
      { key: 'appearance_and_atmosphere', label: 'Appearance & Atmosphere', type: 'textarea' },
      { key: 'notable_features', label: 'Notable Features', type: 'list' },
      { key: 'inhabitants', label: 'Inhabitants', type: 'textarea' },
      { key: 'dangers', label: 'Dangers', type: 'textarea' },
      { key: 'secrets', label: 'Secrets', type: 'textarea' },
      { key: 'hooks', label: 'Hooks', type: 'list' },
      { key: 'dm_notes', label: 'DM Notes', type: 'textarea' },
      { key: 'image_prompt', label: 'Image Prompt', type: 'textarea' },
    ],
  },
  faction: {
    label: 'Faction',
    subtitle: 'Organizations and allegiances.',
    fields: [
      { key: 'faction_type', label: 'Type', type: 'text', placeholder: 'Guild, Cult, Government, Criminal Organization…' },
      { key: 'overview', label: 'Overview', type: 'textarea' },
      { key: 'goals', label: 'Goals', type: 'textarea' },
      { key: 'methods', label: 'Methods', type: 'textarea' },
      { key: 'resources_and_power', label: 'Resources & Power', type: 'textarea' },
      { key: 'territory', label: 'Territory', type: 'text' },
      { key: 'leadership', label: 'Leadership', type: 'pairs', pairFields: ['name', 'role'] },
      { key: 'allies_and_enemies', label: 'Allies & Enemies', type: 'pairs', pairFields: ['name', 'relationship'] },
      { key: 'secrets', label: 'Secrets', type: 'textarea' },
      { key: 'hooks', label: 'Hooks', type: 'list' },
      { key: 'dm_notes', label: 'DM Notes', type: 'textarea' },
      { key: 'image_prompt', label: 'Image Prompt', type: 'textarea' },
    ],
  },
  mechanic: {
    label: 'Mechanic',
    subtitle: 'Homebrew rules and systems.',
    fields: [
      { key: 'mechanic_type', label: 'Type', type: 'text', placeholder: 'Feat, Subclass Feature, House Rule, Downtime Activity…' },
      { key: 'summary', label: 'Summary', type: 'textarea' },
      { key: 'full_rules_text', label: 'Full Rules Text', type: 'textarea' },
      { key: 'when_it_applies', label: 'When It Applies', type: 'textarea' },
      { key: 'design_intent', label: 'Design Intent', type: 'textarea' },
      { key: 'balance_notes', label: 'Balance Notes', type: 'textarea' },
      { key: 'examples', label: 'Examples', type: 'list' },
      { key: 'dm_notes', label: 'DM Notes', type: 'textarea' },
    ],
  },
  lore: {
    label: 'Lore',
    subtitle: 'World history, cosmology, and the truths behind the truths.',
    fields: [
      { key: 'lore_type', label: 'Type', type: 'text', placeholder: 'World History, Cosmology, Timeline Event, Hidden Truth…' },
      { key: 'summary', label: 'Summary', type: 'textarea' },
      { key: 'full_text', label: 'Full Text', type: 'textarea' },
      { key: 'connected_entries', label: 'Connected Entries', type: 'list' },
      { key: 'secrets', label: 'Secrets (Not Yet Revealed)', type: 'textarea' },
      { key: 'dm_notes', label: 'DM Notes', type: 'textarea' },
    ],
  },
  session: {
    label: 'Session',
    subtitle: 'What happened, and what it opened up.',
    fields: [
      { key: 'session_number', label: 'Session #', type: 'text' },
      { key: 'session_date', label: 'Date', type: 'text' },
      { key: 'summary', label: 'Summary', type: 'textarea' },
      { key: 'key_events', label: 'Key Events', type: 'list' },
      { key: 'npcs_involved', label: 'NPCs Involved', type: 'list' },
      { key: 'loose_ends', label: 'Loose Ends', type: 'textarea' },
      { key: 'next_session_hooks', label: 'Hooks for Next Time', type: 'textarea' },
    ],
  },
};

export function getGenericSchema(category) {
  return GENERIC_SCHEMAS[category] || null;
}

export const GENERIC_CATEGORIES = Object.keys(GENERIC_SCHEMAS);

// Builds a YAML template string straight from the field definitions above, so
// Jarvis's prompt template and this app's actual data shape can never drift
// apart the way the hand-written item template once did.
export function buildGenericYamlTemplate(category) {
  const schema = GENERIC_SCHEMAS[category];
  if (!schema) return '';
  const lines = ['name: ""', 'source_franchise: ""', `category: ${category}`, 'vault_tags: []'];
  for (const field of schema.fields) {
    if (field.type === 'list') {
      lines.push(`${field.key}: [] # ${field.label}`);
    } else if (field.type === 'pairs') {
      lines.push(`${field.key}: # ${field.label}`);
      lines.push(`  - ${field.pairFields[0]}: ""`);
      for (let i = 1; i < field.pairFields.length; i++) lines.push(`    ${field.pairFields[i]}: ""`);
    } else {
      lines.push(`${field.key}: "" # ${field.label}`);
    }
  }
  return lines.join('\n');
}

export function makeBlankGenericPayload(category) {
  const schema = getGenericSchema(category);
  if (!schema) return {};
  const payload = {};
  for (const field of schema.fields) {
    if (field.type === 'list') payload[field.key] = [];
    else if (field.type === 'pairs') payload[field.key] = [];
    else payload[field.key] = '';
  }
  return payload;
}

// entry.details — merges a raw AI-shaped YAML block into the payload shape
// for this category, coercing types defensively.
export function mergeGenericPayload(category, raw = {}) {
  const schema = getGenericSchema(category);
  const blank = makeBlankGenericPayload(category);
  if (!schema) return blank;
  const payload = { ...blank };
  for (const field of schema.fields) {
    const value = raw[field.key];
    if (field.type === 'list') {
      payload[field.key] = safeArr(value).filter((v) => typeof v === 'string');
    } else if (field.type === 'pairs') {
      payload[field.key] = safeArr(value).filter((v) => v && typeof v === 'object');
    } else {
      payload[field.key] = safeStr(value);
    }
  }
  return payload;
}

// Builds a full app entry (universal envelope + generic payload) from a raw
// AI-shaped YAML block for one of these categories.
export function mergeWithBlankGenericEntry(category, raw = {}, extra = {}) {
  return {
    title: safeStr(raw.name),
    subtitle: '',
    source_franchise: safeStr(raw.source_franchise),
    category,
    vault_tags: safeArr(raw.vault_tags),
    images: [],
    dm_notes: '',
    details: mergeGenericPayload(category, raw),
    notes: '',
    ...extra,
  };
}
