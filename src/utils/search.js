import { entryToMarkdown } from './exportMarkdown.js';

// One search corpus per entry, covering everything — title, tags, the full
// stat block, lore, secrets, character fields, table rows, all of it —
// reusing entryToMarkdown() rather than hand-listing searchable fields again
// per shape, so search automatically stays complete as new fields get added.
export function buildSearchIndex(entries) {
  return entries.map((entry) => ({
    entry,
    corpus: `${entry.title}\n${entry.subtitle}\n${entry.source_franchise}\n${(entry.vault_tags || []).join(' ')}\n${entryToMarkdown(entry)}`.toLowerCase(),
  }));
}

function queryWords(query) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

// Every word in the query must appear somewhere in the entry — precise
// rather than noisy on a multi-word search, same as how most people expect
// search to behave.
export function searchEntries(index, query) {
  const words = queryWords(query);
  if (!words.length) return [];
  return index.filter(({ corpus }) => words.every((w) => corpus.includes(w))).map(({ entry }) => entry);
}

// A short, readable snippet of context around the first match, so a result
// shows WHY it matched instead of just a bare title.
export function getSnippet(entry, query, radius = 90) {
  const words = queryWords(query);
  if (!words.length) return '';
  const corpus = entryToMarkdown(entry).replace(/[#*_>`|-]/g, ' ').replace(/\s+/g, ' ').trim();
  const lower = corpus.toLowerCase();
  let matchIndex = -1;
  let matchLen = 0;
  for (const w of words) {
    const idx = lower.indexOf(w);
    if (idx !== -1 && (matchIndex === -1 || idx < matchIndex)) {
      matchIndex = idx;
      matchLen = w.length;
    }
  }
  if (matchIndex === -1) return corpus.slice(0, radius * 2);
  const start = Math.max(0, matchIndex - radius);
  const end = Math.min(corpus.length, matchIndex + matchLen + radius);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < corpus.length ? '…' : '';
  return { text: prefix + corpus.slice(start, end) + suffix, matchStart: matchIndex - start + prefix.length, matchLen };
}
