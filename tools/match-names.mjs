/*
 * Ber veiðistaðanöfnin í assets/js/data.js saman við örnefni úr OpenStreetMap
 * og prentar þau sem hittast á. Þau eru akkerin: mæld hnit sem hinir staðirnir
 * eru brúaðir á milli.
 *
 *   node tools/match-names.mjs
 */

import { readFile } from 'node:fs/promises';
import { ZONES } from '../assets/js/data.js';

const named = JSON.parse(await readFile(new URL('./data/osm-named.json', import.meta.url), 'utf8'));

/* Íslensk beygingarending og ritháttur skeikar milli heimilda. */
const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^a-záéíóúýðþæö]/g, '');

const index = new Map();
for (const e of named.elements) {
  const name = e.tags?.name;
  if (!name) continue;
  const at = e.type === 'node' ? [e.lat, e.lon] : e.center ? [e.center.lat, e.center.lon] : null;
  if (!at) continue;
  const k = norm(name);
  if (!index.has(k)) index.set(k, []);
  index.get(k).push({ name, at, tags: e.tags, type: e.type, id: e.id });
}

console.log(`${index.size} ólík örnefni í OSM á svæðinu\n`);

let hits = 0;
let total = 0;
for (const zone of ZONES) {
  for (const half of zone.halves) {
    for (const pool of half.pools) {
      total += 1;
      const found = index.get(norm(pool.name));
      if (!found) continue;
      hits += 1;
      for (const f of found) {
        console.log(
          `${zone.id}${half.id}  ${pool.name.padEnd(24)} → ${f.at[0].toFixed(5)}, ${f.at[1].toFixed(5)}  (${f.type} ${f.id}) ${JSON.stringify(f.tags)}`,
        );
      }
    }
  }
}

console.log(`\n${hits} af ${total} veiðistöðum eiga sér örnefni í OSM`);

/* Kennileiti sem gagnast til að staðsetja endapunkta hálfsvæðanna. */
console.log('\n— kennileiti —');
for (const e of named.elements) {
  const t = e.tags || {};
  const at = e.type === 'node' ? [e.lat, e.lon] : e.center ? [e.center.lat, e.center.lon] : null;
  if (!at) continue;
  if (t.waterway === 'waterfall' || t.place === 'farm' || t.place === 'isolated_dwelling' || t.bridge || t.ford) {
    console.log(`${(t.name || '(ónefnt)').padEnd(28)} ${at[0].toFixed(5)}, ${at[1].toFixed(5)}  ${t.waterway || t.place || (t.bridge && 'brú') || t.ford}`);
  }
}
