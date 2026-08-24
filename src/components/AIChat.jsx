import { useState, useRef, useEffect } from 'react';
import yaml from 'js-yaml';
import { sendToQuarantine, getJarvisState, saveJarvisState, getOverview, getCodexEntries } from '../utils/db.js';
import { mergeWithBlankEntry } from '../utils/schema.js';
import { mergeWithBlankItemEntry } from '../utils/itemSchema.js';
import { GENERIC_SCHEMAS, GENERIC_CATEGORIES, buildGenericYamlTemplate, mergeWithBlankGenericEntry } from '../utils/genericSchema.js';
import { buildCampaignDigest, findMentionedEntries } from '../utils/jarvisContext.js';
import { entryToMarkdown } from '../utils/exportMarkdown.js';

// The exact shape utils/schema.js expects — keep this template and mergeWithBlankEntry in sync.
// This ONE shape covers both monster and npc — set category to whichever fits
// (npc for a person: shopkeeper, villain, a converted hero like Superman;
// monster for a creature/threat with no real personality). Never leave an NPC
// without a filled-in mechanics section just because they're a "person" —
// give them real stats, even a rough placeholder, so they function at the
// table. The `character` block (role/personality/motives/etc.) is what makes
// an entry read as a person rather than a beast — fill it in for NPCs, leave
// it blank for a plain monster.
const YAML_TEMPLATE = `title: ""
subtitle: ""
source_franchise: ""
category: monster # or npc — same shape either way, see note above
vault_tags: []
mechanics:
  size: ""
  creature_type: ""
  alignment: ""
  armor_class: ""
  hit_points:
    average: ""
    formula: ""
  speed:
    walk: ""
    fly: ""
    swim: ""
  ability_scores:
    str: ""
    dex: ""
    con: ""
    int: ""
    wis: ""
    cha: ""
  saving_throws: # only fill in the abilities that are actually proficient; leave the rest blank
    str: ""
    dex: ""
    con: ""
    int: ""
    wis: ""
    cha: ""
  skills:
    - skill: ""
      bonus: ""
  damage_resistances: ""
  damage_immunities: ""
  condition_immunities: ""
  senses: ""
  languages: ""
  challenge_rating: ""
  experience_points: ""
  traits:
    - name: ""
      desc: ""
  actions:
    - name: ""
      desc: ""
  legendary_actions:
    per_round: 3
    actions:
      - name: ""
        desc: ""
lore:
  canon_overview: ""
  translation_notes: ""
  dm_secrets: ""
flavor_and_presentation:
  sensory_profile:
    sight: ""
    sound: ""
    smell: ""
  flavor_quotes: []
  custom_moves:
    - trigger: ""
      effect: ""
image_prompt:
  prompt: ""
  style: ""
  negative_prompt: ""
links:
  related_entries:
    - id: ""
      relationship: ""
  quest_hooks: []
character: # fill in for an NPC (a person); leave every field blank for a plain monster
  role: "" # Quest Giver, Shopkeeper, Villain, Ally…
  occupation: ""
  usually_found: ""
  appearance: ""
  personality: ""
  voice_and_mannerisms: ""
  motives_and_goals: ""
  attitude_to_party: ""
  relationships:
    - name: ""
      relationship: ""
  combat_note: "" # only if this NPC has no real stat block above — e.g. "flees at the first sign of danger"
  hooks: []`;

