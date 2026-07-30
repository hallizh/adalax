/* Staðsetning notandans og einföld hnitareikningar. */

const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;

/** Fjarlægð í metrum milli tveggja hnita (haversine). */
export function distance(a, b) {
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Stefna í gráðum frá a til b (0 = norður). */
export function bearing(a, b) {
  const dLon = rad(b[1] - a[1]);
  const y = Math.sin(dLon) * Math.cos(rad(b[0]));
  const x =
    Math.cos(rad(a[0])) * Math.sin(rad(b[0])) -
    Math.sin(rad(a[0])) * Math.cos(rad(b[0])) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

const COMPASS = ['N', 'NA', 'A', 'SA', 'S', 'SV', 'V', 'NV'];
export const compass = (deg) => COMPASS[Math.round(((deg % 360) + 360) % 360 / 45) % 8];

export function formatDistance(m) {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}

/**
 * Fylgist með staðsetningu. Kallar á onUpdate við hverja mælingu og
 * onError ef hún bregst. Skilar falli sem stöðvar vöktunina.
 */
export function watch(onUpdate, onError) {
  if (!('geolocation' in navigator)) {
    onError({ code: 0, message: 'Tækið styður ekki staðsetningu.' });
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(
    (pos) =>
      onUpdate({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        acc: pos.coords.accuracy,
        heading: pos.coords.heading,
        at: pos.timestamp,
      }),
    (err) => onError({ code: err.code, message: geoMessage(err) }),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
  );
  return () => navigator.geolocation.clearWatch(id);
}

/** Ein mæling, með loforði. Notað þegar veiðistaður er skráður. */
export function once() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Tækið styður ekki staðsetningu.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, acc: pos.coords.accuracy }),
      (err) => reject(new Error(geoMessage(err))),
      // maximumAge 0 neyðir fram nýja GPS-læsingu sem getur hangið lengi;
      // fáeinna sekúndna gömul mæling er nógu góð til að skrá veiðistað.
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 25000 },
    );
  });
}

function geoMessage(err) {
  switch (err.code) {
    case 1:
      return 'Staðsetning ekki leyfð. Kveiktu á henni í stillingum vafrans.';
    case 2:
      return 'Staðsetning fannst ekki. Prófaðu aftur undir berum himni.';
    case 3:
      return 'Staðsetning svaraði ekki í tæka tíð.';
    default:
      return 'Staðsetning virkar ekki í þessum vafra.';
  }
}

/**
 * Staðsetning krefst öruggs samhengis. GitHub Pages er á https, en
 * file:// og http gefa þögla villu — betra að segja það hreint út.
 */
export const secureContextOk = () =>
  window.isSecureContext || ['localhost', '127.0.0.1'].includes(location.hostname);
