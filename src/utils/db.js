import { requireSupabase } from './supabaseClient.js';

// Quarantine/Codex/Overview live in Supabase Postgres now, so the campaign
// data itself is shared across every device instead of trapped in one
// browser's IndexedDB. Each row stores the app's existing entry object
// verbatim as jsonb (`data`) — the `id`/`category`/`created_at` columns
// exist only for indexing and RLS, the shape callers get back is unchanged
// from the old IndexedDB version, so nothing outside this file had to move.
const QUARANTINE_TABLE = 'quarantine_items';
const CODEX_TABLE = 'codex_entries';
const OVERVIEW_TABLE = 'overview_data';
const JARVIS_STATE_TABLE = 'jarvis_state';

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function getAllRows(table) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from(table).select('data').order('created_at', { ascending: true });
  if (error) throw error;
  return data.map((row) => row.data);
}

async function putRow(table, entry, extraColumns = {}) {
  const supabase = requireSupabase();
  const { error } = await supabase.from(table).upsert({ id: entry.id, data: entry, ...extraColumns });
  if (error) throw error;
  return entry;
}

async function removeRow(table, id) {
  const supabase = requireSupabase();
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
  return true;
}

export function getQuarantineItems() {
  return getAllRows(QUARANTINE_TABLE);
}

export function getCodexEntries() {
  return getAllRows(CODEX_TABLE);
}

export function discardCodexEntry(id) {
  return removeRow(CODEX_TABLE, id);
}

// Canon entries are editable in place — approving something isn't a one-way
// door, since lore and item availability keep evolving as the campaign runs.
export function updateCodexEntry(entry) {
  return putRow(CODEX_TABLE, entry, { category: entry.category });
}

// entry should already be a full schema-shaped object — see mergeWithBlankEntry
// in utils/schema.js. sourceLabel/notes describe where it came from.
export function sendToQuarantine(entry) {
  const item = {
    ...entry,
    id: makeId('q'),
    createdAt: new Date().toISOString(),
  };
  return putRow(QUARANTINE_TABLE, item);
}

export function updateQuarantineItem(item) {
  return putRow(QUARANTINE_TABLE, item);
}

export function discardQuarantineItem(id) {
  return removeRow(QUARANTINE_TABLE, id);
}

// The only path onto the Codex is approving something out of Quarantine —
// nothing else in the app is allowed to write to the codex table directly.
export async function approveToCodex(quarantineItem) {
  const entry = {
    ...quarantineItem,
    id: makeId('codex'),
    approvedAt: new Date().toISOString(),
  };
  await putRow(CODEX_TABLE, entry, { category: entry.category });
  await removeRow(QUARANTINE_TABLE, quarantineItem.id);
  return entry;
}

export async function getOverview() {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from(OVERVIEW_TABLE).select('data').eq('id', 'main').maybeSingle();
  if (error) throw error;
  return data ? data.data : null;
}

export async function saveOverview(data) {
  const supabase = requireSupabase();
  const entry = { ...data, id: 'main' };
  const { error } = await supabase.from(OVERVIEW_TABLE).upsert({ id: 'main', data: entry });
  if (error) throw error;
  return entry;
}

// Jarvis's chat history + standing "Steer Jarvis" instructions — synced so a
// conversation started on one device continues seamlessly on another,
// instead of each browser having its own separate localStorage copy.
export async function getJarvisState() {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from(JARVIS_STATE_TABLE).select('data').eq('id', 'main').maybeSingle();
  if (error) throw error;
  return data ? data.data : null;
}

export async function saveJarvisState(state) {
  const supabase = requireSupabase();
  const entry = { ...state, id: 'main' };
  const { error } = await supabase.from(JARVIS_STATE_TABLE).upsert({ id: 'main', data: entry });
  if (error) throw error;
  return entry;
}

// --- Obsidian vault folder handle ---
// A FileSystemDirectoryHandle only means something on the device that picked
// it — it's an OS-level permission grant, not data, so it stays local in
// IndexedDB rather than moving to Supabase. Each device connects its own
// vault folder once; that's a real, inherent limitation of the cloud move,
// not an oversight.
const HANDLE_DB_NAME = 'MultiverseCodexDB';
const HANDLE_DB_VERSION = 1;
const HANDLE_STORE = 'handles';

function getHandleDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(HANDLE_DB_NAME, HANDLE_DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(HANDLE_STORE)) {
        db.createObjectStore(HANDLE_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function handleStoreGetAll() {
  const db = await getHandleDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, 'readonly');
    const req = tx.objectStore(HANDLE_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function handleStorePut(item) {
  const db = await getHandleDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, 'readwrite');
    tx.objectStore(HANDLE_STORE).put(item);
    tx.oncomplete = () => resolve(item);
    tx.onerror = () => reject(tx.error);
  });
}

async function handleStoreRemove(id) {
  const db = await getHandleDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, 'readwrite');
    tx.objectStore(HANDLE_STORE).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// FileSystemDirectoryHandle is structured-cloneable in Chromium, so it can be
// stored directly in IndexedDB — this is what makes the Obsidian vault
// connection persist across reloads instead of re-picking a folder every time.
export async function getVaultHandle() {
  const all = await handleStoreGetAll();
  const rec = all.find((h) => h.id === 'obsidianVault');
  return rec ? rec.handle : null;
}

export function saveVaultHandle(handle) {
  return handleStorePut({ id: 'obsidianVault', handle });
}

export function clearVaultHandle() {
  return handleStoreRemove('obsidianVault');
}
