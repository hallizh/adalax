# tools/

Verkfæri til að sækja og vinna kortagögnin sem hnit veiðistaðanna hvíla á. Þau eru keyrð
sjaldan — í raun aðeins þegar árlínan þarf að uppfærast — og enginn hluti þeirra fer með
appinu sjálfu.

## Röðin

```bash
node tools/fetch-osm.mjs     # Overpass -> tools/data/*.json   (hrágögn, ekki geymd í git)
node tools/build-river.mjs   # tools/data -> assets/js/river.js (árlínan, geymd í git)
node tools/match-names.mjs   # skýrsla: örnefni sem hitta á veiðistaðanöfn
```

`tools/data/` er í `.gitignore`. Hrágögnin eru um 1 MB og öll síðan er gefin út á Pages, svo
þau eiga ekki heima í greininni til lengdar — aðeins unna árlínan.

## Að sækja gögnin án nettengingar við Overpass

Sé Overpass ekki aðgengilegt þaðan sem unnið er, sér `.github/workflows/osm.yml` um það:
verkið keyrir `fetch-osm.mjs` á hlaupara GitHub og leggur hrágögnin í greinina. Það fer af stað
við ýtingu sem snertir `tools/fetch-osm.mjs` eða verkskrána sjálfa, og má einnig ræsa handvirkt.
Hrágögnin eru líka skráð sem hlutur (`osm-data`) á keyrslunni.

## Tvennt sem kom í bakið á okkur

**overpass-api.de svarar 406** við sjálfgefna `User-Agent` hausnum frá Node. `fetch-osm.mjs`
setur því sitt eigið auðkenni.

**overpass.osm.ch geymir aðeins Sviss.** Hún svarar 200 með tómum `elements` fyrir hvaða
íslenska fyrirspurn sem er, sem lítur út eins og „ekkert fannst" en er í raun röng þjónusta.
Þess vegna byrjar `fetch-osm.mjs` á viðmiðunarfyrirspurn um Laxá og hafnar þjónustu sem
þekkir hana ekki, og stöðvast fremur en að skrifa tómt svar í skrá.

## Akkerin

`match-names.mjs` prentar þau örnefni sem hitta á veiðistaðanöfnin. Sem stendur hittir ekkert
þeirra — veiðistaðir eru ekki skráðir í OSM. Kennileitin sem `ANCHORS` í `assets/js/data.js`
byggir á eru því ekki veiðistaðirnir sjálfir heldur bæir, brú, kvísl og foss sem staðirnir draga
nafn sitt af. Skýrslan neðst í keyrslunni telur þau upp.
