import { useState, useEffect, useRef } from 'react';
import { getCodexEntries, discardCodexEntry, updateCodexEntry } from '../utils/db.js';
import { saveMarkdownToVault, downloadMarkdown } from '../utils/exportMarkdown.js';
import EntryPageFor from './EntryPageFor.jsx';
import ExportButton from './ExportButton.jsx';
import PrintCard from './PrintCard.jsx';
import { buildReworkSeed } from '../utils/reworkPrompt.js';

export default function CategoryPage({ category, title, subtitle, onAskJarvis }) {
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [bulkStatus, setBulkStatus] = useState(null);
  const saveTimer = useRef(null);

  const refresh = () => {
    getCodexEntries().then((data) => {
      setEntries(
        data.filter((e) => e.category === category).sort((a, b) => new Date(b.approvedAt) - new Date(a.approvedAt))
      );
      setLoaded(true);
    });
  };

  useEffect(refresh, [category]);

  const openEntry = (entry) => {
    setOpenId(entry.id);
    setDraft(entry);
    setSavedAt(null);
  };

  const closeEntry = () => {
    clearTimeout(saveTimer.current);
    setOpenId(null);
    setDraft(null);
    refresh();
  };

  const handleChange = (next) => {
    setDraft(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await updateCodexEntry(next);
      setSavedAt(new Date());
    }, 800);
  };

  const handleDelete = async (entry) => {
    if (!window.confirm(`Permanently delete "${entry.title || 'this entry'}" from ${title}? This cannot be undone.`)) return;
    clearTimeout(saveTimer.current);
    await discardCodexEntry(entry.id);
    setOpenId(null);
    setDraft(null);
    refresh();
  };

  const handleBulkExport = async () => {
    if (entries.length === 0) return;
    setBulkStatus('working');
    let vaultOk = 0;
    for (const entry of entries) {
      const result = await saveMarkdownToVault(entry).catch(() => ({ ok: false }));
      if (result.ok) vaultOk += 1;
    }
    if (vaultOk === entries.length) {
      setBulkStatus(`Saved all ${vaultOk} to your vault.`);
    } else if (vaultOk > 0) {
      setBulkStatus(`Saved ${vaultOk} of ${entries.length} to your vault — connect a vault (in Quarantine) for the rest.`);
    } else {
      // No vault connected at all — fall back to individual downloads.
      entries.forEach((entry) => downloadMarkdown(entry));
      setBulkStatus(`No vault connected — downloaded all ${entries.length} files instead.`);
    }
    setTimeout(() => setBulkStatus(null), 6000);
  };

  if (!loaded) return null;

  if (openId && draft) {
    return (
      <div className="max-w-3xl mx-auto px-10 py-14 pb-24">
        <div className="flex items-center justify-between mb-8">
          <button onClick={closeEntry} className="text-[12px] italic text-ink/50 hover:text-maroon-dark">
            ← Back to {title}
          </button>
          <div className="flex items-center gap-4">
            <div className="text-[11px] italic text-ink/40">{savedAt ? `Saved ${savedAt.toLocaleTimeString()}` : ''}</div>
            <button onClick={() => window.print()} className="font-display text-[12px] uppercase tracking-wide px-4 py-2 border border-ink/25 rounded-sm text-ink/60 hover:bg-ink/5">
              Print Card
            </button>
            <button
              onClick={() => onAskJarvis?.(buildReworkSeed(draft))}
              className="font-display text-[12px] uppercase tracking-wide px-4 py-2 border border-maroon/40 rounded-sm text-maroon-dark hover:bg-maroon/5"
            >
              Ask Jarvis for a Variant
            </button>
            <ExportButton entry={draft} />
            <button onClick={() => handleDelete(draft)} className="text-[12px] italic text-ink/40 hover:text-maroon-dark">
              Delete
            </button>
          </div>
        </div>
        <EntryPageFor entry={draft} editable onChange={handleChange} />
        <PrintCard entry={draft} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-10 py-14 pb-24">
      <div className="text-center mb-10">
        <div className="font-deco text-[34px] text-maroon-dark">{title}</div>
        <div className="italic text-ink/60 mt-2">{subtitle}</div>
      </div>

      {entries.length > 0 && (
        <div className="flex flex-col items-center gap-2 mb-8">
          <button
            onClick={handleBulkExport}
            disabled={bulkStatus === 'working'}
            className="font-display text-[12px] uppercase tracking-wide px-4 py-2 border border-maroon/40 rounded-sm text-maroon-dark hover:bg-maroon/5 disabled:opacity-40"
          >
            {bulkStatus === 'working' ? 'Exporting…' : `Bulk Export ${entries.length} to Obsidian`}
          </button>
          {bulkStatus && bulkStatus !== 'working' && <div className="text-[11px] italic text-ink/50">{bulkStatus}</div>}
        </div>
      )}

      {entries.length === 0 && <div className="text-center italic text-ink/50 py-16">Nothing here yet.</div>}

      <div className="flex flex-col">
        {entries.map((entry, idx) => (
          <div
            key={entry.id}
            className={`flex items-baseline justify-between gap-4 py-4 hover:bg-maroon/5 ${idx > 0 ? 'border-t border-ink/10' : ''}`}
          >
            <button onClick={() => openEntry(entry)} className="flex-1 flex items-baseline justify-between gap-4 text-left">
              <span className="font-display text-lg text-maroon-dark">{entry.title || 'Untitled Entry'}</span>
              <span className="text-[11px] uppercase tracking-wider text-ink/40 whitespace-nowrap">{entry.source_franchise || ''}</span>
            </button>
            <button onClick={() => handleDelete(entry)} className="text-[12px] italic text-ink/40 hover:text-maroon-dark whitespace-nowrap">
              delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
