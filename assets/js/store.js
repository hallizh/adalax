/*
 * Staðbundin geymsla: mæld hnit, minnispunktar og leiðréttar merkingar á
 * kortamyndunum. Allt liggur í localStorage — engin netþjónusta, engin skráning.
 */

const KEY = 'adalax.v1';

const empty = () => ({
  fixes: {}, // poolId -> { lat, lon, acc, at }
  notes: {}, // poolId -> string
  spots: {}, // poolId -> { x, y }   (leiðrétt staða á kortamynd)
});

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
  } catch {
    return empty();
  }
}

let state = read();
const listeners = new Set();

function commit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* fullt eða læst — höldum áfram með gildin í minni */
  }
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const getFix = (id) => state.fixes[id] || null;
export const getNote = (id) => state.notes[id] || '';
export const getSpot = (id) => state.spots[id] || null;
export const fixCount = () => Object.keys(state.fixes).length;

export function setFix(id, { lat, lon, acc }) {
  state.fixes[id] = { lat, lon, acc, at: new Date().toISOString() };
  commit();
}

export function clearFix(id) {
  delete state.fixes[id];
  commit();
}

export function setNote(id, text) {
  const trimmed = text.trim();
  if (trimmed) state.notes[id] = trimmed;
  else delete state.notes[id];
  commit();
}

export function setSpot(id, x, y) {
  state.spots[id] = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  commit();
}

/** Hnit veiðistaðar: mæling ef til er, annars áætlun úr data.js. */
export function resolved(pool) {
  const fix = state.fixes[pool.id];
  if (fix) return { lat: fix.lat, lon: fix.lon, measured: true, at: fix.at, acc: fix.acc };
  return { lat: pool.lat, lon: pool.lon, measured: false };
}

/** Staða á kortamynd: leiðrétting ef til er, annars upprunaleg ágiskun. */
export function resolvedSpot(pool) {
  const spot = state.spots[pool.id];
  return spot ? { x: spot.x, y: spot.y, moved: true } : { x: pool.x, y: pool.y, moved: false };
}

export function exportAll() {
  return JSON.stringify({ app: 'adalax', version: 1, savedAt: new Date().toISOString(), ...state }, null, 2);
}

export function importAll(json) {
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== 'object') throw new Error('Ógild skrá');
  state = {
    fixes: { ...state.fixes, ...(parsed.fixes || {}) },
    notes: { ...state.notes, ...(parsed.notes || {}) },
    spots: { ...state.spots, ...(parsed.spots || {}) },
  };
  commit();
}

export function resetAll() {
  state = empty();
  commit();
}