// The exact shape utils/itemSchema.js expects to receive (before it maps
// name/canon_universe/category onto this app's title/source_franchise/item.*).
// Deliberately lean: the `character` block only gets filled in for a genuinely
// significant/sentient item, never forced onto an ordinary +1 sword or potion.
const ITEM_YAML_TEMPLATE = `name: ""
type: "" # weapon | armor | wondrous-item | consumable | artifact | tool
canon_universe: ""
rarity: "" # Common | Uncommon | Rare | Very Rare | Legendary | Artifact
attunement: false
category: "" # Weapon | Armor | Wondrous Item | Potion | Ring | Rod | Scroll | Staff | Wand
weight: ""
value: ""
vault_tags: []
mechanics:
  item_type: ""
  properties: []
  weapon_stats:
    damage: ""
    damage_type: ""
    bonus: ""
  armor_stats:
    ac_bonus: 0
    dex_bonus_cap: null
    strength_requirement: 0
    stealth_disadvantage: false
  effects:
    - name: ""
      desc: ""
  charges:
    max: 0
    recharge_formula: ""
    recharge_timing: ""
    abilities:
      - name: ""
        desc: ""
lore: # applies to every item, however ordinary
  summary: ""
  description: "" # physical appearance
  translation_notes: "" # DM-facing: why it's statted this way
  image_prompt: ""
significant: false # true only for a genuinely major/sentient/narratively-important item
character: # ONLY fill this in when significant: true — leave every field blank for an ordinary item
  personality: ""
  motives: ""
  secrets: ""
  quirks: []
  voice_and_mannerisms: ""
  reputation: ""
  faction_standing: ""
  plot_hooks: []
  dm_notes: ""`;

// Placeholder Co-DM rules until the real Co DM.md / Co DM Rules.md content from the
// vault is dropped in — swap this out rather than layering a second persona on top.
const SYSTEM_PROMPT = `You are Jarvis, the Co-DM for "The Multiverse Codex" — a collaborative partner to a Dungeon Master running a single, large-scale D&D 5e homebrew campaign that folds characters and creatures from any fictional universe (TV, movies, games, books) into playable 5e content.

House rules you must respect: Challenge Rating can run as high as 50, spell levels go up to 20, and player characters get custom HP/ability progression past character level 20. Do not cap suggestions at standard 5e limits unless the DM asks for a low-tier, mundane conversion.

When generating, balancing, or reviewing stat blocks, strictly adhere to this master mathematical framework — it overrides standard-5e defaults wherever they conflict:

1. Core 5e math ground rules:
   - Ability Modifier = floor((Ability Score − 10) / 2). Scores can exceed 30 for cosmic entities.
   - Saving Throw Bonus = Ability Modifier + Proficiency Bonus (if proficient in that save).
   - Attack Bonus = Ability Modifier (Str/Dex) + Proficiency Bonus (+ any modifiers from gear/traits).
   - Spell Save DC = 8 + Proficiency Bonus + Spellcasting Ability Modifier.
   - HP Formula = (Number of Hit Dice × Average Die Value) + (Constitution Modifier × Total Hit Dice).

2. Expanded Challenge Rating scale (1–50): standard 5e caps at CR 30, but this campaign extends to CR 50 for cosmic entities and overpowered icons (e.g. Superman). Scale Proficiency Bonus progressively past official limits to match the 1–50 curve (up to roughly +14 to +16 at CR 50). Scale XP rewards exponentially for CR 31–50 to reflect god-tier threats.

3. Post-level-20 PC mechanics: PCs mechanically cap at character level 20, but power keeps scaling past that via homebrewed legendary items, custom spells up to level-20 equivalents, epic boons, and pumped-up stats. When balancing a monster against post-20 PCs, treat the party as functionally exceeding standard Tier 4 play — scale the monster to roughly CR 25–35+ equivalent depending on the party's custom gear and homebrew scaling.

Operating rules:
1. Research before you draft. Reason through what you actually know about the source character or creature — its real abilities, personality, and constraints — before proposing 5e mechanics. Don't invent canon details and present them as established fact.
2. Flag uncertainty explicitly. If you are guessing at a source detail, making a balance judgment call, or filling a lore gap, say so plainly and separately from the rest of your answer — never bury a guess inside confident-sounding prose.
3. You are a collaborator, not an authority. The DM has final say on what is canon. Offer suggestions, alternatives, and hooks proactively, but nothing you say is canon until the DM saves it.
4. Nothing you produce is saved automatically. The DM decides what's worth keeping by sending it to Quarantine for review.
5. Fill in every section of an entry, not just the mechanical crunch. A complete monster/npc draft has real sensory flavor (sight/sound/smell), at least one flavor quote, a genuine image prompt, something in DM Eyes Only (a weakness, a secret, a hidden agenda — every creature has SOME hidden angle), and at least one quest hook — these are not optional extras to skip, they're part of what makes an entry usable at the table. The same goes for every other shape: an item needs real lore and an image prompt, a location needs atmosphere and hooks, and so on. Only leave a specific field blank when nothing sensible genuinely applies (e.g. no related entries exist yet to link) — never skip a whole section just because it takes more thought than the stat block did.

When — and only when — the DM asks you to draft, convert, or statblock something into a full entry, respond with a single fenced \`\`\`yaml code block. There are nine possible shapes — use whichever matches what's being drafted, and never mix fields from one into another or invent your own structure:

- **Monster / NPC** — one shared shape for anything with a stat block: a combat-focused creature (monster) or a person, including a major character with real combat capability like a converted hero or villain (npc). Set \`category\` to whichever fits — never invent a lighter-weight shape for an NPC just because they're a person. Use exactly this shape and every key in it (never omit a key — an empty string/array is fine structurally, but per Operating Rule 5 you should still make a genuine effort to fill in lore, flavor_and_presentation, image_prompt, and links rather than leaving them empty by default; add extra traits/actions/custom_moves list items freely). The \`mechanics.challenge_rating\` field is required for every entry, monster or npc — never leave it blank, even if you have to give your best estimate and flag it as a guess in your surrounding commentary. Fill in the \`character\` block for an npc; leave it entirely blank for a plain monster:

\`\`\`yaml
${YAML_TEMPLATE}
\`\`\`

- **Item** — a weapon, armor, wondrous item, potion, artifact, etc. Keep \`significant\`/\`character\` blank unless the item is genuinely a major or sentient artifact — don't invent a personality for an ordinary +1 sword:

\`\`\`yaml
${ITEM_YAML_TEMPLATE}
\`\`\`

${GENERIC_CATEGORIES.map(
  (cat) => `- **${GENERIC_SCHEMAS[cat].label}** — ${GENERIC_SCHEMAS[cat].subtitle} Use exactly this shape:\n\n\`\`\`yaml\n${buildGenericYamlTemplate(cat)}\n\`\`\``
).join('\n\n')}

