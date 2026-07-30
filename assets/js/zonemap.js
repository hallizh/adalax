/*
 * Gagnvirkt handteiknað svæðakort: þysj/dráttur, merktir veiðistaðir og
 * staðsetning notandans varpað inn á teikninguna.
 *
 * Vörpunin er líkindavörpun (snúningur + kvarði + hliðrun) sem er felld að
 * þeim veiðistöðum sem svæðið þekkir. Séu tvær eða fleiri raunmælingar til
 * er hún reiknuð út frá þeim einum; annars út frá áætluðu hnitunum, og þá er
 * niðurstaðan aðeins vísbending.
 */

import * as store from './store.js';

const MIN_SCALE = 0.4;
const MAX_SCALE = 8;

/** Umbreytir hnitum í metra austur/norður miðað við viðmiðunarpunkt. */
function toLocal(lat, lon, originLat) {
  const mPerDegLat = 111320;
  const mPerDegLon = 111320 * Math.cos((originLat * Math.PI) / 180);
  return [lon * mPerDegLon, -lat * mPerDegLat]; // y snýr niður, eins og í mynd
}

/**
 * Fellir líkindavörpun (lat,lon) -> (x%,y%) að pörum { geo:[lat,lon], img:[x,y] }.
 * Lokuð lausn minnstu kvaðrata á tvinnformi: Q = a·P + b.
 */
function fitTransform(pairs) {
  if (pairs.length < 2) return null;
  const originLat = pairs[0].geo[0];
  const P = pairs.map((p) => toLocal(p.geo[0], p.geo[1], originLat));
  const Q = pairs.map((p) => p.img);

  const mean = (pts, i) => pts.reduce((s, p) => s + p[i], 0) / pts.length;
  const [pcx, pcy] = [mean(P, 0), mean(P, 1)];
  const [qcx, qcy] = [mean(Q, 0), mean(Q, 1)];

  let numRe = 0;
  let numIm = 0;
  let den = 0;
  for (let i = 0; i < P.length; i++) {
    const px = P[i][0] - pcx;
    const py = P[i][1] - pcy;
    const qx = Q[i][0] - qcx;
    const qy = Q[i][1] - qcy;
    // (qx + i·qy) · conj(px + i·py)
    numRe += qx * px + qy * py;
    numIm += qy * px - qx * py;
    den += px * px + py * py;
  }
  if (den < 1e-9) return null;

  const aRe = numRe / den;
  const aIm = numIm / den;
  if (!Number.isFinite(aRe) || !Number.isFinite(aIm) || (aRe === 0 && aIm === 0)) return null;

  return (lat, lon) => {
    const [px, py] = toLocal(lat, lon, originLat);
    const dx = px - pcx;
    const dy = py - pcy;
    return [qcx + (aRe * dx - aIm * dy), qcy + (aIm * dx + aRe * dy)];
  };
}

/** Byggir vörpun fyrir eitt svæði út frá bestu fáanlegu hnitum. */
export function zoneTransform(pools) {
  const measured = pools
    .map((p) => ({ pool: p, fix: store.getFix(p.id) }))
    .filter((r) => r.fix)
    .map((r) => ({
      geo: [r.fix.lat, r.fix.lon],
      img: [store.resolvedSpot(r.pool).x, store.resolvedSpot(r.pool).y],
    }));

  if (measured.length >= 2) {
    const fn = fitTransform(measured);
    if (fn) return { project: fn, measured: true, points: measured.length };
  }

  const approx = pools.map((p) => {
    const spot = store.resolvedSpot(p);
    return { geo: [p.lat, p.lon], img: [spot.x, spot.y] };
  });
  const fn = fitTransform(approx);
  return fn ? { project: fn, measured: false, points: approx.length } : null;
}

