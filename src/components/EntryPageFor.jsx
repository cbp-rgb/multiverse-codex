import EntryPage from './EntryPage.jsx';
import ItemEntryPage from './ItemEntryPage.jsx';
import GenericEntryPage from './GenericEntryPage.jsx';
import { GENERIC_CATEGORIES } from '../utils/genericSchema.js';
import { mergeWithBlankEntry } from '../utils/schema.js';

// Picks the right renderer for an entry's category — the single place that
// knows how the schemas map to components.
export default function EntryPageFor({ entry, editable, onChange }) {
  if (entry.category === 'item') return <ItemEntryPage entry={entry} editable={editable} onChange={onChange} />;
  if (GENERIC_CATEGORIES.includes(entry.category)) return <GenericEntryPage entry={entry} editable={editable} onChange={onChange} />;
  // NPC used to be a separate, lighter schema (before it was unified with
  // Monster) — an entry saved back then has `details`, not `mechanics`.
  // Normalize on the way in rather than crashing on the missing keys; the
  // normalized shape gets saved back for real the next time it's edited.
  const normalized = entry.mechanics ? entry : mergeWithBlankEntry(entry);
  return <EntryPage entry={normalized} editable={editable} onChange={onChange} />;
}
