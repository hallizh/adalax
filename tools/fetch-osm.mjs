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

/*
 * overpass.osm.ch var hér áður og skilaði alltaf tómu svari — það er svissnesk
 * þjónusta og geymir ekki Ísland. Aðeins þjónustur með allan heiminn duga.
 */
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

/* Sjálfgefinn hausinn frá Node fær 406 hjá overpass-api.de. */
const HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'User-Agent': 'adalax/1.0 (+https://github.com/hallizh/adalax)',
  Accept: 'application/json',
};

/* Sannreynir að þjónustan geymi Ísland áður en treyst er á tóm svör. */
const CONTROL = `[out:json][timeout:60];way["waterway"="river"]["name"="Laxá"](65.5,-17.8,66.1,-16.8);out ids 1;`;

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

async function ask(endpoint, query) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: HEADERS,
    body: new URLSearchParams({ data: query }),
    signal: AbortSignal.timeout(300000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`ekki JSON: ${text.slice(0, 200)}`);
  }
  if (!Array.isArray(json.elements)) throw new Error('engin elements');
  return json;
}

/** Fyrsta þjónustan sem stenst viðmiðunarfyrirspurnina. */
let chosen = null;
async function pickEndpoint() {
  for (const endpoint of ENDPOINTS) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const json = await ask(endpoint, CONTROL);
        if (!json.elements.length) throw new Error('þekkir ekki Ísland (tómt viðmiðunarsvar)');
        console.log(`Nota ${endpoint}`);
        return endpoint;
      } catch (err) {
        console.warn(`  ${endpoint} tilraun ${attempt}: ${err.message}`);
        await new Promise((r) => setTimeout(r, attempt * 5000));
      }
    }
  }
  throw new Error('engin Overpass-þjónusta svaraði með Íslandsgögnum');
}

async function overpass(query) {
  chosen ||= await pickEndpoint();
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await ask(chosen, query);
    } catch (err) {
      lastError = err;
      console.warn(`  tilraun ${attempt} brást: ${err.message}`);
      // Overpass hafnar of tíðum fyrirspurnum; bakkað hægt út.
      await new Promise((r) => setTimeout(r, attempt * 10000));
    }
  }
  throw lastError;
}

const dir = new URL('./data/', import.meta.url);
await mkdir(dir, { recursive: true });

for (const [file, query] of Object.entries(QUERIES)) {
  console.log(`Sæki ${file}…`);
  const json = await overpass(query);
  // Tómt svar er merki um bilaða þjónustu, ekki um autt landsvæði — betra að
  // stöðvast en að leggja gagnslaus gögn í greinina.
  if (!json.elements.length) throw new Error(`${file} kom tómt`);
  await writeFile(new URL(file, dir), JSON.stringify(json));
  console.log(`  ${json.elements.length} fyrirbæri`);
}

console.log('Búið.');
