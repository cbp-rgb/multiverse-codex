import { useState, useRef, useEffect } from 'react';
import yaml from 'js-yaml';
import { sendToQuarantine } from '../utils/db.js';
import { mergeWithBlankEntry } from '../utils/schema.js';
import { mergeWithBlankItemEntry } from '../utils/itemSchema.js';
import { GENERIC_SCHEMAS, GENERIC_CATEGORIES, buildGenericYamlTemplate, mergeWithBlankGenericEntry } from '../utils/genericSchema.js';

// The exact shape utils/schema.js expects — keep this template and mergeWithBlankEntry in sync.
const YAML_TEMPLATE = `title: ""
subtitle: ""
source_franchise: ""
category: monster # this shape is for monsters only — NPCs use the separate NPC shape below
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
  quest_hooks: []`;

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

Operating rules:
1. Research before you draft. Reason through what you actually know about the source character or creature — its real abilities, personality, and constraints — before proposing 5e mechanics. Don't invent canon details and present them as established fact.
2. Flag uncertainty explicitly. If you are guessing at a source detail, making a balance judgment call, or filling a lore gap, say so plainly and separately from the rest of your answer — never bury a guess inside confident-sounding prose.
3. You are a collaborator, not an authority. The DM has final say on what is canon. Offer suggestions, alternatives, and hooks proactively, but nothing you say is canon until the DM saves it.
4. Nothing you produce is saved automatically. The DM decides what's worth keeping by sending it to Quarantine for review.

When — and only when — the DM asks you to draft, convert, or statblock something into a full entry, respond with a single fenced \`\`\`yaml code block. There are seven possible shapes, one per category — use whichever matches what's being drafted, and never mix fields from one into another or invent your own structure:

- **Monster** — a combat-focused creature. Use exactly this shape (leave a field blank/empty rather than omitting its key; add extra traits/actions/custom_moves list items freely). The \`challenge_rating\` field is required — never leave it blank, even if you have to give your best estimate and flag it as a guess in your surrounding commentary:

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

You may still write a sentence or two of ordinary commentary around the yaml block (e.g. flagging an uncertain guess), but the yaml block itself must be valid YAML matching one of these seven shapes exactly — do not rename keys, restructure sections, or add your own top-level fields. For everyday conversation, rules questions, or brainstorming, just talk normally — don't force a yaml block unless you're actually drafting an entry.`;

function extractYaml(text) {
  const match = text.match(/```ya?ml\n([\s\S]*?)```/i);
  if (!match) return null;
  try {
    const parsed = yaml.load(match[1]);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

// Every shape has its own tell — the generic ones carry an explicit
// `category` matching one of GENERIC_CATEGORIES; the item shape uses `name` +
// rarity/weapon_stats-ish fields instead of `title`; anything else is treated
// as the creature (monster) shape, the long-standing default.
function detectSchemaKind(parsed) {
  // Normalize before matching — a model writing "NPC" or " npc " instead of
  // the exact lowercase key shouldn't silently fall through to the wrong
  // schema (this previously sent real NPC drafts through the monster
  // template, rendering as a mostly-empty stat block).
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
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('codex_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [DEFAULT_MESSAGE];
      }
    }
    return [DEFAULT_MESSAGE];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('codex_api_key') || '');
  const [model, setModel] = useState(() => localStorage.getItem('codex_api_model') || 'meta-llama/llama-3.1-8b-instruct');
  const [customInstructions, setCustomInstructions] = useState(() => localStorage.getItem('codex_custom_instructions') || '');
  // Transient "Sent ✓" confirmation per message index — clears itself so the
  // same message can be sent to Quarantine more than once (e.g. after tweaking
  // Jarvis's answer, or deliberately wanting two drafts from one reply).
  const [sentFlash, setSentFlash] = useState({});
  const endRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('codex_api_key', apiKey);
  }, [apiKey]);
  useEffect(() => {
    localStorage.setItem('codex_api_model', model);
  }, [model]);
  useEffect(() => {
    localStorage.setItem('codex_custom_instructions', customInstructions);
  }, [customInstructions]);
  useEffect(() => {
    localStorage.setItem('codex_chat_history', JSON.stringify(messages));
  }, [messages]);
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
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          stream: true,
          messages: [
            {
              role: 'system',
              content: customInstructions.trim()
                ? `${SYSTEM_PROMPT}\n\nThe DM has given you these additional standing instructions — follow them alongside everything above, and let them override your default judgment calls where they conflict:\n${customInstructions.trim()}`
                : SYSTEM_PROMPT,
            },
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
    const parsed = extractYaml(msg.text);
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
      entry = mergeWithBlankEntry({ notes: msg.text, sourceLabel: 'Co-DM Chat' });
    }
    await sendToQuarantine(entry);
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
                      const parsed = extractYaml(msg.text);
                      return (
                        <>
                          {parsed && (
                            <div className="text-[10.5px] italic text-maroon-dark/70 mb-1.5">
                              Structured entry detected{(parsed.title || parsed.name) ? `: ${parsed.title || parsed.name}` : ''}.
                            </div>
                          )}
                          <button
                            onClick={() => handleQuarantine(msg, idx)}
                            className="font-display text-[10px] uppercase tracking-wide px-2.5 py-1 border border-maroon/40 rounded-sm text-maroon-dark hover:bg-maroon/5"
                          >
                            {sentFlash[idx] ? 'Sent ✓' : parsed ? '→ Send Structured Entry' : '→ Send to Quarantine'}
                          </button>
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
