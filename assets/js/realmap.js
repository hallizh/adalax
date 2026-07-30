/*
 * Raunkortið: Leaflet ofan á loftmynd eða götukort, með veiðistöðum,
 * svæðalínum og staðsetningu notandans.
 *
 * Flísar sækjast af netinu. Á árbakkanum má búast við sambandsleysi —
 * þjónustuvinnan geymir umgjörðina en ekki flísarnar, svo kortið getur
 * verið autt þótt appið sjálft opnist.
 */

import * as store from './store.js';
import { ZONES, RIVER_CENTER } from './data.js';

const L = window.L;

const BASEMAPS = {
  sat: {
    label: 'Loftmynd',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution: 'Loftmynd © Esri, Maxar, Earthstar Geographics',
    },
  },
  street: {
    label: 'Götukort',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: { maxZoom: 19, attribution: '© OpenStreetMap-höfundar' },
  },
  topo: {
    label: 'Landslag',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    options: { maxZoom: 17, attribution: '© OpenTopoMap, © OpenStreetMap-höfundar' },
  },
};

export function createRealMap(el, { onSelect } = {}) {
  const map = L.map(el, { zoomControl: false, attributionControl: true }).setView(RIVER_CENTER, 12);
  L.control.zoom({ position: 'topright' }).addTo(map);
  L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

  let baseLayer = null;
  let currentBase = 'sat';

  function setBasemap(key) {
    const spec = BASEMAPS[key];
    if (!spec) return;
    currentBase = key;
    if (baseLayer) map.removeLayer(baseLayer);
    baseLayer = L.tileLayer(spec.url, spec.options).addTo(map);
    baseLayer.bringToBack();
  }
  setBasemap(currentBase);

  const zoneLayer = L.layerGroup().addTo(map);
  const poolLayer = L.layerGroup().addTo(map);
  const meLayer = L.layerGroup().addTo(map);

  let pools = [];
  let markers = new Map();
  let visibleZone = null; // null = öll svæði
  let meMarker = null;
  let meCircle = null;
  let follow = false;
  let selectedId = null;

  /*
   * Á síma er raunkortið falið þegar teikningin er í forgrunni. Leaflet sem
   * hefur enga stærð reiknar NaN út úr flyTo/fitBounds, svo við geymum
   * óskina og keyrum hana þegar kortið birtist.
   */
  let pending = null;
  const hasSize = () => {
    const size = map.getSize();
    return size.x > 0 && size.y > 0;
  };
  const later = (fn) => {
    if (hasSize()) fn(false);
    else pending = () => fn(true);
  };

  function poolIcon(pool, measured, selected) {
    const cls = [
      'rp',
      measured ? 'rp--measured' : 'rp--approx',
      selected ? 'rp--selected' : '',
      pool.outside ? 'rp--outside' : '',
    ].join(' ');
    const label = pool.label;
    return L.divIcon({
      className: 'rp-wrap',
      html: `<span class="${cls}" style="--rp-color:${pool.color}"><i>${label}</i></span>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
  }

  function draw() {
    zoneLayer.clearLayers();
    poolLayer.clearLayers();
    markers = new Map();

    for (const zone of ZONES) {
      if (visibleZone && zone.id !== visibleZone) continue;
      const zonePools = pools.filter((p) => p.zoneId === zone.id);
      if (!zonePools.length) continue;

      const line = zonePools.map((p) => {
        const r = store.resolved(p);
        return [r.lat, r.lon];
      });
      L.polyline(line, {
        color: zone.color,
        weight: 5,
        opacity: 0.75,
        lineCap: 'round',
        dashArray: zonePools.some((p) => store.getFix(p.id)) ? null : '10 8',
      })
        .bindTooltip(`${zone.name} — ${zone.place}`, { sticky: true })
        .addTo(zoneLayer);

      for (const pool of zonePools) {
        const r = store.resolved(pool);
        const marker = L.marker([r.lat, r.lon], {
          icon: poolIcon(pool, r.measured, pool.id === selectedId),
          keyboard: true,
          title: pool.name,
        });
        marker.on('click', () => onSelect?.(pool));
        marker.addTo(poolLayer);
        markers.set(pool.id, marker);
      }
    }
  }

  return {
    setPools(next) {
      pools = next;
      draw();
    },
    setZone(zoneId) {
      visibleZone = zoneId;
      draw();
    },
    setBasemap,
    get basemap() {
      return currentBase;
    },
    basemaps: BASEMAPS,
    select(id) {
      selectedId = id;
      draw();
    },
    flyToPool(id) {
      const pool = pools.find((p) => p.id === id);
      if (!pool) return;
      const r = store.resolved(pool);
      later((deferred) =>
        map.flyTo([r.lat, r.lon], Math.max(map.getZoom(), 15), {
          duration: 0.6,
          animate: !deferred,
        }),
      );
    },
    fitZone(zoneId) {
      const subset = pools.filter((p) => !zoneId || p.zoneId === zoneId);
      if (!subset.length) return;
      const bounds = L.latLngBounds(
        subset.map((p) => {
          const r = store.resolved(p);
          return [r.lat, r.lon];
        }),
      );
      later(() => map.fitBounds(bounds.pad(0.25), { animate: false }));
    },
    setMe(position) {
      meLayer.clearLayers();
      meMarker = null;
      meCircle = null;
      if (!position) return;
      const at = [position.lat, position.lon];
      meCircle = L.circle(at, {
        radius: Math.max(position.acc || 0, 5),
        color: '#1b74e4',
        weight: 1,
        fillColor: '#1b74e4',
        fillOpacity: 0.15,
      }).addTo(meLayer);
      meMarker = L.marker(at, {
        icon: L.divIcon({ className: 'me-wrap', html: '<span class="me-dot"></span>', iconSize: [18, 18], iconAnchor: [9, 9] }),
        zIndexOffset: 1000,
        title: 'Þú ert hér',
      }).addTo(meLayer);
      if (follow) later(() => map.setView(at, Math.max(map.getZoom(), 15), { animate: true }));
    },
    setFollow(on) {
      follow = on;
    },
    get following() {
      return follow;
    },
    invalidate() {
      map.invalidateSize();
      if (pending && hasSize()) {
        const run = pending;
        pending = null;
        run();
      }
    },
    refresh: draw,
    map,
  };
}
