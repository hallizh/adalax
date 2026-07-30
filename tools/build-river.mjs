/*
 * Vinnur árlínu Laxár úr hrágögnunum í tools/data/ og skrifar assets/js/river.js.
 *
 * OSM geymir ána sem margar sundurlausar leiðir (way), í ótiltekinni röð og
 * með kvíslum kringum hólmana. Hér eru þær tengdar saman á endapunktum í eina
 * samfellda línu frá upptökum til sjávar, kvíslarnar skildar eftir.
 *
 *   node tools/build-river.mjs
 */

import { readFile, writeFile } from 'node:fs/promises';

const dir = new URL('./data/', import.meta.url);
const read = async (name) => JSON.parse(await readFile(new URL(name, dir), 'utf8'));

const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;
export function metres([lat1, lon1], [lat2, lon2]) {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* Hnútar sem falla saman innan við þetta teljast sami punktur. */
const JOIN_TOLERANCE_M = 2;
const key = (p) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`;

/**
 * Tengir leiðir saman í keðjur. Byrjað á lengstu leiðinni og hún lengd í báða
 * enda meðan næsta leið hittir á endann; kvíslar sem greinast frá eru skildar
 * eftir svo aðeins meginfarvegurinn standi.
 */
function stitch(ways) {
  const remaining = new Map(ways.map((w) => [w.id, w]));
  const chains = [];

  while (remaining.size) {
    let seed = null;
    for (const w of remaining.values()) {
      if (!seed || w.line.length > seed.line.length) seed = w;
    }
    remaining.delete(seed.id);
    const chain = [...seed.line];

    let grew = true;
    while (grew) {
      grew = false;
      for (const w of remaining.values()) {
        const head = chain[0];
        const tail = chain[chain.length - 1];
        const a = w.line[0];
        const b = w.line[w.line.length - 1];

        if (metres(tail, a) <= JOIN_TOLERANCE_M) chain.push(...w.line.slice(1));
        else if (metres(tail, b) <= JOIN_TOLERANCE_M) chain.push(...[...w.line].reverse().slice(1));
        else if (metres(head, b) <= JOIN_TOLERANCE_M) chain.unshift(...w.line.slice(0, -1));
        else if (metres(head, a) <= JOIN_TOLERANCE_M) chain.unshift(...[...w.line].reverse().slice(0, -1));
        else continue;

        remaining.delete(w.id);
        grew = true;
        break;
      }
    }
    chains.push(chain);
  }

  return chains.sort((a, b) => length(b) - length(a));
}

export function length(line) {
  let sum = 0;
  for (let i = 1; i < line.length; i += 1) sum += metres(line[i - 1], line[i]);
  return sum;
}

/** Douglas–Peucker, í metrum. Heldur beygjum árinnar en fellir burt hnútaþéttni. */
function simplify(line, tolerance) {
  if (line.length < 3) return line;
  const keep = new Uint8Array(line.length);
  keep[0] = 1;
  keep[line.length - 1] = 1;

  const stack = [[0, line.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop();
    let worst = 0;
    let index = -1;
    for (let i = start + 1; i < end; i += 1) {
      const d = perpendicular(line[i], line[start], line[end]);
      if (d > worst) {
        worst = d;
        index = i;
      }
    }
    if (worst > tolerance && index > 0) {
      keep[index] = 1;
      stack.push([start, index], [index, end]);
    }
  }
  return line.filter((_, i) => keep[i]);
}

function perpendicular(p, a, b) {
  // Nógu lítið svæði til að fletja megi út í metra kringum miðbaugsbreiddina.
  const scale = Math.cos(rad(a[0]));
  const toXY = ([lat, lon]) => [lon * scale * 111320, lat * 110540];
  const [px, py] = toXY(p);
  const [ax, ay] = toXY(a);
  const [bx, by] = toXY(b);
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (!len2) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/* --------------------------------------------------------------------------- */

const river = await read('osm-river.json');

const ways = river.elements
  .filter((e) => e.type === 'way' && Array.isArray(e.geometry))
  .filter((e) => /^Laxá/.test(e.tags?.name || ''))
  .map((e) => ({
    id: e.id,
    name: e.tags.name,
    line: e.geometry.map((g) => [g.lat, g.lon]),
  }));

console.log(`${ways.length} leiðir merktar Laxá`);

const chains = stitch(ways);
console.log(
  'keðjur:',
  chains.slice(0, 5).map((c) => `${(length(c) / 1000).toFixed(1)} km / ${c.length} hnútar`).join(', '),
);

let main = chains[0];

/* Norður er niður eftir ánni: fyrsti punktur á að vera efstur, sá síðasti við sjó. */
if (main[0][0] > main[main.length - 1][0]) main = [...main].reverse();

const line = simplify(main, 4);
console.log(`einfölduð: ${line.length} hnútar, ${(length(line) / 1000).toFixed(1)} km`);
console.log(`efst  ${line[0]}`);
console.log(`neðst ${line[line.length - 1]}`);

const body = `/*
 * Árlína Laxár, unnin úr OpenStreetMap (ODbL) með tools/build-river.mjs.
 * Röðin er niður eftir ánni: fyrsti punktur efst, sá síðasti við ósinn.
 * ${line.length} hnútar, ${(length(line) / 1000).toFixed(1)} km.
 */

export const RIVER_LINE = ${JSON.stringify(
  line.map(([lat, lon]) => [Number(lat.toFixed(6)), Number(lon.toFixed(6))]),
)};
`;

await writeFile(new URL('../assets/js/river.js', import.meta.url), body);
console.log('skrifað assets/js/river.js');
