/*
 * Laxá í Aðaldal — svæðaskipting, veiðistaðir og kortagögn.
 *
 * Heimild: handteiknað svæðakort (skannað 2026-07-29). Myndirnar í /maps eru
 * beinir útsnið úr þeirri skönnun.
 *
 * Hnit (lat/lon) eru ÁÆTLUÐ. Þau eru reiknuð með því að dreifa veiðistöðum
 * jafnt eftir ánni milli endapunkta hvers hálfsvæðis. Röðin upp/niður ána er
 * rétt, en hver punktur getur skeikað hundruðum metra. Notaðu "Ég er hér" til
 * að skrá raunhnit — þá víkur ágiskunin fyrir mælingu.
 */

export const SOURCE = {
  title: 'Laxá í Aðaldal',
  subtitle: 'Svæðaskipting — 12 stanga',
  scannedAt: '2026-07-29',
  lodges: [
    { name: 'Vökuholt', phone: '464-1549' },
    { name: 'Árnes', phone: '464-3715' },
  ],
  riverkeepers: ['Jón Helgi Björnsson', 'Árni Pét…'],
  // Neðsta línan á skönnuninni er klippt; símanúmer veiðivarða lásust ekki.
  contactNote: 'Símanúmer veiðivarða komu skorin af í skönnuninni.',
};

/** Reglur eins og þær standa á blaði 3 í skönnuninni. */
export const RULES = [
  'Veidd er ein vakt á hverju svæði.',
  'Þrír tímar á A, þrír tímar á B.',
  'Í þessari 12 stanga skiptingu eiga allar stangir öll svæðin 1x.',
  'Svæðaskiptingin er litamerkt.',
  'Sá sem byrjar á A byrjar alltaf á A, allar vaktir.',
];

/**
 * Svæðin, númeruð eins og á kortinu: 1 er neðst (við sjó), 6 er efst.
 * Innan hvers svæðis er A efri hlutinn og B sá neðri — nema á svæði 1,
 * þar sem Æðarfossar eru flæmi frekar en samfelldur strengur.
 *
 * x/y eru prósentur af kortamyndinni (0–100), mælt frá efra vinstra horni.
 * geo.from/geo.to eru endapunktar hálfsvæðisins; veiðistaðir dreifast þar á milli.
 */
