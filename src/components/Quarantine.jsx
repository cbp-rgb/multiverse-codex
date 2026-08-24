import { useState, useEffect, useRef } from 'react';
import { getQuarantineItems, updateQuarantineItem, discardQuarantineItem, approveToCodex, sendToQuarantine } from '../utils/db.js';
import { parseObsidianFile } from '../utils/importObsidian.js';
import { mergeWithBlankEntry } from '../utils/schema.js';
import { mergeWithBlankItemEntry } from '../utils/itemSchema.js';
import { GENERIC_CATEGORIES, mergeWithBlankGenericEntry } from '../utils/genericSchema.js';
import { ALL_CATEGORIES, ALL_CATEGORY_LABELS } from '../utils/categoryConvert.js';
import EntryPageFor from './EntryPageFor.jsx';
import ObsidianImporter from './ObsidianImporter.jsx';
import ExportButton from './ExportButton.jsx';
import PrintCard from './PrintCard.jsx';
import Divider from './Divider.jsx';
import { buildReworkSeed } from '../utils/reworkPrompt.js';

// A blank starting point for hand-building an entry, independent of Jarvis
// or an Obsidian import — same three payload shapes everything else uses.
function makeBlankEntryForCategory(category) {
  if (category === 'item') return mergeWithBlankItemEntry({}, { sourceLabel: 'Manual Entry' });
  if (GENERIC_CATEGORIES.includes(category)) return mergeWithBlankGenericEntry(category, {}, { sourceLabel: 'Manual Entry' });
  return mergeWithBlankEntry({ category, sourceLabel: 'Manual Entry' });
}

export default function Quarantine({ onChange, onAskJarvis }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [importing, setImporting] = useState(false);
  const [newCategory, setNewCategory] = useState('monster');
  const saveTimer = useRef(null);
  const fileInputRef = useRef(null);

  const refresh = async () => {
    const data = await getQuarantineItems();
    setItems(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    setLoaded(true);
  };

  useEffect(() => {
    refresh();
  }, []);

  const openItem = (item) => {
    setOpenId(item.id);
    setDraft(item);
    setSavedAt(null);
  };

  const closeItem = () => {
    setOpenId(null);
    setDraft(null);
    refresh();
  };

  const handleDraftChange = (next) => {
    setDraft(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await updateQuarantineItem(next);
      setSavedAt(new Date());
    }, 800);
  };

  const handleApprove = async () => {
    clearTimeout(saveTimer.current);
    await updateQuarantineItem(draft);
    await approveToCodex(draft);
    closeItem();
    onChange?.();
  };

  const handleDiscard = async () => {
    if (!window.confirm(`Discard "${draft.title || 'this draft'}" permanently?`)) return;
    clearTimeout(saveTimer.current);
    await discardQuarantineItem(draft.id);
    closeItem();
    onChange?.();
  };

  const handleQuickDiscard = async (item) => {
    if (!window.confirm(`Discard "${item.title || 'this draft'}" permanently?`)) return;
    await discardQuarantineItem(item.id);
    await refresh();
    onChange?.();
  };

  const handleCreateNew = async () => {
    const entry = makeBlankEntryForCategory(newCategory);
    const saved = await sendToQuarantine(entry);
    await refresh();
    onChange?.();
    openItem(saved);
  };

  const handleImportFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-selecting the same file(s) later
    if (files.length === 0) return;
    setImporting(true);
    for (const file of files) {
      const text = await file.text();
      const entry = parseObsidianFile(file.name, text);
      await sendToQuarantine(entry);
    }
    setImporting(false);
    await refresh();
    onChange?.();
  };

  if (!loaded) return null;

  if (openId && draft) {
    return (
      <div className="max-w-3xl mx-auto px-10 py-14 pb-24">
        <div className="flex items-center justify-between mb-8">
          <button onClick={closeItem} className="text-[12px] italic text-ink/50 hover:text-maroon-dark">
            ← Back to Quarantine
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
              Ask Jarvis to Rework
            </button>
            <ExportButton entry={draft} />
          </div>
        </div>

        <EntryPageFor entry={draft} editable onChange={handleDraftChange} />
        <PrintCard entry={draft} />

        <div className="flex justify-end gap-6 mt-10 border-t border-ink/10 pt-6">
          <button onClick={handleDiscard} className="text-[13px] italic text-ink/50 hover:text-maroon-dark">
            Discard
          </button>
          <button onClick={handleApprove} className="font-display text-[13px] uppercase tracking-wide text-maroon-dark hover:text-maroon-darker">
            Approve → Codex
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-10 py-14 pb-24">
      <div className="text-center mb-10">
        <div className="font-deco text-[34px] text-maroon-dark">Quarantine</div>
        <div className="italic text-ink/60 mt-2">Nothing here is canon. Read it, reshape it, or send it back to the void.</div>
        <Divider className="max-w-[180px] mx-auto mt-5" />
      </div>

      <div className="flex justify-center items-center gap-3 mb-8">
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="bg-transparent border-0 border-b border-dashed border-ink/25 outline-none text-[12px] font-display uppercase tracking-wide text-ink/60 py-2"
        >
          {ALL_CATEGORIES.map((c) => (
            <option key={c} value={c}>{ALL_CATEGORY_LABELS[c] || c}</option>
          ))}
        </select>
        <button
          onClick={handleCreateNew}
          className="font-display text-[12px] uppercase tracking-wide px-4 py-2 border border-maroon/40 rounded-sm text-maroon-dark hover:bg-maroon/5"
        >
          + Build New Entry
        </button>
      </div>

      <ObsidianImporter onImported={() => { refresh(); onChange?.(); }} />

      <div className="flex justify-center mb-10">
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.txt"
          multiple
          onChange={handleImportFiles}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="font-display text-[12px] uppercase tracking-wide px-4 py-2 border border-ink/25 rounded-sm text-ink/60 hover:bg-ink/5 disabled:opacity-40"
        >
          {importing ? 'Importing…' : 'or Import Individual Files'}
        </button>
      </div>

      {items.length === 0 && (
        <div className="text-center py-20">
          <div className="text-[32px] text-maroon/15 mb-3" aria-hidden="true">✦</div>
          <div className="italic text-ink/50">
            Nothing in quarantine right now. Anything you send from Jarvis, or import from Obsidian, lands here first.
          </div>
        </div>
      )}

      <div className="flex flex-col">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={`flex items-baseline justify-between gap-4 py-4 px-3 -mx-3 rounded-sm border-l-2 border-l-transparent hover:border-l-gold hover:bg-maroon/5 transition-colors ${idx > 0 ? 'border-t border-ink/10' : ''}`}
          >
            <button onClick={() => openItem(item)} className="flex-1 flex items-baseline justify-between gap-4 text-left">
              <span className="font-display text-lg text-maroon-dark">{item.title || 'Untitled Draft'}</span>
              <span className="text-[11px] uppercase tracking-wider text-ink/40 whitespace-nowrap">
                {item.category} · from {item.sourceLabel} · {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </button>
            <button onClick={() => handleQuickDiscard(item)} className="text-[12px] italic text-ink/40 hover:text-maroon-dark whitespace-nowrap">
              discard
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
