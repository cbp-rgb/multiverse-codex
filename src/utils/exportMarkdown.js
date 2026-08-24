import { getVaultHandle } from './db.js';
import { getGenericSchema, GENERIC_CATEGORIES } from './genericSchema.js';

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

function sanitizeFilename(name) {
  return (name || 'Untitled Entry').replace(/[\\/:*?"<>|]/g, '').trim() || 'Untitled Entry';
}

function line(label, value) {
  return value ? `**${label}** ${value}` : null;
}

export function entryToMarkdown(entry) {
  if (entry.category === 'item') return itemToMarkdown(entry);
  if (GENERIC_CATEGORIES.includes(entry.category)) return genericToMarkdown(entry);
  return creatureToMarkdown(entry);
}

function genericToMarkdown(entry) {
  const schema = getGenericSchema(entry.category);
  const details = entry.details || {};
  const lines = [];

  lines.push('---');
  lines.push(`title: "${(entry.title || '').replace(/"/g, '\\"')}"`);
  if (entry.source_franchise) lines.push(`source_franchise: "${entry.source_franchise.replace(/"/g, '\\"')}"`);
  lines.push(`category: ${entry.category}`);
  if (entry.vault_tags?.length) lines.push(`tags: [${entry.vault_tags.join(', ')}]`);
  lines.push('---', '');

  lines.push(`# ${entry.title || `Untitled ${schema?.label || 'Entry'}`}`);
  if (entry.source_franchise) lines.push(`*${entry.source_franchise}*`);
  lines.push('');

  for (const field of schema?.fields || []) {
    const value = details[field.key];
    if (field.type === 'list') {
      if (!value?.length) continue;
      lines.push(`**${field.label}**`);
      value.forEach((v) => lines.push(`- ${v}`));
      lines.push('');
    } else if (field.type === 'pairs') {
      if (!value?.length) continue;
      lines.push(`**${field.label}**`);
      value.forEach((v) => lines.push(`- ${v[field.pairFields[0]] || ''}${v[field.pairFields[1]] ? ` — ${v[field.pairFields[1]]}` : ''}`));
      lines.push('');
    } else if (field.type === 'table') {
      if (!value?.length) continue;
      const [rollKey, resultKey] = field.pairFields;
      lines.push(`**${field.label}**`, '', '| Roll | Result |', '|---|---|');
      value.forEach((v) => lines.push(`| ${v[rollKey] || ''} | ${v[resultKey] || ''} |`));
      lines.push('');
    } else if (value) {
      lines.push(`**${field.label}:** ${value}`, '');
    }
  }

  if (entry.dm_notes) lines.push('## DM Notes (Ongoing)', entry.dm_notes, '');
  if (entry.notes) lines.push('## Original Notes', entry.notes, '');

  return lines.join('\n');
}

function creatureToMarkdown(entry) {
  const lines = [];

  lines.push('---');
  lines.push(`title: "${(entry.title || '').replace(/"/g, '\\"')}"`);
  if (entry.subtitle) lines.push(`subtitle: "${entry.subtitle.replace(/"/g, '\\"')}"`);
  if (entry.source_franchise) lines.push(`source_franchise: "${entry.source_franchise.replace(/"/g, '\\"')}"`);
  lines.push(`category: ${entry.category}`);
  if (entry.vault_tags?.length) lines.push(`tags: [${entry.vault_tags.join(', ')}]`);
  lines.push('---');
  lines.push('');

  lines.push(`# ${entry.title || 'Untitled Entry'}`);
  if (entry.subtitle || entry.source_franchise) {
    lines.push(`*${[entry.subtitle, entry.source_franchise].filter(Boolean).join(' — ')}*`);
  }
  lines.push('');

  const c = entry.character;
  const hasCharacter =
    c &&
    (c.role || c.occupation || c.usually_found || c.appearance || c.personality || c.voice_and_mannerisms || c.motives_and_goals || c.attitude_to_party || c.combat_note || c.relationships?.length || c.hooks?.length);
  if (hasCharacter) {
    lines.push('## Character');
    [
      line('Role', c.role),
      line('Occupation', c.occupation),
      line('Usually Found', c.usually_found),
    ]
      .filter(Boolean)
      .forEach((l) => lines.push(l));
    if (c.appearance) lines.push('', '**Appearance:** ' + c.appearance);
    if (c.personality) lines.push('', '**Personality:** ' + c.personality);
    if (c.voice_and_mannerisms) lines.push('', '**Voice & Mannerisms:** ' + c.voice_and_mannerisms);
    if (c.motives_and_goals) lines.push('', '**Motives & Goals:** ' + c.motives_and_goals);
    if (c.attitude_to_party) lines.push('', '**Attitude to the Party:** ' + c.attitude_to_party);
    if (c.relationships?.length) {
      lines.push('', '**Relationships**');
      c.relationships.forEach((r) => lines.push(`- ${r.name}${r.relationship ? ` — ${r.relationship}` : ''}`));
    }
    if (c.combat_note) lines.push('', '**Combat Notes:** ' + c.combat_note);
    if (c.hooks?.length) {
      lines.push('', '**Hooks**');
      c.hooks.forEach((h) => lines.push(`- ${h}`));
    }
    lines.push('');
  }

  const m = entry.mechanics;
  const hasMechanics = m.size || m.creature_type || m.armor_class || m.hit_points.average || m.traits.length || m.actions.length;
  if (hasMechanics) {
    lines.push('## Stat Block');
    const typeLine = [m.size, m.creature_type].filter(Boolean).join(' ') + (m.alignment ? `, ${m.alignment}` : '');
    if (typeLine.trim()) lines.push(`*${typeLine}*`);
    lines.push('');

    [
      line('Armor Class', m.armor_class),
      line('Hit Points', [m.hit_points.average, m.hit_points.formula].filter(Boolean).join(' / ')),
      line('Speed', ['walk ' + m.speed.walk, m.speed.fly && `fly ${m.speed.fly}`, m.speed.swim && `swim ${m.speed.swim}`].filter(Boolean).join(', ')),
    ]
      .filter(Boolean)
      .forEach((l) => lines.push(l));
    lines.push('');

    if (ABILITIES.some((a) => m.ability_scores[a])) {
      lines.push('| STR | DEX | CON | INT | WIS | CHA |');
      lines.push('|---|---|---|---|---|---|');
      lines.push(`| ${ABILITIES.map((a) => m.ability_scores[a] || '—').join(' | ')} |`);
      lines.push('');
    }

    const savingThrowsText = ABILITIES.filter((a) => m.saving_throws[a])
      .map((a) => `${a[0].toUpperCase()}${a.slice(1)} ${m.saving_throws[a]}`)
      .join(', ');
    const skillsText = (m.skills || [])
      .filter((s) => s.skill)
      .map((s) => `${s.skill} ${s.bonus}`)
      .join(', ');

    [
      line('Saving Throws', savingThrowsText),
      line('Skills', skillsText),
      line('Damage Resistances', m.damage_resistances),
      line('Damage Immunities', m.damage_immunities),
      line('Condition Immunities', m.condition_immunities),
      line('Senses', m.senses),
      line('Languages', m.languages),
      line('Challenge', [m.challenge_rating, m.experience_points && `(${m.experience_points} XP)`].filter(Boolean).join(' ')),
    ]
      .filter(Boolean)
      .forEach((l) => lines.push(l));
    lines.push('');

    if (m.traits.length) {
      lines.push('### Traits');
      m.traits.forEach((t) => lines.push(`**${t.name || 'Untitled'}.** ${t.desc || ''}`));
      lines.push('');
    }
    if (m.actions.length) {
      lines.push('### Actions');
      m.actions.forEach((a) => lines.push(`**${a.name || 'Untitled'}.** ${a.desc || ''}`));
      lines.push('');
    }
    if (m.legendary_actions.actions.length) {
      lines.push('### Legendary Actions');
      if (m.legendary_actions.per_round) lines.push(`*Can take ${m.legendary_actions.per_round} legendary actions.*`);
      m.legendary_actions.actions.forEach((a) => lines.push(`**${a.name || 'Untitled'}.** ${a.desc || ''}`));
      lines.push('');
    }
  }

  if (entry.lore.canon_overview) {
    lines.push('## Canon Overview', entry.lore.canon_overview, '');
  }
  if (entry.lore.translation_notes) {
    lines.push("## Designer's Notes", entry.lore.translation_notes, '');
  }
  if (entry.lore.dm_secrets) {
    lines.push('## DM Eyes Only', entry.lore.dm_secrets, '');
  }

  const sp = entry.flavor_and_presentation.sensory_profile;
  if (sp.sight || sp.sound || sp.smell) {
    lines.push('## Flavor & Presentation');
    if (sp.sight) lines.push(`**Sight:** ${sp.sight}`);
    if (sp.sound) lines.push(`**Sound:** ${sp.sound}`);
    if (sp.smell) lines.push(`**Smell:** ${sp.smell}`);
    lines.push('');
  }
  if (entry.flavor_and_presentation.flavor_quotes.length) {
    entry.flavor_and_presentation.flavor_quotes.forEach((q) => lines.push(`> "${q}"`));
    lines.push('');
  }
  if (entry.flavor_and_presentation.custom_moves.length) {
    lines.push('### Custom Moves');
    entry.flavor_and_presentation.custom_moves.forEach((mv) => lines.push(`- **When** ${mv.trigger} — **Then** ${mv.effect}`));
    lines.push('');
  }

  const ip = entry.image_prompt;
  if (ip.prompt || ip.style || ip.negative_prompt) {
    lines.push('## Image Prompt');
    if (ip.prompt) lines.push(`**Prompt:** ${ip.prompt}`);
    if (ip.style) lines.push(`**Style:** ${ip.style}`);
    if (ip.negative_prompt) lines.push(`**Negative Prompt:** ${ip.negative_prompt}`);
    lines.push('');
  }

  if (entry.links.related_entries.length || entry.links.quest_hooks.length) {
    lines.push('## Cross-Vault Linkages');
    if (entry.links.related_entries.length) {
      lines.push('### Related Entries');
      entry.links.related_entries.forEach((r) => lines.push(`- ${r.id} — *${r.relationship}*`));
      lines.push('');
    }
    if (entry.links.quest_hooks.length) {
      lines.push('### Quest Hooks');
      entry.links.quest_hooks.forEach((h) => lines.push(`- ${h}`));
      lines.push('');
    }
  }

  if (entry.dm_notes) {
    lines.push('## DM Notes (Ongoing)', entry.dm_notes, '');
  }

  if (entry.notes) {
    lines.push('## Original Notes', entry.notes, '');
  }

  return lines.join('\n');
}

function itemToMarkdown(entry) {
  const lines = [];
  const item = entry.item || {};
  const m = item.mechanics || {};
  const lore = item.lore || {};
  const character = item.character || {};

  lines.push('---');
  lines.push(`title: "${(entry.title || '').replace(/"/g, '\\"')}"`);
  if (entry.source_franchise) lines.push(`source_franchise: "${entry.source_franchise.replace(/"/g, '\\"')}"`);
  lines.push(`category: ${entry.category}`);
  if (item.item_class) lines.push(`type: ${item.item_class}`);
  if (item.rarity) lines.push(`rarity: ${item.rarity}`);
  if (entry.vault_tags?.length) lines.push(`tags: [${entry.vault_tags.join(', ')}]`);
  lines.push('---', '');

  lines.push(`# ${entry.title || 'Untitled Item'}`);
  if (entry.source_franchise) lines.push(`*${entry.source_franchise}*`);
  lines.push('');

  lines.push('## Item Stat Block');
  lines.push(`*${[item.rarity, item.item_category].filter(Boolean).join(' ')}${item.attunement ? ', requires attunement' : ''}*`);
  lines.push('');
  [line('Weight', item.weight), line('Value', item.value), line('Type', m.item_type)].filter(Boolean).forEach((l) => lines.push(l));
  if (m.properties?.length) lines.push(`**Properties** ${m.properties.join(', ')}`);
  if (m.weapon_stats?.damage) lines.push(`**Weapon** ${m.weapon_stats.damage} ${m.weapon_stats.damage_type}${m.weapon_stats.bonus ? `, ${m.weapon_stats.bonus}` : ''}`);
  if (m.armor_stats?.ac_bonus) lines.push(`**Armor** +${m.armor_stats.ac_bonus} AC`);
  if (m.charges?.max) lines.push(`**Charges** ${m.charges.max} (recharges ${m.charges.recharge_formula || '?'} ${m.charges.recharge_timing || ''})`.trim());
  lines.push('');

  if (m.effects?.length) {
    lines.push('### Effects');
    m.effects.forEach((e) => lines.push(`**${e.name || 'Untitled'}.** ${e.desc || ''}`));
    lines.push('');
  }
  if (m.charges?.abilities?.length) {
    lines.push('### Charged Abilities');
    m.charges.abilities.forEach((a) => lines.push(`**${a.name || 'Untitled'}.** ${a.desc || ''}`));
    lines.push('');
  }

  if (lore.summary || lore.description) {
    lines.push('## Lore & Design');
    if (lore.summary) lines.push(lore.summary, '');
    if (lore.description) lines.push(`**Appearance:** ${lore.description}`, '');
  }
  if (lore.translation_notes) {
    lines.push(`**Designer's Notes:** ${lore.translation_notes}`, '');
  }

  if (item.significant) {
    lines.push('## Character');
    if (character.personality) lines.push(`**Personality:** ${character.personality}`, '');
    if (character.motives) lines.push(`**Motives:** ${character.motives}`, '');
    if (character.secrets) lines.push(`**Secrets:** ${character.secrets}`, '');
    if (character.quirks?.length) lines.push(`**Quirks:** ${character.quirks.join(', ')}`, '');
    if (character.voice_and_mannerisms) lines.push(`**Voice & Mannerisms:** ${character.voice_and_mannerisms}`, '');
    if (character.reputation) lines.push(`**Reputation:** ${character.reputation}`, '');
    if (character.faction_standing) lines.push(`**Faction Standing:** ${character.faction_standing}`, '');
    if (character.plot_hooks?.length) {
      lines.push('### Plot Hooks');
      character.plot_hooks.forEach((h) => lines.push(`- ${h}`));
      lines.push('');
    }
    if (character.dm_notes) lines.push(`**DM Notes:** ${character.dm_notes}`, '');
  }

  if (lore.image_prompt) {
    lines.push('## Image Prompt', lore.image_prompt, '');
  }

  if (entry.dm_notes) lines.push('## DM Notes (Ongoing)', entry.dm_notes, '');
  if (entry.notes) lines.push('## Original Notes', entry.notes, '');

  return lines.join('\n');
}

export function downloadMarkdown(entry) {
  const md = entryToMarkdown(entry);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(entry.title)}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Writes straight into the connected vault (in a "The Multiverse Codex" subfolder,
// created if needed) rather than making the DM drag a downloaded file in by hand.
export async function saveMarkdownToVault(entry) {
  const vaultHandle = await getVaultHandle();
  if (!vaultHandle) return { ok: false, reason: 'not-connected' };

  let perm = await vaultHandle.queryPermission({ mode: 'readwrite' });
  if (perm !== 'granted') {
    perm = await vaultHandle.requestPermission({ mode: 'readwrite' });
  }
  if (perm !== 'granted') return { ok: false, reason: 'no-permission' };

  const folder = await vaultHandle.getDirectoryHandle('The Multiverse Codex', { create: true });
  const filename = `${sanitizeFilename(entry.title)}.md`;
  const fileHandle = await folder.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(entryToMarkdown(entry));
  await writable.close();
  return { ok: true, filename };
}
