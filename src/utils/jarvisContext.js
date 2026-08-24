// Builds a compact "what Jarvis already knows" briefing from data that
// already exists (the Overview page + established Lore/Sessions/NPCs/
// Factions/Locations in the Codex) so he has real campaign context in every
// conversation — including a brand new chat on a different device — without
// the DM re-explaining it each time. Deliberately reuses existing structured
// data rather than building a second, redundant memory store.

function truncate(text, max = 220) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function buildCampaignDigest(overview, codexEntries = []) {
  const parts = [];

  if (overview) {
    const lines = [];
    if (overview.campaignName) lines.push(`Campaign: ${overview.campaignName}${overview.tagline ? ` — ${overview.tagline}` : ''}`);
    if (overview.premise) lines.push(`Premise: ${truncate(overview.premise, 400)}`);
    if (overview.setting) lines.push(`Setting: ${truncate(overview.setting, 400)}`);
    if (overview.multiverseConceit) lines.push(`Multiverse conceit: ${truncate(overview.multiverseConceit, 400)}`);
    if (overview.currentState) lines.push(`Current state: ${truncate(overview.currentState, 400)}`);
    if (overview.activeThreads) lines.push(`Active threads: ${truncate(overview.activeThreads, 400)}`);
    const party = (overview.party || []).filter((p) => p.name);
    if (party.length) {
      lines.push(`Party: ${party.map((p) => `${p.name}${p.classRace ? ` (${p.classRace})` : ''}`).join(', ')}`);
    }
    if (lines.length) parts.push(`CAMPAIGN OVERVIEW:\n${lines.join('\n')}`);
  }

  const lore = codexEntries.filter((e) => e.category === 'lore');
  if (lore.length) {
    const loreLines = lore.map((e) => `- ${e.title}: ${truncate(e.details?.summary || e.details?.full_text)}`);
    parts.push(`ESTABLISHED LORE:\n${loreLines.join('\n')}`);
  }

  const sessions = codexEntries
    .filter((e) => e.category === 'session')
    .sort((a, b) => Number(a.details?.session_number || 0) - Number(b.details?.session_number || 0))
    .slice(-8);
  if (sessions.length) {
    const sessionLines = sessions.map((e) => {
      const label = e.details?.session_number ? `Session ${e.details.session_number}` : e.title;
      return `- ${label}: ${truncate(e.details?.summary)}`;
    });
    parts.push(`RECENT SESSIONS (most recent last):\n${sessionLines.join('\n')}`);
  }

  const indexCats = [
    ['npc', 'NPCs'],
    ['faction', 'Factions'],
    ['location', 'Locations'],
  ];
  const grouped = indexCats
    .map(([cat, label]) => {
      const items = codexEntries.filter((e) => e.category === cat);
      if (!items.length) return null;
      const names = items.map((e) => (cat === 'npc' && e.details?.role ? `${e.title} (${e.details.role})` : e.title));
      return `${label}: ${names.join(', ')}`;
    })
    .filter(Boolean);
  if (grouped.length) {
    parts.push(`KNOWN NAMES IN THE CODEX (ask the DM if you need more detail on any of these):\n${grouped.join('\n')}`);
  }

  return parts.join('\n\n');
}

// Finds Codex entries whose title is named in a message, so Jarvis can be
// given their full, authoritative detail instead of just the name/summary
// from the digest above. Matched by plain substring against the DM's own
// text rather than relying on the model to ask for it via a tool call —
// many free/cheap OpenRouter models don't support tool-calling reliably, so
// this works the same regardless of which model is selected. Titles under 3
// characters are skipped so a short name doesn't match half the message.
export function findMentionedEntries(text, codexEntries = [], max = 5) {
  const lower = text.toLowerCase();
  return codexEntries.filter((e) => e.title && e.title.trim().length >= 3 && lower.includes(e.title.trim().toLowerCase())).slice(0, max);
}
