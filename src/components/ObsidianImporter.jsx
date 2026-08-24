import { useState, useEffect, useRef } from 'react';
import { getVaultHandle, saveVaultHandle, clearVaultHandle, sendToQuarantine } from '../utils/db.js';
import { parseObsidianFile } from '../utils/importObsidian.js';

const MD_EXT = /\.(md|markdown|txt)$/i;

async function listEntries(dirHandle) {
  const folders = [];
  const files = [];
  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === 'directory') folders.push({ name, handle });
    else if (MD_EXT.test(name)) files.push({ name, handle });
  }
  folders.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));
  return { folders, files };
}

export default function ObsidianImporter({ onImported }) {
  const supported = typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
  const [status, setStatus] = useState('checking'); // checking | disconnected | needs-permission | connected
  const [entries, setEntries] = useState({ folders: [], files: [] });
  const [pathStack, setPathStack] = useState([]); // [{ name, handle }] from vault root
  const [importedNames, setImportedNames] = useState(() => new Set());
  const [importingName, setImportingName] = useState(null);
  const rootHandle = useRef(null);

  const openFolder = async (handle, name) => {
    const { folders, files } = await listEntries(handle);
    setEntries({ folders, files });
    return { folders, files };
  };

  useEffect(() => {
    if (!supported) {
      setStatus('disconnected');
      return;
    }
    (async () => {
      const handle = await getVaultHandle();
      if (!handle) {
        setStatus('disconnected');
        return;
      }
      rootHandle.current = handle;
      const perm = await handle.queryPermission({ mode: 'readwrite' });
      if (perm === 'granted') {
        setPathStack([{ name: handle.name, handle }]);
        await openFolder(handle);
        setStatus('connected');
      } else {
        setStatus('needs-permission');
      }
    })();
  }, [supported]);

  const connectVault = async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      await saveVaultHandle(handle);
      rootHandle.current = handle;
      setPathStack([{ name: handle.name, handle }]);
      await openFolder(handle);
      setStatus('connected');
    } catch {
      // user cancelled the picker — nothing to do
    }
  };

  const reconnectVault = async () => {
    const handle = rootHandle.current;
    if (!handle) return;
    const perm = await handle.requestPermission({ mode: 'readwrite' });
    if (perm === 'granted') {
      setPathStack([{ name: handle.name, handle }]);
      await openFolder(handle);
      setStatus('connected');
    }
  };

  const disconnectVault = async () => {
    if (!window.confirm('Disconnect this vault folder? You can reconnect any time.')) return;
    await clearVaultHandle();
    rootHandle.current = null;
    setPathStack([]);
    setEntries({ folders: [], files: [] });
    setStatus('disconnected');
  };

  const navigateInto = async (handle, name) => {
    const nextStack = [...pathStack, { name, handle }];
    setPathStack(nextStack);
    await openFolder(handle);
  };

  const navigateToBreadcrumb = async (idx) => {
    const nextStack = pathStack.slice(0, idx + 1);
    setPathStack(nextStack);
    await openFolder(nextStack[nextStack.length - 1].handle);
  };

  const importFile = async (fileHandle, name) => {
    setImportingName(name);
    const file = await fileHandle.getFile();
    const text = await file.text();
    const entry = parseObsidianFile(name, text);
    await sendToQuarantine(entry);
    setImportedNames((prev) => new Set(prev).add(name));
    setImportingName(null);
    onImported?.();
  };

  if (status === 'checking') return null;

  if (!supported) {
    return (
      <div className="text-center text-[12px] italic text-ink/40 mb-10">
        Persistent vault browsing needs a Chromium browser (Chrome or Edge) — use "Import Files" below instead.
      </div>
    );
  }

  if (status === 'disconnected') {
    return (
      <div className="flex justify-center mb-6">
        <button
          onClick={connectVault}
          className="font-display text-[12px] uppercase tracking-wide px-4 py-2 border border-maroon/40 rounded-sm text-maroon-dark hover:bg-maroon/5"
        >
          + Connect Obsidian Vault Folder
        </button>
      </div>
    );
  }

  if (status === 'needs-permission') {
    return (
      <div className="flex justify-center mb-6">
        <button
          onClick={reconnectVault}
          className="font-display text-[12px] uppercase tracking-wide px-4 py-2 border border-gold rounded-sm text-maroon-dark hover:bg-gold/10"
        >
          Reconnect to Obsidian Vault
        </button>
      </div>
    );
  }

  return (
    <div className="mb-12 border border-ink/15 rounded-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-wrap items-center gap-1 text-[12px]">
          {pathStack.map((crumb, idx) => (
            <span key={idx} className="flex items-center gap-1">
              {idx > 0 && <span className="text-ink/30">/</span>}
              <button
                onClick={() => navigateToBreadcrumb(idx)}
                className={`hover:text-maroon-dark ${idx === pathStack.length - 1 ? 'font-bold text-maroon-dark' : 'text-ink/60'}`}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>
        <button onClick={disconnectVault} className="text-[11px] italic text-ink/40 hover:text-maroon-dark whitespace-nowrap">
          disconnect
        </button>
      </div>

      <div className="flex flex-col gap-1">
        {entries.folders.length === 0 && entries.files.length === 0 && (
          <div className="text-[12px] italic text-ink/40 py-2">Empty folder.</div>
        )}
        {entries.folders.map((f) => (
          <button
            key={f.name}
            onClick={() => navigateInto(f.handle, f.name)}
            className="flex items-center gap-2 text-left text-[13px] py-1.5 px-2 rounded-sm hover:bg-maroon/5"
          >
            <span className="text-gold">▸</span> {f.name}
          </button>
        ))}
        {entries.files.map((f) => (
          <div key={f.name} className="flex items-center justify-between gap-2 text-[13px] py-1.5 px-2 rounded-sm hover:bg-maroon/5">
            <span className="truncate">{f.name}</span>
            <button
              onClick={() => importFile(f.handle, f.name)}
              disabled={importingName === f.name}
              className="font-display text-[10px] uppercase tracking-wide px-2.5 py-1 border border-maroon/40 rounded-sm text-maroon-dark disabled:opacity-40 hover:bg-maroon/5 whitespace-nowrap"
            >
              {importingName === f.name ? 'Importing…' : importedNames.has(f.name) ? 'Imported ✓ (again?)' : 'Import'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
