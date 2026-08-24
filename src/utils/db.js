const DB_NAME = 'MultiverseCodexDB';
const DB_VERSION = 1;
const QUARANTINE_STORE = 'quarantine';
const CODEX_STORE = 'codex';
const OVERVIEW_STORE = 'overview';
const HANDLE_STORE = 'handles';

function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(QUARANTINE_STORE)) {
        db.createObjectStore(QUARANTINE_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(CODEX_STORE)) {
        db.createObjectStore(CODEX_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(OVERVIEW_STORE)) {
        db.createObjectStore(OVERVIEW_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(HANDLE_STORE)) {
        db.createObjectStore(HANDLE_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAll(storeName) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function put(storeName, item) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(item);
    tx.oncomplete = () => resolve(item);
    tx.onerror = () => reject(tx.error);
  });
}

async function remove(storeName, id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getQuarantineItems() {
  return getAll(QUARANTINE_STORE);
}

export function getCodexEntries() {
  return getAll(CODEX_STORE);
}

export function discardCodexEntry(id) {
  return remove(CODEX_STORE, id);
}

// Canon entries are editable in place — approving something isn't a one-way
// door, since lore and item availability keep evolving as the campaign runs.
export function updateCodexEntry(entry) {
  return put(CODEX_STORE, entry);
}

// entry should already be a full schema-shaped object — see mergeWithBlankEntry
// in utils/schema.js. sourceLabel/notes describe where it came from.
export function sendToQuarantine(entry) {
  const item = {
    ...entry,
    id: makeId('q'),
    createdAt: new Date().toISOString(),
  };
  return put(QUARANTINE_STORE, item);
}

export function updateQuarantineItem(item) {
  return put(QUARANTINE_STORE, item);
}

export function discardQuarantineItem(id) {
  return remove(QUARANTINE_STORE, id);
}

// The only path onto the Codex is approving something out of Quarantine —
// nothing else in the app is allowed to write to the codex store directly.
export async function approveToCodex(quarantineItem) {
  const entry = {
    ...quarantineItem,
    id: makeId('codex'),
    approvedAt: new Date().toISOString(),
  };
  await put(CODEX_STORE, entry);
  await remove(QUARANTINE_STORE, quarantineItem.id);
  return entry;
}

export async function getOverview() {
  const all = await getAll(OVERVIEW_STORE);
  return all.find((o) => o.id === 'main') || null;
}

export function saveOverview(data) {
  return put(OVERVIEW_STORE, { ...data, id: 'main' });
}

// FileSystemDirectoryHandle is structured-cloneable in Chromium, so it can be
// stored directly in IndexedDB — this is what makes the Obsidian vault
// connection persist across reloads instead of re-picking a folder every time.
export async function getVaultHandle() {
  const all = await getAll(HANDLE_STORE);
  const rec = all.find((h) => h.id === 'obsidianVault');
  return rec ? rec.handle : null;
}

export function saveVaultHandle(handle) {
  return put(HANDLE_STORE, { id: 'obsidianVault', handle });
}

export function clearVaultHandle() {
  return remove(HANDLE_STORE, 'obsidianVault');
}
