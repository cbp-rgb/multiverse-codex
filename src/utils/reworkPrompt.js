import yaml from 'js-yaml';

// Strips app-internal bookkeeping (ids, timestamps, base64 images) before
// handing an entry back to Jarvis as context — he only needs the content.
function cleanEntry(entry) {
  const { id, createdAt, approvedAt, sourceLabel, images, ...rest } = entry;
  return rest;
}

// Builds a { id, text } seed for AIChat's `seed` prop — opening the panel and
// sending this as though the DM had typed it, so Jarvis has the entry's full
// content to rework or riff on.
export function buildReworkSeed(entry) {
  const yamlText = yaml.dump(cleanEntry(entry));
  return {
    id: `rework-${Date.now()}`,
    text: `Here's an existing entry, "${entry.title || 'Untitled'}," for you to rework or riff on:\n\n\`\`\`yaml\n${yamlText}\`\`\`\n\nPropose a reworked version, or ask what direction I want (tougher, weirder, a specific variant, etc.) before drafting one.`,
  };
}
