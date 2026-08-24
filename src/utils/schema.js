export function makeBlankEntry() {
  return {
    slug: '',
    title: '',
    subtitle: '',
    source_franchise: '',
    category: 'monster',
    vault_tags: [],
    images: [], // [{ id, name, dataUrl }]
    dm_notes: '', // ongoing scratchpad — session developments, not the initial design writeup

    mechanics: {
      size: '',
      creature_type: '',
      alignment: '',
      armor_class: '',
      hit_points: { average: '', formula: '' },
      speed: { walk: '', fly: '', swim: '' },
      ability_scores: { str: '', dex: '', con: '', int: '', wis: '', cha: '' },
      saving_throws: { str: '', dex: '', con: '', int: '', wis: '', cha: '' },
      skills: [],
      damage_resistances: '',
      damage_immunities: '',
      condition_immunities: '',
      senses: '',
      languages: '',
      challenge_rating: '',
      experience_points: '',
      traits: [],
      actions: [],
      legendary_actions: { per_round: '', actions: [] },
    },

    lore: {
      canon_overview: '',
      translation_notes: '',
      dm_secrets: '',
    },

    flavor_and_presentation: {
      sensory_profile: { sight: '', sound: '', smell: '' },
      flavor_quotes: [],
      custom_moves: [],
    },

    image_prompt: {
      prompt: '',
      style: '',
      negative_prompt: '',
    },

    links: {
      related_entries: [],
      quest_hooks: [],
    },

    // Narrative/social fields — mainly for NPCs (a shopkeeper, a villain,
    // a converted hero like Superman), but left available on every entry
    // since a memorable monster can want a personality too. Blank fields
    // are hidden on the page rather than shown as empty, so an ordinary
    // combat-only monster doesn't look cluttered by unused NPC fields.
    character: {
      role: '',
      occupation: '',
      usually_found: '',
      appearance: '',
      personality: '',
      voice_and_mannerisms: '',
      motives_and_goals: '',
      attitude_to_party: '',
      relationships: [], // [{ name, relationship }]
      combat_note: '', // for an NPC with no real stat block — "flees at the first sign of danger" — leave blank if the mechanics section above is filled in instead
      hooks: [],
    },

    notes: '',
  };
}

function safeArr(x) {
  return Array.isArray(x) ? x : [];
}
function safeObj(x) {
  return x && typeof x === 'object' && !Array.isArray(x) ? x : {};
}
function firstDefined(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return '';
}

// Merge a (possibly partial / AI-supplied) entry over the blank schema shape,
// so every section always has every key the UI expects. Every array/object
// field is type-checked rather than just truthy-checked — an AI response that
// puts a string where an array belongs (e.g. `traits: "None"` instead of `[]`)
// would otherwise silently corrupt the entry and crash EntryPage's `.map()`
// calls on open.
export function mergeWithBlankEntry(partial = {}) {
  const blank = makeBlankEntry();
  const m = safeObj(partial.mechanics);
  const fp = safeObj(partial.flavor_and_presentation);
  const links = safeObj(partial.links);
  const character = safeObj(partial.character);
  return {
    ...blank,
    ...partial,
    mechanics: {
      ...blank.mechanics,
      ...m,
      hit_points: { ...blank.mechanics.hit_points, ...safeObj(m.hit_points) },
      speed: { ...blank.mechanics.speed, ...safeObj(m.speed) },
      ability_scores: { ...blank.mechanics.ability_scores, ...safeObj(m.ability_scores) },
      saving_throws: { ...blank.mechanics.saving_throws, ...safeObj(m.saving_throws) },
      skills: safeArr(m.skills),
      traits: safeArr(m.traits),
      actions: safeArr(m.actions),
      legendary_actions: {
        ...blank.mechanics.legendary_actions,
        ...safeObj(m.legendary_actions),
        actions: safeArr(safeObj(m.legendary_actions).actions),
      },
      // The model doesn't always put these exactly where the template puts
      // them (top-level `cr` instead of `mechanics.challenge_rating`, etc.) —
      // check the plausible alternate spots rather than losing the value.
      challenge_rating: firstDefined(m.challenge_rating, m.cr, m.challenge, partial.challenge_rating, partial.cr, partial.challenge),
      experience_points: firstDefined(m.experience_points, m.xp, m.experience, partial.experience_points, partial.xp),
    },
    lore: { ...blank.lore, ...safeObj(partial.lore) },
    flavor_and_presentation: {
      ...blank.flavor_and_presentation,
      ...fp,
      sensory_profile: {
        ...blank.flavor_and_presentation.sensory_profile,
        ...safeObj(fp.sensory_profile),
      },
      flavor_quotes: safeArr(fp.flavor_quotes),
      custom_moves: safeArr(fp.custom_moves),
    },
    image_prompt: { ...blank.image_prompt, ...safeObj(partial.image_prompt) },
    links: {
      ...blank.links,
      ...links,
      related_entries: safeArr(links.related_entries),
      quest_hooks: safeArr(links.quest_hooks),
    },
    character: {
      ...blank.character,
      ...character,
      relationships: safeArr(character.relationships),
      hooks: safeArr(character.hooks),
    },
    vault_tags: safeArr(partial.vault_tags),
    images: safeArr(partial.images),
    dm_notes: typeof partial.dm_notes === 'string' ? partial.dm_notes : '',
  };
}

// Immutable nested-path update: set(entry, ['mechanics', 'armor_class'], '16').
// Arrays are always leaf values here (assigned whole, never spread), so this
// never turns an array into a plain object.
export function setPath(obj, path, value) {
  const [head, ...rest] = path;
  if (rest.length === 0) return { ...obj, [head]: value };
  return { ...obj, [head]: setPath(obj[head] || {}, rest, value) };
}
