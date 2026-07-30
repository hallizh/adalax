/* Samsetning: svæðaval, kortin tvö, veiðistaðaspjald og staðsetning. */

import { ZONES, RULES, SOURCE, allPools } from './data.js';
import * as store from './store.js';
import { createZoneMap } from './zonemap.js';
import { createRealMap } from './realmap.js';
import * as geo from './geo.js';

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
};

const POOLS = allPools();
const byId = new Map(POOLS.map((p) => [p.id, p]));

const state = {
  zoneId: Number(new URLSearchParams(location.search).get('svaedi')) || 1,
  poolId: null,
  view: matchMedia('(min-width: 900px)').matches ? 'both' : 'drawing',
  me: null,
  geoError: null,
  editing: new URLSearchParams(location.search).has('edit'),
};

let zoneMap;
let realMap;
let stopWatch = null;

/* ------------------------------------------------------------------ svæðaval */

function renderZoneTabs() {
  const bar = $('#zones');
  bar.innerHTML = '';
  for (const zone of ZONES) {
    const btn = el('button', 'zonetab');
    btn.type = 'button';
    btn.style.setProperty('--zone-color', zone.color);
    btn.classList.toggle('is-active', zone.id === state.zoneId);
    btn.setAttribute('aria-pressed', String(zone.id === state.zoneId));
    btn.append(el('strong', null, String(zone.id)), el('span', null, zone.place));
    btn.addEventListener('click', () => selectZone(zone.id));
    bar.append(btn);
  }
}

function currentZone() {
  return ZONES.find((z) => z.id === state.zoneId) || ZONES[0];
}

function zonePools(zoneId = state.zoneId) {
  return POOLS.filter((p) => p.zoneId === zoneId);
}

async function selectZone(id) {
  state.zoneId = id;
  state.poolId = null;
  const url = new URL(location.href);
  url.searchParams.set('svaedi', String(id));
  history.replaceState(null, '', url);

  renderZoneTabs();
  renderZoneHeader();
  renderPoolList();
  closeSheet();

  await zoneMap.load(currentZone(), zonePools());
  zoneMap.setMe(state.me);
  zoneMap.setEditing(state.editing);
  realMap.setZone(id);
  realMap.fitZone(id);
}

function renderZoneHeader() {
  const zone = currentZone();
  const head = $('#zonehead');
  head.innerHTML = '';
  head.style.setProperty('--zone-color', zone.color);

  head.append(el('h2', 'zonehead__title', `${zone.name} · ${zone.place}`));

  const halves = el('div', 'zonehead__halves');
  for (const half of zone.halves) {
    const chip = el('span', 'halfchip');
    chip.append(el('b', null, half.id), el('span', null, half.range));
    halves.append(chip);
  }
  head.append(halves);

  if (zone.note) head.append(el('p', 'zonehead__note', zone.note));
}

/* ------------------------------------------------------- listi yfir veiðistaði */

/**
 * Fjarlægðarmerki á hverri röð, geymd sér.
 * Staðsetning uppfærist á nokkurra sekúndna fresti; væri listinn endurbyggður
 * í hvert sinn myndi röð hverfa undan fingrinum í miðju taps.
 */
const distTags = new Map();

function renderPoolList() {
  distTags.clear();
  const zone = currentZone();
  const list = $('#pools');
  list.innerHTML = '';

  zone.halves.forEach((half) => {
    const section = el('section', 'half');
    section.style.setProperty('--zone-color', zone.color);

    const heading = el('h3', 'half__head');
    heading.append(el('span', 'half__badge', half.id), el('span', 'half__range', half.range));
    section.append(heading);

    const ul = el('ul', 'half__list');
    half.pools.forEach((pool, i) => {
      const full = byId.get(`${zone.id}${half.id}-${i}`);
      if (!full) return;
      const li = el('li');
      const btn = el('button', 'poolrow');
      btn.type = 'button';
      btn.dataset.id = full.id;
      btn.classList.toggle('is-active', full.id === state.poolId);

      const num = el('span', 'poolrow__n', full.label);
      const name = el('span', 'poolrow__name', full.name);
      const meta = el('span', 'poolrow__meta');

      if (store.getFix(full.id)) meta.append(el('span', 'tag tag--measured', 'mælt'));
      if (full.outside) meta.append(el('span', 'tag tag--outside', 'utan skiptingar'));
      if (store.getNote(full.id)) meta.append(el('span', 'tag', 'minnispunktur'));

      const dist = el('span', 'tag tag--dist');
      dist.hidden = true;
      meta.append(dist);
      distTags.set(full.id, dist);

      btn.append(num, name, meta);
      btn.addEventListener('click', () => selectPool(full.id));
      li.append(btn);
      ul.append(li);
    });

    section.append(ul);
    list.append(section);
  });

  updateDistances();
}

