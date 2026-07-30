/*
 * Sækir hrágögn úr OpenStreetMap um Laxá í Aðaldal og skrifar í tools/data/.
 *
 * Keyrt í GitHub Actions (.github/workflows/osm.yml) af því að Overpass er
 * ekki aðgengilegt úr þróunarumhverfinu. Hrágögnin eru millistig: úr þeim er
 * unnin árlínan í assets/js/river.js með tools/build-river.mjs.
 *
 *   node tools/fetch-osm.mjs
 */

import { mkdir, writeFile } from 'node:fs/promises';

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
];

/* Laxá frá Mývatni til sjávar. Rúmt tekið — betra að sía á eftir. */
const RIVER_BBOX = '65.55,-17.75,66.10,-16.85';
/* Veiðisvæðin sjálf: Aðaldalur, frá Hólmavaði niður í Laxárós. */
const NAMES_BBOX = '65.83,-17.60,66.06,-17.20';

const QUERIES = {
  'osm-river.json': `
    [out:json][timeout:240];
    (
      way["waterway"~"^(river|stream)$"]["name"~"Lax"](${RIVER_BBOX});
      way["waterway"="riverbank"]["name"~"Lax"](${RIVER_BBOX});
      relation["waterway"="river"]["name"~"Lax"](${RIVER_BBOX});
    );
    out geom;`,

  /* Allt vatn á veiðisvæðinu — kvíslar kringum hólmana heita sjaldnast neitt. */
  'osm-water.json': `
    [out:json][timeout:240];
    (
      way["waterway"](${NAMES_BBOX});
      way["natural"="water"](${NAMES_BBOX});
    );
    out geom;`,

  /* Örnefni: veiðistaðanöfn, bæir, brýr, fossar, hólmar. */
  'osm-named.json': `
    [out:json][timeout:240];
    (
      node["name"](${NAMES_BBOX});
      way["name"](${NAMES_BBOX});
      node["place"](${NAMES_BBOX});
      node["natural"="spring"](${NAMES_BBOX});
      way["bridge"](${NAMES_BBOX});
      node["waterway"="waterfall"](${NAMES_BBOX});
    );
    out center;`,
};

async function overpass(query) {
  let lastError;
  for (const endpoint of ENDPOINTS) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ data: query }),
        });
        if (!res.ok) throw new Error(`${endpoint} → HTTP ${res.status}`);
        const json = await res.json();
        if (!Array.isArray(json.elements)) throw new Error(`${endpoint} → engin elements`);
        return json;
      } catch (err) {
        lastError = err;
        console.warn(`  tilraun ${attempt} á ${endpoint} brást: ${err.message}`);
        // Overpass hafnar of tíðum fyrirspurnum; bakkað hægt út.
        await new Promise((r) => setTimeout(r, attempt * 15000));
      }
    }
  }
  throw lastError;
}

const dir = new URL('./data/', import.meta.url);
await mkdir(dir, { recursive: true });

for (const [file, query] of Object.entries(QUERIES)) {
  console.log(`Sæki ${file}…`);
  const json = await overpass(query);
  await writeFile(new URL(file, dir), JSON.stringify(json));
  console.log(`  ${json.elements.length} fyrirbæri`);
}

console.log('Búið.');