export const ZONES = [
  {
    id: 1,
    name: 'Svæði 1',
    place: 'Æðarfossar',
    color: '#c19a1e',
    image: 'maps/svaedi-1.jpg',
    numbered: true,
    note: 'Æðarfossar eru neðsta svæðið, næst sjó. Veiðistaðir eru tölusettir 1–13 á kortinu.',
    halves: [
      {
        id: 'A',
        range: 'Bjargstrengur – Sjávarhola',
        geo: { from: [66.0268, -17.416], to: [66.03, -17.42] },
        pools: [
          { n: 1, name: 'Bjargstrengur', x: 45.8, y: 79.0 },
          { n: 2, name: 'Breiðan', x: 50.5, y: 91.0 },
          { n: 3, name: 'Háfholur', x: 59.0, y: 23.8 },
          { n: 4, name: 'Flösin', x: 58.5, y: 28.6 },
          { n: 5, name: 'Staurinn', x: 60.0, y: 35.7 },
          { n: 6, name: 'Grjótin', x: 61.8, y: 40.0 },
          { n: 7, name: 'Sjávarhola', x: 62.5, y: 52.2 },
        ],
      },
      {
        id: 'B',
        range: 'Stórifoss – Kistuhylur',
        geo: { from: [66.0255, -17.4148], to: [66.0243, -17.4137] },
        pools: [
          { n: 8, name: 'Stórifoss', x: 47.5, y: 69.5 },
          { n: 9, name: 'Fosspollur', x: 50.8, y: 73.5 },
          { n: 10, name: 'Miðfosspollur', x: 57.0, y: 54.3 },
          { n: 11, name: 'Eyrin', x: 58.0, y: 42.9 },
          { n: 12, name: 'Lænur', x: 58.0, y: 54.3 },
          { n: 13, name: 'Kistuhylur', x: 52.0, y: 96.0 },
        ],
      },
    ],
  },

  {
    id: 2,
    name: 'Svæði 2',
    place: 'Brúarstrengur – Mjósund',
    color: '#7d4a63',
    image: 'maps/svaedi-2.jpg',
    halves: [
      {
        id: 'A',
        range: 'Brúarstrengur – Kiðeyjarbrot',
        geo: { from: [65.9985, -17.386], to: [66.0115, -17.3995] },
        pools: [
          { name: 'Brúarstrengur', x: 48.6, y: 2.4 },
          { name: 'Brúarhylur', x: 50.8, y: 7.3 },
          { name: 'Hólmakvísl', x: 53.1, y: 10.5 },
          { name: 'Hólmatagl', x: 55.3, y: 13.3 },
          { name: 'Skriðuklöpp', x: 58.0, y: 15.4 },
          { name: 'Bakkastrengur', x: 59.9, y: 23.2 },
          { name: 'Heiðarendaflúð', x: 56.4, y: 25.5 },
          { name: 'Jakobspollur', x: 35.6, y: 34.6 },
          { name: 'Kiðeyjarbrot', x: 34.8, y: 36.5 },
        ],
      },
      {
        id: 'B',
        range: 'Þokuflúð – Mjósund',
        geo: { from: [66.013, -17.401], to: [66.023, -17.412] },
        pools: [
          { name: 'Þokuflúð', x: 68.3, y: 63.6 },
          { name: 'Sandhólaálar', x: 68.3, y: 80.3 },
          { name: 'Hraunhorn', x: 69.9, y: 91.2 },
          { name: 'Mjósund', x: 72.6, y: 93.8 },
          { name: 'Fossavaðsbrot', x: 74.2, y: 95.2, outside: true },
          { name: 'Potturinn', x: 75.3, y: 96.3, outside: true },
          { name: 'Fossavað', x: 76.3, y: 97.5, outside: true },
        ],
      },
    ],
  },

  {
    id: 3,
    name: 'Svæði 3',
    place: 'Malargryfja – Brúarflúð',
    color: '#6fa8c7',
    image: 'maps/svaedi-3.jpg',
    note: 'Norður snýr niður á þessu korti — efst er upp á við eftir ánni.',
    halves: [
      {
        id: 'A',
        range: 'Malargryfja – Straumáll',
        geo: { from: [65.964, -17.37], to: [65.976, -17.3765] },
        pools: [
          { name: 'Malargryfja', x: 81.6, y: 8.3 },
          { name: 'Laxatangi', x: 70.6, y: 6.0 },
          { name: 'Græni tangi', x: 60.0, y: 14.5 },
          { name: 'Núpabreiða', x: 52.2, y: 21.5 },
          { name: 'Straumáll', x: 42.9, y: 24.8 },
        ],
      },
      {
        id: 'B',
        range: 'Eskeyjarflúð – Brúarflúð',
        geo: { from: [65.979, -17.3785], to: [65.9955, -17.3848] },
        pools: [
          { name: 'Eskeyjarflúð', x: 28.2, y: 62.9 },
          { name: 'Litla Núpabreiða', x: 15.3, y: 80.0 },
          { name: 'Uxaklöpp', x: 18.8, y: 91.8 },
          { name: 'Spegilflúð', x: 21.2, y: 92.5 },
          { name: 'Brúarflúð', x: 22.0, y: 96.3 },
        ],
      },
    ],
  },

  {
    id: 4,
    name: 'Svæði 4',
    place: 'Merkjapollur – Fossbrún',
    color: '#2e6b3c',
    image: 'maps/svaedi-4.jpg',
    note: 'Reglurnar um vaktaskiptinguna standa á þessu blaði, vinstra megin.',
    halves: [
      {
        id: 'A',
        range: 'Merkjapollur – Knútsstaðatún',
        geo: { from: [65.926, -17.352], to: [65.94, -17.36] },
        pools: [
          { name: 'Merkjapollur', x: 23.8, y: 6.5 },
          { name: 'Birgisflúð', x: 25.6, y: 25.6 },
          { name: 'Langaflúð', x: 32.5, y: 34.3 },
          { name: 'Beygjan', x: 40.4, y: 40.0 },
          { name: 'Knútsstaðatún', x: 52.3, y: 45.3 },
        ],
      },
      {
        id: 'B',
        range: 'Grundarhorn – Fossbrún',
        geo: { from: [65.943, -17.3615], to: [65.96, -17.3685] },
        pools: [
          { name: 'Grundarhyljir', x: 63.9, y: 52.3 },
          { name: 'Grundarhorn', x: 67.3, y: 56.5 },
          { name: 'Höfðabreiða', x: 71.1, y: 70.3 },
          { name: 'Höfðahylur', x: 71.5, y: 80.0 },
          { name: 'Fossbrún', x: 67.3, y: 94.0 },
        ],
      },
    ],
  },

  {
    id: 5,
    name: 'Svæði 5',
    place: 'Leirhólmi – Dýjaveitur',
    color: '#c33a2e',
    image: 'maps/svaedi-5.jpg',
    halves: [
      {
        id: 'A',
        range: 'Leirhólmi – Presthylur',
        geo: { from: [65.899, -17.342], to: [65.908, -17.346] },
        pools: [
          { name: 'Leirhólmi', x: 52.5, y: 17.0 },
          { name: 'Hornflúð', x: 18.2, y: 17.3 },
          { name: 'Móri', x: 27.0, y: 17.0 },
          { name: 'Vitaðsgjafi', x: 15.4, y: 22.8 },
          { name: 'Skerflúðir', x: 21.5, y: 34.0 },
          { name: 'Presthylur', x: 22.0, y: 39.5 },
        ],
      },
      {
        id: 'B',
        range: 'Þvottastrengur – Dýjaveitur',
        geo: { from: [65.9095, -17.3468], to: [65.9225, -17.3508] },
        pools: [
          { name: 'Þvottastrengur', x: 53.1, y: 64.5 },
          { name: 'Kirkjuhólmakvísl', x: 63.3, y: 70.0 },
          { name: 'Kirkjuhólmabrot', x: 62.7, y: 73.3 },
          { name: 'Skriðuflúð', x: 64.6, y: 76.5 },
          { name: 'Oddhylur', x: 65.7, y: 80.0 },
          { name: 'Eyrarhylur', x: 66.8, y: 82.5 },
          { name: 'Dýjaveitur', x: 68.2, y: 85.0 },
          { name: 'Veiðimörk við girðingu', x: 71.0, y: 88.0, outside: true },
        ],
      },
    ],
  },

  {
    id: 6,
    name: 'Svæði 6',
    place: 'Suðureyri – Neðri Grástraumur',
    color: '#3f4f8f',
    image: 'maps/svaedi-6.jpg',
    halves: [
      {
        id: 'A',
        range: 'Suðureyri – Hólmavaðsstífla að austan',
        geo: { from: [65.872, -17.333], to: [65.885, -17.339] },
        pools: [
          { name: 'Langeyjareyri', x: 46.7, y: 7.5, outside: true },
          { name: 'Suðureyri', x: 48.6, y: 11.3 },
          { name: 'Hagabakkar efri', x: 45.6, y: 20.3 },
          { name: 'Suðurhólmi', x: 49.5, y: 23.5 },
          { name: 'Hagabakkar neðri', x: 47.1, y: 32.0 },
          { name: 'Hólmavaðsstífla', x: 47.1, y: 59.5 },
        ],
      },
      {
        id: 'B',
        range: 'Hólmavaðsstífla – Neðri Grástraumur',
        geo: { from: [65.8855, -17.3392], to: [65.8975, -17.3415] },
        pools: [
          { name: 'Hólmavaðsstífla austan', x: 40.1, y: 62.5 },
          { name: 'Sjónarhóll', x: 53.2, y: 72.0 },
          { name: 'Hrúthólmabakkar', x: 54.1, y: 79.0 },
          { name: 'Hrúthólmi', x: 57.3, y: 80.8 },
          { name: 'Hagastraumur', x: 57.0, y: 86.3 },
          { name: 'Grástraumur', x: 59.1, y: 85.5 },
          { name: 'Neðri Grástraumur', x: 54.5, y: 89.8 },
        ],
      },
    ],
  },
];