/** Uppfærir fjarlægðir án þess að hreyfa við DOM-byggingunni. */
function updateDistances() {
  for (const [id, tag] of distTags) {
    const pool = byId.get(id);
    if (!pool || !state.me) {
      tag.hidden = true;
      continue;
    }
    const r = store.resolved(pool);
    const d = geo.distance([state.me.lat, state.me.lon], [r.lat, r.lon]);
    tag.textContent = geo.formatDistance(d);
    tag.classList.toggle('tag--soft', !r.measured);
    tag.hidden = false;
  }
}

/* ----------------------------------------------------------- veiðistaðaspjald */

function selectPool(id) {
  state.poolId = id;
  zoneMap.select(id);
  zoneMap.centerOn(id);
  realMap.select(id);
  realMap.flyToPool(id);
  document.querySelectorAll('.poolrow').forEach((b) => b.classList.toggle('is-active', b.dataset.id === id));
  openSheet(id);
}

function openSheet(id) {
  const pool = byId.get(id);
  if (!pool) return;
  const sheet = $('#sheet');
  const body = $('#sheet-body');
  body.innerHTML = '';
  sheet.hidden = false;
  sheet.style.setProperty('--zone-color', pool.color);

  const title = el('div', 'sheet__title');
  title.append(
    el('h3', null, pool.name),
    el('p', null, `${pool.zoneName} · hluti ${pool.halfId}${pool.outside ? ' · utan skiptingar' : ''}`),
  );
  body.append(title);

  const r = store.resolved(pool);

  const coords = el('div', 'coords');
  coords.append(
    el('code', null, `${r.lat.toFixed(5)}, ${r.lon.toFixed(5)}`),
    el(
      'span',
      `tag ${r.measured ? 'tag--measured' : 'tag--soft'}`,
      r.measured ? `mælt ${new Date(r.at).toLocaleDateString('is-IS')}` : 'áætlað',
    ),
  );
  body.append(coords);

  if (!r.measured) {
    body.append(
      el(
        'p',
        'hint',
        'Þetta hnit er ágiskun út frá teikningunni. Stattu á staðnum og skráðu hann til að fá rétta staðsetningu.',
      ),
    );
  }

  if (state.me) {
    const d = geo.distance([state.me.lat, state.me.lon], [r.lat, r.lon]);
    const b = geo.bearing([state.me.lat, state.me.lon], [r.lat, r.lon]);
    body.append(el('p', 'distline', `${geo.formatDistance(d)} í ${geo.compass(b)} frá þér`));
  }

  const actions = el('div', 'sheet__actions');

  const capture = el('button', 'btn btn--primary', 'Ég er hér');
  capture.type = 'button';
  capture.addEventListener('click', () => captureFix(pool, capture));
  actions.append(capture);

  if (r.measured) {
    const clear = el('button', 'btn', 'Hreinsa mælingu');
    clear.type = 'button';
    clear.addEventListener('click', () => {
      store.clearFix(pool.id);
      refreshAll();
      openSheet(pool.id);
    });
    actions.append(clear);
  }

  const nav = el('a', 'btn', 'Leiðsögn');
  nav.href = `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lon}`;
  nav.target = '_blank';
  nav.rel = 'noopener';
  actions.append(nav);

  body.append(actions);

  const noteWrap = el('label', 'notefield');
  noteWrap.append(el('span', null, 'Minnispunktur'));
  const note = document.createElement('textarea');
  note.rows = 2;
  note.placeholder = 'Fluga, vatnshæð, hvar fiskurinn lá…';
  note.value = store.getNote(pool.id);
  note.addEventListener('change', () => {
    store.setNote(pool.id, note.value);
    renderPoolList();
  });
  noteWrap.append(note);
  body.append(noteWrap);
}

function closeSheet() {
  $('#sheet').hidden = true;
}

/** Nógu fersk mæling úr vöktuninni til að skrá beint, án nýrrar fyrirspurnar. */
const FRESH_MS = 15000;

