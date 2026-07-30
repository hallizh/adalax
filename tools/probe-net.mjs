/*
 * Kannar hvað hlauparinn nær raunverulega í. Overpass skilaði tómu svari fyrir
 * fyrirspurnir sem eiga að gefa hundruð fyrirbæra, svo spurningin er hvort
 * netið sé opið eða hvort svörin komi úr einhverju milliliði.
 *
 *   node tools/probe-net.mjs
 */

const HOSTS = [
  'https://overpass-api.de/api/status',
  'https://overpass.kumi.systems/api/status',
  'https://overpass.osm.ch/api/status',
  'https://nominatim.openstreetmap.org/search?q=Reykjavik&format=json&limit=1',
  'https://www.openstreetmap.org/',
  'https://api.github.com/',
  'https://example.com/',
];

for (const url of HOSTS) {
  const started = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    const body = await res.text();
    console.log(`\n### ${url}\n  HTTP ${res.status}  ${Date.now() - started}ms  ${body.length} bytes`);
    console.log(`  ${body.slice(0, 400).replace(/\n/g, '\n  ')}`);
  } catch (err) {
    console.log(`\n### ${url}\n  BRÁST eftir ${Date.now() - started}ms: ${err.message}`);
  }
}

/* Fyrirspurn sem hlýtur að skila einhverju sé Overpass raunverulegt. */
const CONTROL = `[out:json][timeout:60];node["amenity"="cafe"](64.140,-21.945,64.155,-21.910);out 5;`;
/* Og sama svæði og veiðisvæðið, án nokkurra sía. */
const RIVER = `[out:json][timeout:60];way["waterway"](65.95,-17.45,66.05,-17.30);out 5 geom;`;

for (const endpoint of [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
]) {
  for (const [label, query] of [['Reykjavík-kaffihús', CONTROL], ['Laxá', RIVER]]) {
    const started = Date.now();
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(90000),
      });
      const body = await res.text();
      let count = '?';
      try {
        count = JSON.parse(body).elements?.length;
      } catch {
        /* ekki JSON */
      }
      console.log(`\n### ${endpoint} — ${label}\n  HTTP ${res.status}  ${Date.now() - started}ms  elements=${count}`);
      console.log(`  ${body.slice(0, 500).replace(/\n/g, '\n  ')}`);
    } catch (err) {
      console.log(`\n### ${endpoint} — ${label}\n  BRÁST eftir ${Date.now() - started}ms: ${err.message}`);
    }
  }
}
