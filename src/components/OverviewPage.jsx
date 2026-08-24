import { useState, useEffect, useRef } from 'react';
import { getOverview, saveOverview } from '../utils/db.js';
import { PageInput, PageTextarea, SectionHeading } from './PageField.jsx';
import Divider from './Divider.jsx';
import CornerFlourish from './CornerFlourish.jsx';

const BLANK_OVERVIEW = {
  campaignName: '',
  tagline: '',
  premise: '',
  setting: '',
  tone: '',
  houseRules: '',
  multiverseConceit: '',
  party: [{ name: '', player: '', classRace: '', hook: '' }],
  currentState: '',
  activeThreads: '',
};

export default function OverviewPage() {
  const [data, setData] = useState(BLANK_OVERVIEW);
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    getOverview().then((stored) => {
      if (stored) {
        setData({
          ...BLANK_OVERVIEW,
          ...stored,
          party: stored.party?.length ? stored.party : BLANK_OVERVIEW.party,
        });
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return undefined;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveOverview(data).then(() => setSavedAt(new Date()));
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [data, loaded]);

  const update = (field, value) => setData((prev) => ({ ...prev, [field]: value }));

  const updatePartyRow = (idx, field, value) => {
    setData((prev) => {
      const party = [...prev.party];
      party[idx] = { ...party[idx], [field]: value };
      return { ...prev, party };
    });
  };

  const addPartyRow = () => {
    setData((prev) => ({ ...prev, party: [...prev.party, { name: '', player: '', classRace: '', hook: '' }] }));
  };

  const removePartyRow = (idx) => {
    setData((prev) => ({ ...prev, party: prev.party.filter((_, i) => i !== idx) }));
  };

  if (!loaded) return null;

  return (
    <div className="max-w-3xl mx-auto px-10 py-14 pb-24">
      <div className="flex justify-end h-4 mb-2">
        <div className="text-[11px] italic text-ink/40">{savedAt ? `Saved ${savedAt.toLocaleTimeString()}` : ''}</div>
      </div>

      <div className="relative px-4">
        <CornerFlourish />
        <input
          value={data.campaignName}
          onChange={(e) => update('campaignName', e.target.value)}
          placeholder="Name Your Campaign"
          className="w-full bg-transparent border-0 outline-none font-deco text-center text-[52px] text-maroon-dark placeholder:text-maroon-dark/30"
        />
        <input
          value={data.tagline}
          onChange={(e) => update('tagline', e.target.value)}
          placeholder="A one-line tagline for what this campaign is about"
          className="w-full bg-transparent border-0 outline-none text-center italic font-bold text-[17px] text-ink/70 mt-2 placeholder:text-ink/30 placeholder:font-normal"
        />
      </div>

      <Divider className="max-w-md mx-auto mt-8 mb-2" />

      {/* The pitch — given real visual weight as the anchor of the page,
          rather than looking identical to every section below it. */}
      <div className="mt-8 relative bg-maroon/[0.04] border border-maroon/20 rounded-sm p-6">
        <div className="text-[11px] font-display uppercase tracking-wider text-maroon-dark/70 mb-2 flex items-center gap-2">
          <span className="text-gold">✦</span> The Premise
        </div>
        <PageTextarea
          value={data.premise}
          onChange={(e) => update('premise', e.target.value)}
          rows={4}
          placeholder="What is this campaign actually about? The central conflict, the stakes, the feeling you want at the table."
          className="text-[16px]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 mt-4">
        <div>
          <SectionHeading>Setting Snapshot</SectionHeading>
          <PageTextarea
            value={data.setting}
            onChange={(e) => update('setting', e.target.value)}
            rows={5}
            placeholder="The home world, its key regions, and where the party starts."
          />
        </div>
        <div>
          <SectionHeading>Tone &amp; Pillars</SectionHeading>
          <PageTextarea
            value={data.tone}
            onChange={(e) => update('tone', e.target.value)}
            rows={5}
            placeholder="Genre and tone, table expectations, how combat / exploration / social weigh against each other."
          />
        </div>
      </div>

      {/* House rules read as a designer's ruling, not campaign prose — give
          it the same gold callout treatment as an entry's Designer's Notes. */}
      <div className="mt-10 bg-gold/[0.08] border-l-4 border-gold rounded-r-sm p-5">
        <div className="font-display text-sm font-bold text-maroon-dark uppercase tracking-wide mb-2">House Rules, In Brief</div>
        <PageTextarea
          value={data.houseRules}
          onChange={(e) => update('houseRules', e.target.value)}
          rows={3}
          placeholder="CR up to 50, spell levels to 20, custom post-20 progression — the quick version; full rules live elsewhere."
          className="text-[15px]"
        />
      </div>

      <div className="mt-6 border border-ink/15 rounded-sm p-6">
        <div className="text-[11px] font-display uppercase tracking-wider text-ink/50 mb-2 flex items-center gap-2">
          <span className="text-maroon/60">◈</span> The Multiverse Conceit
        </div>
        <PageTextarea
          value={data.multiverseConceit}
          onChange={(e) => update('multiverseConceit', e.target.value)}
          rows={4}
          placeholder="How crossovers work in this world, and the canon philosophy behind converting outside material into it."
        />
      </div>

      <SectionHeading>The Party</SectionHeading>
      <div className="border border-ink/15 rounded-sm overflow-hidden">
        <div className="grid grid-cols-[1.2fr_1fr_1.2fr_2fr_auto] gap-3 text-[10px] font-display uppercase tracking-wider text-ink/50 px-4 py-2 bg-maroon/[0.05] border-b border-ink/10">
          <div>Character</div>
          <div>Player</div>
          <div>Class &amp; Race</div>
          <div>Hook</div>
          <div></div>
        </div>
        {data.party.map((row, idx) => (
          <div
            key={idx}
            className={`grid grid-cols-[1.2fr_1fr_1.2fr_2fr_auto] gap-3 items-center px-4 py-2.5 hover:bg-maroon/[0.03] ${idx > 0 ? 'border-t border-ink/10' : ''}`}
          >
            <PageInput value={row.name} onChange={(e) => updatePartyRow(idx, 'name', e.target.value)} placeholder="—" />
            <PageInput value={row.player} onChange={(e) => updatePartyRow(idx, 'player', e.target.value)} placeholder="—" />
            <PageInput value={row.classRace} onChange={(e) => updatePartyRow(idx, 'classRace', e.target.value)} placeholder="—" />
            <PageInput value={row.hook} onChange={(e) => updatePartyRow(idx, 'hook', e.target.value)} placeholder="—" />
            <button onClick={() => removePartyRow(idx)} className="text-[11px] text-ink/40 hover:text-maroon-dark italic">
              remove
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addPartyRow}
        className="self-start text-[12px] font-display uppercase tracking-wide text-maroon-dark/70 hover:text-maroon-dark mt-2"
      >
        + Add Party Member
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 mt-10">
        <div className="bg-parchment-dark/40 border border-ink/15 rounded-sm p-5">
          <div className="text-[11px] font-display uppercase tracking-wider text-maroon-dark/70 mb-2">Current State of the World</div>
          <PageTextarea
            value={data.currentState}
            onChange={(e) => update('currentState', e.target.value)}
            rows={5}
            placeholder="Where things stand right now — update this as the campaign moves forward."
            className="text-[15px]"
          />
        </div>
        <div className="bg-parchment-dark/40 border border-ink/15 rounded-sm p-5">
          <div className="text-[11px] font-display uppercase tracking-wider text-maroon-dark/70 mb-2">Active Threads &amp; Hooks</div>
          <PageTextarea
            value={data.activeThreads}
            onChange={(e) => update('activeThreads', e.target.value)}
            rows={5}
            placeholder="Open mysteries, dangling plot threads, things the party hasn't followed up on yet."
            className="text-[15px]"
          />
        </div>
      </div>
    </div>
  );
}
