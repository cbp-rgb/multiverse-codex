import EntryPage from './EntryPage.jsx';
import ItemEntryPage from './ItemEntryPage.jsx';
import GenericEntryPage from './GenericEntryPage.jsx';
import { GENERIC_CATEGORIES } from '../utils/genericSchema.js';

// Picks the right renderer for an entry's category — the single place that
// knows how the seven schemas map to components.
export default function EntryPageFor({ entry, editable, onChange }) {
  if (entry.category === 'item') return <ItemEntryPage entry={entry} editable={editable} onChange={onChange} />;
  if (GENERIC_CATEGORIES.includes(entry.category)) return <GenericEntryPage entry={entry} editable={editable} onChange={onChange} />;
  return <EntryPage entry={entry} editable={editable} onChange={onChange} />;
}
