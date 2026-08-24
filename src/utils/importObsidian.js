import yaml from 'js-yaml';
import { mergeWithBlankEntry, CATEGORIES } from './schema.js';
import { mergeWithBlankItemEntry } from './itemSchema.js';

// Obsidian notes are plain markdown, usually with an optional YAML frontmatter
// block up top. We lift whatever recognizable fields we can out of the
// frontmatter and dump the rest of the note body into `notes` — the same
// catch-all field the Co-DM chat uses for unstructured text — so nothing is
// ever lost even when a note doesn't match this app's schema at all (which is
// the common case, since most of the vault predates this app).
export function parseObsidianFile(filename, text) {
  const guessedTitle = filename.replace(/\.(md|markdown|txt)$/i, '').trim();
  const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  let frontmatter = {};
  let body = text;
  if (fmMatch) {
    try {
      frontmatter = yaml.load(fmMatch[1]) || {};
    } catch {
      frontmatter = {};
    }
    body = text.slice(fmMatch[0].length);
  }

  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags
    : Array.isArray(frontmatter.vault_tags)
      ? frontmatter.vault_tags
      : [];

  const category = CATEGORIES.includes(frontmatter.category) ? frontmatter.category : 'monster';
  const sourceLabel = `Imported from Obsidian (${filename})`;

  if (category === 'item') {
    return mergeWithBlankItemEntry(
      { name: frontmatter.title || guessedTitle, canon_universe: frontmatter.source_franchise || frontmatter.franchise || '', vault_tags: tags },
      { notes: body.trim(), sourceLabel }
    );
  }

  return mergeWithBlankEntry({
    title: frontmatter.title || guessedTitle,
    source_franchise: frontmatter.source_franchise || frontmatter.franchise || '',
    category,
    vault_tags: tags,
    notes: body.trim(),
    sourceLabel,
  });
}