export function createZoneMap(container, { onSelect } = {}) {
  container.innerHTML = '';
  container.classList.add('zonemap');

  const stage = document.createElement('div');
  stage.className = 'zonemap__stage';

  const img = document.createElement('img');
  img.className = 'zonemap__img';
  img.alt = '';
  img.draggable = false;

  const layer = document.createElement('div');
  layer.className = 'zonemap__layer';

  stage.append(img, layer);
  container.append(stage);

  const zoomBox = document.createElement('div');
  zoomBox.className = 'zonemap__zoom';
  zoomBox.innerHTML = `
    <button type="button" data-z="in" aria-label="Þysja inn">+</button>
    <button type="button" data-z="out" aria-label="Þysja út">−</button>
    <button type="button" data-z="fit" aria-label="Passa á skjá">⤢</button>`;
  container.append(zoomBox);

  let natural = [1000, 1000];
  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pools = [];
  let selectedId = null;
  let editing = false;
  let me = null; // { lat, lon, acc }
  let markers = new Map();
  let meEl = null;

  function apply() {
    stage.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    const inv = 1 / scale;
    container.style.setProperty('--pin-inv', inv);
  }

  function fit() {
    const cw = container.clientWidth || 1;
    const ch = container.clientHeight || 1;
    const [w, h] = natural;
    scale = Math.min(cw / w, ch / h);
    tx = (cw - w * scale) / 2;
    ty = (ch - h * scale) / 2;
    apply();
  }

  function zoomAt(cx, cy, factor) {
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));
    const k = next / scale;
    tx = cx - (cx - tx) * k;
    ty = cy - (cy - ty) * k;
    scale = next;
    apply();
  }

  /* ---- dráttur og þysj ---- */
  const pointers = new Map();
  let pinchStart = null;
  let moved = false;

  container.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.zonemap__zoom')) return;
    container.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = false;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale };
    }
  });

  container.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };

    if (pointers.size === 2 && pinchStart) {
      pointers.set(e.pointerId, next);
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = container.getBoundingClientRect();
      const mid = { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top };
      zoomAt(mid.x, mid.y, dist / pinchStart.dist / (scale / pinchStart.scale));
      moved = true;
      return;
    }

    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
    tx += dx;
    ty += dy;
    pointers.set(e.pointerId, next);
    apply();
  });

  const release = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStart = null;
  };
  container.addEventListener('pointerup', release);
  container.addEventListener('pointercancel', release);

  container.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 1.15 : 1 / 1.15);
    },
    { passive: false },
  );

  zoomBox.addEventListener('click', (e) => {
    const z = e.target.dataset.z;
    if (!z) return;
    if (z === 'fit') return fit();
    const cw = container.clientWidth / 2;
    const ch = container.clientHeight / 2;
    zoomAt(cw, ch, z === 'in' ? 1.4 : 1 / 1.4);
  });

  /* ---- merki ---- */
  function drawMarkers() {
    layer.innerHTML = '';
    markers = new Map();
    const [w, h] = natural;

    pools.forEach((pool) => {
      const spot = store.resolvedSpot(pool);
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'pin';
      el.style.left = `${(spot.x / 100) * w}px`;
      el.style.top = `${(spot.y / 100) * h}px`;
      el.style.setProperty('--pin-color', pool.color);
      el.dataset.id = pool.id;
      if (store.getFix(pool.id)) el.classList.add('pin--measured');
      if (pool.outside) el.classList.add('pin--outside');
      if (pool.id === selectedId) el.classList.add('pin--selected');

      const label = pool.label;
      el.innerHTML = `<span class="pin__dot">${label}</span><span class="pin__label">${pool.name}</span>`;
      el.setAttribute('aria-label', pool.name);

      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (moved) return;
        onSelect?.(pool);
      });

      if (editing) enableDrag(el, pool);

      layer.append(el);
      markers.set(pool.id, el);
    });

    drawMe();
  }

  function enableDrag(el, pool) {
    el.classList.add('pin--draggable');
    let dragging = false;
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      dragging = true;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      e.stopPropagation();
      const rect = stage.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      const cx = Math.min(100, Math.max(0, x));
      const cy = Math.min(100, Math.max(0, y));
      el.style.left = `${(cx / 100) * natural[0]}px`;
      el.style.top = `${(cy / 100) * natural[1]}px`;
      el.dataset.dragX = cx;
      el.dataset.dragY = cy;
    });
    const stop = (e) => {
      if (!dragging) return;
      dragging = false;
      e.stopPropagation();
      if (el.dataset.dragX) store.setSpot(pool.id, +el.dataset.dragX, +el.dataset.dragY);
    };
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
  }

  function drawMe() {
    meEl?.remove();
    meEl = null;
    if (!me || !pools.length) return;

    const t = zoneTransform(pools);
    if (!t) return;
    const [x, y] = t.project(me.lat, me.lon);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    const [w, h] = natural;
    meEl = document.createElement('div');
    meEl.className = `me ${t.measured ? 'me--measured' : 'me--approx'}`;
    meEl.style.left = `${(x / 100) * w}px`;
    meEl.style.top = `${(y / 100) * h}px`;
    const off = x < -8 || x > 108 || y < -8 || y > 108;
    if (off) meEl.classList.add('me--off');
    meEl.title = t.measured
      ? 'Staðsetning þín, felld að mældum veiðistöðum'
      : 'Staðsetning þín — gróf vörpun á handteiknað kort';
    layer.append(meEl);
  }

  return {
    async load(zone, zonePools) {
      pools = zonePools;
      selectedId = null;
      await new Promise((resolve) => {
        img.onload = () => {
          natural = [img.naturalWidth, img.naturalHeight];
          stage.style.width = `${natural[0]}px`;
          stage.style.height = `${natural[1]}px`;
          resolve();
        };
        img.onerror = () => resolve();
        img.src = zone.image;
      });
      fit();
      drawMarkers();
    },
    select(id) {
      selectedId = id;
      markers.forEach((el, key) => el.classList.toggle('pin--selected', key === id));
    },
    centerOn(id) {
      const pool = pools.find((p) => p.id === id);
      if (!pool) return;
      const spot = store.resolvedSpot(pool);
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      scale = Math.max(scale, 1.8);
      tx = cw / 2 - (spot.x / 100) * natural[0] * scale;
      ty = ch / 2 - (spot.y / 100) * natural[1] * scale;
      apply();
    },
    setMe(position) {
      me = position;
      drawMe();
    },
    setEditing(on) {
      editing = on;
      container.classList.toggle('zonemap--editing', on);
      drawMarkers();
    },
    refresh: drawMarkers,
    fit,
  };
}