async function captureFix(pool, button) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = 'Leita…';
  try {
    // Vöktunin er þegar í gangi; nýleg mæling þaðan er jafngild og kemur strax.
    // Köld GPS-fyrirspurn getur tekið tugi sekúndna á bakkanum.
    const fresh = state.me && Date.now() - state.me.at < FRESH_MS ? state.me : null;
    const fix = fresh || (await geo.once());
    store.setFix(pool.id, { lat: fix.lat, lon: fix.lon, acc: fix.acc });
    const acc = Math.round(fix.acc);
    toast(`${pool.name} skráður (±${acc} m)${acc > 30 ? ' — grófleg mæling' : ''}`);
    refreshAll();
    openSheet(pool.id);
  } catch (err) {
    toast(err.message, true);
    button.disabled = false;
    button.textContent = original;
  }
}

/* ------------------------------------------------------------------ staðsetning */

function startLocating() {
  if (!geo.secureContextOk()) {
    setGeoStatus('Staðsetning krefst https — opnaðu síðuna á GitHub Pages slóðinni.', true);
    return;
  }
  setGeoStatus('Leita að staðsetningu…');
  stopWatch?.();
  stopWatch = geo.watch(
    (pos) => {
      state.me = pos;
      state.geoError = null;
      setGeoStatus(`Staðsetning ±${Math.round(pos.acc)} m`);
      zoneMap.setMe(pos);
      realMap.setMe(pos);
      updateDistances();
      updateNearest();
    },
    (err) => {
      state.geoError = err.message;
      setGeoStatus(err.message, true);
    },
  );
}

function setGeoStatus(text, isError = false) {
  const node = $('#geostatus');
  node.textContent = text;
  node.classList.toggle('is-error', isError);
}

let nearestTarget = null;

function updateNearest() {
  const node = $('#nearest');
  if (!state.me) {
    node.hidden = true;
    return;
  }

  let best = null;
  for (const pool of POOLS) {
    const r = store.resolved(pool);
    const d = geo.distance([state.me.lat, state.me.lon], [r.lat, r.lon]);
    if (!best || d < best.d) best = { pool, d, measured: r.measured };
  }
  if (!best) {
    node.hidden = true;
    return;
  }

  // Byggt einu sinni og síðan aðeins uppfært — hnappurinn má ekki hverfa undan tapi.
  if (!node.firstChild) {
    node.append(
      el('span', 'nearest__label', 'Næst þér'),
      el('strong'),
      el('span', 'tag'),
    );
    node.addEventListener('click', () => {
      const target = nearestTarget;
      if (!target) return;
      if (target.zoneId !== state.zoneId) selectZone(target.zoneId).then(() => selectPool(target.id));
      else selectPool(target.id);
    });
  }

  nearestTarget = best.pool;
  node.hidden = false;
  node.children[1].textContent = `${best.pool.name} · ${best.pool.zoneName}${best.pool.halfId}`;
  node.children[2].textContent = geo.formatDistance(best.d);
  node.children[2].className = `tag ${best.measured ? 'tag--measured' : 'tag--soft'}`;
}

/* ------------------------------------------------------------------------ útlit */

