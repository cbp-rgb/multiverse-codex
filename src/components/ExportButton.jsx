import { useState } from 'react';
import { saveMarkdownToVault, downloadMarkdown } from '../utils/exportMarkdown.js';

export default function ExportButton({ entry }) {
  const [status, setStatus] = useState(null);

  const handleExport = async () => {
    setStatus('working');
    const result = await saveMarkdownToVault(entry).catch(() => ({ ok: false, reason: 'error' }));
    if (result.ok) {
      setStatus(`Saved to vault as "${result.filename}"`);
    } else {
      downloadMarkdown(entry);
      setStatus('Vault not connected — downloaded instead.');
    }
    setTimeout(() => setStatus(null), 5000);
  };

  return (
    <div className="flex items-center gap-3">
      {status && status !== 'working' && <span className="text-[11px] italic text-ink/50">{status}</span>}
      <button
        onClick={handleExport}
        disabled={status === 'working'}
        className="font-display text-[12px] uppercase tracking-wide px-4 py-2 border border-maroon/40 rounded-sm text-maroon-dark hover:bg-maroon/5 disabled:opacity-40 whitespace-nowrap"
      >
        {status === 'working' ? 'Exporting…' : 'Export to Obsidian'}
      </button>
    </div>
  );
}
