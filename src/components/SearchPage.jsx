import { useState, useEffect, useMemo, useRef } from 'react';
import { getCodexEntries, discardCodexEntry, updateCodexEntry } from '../utils/db.js';
import { buildSearchIndex, searchEntries, getSnippet } from '../utils/search.js';
import { ALL_CATEGORY_LABELS } from '../utils/categoryConvert.js';
import EntryPageFor from './EntryPageFor.jsx';
import ExportButton from './ExportButton.jsx';
import PrintCard from './PrintCard.jsx';
import Divider from './Divider.jsx';
import { buildReworkSeed } from '../utils/reworkPrompt.js';

function Snippet({ entry, query }) {
  const result = getSnippet(entry, query);
  if (!result || typeof result === 'string') return <span className="italic text-ink/40">{result}</span>;
  const { text, matchStart, matchLen } = result;
  return (
    <span>
      {text.slice(0, matchStart)}
      <mark className="bg-gold/30 text-ink not-italic">{text.slice(matchStart, matchStart + matchLen)}</mark>
      {text.slice(matchStart + matchLen)}
    </span>
  );
}

export default function SearchPage({ onAskJarvis }) {
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const saveTimer = useRef(null);

  const refresh = () => {
    getCodexEntries().then((data) => {
      setEntries(data);
      setLoaded(true);
    });
  };

  useEffect(refresh, []);

  const index = useMemo(() => buildSearchIndex(entries), [entries]);
  const results = useMemo(() => (query.trim() ? searchEntries(index, query) : []), [index, query]);

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
    if (!window.confirm(`Permanently delete "${entry.title || 'this entry'}"? This cannot be undone.`)) return;
    clearTimeout(saveTimer.current);
    await discardCodexEntry(entry.id);
    setOpenId(null);
    setDraft(null);
    refresh();
  };

  if (!loaded) return null;

  if (openId && draft) {
    return (
      <div className="max-w-3xl mx-auto px-10 py-14 pb-24">
        <div className="flex items-center justify-between mb-8">
          <button onClick={closeEntry} className="text-[12px] italic text-ink/50 hover:text-maroon-dark">
            ← Back to Search
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
        <div className="font-deco text-[34px] text-maroon-dark">Search</div>
        <div className="italic text-ink/60 mt-2">Every word of every entry in the Codex — stats, lore, secrets, notes, all of it.</div>
        <Divider className="max-w-[180px] mx-auto mt-5" />
      </div>

      <div className="mb-10">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the whole Codex…"
          className="w-full text-center bg-transparent border-0 border-b border-dashed border-ink/30 focus:border-maroon/60 outline-none py-3 text-lg placeholder:text-ink/30 placeholder:italic"
        />
      </div>

      {!query.trim() && (
        <div className="text-center py-20">
          <div className="text-[32px] text-maroon/15 mb-3" aria-hidden="true">✦</div>
          <div className="italic text-ink/50">Start typing to search across every category in the Codex.</div>
        </div>
      )}

      {query.trim() && results.length === 0 && (
        <div className="text-center py-20">
          <div className="text-[32px] text-maroon/15 mb-3" aria-hidden="true">✦</div>
          <div className="italic text-ink/50">Nothing matches "{query}" — Quarantine drafts aren't searched here, only approved Codex entries.</div>
        </div>
      )}

      {query.trim() && results.length > 0 && (
        <>
          <div className="text-[11px] uppercase tracking-wider text-ink/40 mb-4 text-center">
            {results.length} result{results.length === 1 ? '' : 's'}
          </div>
          <div className="flex flex-col">
            {results.map((entry, idx) => (
              <button
                key={entry.id}
                onClick={() => openEntry(entry)}
                className={`text-left py-4 px-3 -mx-3 rounded-sm border-l-2 border-l-transparent hover:border-l-gold hover:bg-maroon/5 transition-colors ${idx > 0 ? 'border-t border-ink/10' : ''}`}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-display text-lg text-maroon-dark">{entry.title || 'Untitled Entry'}</span>
                  <span className="text-[10px] uppercase tracking-wider text-ink/40 whitespace-nowrap border border-ink/20 rounded-full px-2.5 py-0.5">
                    {ALL_CATEGORY_LABELS[entry.category] || entry.category}
                  </span>
                </div>
                <div className="text-[13px] text-ink/60 mt-1 leading-relaxed">
                  <Snippet entry={entry} query={query} />
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
