/*
 * Árleiðin: að leggja punkta á farveg Laxár í stað þess að draga beina línu
 * milli þeirra.
 *
 * Áður voru veiðistaðir hálfsvæðis dreifðir jafnt á beinni línu milli
 * endapunkta. Áin er hvergi bein, svo staðir lentu uppi á landi og bilin milli
 * þeirra stemmdu ekki. Hér er í staðinn mælt EFTIR ánni: hver punktur á sér
 * stöð — vegalengd frá efsta hnút árlínunnar — og staðirnir dreifast á stöðvar.
 */

import { RIVER_LINE } from './river.js';

const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;

function metres([lat1, lon1], [lat2, lon2]) {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/*
 * Reiknað einu sinni: uppsöfnuð vegalengd að hverjum hnút, og hnútarnir
 * fletjaðir í metra svo varpanir verði einföld rúmfræði. Svæðið er lítið og
 * norðlægt; flatt hnitakerfi um miðbreidd árinnar skeikar innan við metra.
 */
const MID_LAT = RIVER_LINE.length
  ? RIVER_LINE.reduce((sum, p) => sum + p[0], 0) / RIVER_LINE.length
  : 66;
const MX = 111320 * Math.cos(rad(MID_LAT));
const MY = 110540;
const flat = ([lat, lon]) => [lon * MX, lat * MY];

const XY = RIVER_LINE.map(flat);

const CUM = (() => {
  const out = [0];
  for (let i = 1; i < RIVER_LINE.length; i += 1) {
    out.push(out[i - 1] + metres(RIVER_LINE[i - 1], RIVER_LINE[i]));
  }
  return out;
})();

/** Heildarlengd árlínunnar í metrum. */
export const RIVER_LENGTH = CUM.length ? CUM[CUM.length - 1] : 0;

/**
 * Stöð punkts: vegalengd eftir ánni, frá efsta hnút, að þeim stað á farveginum
 * sem er næstur punktinum. Skilar líka fráviki punktsins frá ánni.
 */
export function station(point) {
  const [px, py] = flat(point);
  let best = { station: 0, offset: Infinity };

  for (let i = 1; i < XY.length; i += 1) {
    const [ax, ay] = XY[i - 1];
    const [bx, by] = XY[i];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
    const offset = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    if (offset < best.offset) {
      best = { station: CUM[i - 1] + (CUM[i] - CUM[i - 1]) * t, offset };
    }
  }
  return best;
}

/** Punktur á farveginum í tiltekinni fjarlægð frá efsta hnút. */
export function at(target) {
  if (!RIVER_LINE.length) return [0, 0];
  const s = Math.max(0, Math.min(RIVER_LENGTH, target));

  let lo = 0;
  let hi = CUM.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (CUM[mid] <= s) lo = mid;
    else hi = mid;
  }

  const span = CUM[hi] - CUM[lo];
  const t = span ? (s - CUM[lo]) / span : 0;
  const a = RIVER_LINE[lo];
  const b = RIVER_LINE[hi];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
