import { useState, useEffect, useRef } from 'react';
import { getOverview, saveOverview } from '../utils/db.js';
import { PageInput, PageTextarea, SectionHeading } from './PageField.jsx';
import Divider from './Divider.jsx';

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

      <Divider className="max-w-xs mx-auto mt-8" />

      <SectionHeading>The Premise</SectionHeading>
      <PageTextarea
        value={data.premise}
        onChange={(e) => update('premise', e.target.value)}
        rows={4}
        placeholder="What is this campaign actually about? The central conflict, the stakes, the feeling you want at the table."
      />

      <SectionHeading>Setting Snapshot</SectionHeading>
      <PageTextarea
        value={data.setting}
        onChange={(e) => update('setting', e.target.value)}
        rows={4}
        placeholder="The home world, its key regions, and where the party starts."
      />

      <SectionHeading>Tone &amp; Pillars</SectionHeading>
      <PageTextarea
        value={data.tone}
        onChange={(e) => update('tone', e.target.value)}
        rows={3}
        placeholder="Genre and tone, table expectations, how combat / exploration / social weigh against each other."
      />

      <SectionHeading>House Rules, In Brief</SectionHeading>
      <PageTextarea
        value={data.houseRules}
        onChange={(e) => update('houseRules', e.target.value)}
        rows={3}
        placeholder="CR up to 50, spell levels to 20, custom post-20 progression — the quick version; full rules live elsewhere."
      />

      <SectionHeading>The Multiverse Conceit</SectionHeading>
      <PageTextarea
        value={data.multiverseConceit}
        onChange={(e) => update('multiverseConceit', e.target.value)}
        rows={4}
        placeholder="How crossovers work in this world, and the canon philosophy behind converting outside material into it."
      />

      <SectionHeading>The Party</SectionHeading>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-[1.2fr_1fr_1.2fr_2fr_auto] gap-3 text-[10px] font-display uppercase tracking-wider text-ink/50 px-1">
          <div>Character</div>
          <div>Player</div>
          <div>Class &amp; Race</div>
          <div>Hook</div>
          <div></div>
        </div>
        {data.party.map((row, idx) => (
          <div key={idx} className="grid grid-cols-[1.2fr_1fr_1.2fr_2fr_auto] gap-3 items-center border-b border-ink/10 pb-2">
            <PageInput value={row.name} onChange={(e) => updatePartyRow(idx, 'name', e.target.value)} placeholder="—" />
            <PageInput value={row.player} onChange={(e) => updatePartyRow(idx, 'player', e.target.value)} placeholder="—" />
            <PageInput value={row.classRace} onChange={(e) => updatePartyRow(idx, 'classRace', e.target.value)} placeholder="—" />
            <PageInput value={row.hook} onChange={(e) => updatePartyRow(idx, 'hook', e.target.value)} placeholder="—" />
            <button onClick={() => removePartyRow(idx)} className="text-[11px] text-ink/40 hover:text-maroon-dark italic">
              remove
            </button>
          </div>
        ))}
        <button
          onClick={addPartyRow}
          className="self-start text-[12px] font-display uppercase tracking-wide text-maroon-dark/70 hover:text-maroon-dark mt-1"
        >
          + Add Party Member
        </button>
      </div>

      <SectionHeading>Current State of the World</SectionHeading>
      <PageTextarea
        value={data.currentState}
        onChange={(e) => update('currentState', e.target.value)}
        rows={4}
        placeholder="Where things stand right now — update this as the campaign moves forward."
      />

      <SectionHeading>Active Threads &amp; Hooks</SectionHeading>
      <PageTextarea
        value={data.activeThreads}
        onChange={(e) => update('activeThreads', e.target.value)}
        rows={4}
        placeholder="Open mysteries, dangling plot threads, things the party hasn't followed up on yet."
      />
    </div>
  );
}