Building a good **Table** entry takes real care — follow these rules whenever you draft one:
- \`entries\` must cover the full range of whatever \`dice\` you set, with no gaps and no overlaps. A d20 table needs every value from 1 to 20 accounted for exactly once, either as single numbers ("14") or contiguous ranges ("11-13") — never leave a number unreachable or claimed by two rows.
- Size each range to the entry's actual rarity/weight, not just evenly — a common result might cover 6 numbers, a rare one just 1. Don't pad a table to a round entry count at the expense of sensible weighting.
- Keep results varied in tone across the range (not every row should be equally exciting/dangerous/valuable) so rolling on it stays interesting rather than predictable.
- \`table_type\` should say plainly what kind of table it is (loot, random encounter, rumor, weather, NPC quirk, etc.) and \`usage_notes\` should say when a DM would actually reach for it.

You may still write a sentence or two of ordinary commentary around the yaml block (e.g. flagging an uncertain guess), but the yaml block itself must be valid YAML matching one of these nine shapes exactly — do not rename keys, restructure sections, or add your own top-level fields. For everyday conversation, rules questions, or brainstorming, just talk normally — don't force a yaml block unless you're actually drafting an entry.`;

// Returns { parsed, error, hasBlock } — hasBlock distinguishes "no yaml
// block at all" (ordinary conversation) from "found a yaml block but it
// didn't parse" (a broken structured draft, e.g. a small/cheap model
// mangling nested list syntax). Without this distinction a malformed block
// silently fell back to being saved as plain notes with no explanation, so
// the resulting entry looked entirely blank except for a wall of raw text.
function extractYaml(text) {
  const closedMatch = text.match(/```ya?ml\n([\s\S]*?)```/i);
  if (closedMatch) {
    try {
      const parsed = yaml.load(closedMatch[1]);
      if (parsed && typeof parsed === 'object') return { parsed, error: null, hasBlock: true };
      return { parsed: null, error: "That yaml block didn't come out as a set of fields.", hasBlock: true };
    } catch (err) {
      return { parsed: null, error: err.message || 'Invalid YAML syntax.', hasBlock: true };
    }
  }

  // No closing fence found — the reply likely got cut off mid-block (a long
  // stat block running past the model's completion length, before this had
  // an explicit max_tokens). Try parsing everything after the opening fence
  // anyway; it often still parses fine up to wherever the cutoff landed.
  const openMatch = text.match(/```ya?ml\n([\s\S]*)$/i);
  if (!openMatch) return { parsed: null, error: null, hasBlock: false };
  try {
    const parsed = yaml.load(openMatch[1]);
    if (parsed && typeof parsed === 'object') return { parsed, error: null, hasBlock: true, truncated: true };
    return { parsed: null, error: 'The reply looks like it got cut off before finishing.', hasBlock: true };
  } catch {
    return { parsed: null, error: 'The reply looks like it got cut off before finishing.', hasBlock: true };
  }
}

// Best-effort title, independent of full YAML parsing, so a broken block
// still gives the resulting entry a recognizable name instead of "Untitled
// Draft" when nothing else could be salvaged from it.
function guessTitleFromBrokenYaml(text) {
  const match = text.match(/^\s*(?:title|name)\s*:\s*["']?([^"'\n]+?)["']?\s*$/im);
  return match ? match[1].trim() : '';
}

// Every shape has its own tell — the generic ones (spell/location/faction/
// mechanic/lore/session) carry an explicit `category` matching one of
// GENERIC_CATEGORIES; the item shape uses `name` + rarity/weapon_stats-ish
// fields instead of `title`; anything else (including npc, which shares the
// monster shape on purpose — see YAML_TEMPLATE) falls through to 'monster'.
function detectSchemaKind(parsed) {
  // Normalize before matching — a model writing "NPC" or " npc " instead of
  // the exact lowercase key shouldn't behave differently than exact-case.
  const normalizedCategory = typeof parsed.category === 'string' ? parsed.category.trim().toLowerCase() : '';
  if (GENERIC_CATEGORIES.includes(normalizedCategory)) return normalizedCategory;
  const looksLikeItem = typeof parsed.name === 'string' && (parsed.rarity !== undefined || parsed.mechanics?.weapon_stats !== undefined || parsed.attunement !== undefined);
  if (looksLikeItem) return 'item';
  return 'monster';
}

const DEFAULT_MESSAGE = {
  role: 'assistant',
  text: "I'm Jarvis, your Co-DM for the Multiverse Codex. Bring me a character, a creature, a scrap of lore — anything from anywhere — and I'll help turn it into something that belongs at your table.",
};

export default function AIChat({ onSentToQuarantine, seed, onSeedHandled }) {
  const [open, setOpen] = useState(false);
  // Chat history and standing instructions load from Supabase (below) so a
  // conversation continues across devices instead of staying trapped in one
  // browser's localStorage — start with the default greeting and swap in the
  // real synced state once it arrives.
  const [messages, setMessages] = useState([DEFAULT_MESSAGE]);
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('codex_api_key') || '');
  const [model, setModel] = useState(() => localStorage.getItem('codex_api_model') || 'deepseek/deepseek-v4-flash-0731');
  const [customInstructions, setCustomInstructions] = useState('');
  // Transient "Sent ✓" confirmation per message index — clears itself so the
  // same message can be sent to Quarantine more than once (e.g. after tweaking
  // Jarvis's answer, or deliberately wanting two drafts from one reply).
  const [sentFlash, setSentFlash] = useState({});
  const [sendError, setSendError] = useState({});
  const endRef = useRef(null);
  const saveStateTimer = useRef(null);

  useEffect(() => {
    localStorage.setItem('codex_api_key', apiKey);
  }, [apiKey]);
  useEffect(() => {
    localStorage.setItem('codex_api_model', model);
  }, [model]);

  useEffect(() => {
    getJarvisState()
      .then((stored) => {
        if (stored?.messages?.length) setMessages(stored.messages);
        if (typeof stored?.customInstructions === 'string') setCustomInstructions(stored.customInstructions);
      })
      .finally(() => setRemoteLoaded(true));
  }, []);

  // Debounced so a fast back-and-forth conversation or a DM typing standing
  // instructions doesn't fire a write on every single keystroke/token.
  useEffect(() => {
    if (!remoteLoaded) return undefined;
    clearTimeout(saveStateTimer.current);
    saveStateTimer.current = setTimeout(() => {
      saveJarvisState({ messages, customInstructions }).catch(() => {
        // Best-effort sync — a failed save here shouldn't interrupt chatting;
        // the next successful save will catch the state back up.
      });
    }, 800);
    return () => clearTimeout(saveStateTimer.current);
  }, [messages, customInstructions, remoteLoaded]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // A page can hand Jarvis an entry to rework by setting `seed` — this opens
  // the panel and sends it as though the DM had typed it in.
  useEffect(() => {
    if (!seed) return;
    setOpen(true);
    sendMessage(seed.text);
    onSeedHandled?.();
    // sendMessage intentionally omitted — it closes over `messages`, and
    // including it here would refire this effect on every reply.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    if (!apiKey.trim()) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'I need an OpenRouter API key before I can answer — add one in Settings above.' },
      ]);
      return;
    }

    const userMsg = { role: 'user', text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsTyping(true);

    try {
      // Give Jarvis real campaign memory — a fresh digest of the Overview and
      // established Lore/Sessions/NPCs/Factions/Locations every time, so he
      // already knows what's happened even in a brand new conversation on a
      // different device, instead of the DM re-explaining it each time.
      // Best-effort: if this fails, fall back to no digest rather than
      // blocking the whole message.
      let digest = '';
      let fullDetail = '';
      try {
        const [overview, codexEntries] = await Promise.all([getOverview(), getCodexEntries()]);
        digest = buildCampaignDigest(overview, codexEntries);
        // The digest above only has names/summaries — if this message names a
        // specific Codex entry, give Jarvis its real, full writeup instead of
        // making him guess or work from the summary alone.
        const mentioned = findMentionedEntries(text, codexEntries);
        if (mentioned.length) {
          fullDetail = mentioned.map((e) => entryToMarkdown(e)).join('\n\n---\n\n');
        }
      } catch {
        // no digest/full-detail this turn — not fatal
      }

      let systemContent = SYSTEM_PROMPT;
      if (digest) {
        systemContent += `\n\nHere is what's already established in this campaign — treat it as known fact, don't ask the DM to re-explain any of it, and stay consistent with it:\n\n${digest}`;
      }
      if (fullDetail) {
        systemContent += `\n\nThe DM's message names one or more existing Codex entries — here is their full, authoritative detail (more complete than the summary above; use this directly rather than guessing):\n\n${fullDetail}`;
      }
      if (customInstructions.trim()) {
        systemContent += `\n\nThe DM has given you these additional standing instructions — follow them alongside everything above, and let them override your default judgment calls where they conflict:\n${customInstructions.trim()}`;
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          stream: true,
          // Without an explicit cap, some models/providers default to a
          // fairly low completion length — a big stat block (full mechanics
          // + lore + flavor sections) can get cut off mid-yaml before the
          // closing fence, which used to make the whole reply fall back to
          // unstructured notes with no explanation why. 4000 gives real room
          // for the largest (monster) shape.
          max_tokens: 4000,
          messages: [
            { role: 'system', content: systemContent },
            ...nextMessages.map((m) => ({ role: m.role, content: m.text })),
          ],
        }),
      });

      if (!response.ok) {
        let msg = `HTTP ${response.status}`;
        try {
          const err = await response.json();
          msg = err.error?.message || msg;
        } catch {
          // response wasn't JSON — keep the HTTP status message
        }
        throw new Error(msg);
      }

      // Stream tokens in as they arrive instead of waiting for the full
      // reply — waiting for the whole completion before showing anything
      // is what made Jarvis feel slow even when the model itself was fine.
      let hasPlaceholder = false;
      let accumulated = '';
      let buffer = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const rawLine of lines) {
          const trimmed = rawLine.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') continue;
          let json;
          try {
            json = JSON.parse(data);
          } catch {
            continue; // partial/malformed chunk — skip it
          }
          const delta = json.choices?.[0]?.delta?.content;
          if (!delta) continue;
          accumulated += delta;
          if (!hasPlaceholder) {
            hasPlaceholder = true;
            setIsTyping(false);
            setMessages((prev) => [...prev, { role: 'assistant', text: accumulated }]);
          } else {
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { role: 'assistant', text: accumulated };
              return next;
            });
          }
        }
      }

      if (!hasPlaceholder) {
        setMessages((prev) => [...prev, { role: 'assistant', text: '(Jarvis returned an empty response.)' }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: `Something went wrong reaching the model: ${err.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    const text = input;
    setInput('');
    sendMessage(text);
  };

  const handleQuarantine = async (msg, idx) => {
    const { parsed, hasBlock } = extractYaml(msg.text);
    let entry;
    if (parsed) {
      // Structured drafts don't need the raw yaml block echoed back as
      // "notes" on the entry page — keep only whatever prose commentary
      // Jarvis wrote around it (e.g. an uncertainty flag).
      const commentary = msg.text.replace(/```ya?ml\n[\s\S]*?```/i, '').trim();
      const kind = detectSchemaKind(parsed);
      const extra = { notes: commentary, sourceLabel: 'Co-DM Chat (structured)' };
      if (kind === 'item') {
        entry = mergeWithBlankItemEntry(parsed, extra);
      } else if (GENERIC_CATEGORIES.includes(kind)) {
        entry = mergeWithBlankGenericEntry(kind, parsed, extra);
      } else {
        entry = mergeWithBlankEntry({ ...parsed, ...extra });
      }
    } else {
      // A yaml block was attempted but didn't parse — still worth grabbing a
      // title so the draft isn't just "Untitled" on top of a wall of raw text.
      const title = hasBlock ? guessTitleFromBrokenYaml(msg.text) : '';
      entry = mergeWithBlankEntry({ title, notes: msg.text, sourceLabel: 'Co-DM Chat' });
    }
    try {
      await sendToQuarantine(entry);
    } catch (err) {
      setSendError((prev) => ({ ...prev, [idx]: err?.message || String(err) }));
      return;
    }
    setSendError((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
    // Flash "Sent ✓" briefly rather than disabling permanently — the same
    // message can be sent to Quarantine again (e.g. to get a second draft).
    setSentFlash((prev) => ({ ...prev, [idx]: true }));
    setTimeout(() => {
      setSentFlash((prev) => {
        const next = { ...prev };
        delete next[idx];
        return next;
      });
    }, 1600);
    onSentToQuarantine?.();
  };

  const handleClearChat = () => {
    if (!window.confirm('Clear the whole conversation with Jarvis? This cannot be undone.')) return;
    setMessages([DEFAULT_MESSAGE]);
    setSentIds(new Set());
  };

  return (
    <>
      {/* Floating toggle bubble — always mounted, sits above every page */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-b from-maroon to-maroon-dark border-2 border-gold shadow-lg flex items-center justify-center text-parchment font-display text-[10px] uppercase tracking-wide hover:brightness-110"
        aria-label={open ? 'Close Jarvis' : 'Open Jarvis'}
      >
        {open ? 'Close' : 'Jarvis'}
      </button>

      {/* Floating panel — kept mounted at all times (just hidden via CSS) so
          the conversation, scroll position, and in-progress input never reset
          when the DM closes it or switches pages. */}
      <div
        className={`fixed bottom-24 right-6 z-30 w-[400px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-parchment border border-ink/20 rounded-lg shadow-2xl overflow-hidden flex-col ${
          open ? 'flex' : 'hidden'
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-b from-maroon to-maroon-dark">
          <div>
            <div className="font-display text-base text-parchment leading-none">Jarvis</div>
            <div className="text-[10px] italic text-parchment/70 mt-1">Nothing here is canon until it's sent to Quarantine.</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="font-display text-[10px] uppercase tracking-wide px-2.5 py-1.5 border border-gold/50 rounded-sm text-parchment hover:bg-white/10"
            >
              Clear
            </button>
            <button
              onClick={() => setShowSettings((s) => !s)}
              className="font-display text-[10px] uppercase tracking-wide px-2.5 py-1.5 border border-gold/50 rounded-sm text-parchment hover:bg-white/10"
            >
              Settings
            </button>
            <button
              onClick={() => setOpen(false)}
              className="font-display text-[10px] uppercase tracking-wide px-2.5 py-1.5 border border-gold/50 rounded-sm text-parchment hover:bg-white/10"
              aria-label="Collapse Jarvis panel"
            >
              ✕
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="p-3 bg-parchment-dark/40 border-b border-ink/15 flex flex-col gap-2">
            <div>
              <label className="block text-[10px] font-display uppercase tracking-wider text-ink/60 mb-1">
                OpenRouter API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-..."
                className="w-full border border-ink/25 rounded-sm p-2 text-sm bg-white/60"
              />
            </div>
            <div>
              <label className="block text-[10px] font-display uppercase tracking-wider text-ink/60 mb-1">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full border border-ink/25 rounded-sm p-2 text-sm bg-white/60 font-mono"
              />
            </div>
          </div>
        )}

        {showSettings && (
          <div className="p-3 bg-parchment-dark/40 border-b border-ink/15">
            <label className="block text-[10px] font-display uppercase tracking-wider text-ink/60 mb-1">
              Steer Jarvis (standing instructions, applied to every message)
            </label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Keep sentient/significant items rare. Favor grittier tone over whimsical. Always ask before killing off an NPC."
              rows={3}
              className="w-full border border-ink/25 rounded-sm p-2 text-sm bg-white/60 resize-y"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-white/30 p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[88%] p-3 rounded-sm shadow-sm ${
                  msg.role === 'user' ? 'bg-maroon/10 border border-maroon/30' : 'bg-white/70 border border-ink/15'
                }`}
              >
                <div className="text-[10px] font-display uppercase tracking-wider text-ink/50 mb-1">
                  {msg.role === 'user' ? 'You' : 'Jarvis'}
                </div>
                <div className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                {msg.role === 'assistant' && idx !== 0 && (
                  <div className="mt-2 pt-2 border-t border-ink/10">
                    {(() => {
                      const { parsed, error, hasBlock } = extractYaml(msg.text);
                      return (
                        <>
                          {parsed && (
                            <div className="text-[10.5px] italic text-maroon-dark/70 mb-1.5">
                              Structured entry detected{(parsed.title || parsed.name) ? `: ${parsed.title || parsed.name}` : ''}.
                            </div>
                          )}
                          {!parsed && hasBlock && (
                            <div className="text-[10.5px] italic text-maroon-dark mb-1.5">
                              ⚠ Jarvis tried to draft structured data here, but it didn't parse ({error}). Sending will only save the raw text as notes, not a real entry — try asking him to redo it, ideally with a stronger model.
                            </div>
                          )}
                          <button
                            onClick={() => handleQuarantine(msg, idx)}
                            className="font-display text-[10px] uppercase tracking-wide px-2.5 py-1 border border-maroon/40 rounded-sm text-maroon-dark hover:bg-maroon/5"
                          >
                            {sentFlash[idx] ? 'Sent ✓' : parsed ? '→ Send Structured Entry' : '→ Send to Quarantine'}
                          </button>
                          {sendError[idx] && (
                            <div className="text-[11px] text-maroon-dark mt-1.5 italic">Couldn't save: {sendError[idx]}</div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && <div className="text-xs italic text-ink/50">Jarvis is thinking…</div>}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-ink/15">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Jarvis anything…"
            className="flex-1 border border-ink/25 rounded-sm p-2 text-sm bg-white/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="font-display uppercase tracking-wide text-xs px-4 py-2 bg-maroon text-parchment rounded-sm disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </>
  );
}