/** Stöðugt auðkenni veiðistaðar: "3A-2". Notað sem lykill í geymslu. */
export function poolId(zoneId, halfId, index) {
  return `${zoneId}${halfId}-${index}`;
}

/**
 * Flettir svæðunum út í einn lista af veiðistöðum með áætluðum hnitum.
 * Hnitin fást með línulegri brúun milli endapunkta hvers hálfsvæðis.
 */
export function allPools() {
  const out = [];
  for (const zone of ZONES) {
    for (const half of zone.halves) {
      const [lat0, lon0] = half.geo.from;
      const [lat1, lon1] = half.geo.to;
      const last = Math.max(half.pools.length - 1, 1);
      half.pools.forEach((pool, i) => {
        const t = half.pools.length === 1 ? 0 : i / last;
        out.push({
          ...pool,
          id: poolId(zone.id, half.id, i),
          // Merkingin sem sést á kortinu: talan af kortinu ef hún er til,
          // annars sætið innan hálfsvæðisins. Öll þrjú útlitin nota þessa sömu tölu.
          label: pool.n != null ? String(pool.n) : String(i + 1),
          zoneId: zone.id,
          zoneName: zone.name,
          halfId: half.id,
          color: zone.color,
          image: zone.image,
          lat: lat0 + (lat1 - lat0) * t,
          lon: lon0 + (lon1 - lon0) * t,
        });
      });
    }
  }
  return out;
}

/** Miðja alls veiðisvæðisins — upphafsstaða á raunkortinu. */
export const RIVER_CENTER = [65.95, -17.377];
