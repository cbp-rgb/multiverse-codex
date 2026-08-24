import { PageTextarea, SectionHeading } from './PageField.jsx';

// Always editable, even on a read-only (canon) page view — this is the
// running scratchpad for updating an entry as the campaign plays out, not
// part of the entry's original structured content.
export default function DMNotesSection({ entry, onChange }) {
  return (
    <>
      <SectionHeading>DM Notes (Ongoing)</SectionHeading>
      <div className="italic text-[12px] text-ink/40 mb-2 -mt-3">Session developments, lore updates, anything worth remembering next time this comes up.</div>
      <PageTextarea
        value={entry.dm_notes || ''}
        onChange={(e) => onChange?.({ ...entry, dm_notes: e.target.value })}
        placeholder="Nothing noted yet."
        rows={3}
      />
    </>
  );
}