function setView(view) {
  state.view = view;
  document.body.dataset.view = view;
  document.querySelectorAll('.viewtab').forEach((b) => {
    const on = b.dataset.view === view;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  requestAnimationFrame(() => {
    realMap.invalidate();
    zoneMap.fit();
  });
}

function refreshAll() {
  zoneMap.refresh();
  realMap.refresh();
  renderPoolList();
  updateNearest();
  $('#fixcount').textContent = String(store.fixCount());
}

let toastTimer;
function toast(message, isError = false) {
  const node = $('#toast');
  node.textContent = message;
  node.className = `toast is-visible${isError ? ' is-error' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    node.className = 'toast';
  }, 4000);
}

/* ------------------------------------------------------------------ stillingar */

function buildSettings() {
  const panel = $('#settings-body');
  panel.innerHTML = '';

  const basemaps = el('div', 'field');
  basemaps.append(el('span', 'field__label', 'Grunnkort'));
  const group = el('div', 'segmented');
  Object.entries(realMap.basemaps).forEach(([key, spec]) => {
    const btn = el('button', 'segmented__btn', spec.label);
    btn.type = 'button';
    btn.classList.toggle('is-active', key === realMap.basemap);
    btn.addEventListener('click', () => {
      realMap.setBasemap(key);
      buildSettings();
    });
    group.append(btn);
  });
  basemaps.append(group);
  panel.append(basemaps);

  panel.append(
    toggleField('Fylgja staðsetningu', realMap.following, (on) => {
      realMap.setFollow(on);
      if (on && state.me) realMap.setMe(state.me);
    }),
  );

  panel.append(
    toggleField(
      'Færa merki á teikningu',
      state.editing,
      (on) => {
        state.editing = on;
        zoneMap.setEditing(on);
        const url = new URL(location.href);
        if (on) url.searchParams.set('edit', '1');
        else url.searchParams.delete('edit');
        history.replaceState(null, '', url);
      },
      'Dragðu punkt á sinn rétta stað á handteiknaða kortinu. Vistast í tækinu.',
    ),
  );

  const data = el('div', 'field');
  data.append(el('span', 'field__label', 'Mín gögn'));
  const row = el('div', 'btnrow');

  const exportBtn = el('button', 'btn', 'Vista skrá');
  exportBtn.type = 'button';
  exportBtn.addEventListener('click', () => {
    const blob = new Blob([store.exportAll()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `adalax-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  const importBtn = el('button', 'btn', 'Lesa skrá');
  importBtn.type = 'button';
  const file = document.createElement('input');
  file.type = 'file';
  file.accept = 'application/json';
  file.hidden = true;
  file.addEventListener('change', async () => {
    const chosen = file.files?.[0];
    if (!chosen) return;
    try {
      store.importAll(await chosen.text());
      refreshAll();
      toast('Gögn lesin inn');
    } catch {
      toast('Gat ekki lesið skrána', true);
    }
    file.value = '';
  });
  importBtn.addEventListener('click', () => file.click());

  const resetBtn = el('button', 'btn btn--danger', 'Hreinsa allt');
  resetBtn.type = 'button';
  resetBtn.addEventListener('click', () => {
    if (!confirm('Eyða öllum mælingum, minnispunktum og færslum á merkjum?')) return;
    store.resetAll();
    refreshAll();
    toast('Öllu eytt');
  });

  row.append(exportBtn, importBtn, resetBtn, file);
  data.append(row);
  data.append(
    el('p', 'hint', `${store.fixCount()} af ${POOLS.length} veiðistöðum eru með mælt hnit.`),
  );
  panel.append(data);

  const about = el('div', 'field');
  about.append(el('span', 'field__label', 'Reglur'));
  const rules = el('ul', 'rules');
  RULES.forEach((line) => rules.append(el('li', null, line)));
  about.append(rules);

  const contacts = el('p', 'hint');
  contacts.append(
    document.createTextNode('Veiðihús: '),
    ...SOURCE.lodges.flatMap((lodge, i) => {
      const link = el('a', null, `${lodge.name} ${lodge.phone}`);
      link.href = `tel:${lodge.phone.replace(/\D/g, '')}`;
      return i ? [document.createTextNode(' · '), link] : [link];
    }),
  );
  about.append(contacts);
  about.append(
    el('p', 'hint', `Veiðiverðir: ${SOURCE.riverkeepers.join(', ')}. ${SOURCE.contactNote}`),
  );
  about.append(
    el(
      'p',
      'hint',
      `Byggt á handteiknaða svæðakortinu, skannað ${SOURCE.scannedAt}. Áætluð hnit geta skeikað hundruðum metra þar til þau eru mæld.`,
    ),
  );
  panel.append(about);
}

function toggleField(label, checked, onChange, hint) {
  const wrap = el('label', 'toggle');
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  wrap.append(input, el('span', null, label));
  if (!hint) return wrap;
  const box = el('div', 'field');
  box.append(wrap, el('p', 'hint', hint));
  return box;
}

/* -------------------------------------------------------------------- ræsing */

async function boot() {
  zoneMap = createZoneMap($('#drawing'), { onSelect: (pool) => selectPool(pool.id) });
  realMap = createRealMap($('#real'), { onSelect: (pool) => selectPool(pool.id) });
  realMap.setPools(POOLS);

  document.querySelectorAll('.viewtab').forEach((btn) => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });

  $('#sheet-close').addEventListener('click', closeSheet);
  $('#settings-open').addEventListener('click', () => {
    buildSettings();
    $('#settings').hidden = false;
  });
  $('#settings-close').addEventListener('click', () => {
    $('#settings').hidden = true;
  });
  $('#locate').addEventListener('click', () => {
    startLocating();
    if (state.me) realMap.flyToPool(state.poolId || POOLS[0].id);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('#settings').hidden) $('#settings').hidden = true;
    else closeSheet();
  });

  store.subscribe(() => {
    $('#fixcount').textContent = String(store.fixCount());
  });

  setView(state.view);
  renderZoneTabs();
  await selectZone(state.zoneId);
  realMap.fitZone(state.zoneId);
  $('#fixcount').textContent = String(store.fixCount());

  window.addEventListener('resize', () => {
    realMap.invalidate();
  });

  startLocating();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

boot();
