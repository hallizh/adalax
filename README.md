# Aðalax — svæðaleiðarvísir fyrir Laxá í Aðaldal

Gagnvirkur leiðarvísir um veiðisvæðin sex í Laxá í Aðaldal, byggður á handteiknaða
svæðakortinu. Hvert svæði er sitt eigið gagnvirka kort: teikningin sjálf með smellanlegum
veiðistöðum, raunkort með loftmynd, og staðsetning þín ofan á hvoru tveggja.

**Í loftinu: <https://hallizh.github.io/adalax/>**

Kyrrstæð síða — engin bakendaþjónusta, engir lyklar, ekkert sem þarf að reka.

## Hvað er í boði

- **Sex svæði, hvert með A- og B-hluta** eins og skiptingin á blaðinu segir til um, litamerkt eins
  og frumritið.
- **Handteiknaða kortið sem gagnvirkt kort** — dragðu, þysjaðu, smelltu á veiðistað. Merkin sitja
  ofan á skönnuninni sjálfri.
- **Raunkort** með loftmynd, götukorti eða landslagskorti, svæðalínum og öllum veiðistöðum.
- **Staðsetning þín á báðum kortum.** Á raunkortinu er hún beinlínis mæld. Á teikningunni er hún
  varpað inn með líkindavörpun sem er felld að veiðistöðum svæðisins.
- **Fjarlægð og stefna** á hvern veiðistað, og hvaða staður er næstur þér hverju sinni.
- **„Ég er hér“** skráir raunhnit veiðistaðar þar sem þú stendur.
- **Minnispunktar** á hvern stað — fluga, vatnshæð, hvar fiskurinn lá.
- **Virkar án sambands** eftir fyrstu heimsókn (nema kortaflísar raunkortsins).

## Um hnitin — lestu þetta

Handteiknaða kortið hefur engin hnit. Veiðistaðirnir eru því **áætlaðir**, en áætlunin hvílir á
tvennu sem er mælt:

1. **Farvegur Laxár** úr OpenStreetMap (`assets/js/river.js`). Hver veiðistaður er lagður á
   farveginn sjálfan, ekki á beina línu milli endapunkta.
2. **Sex kennileiti** sem tengja svæðaskiptinguna við ána — Hólmavað, Knútsstaðir, brú
   Norðausturvegar, Kistukvísl, Æðarfossar og ósinn. Þau eru talin upp í `ANCHORS` í
   `assets/js/data.js`, hvert með sínu OSM-hniti.

Milli akkeranna dreifast staðirnir jafnt **eftir ánni**. Það þýðir:

- **Hver staður situr á vatni**, réttum megin við nágranna sína, í réttri fjarlægð eftir farvegi.
- **Skilin milli svæða eru rétt** þar sem akkeri liggur — við Hólmavaðsstíflu, Knútsstaðatún,
  brúna og Æðarfossa.
- **Staðsetningin milli akkera getur enn skeikað hundruðum metra.** Jafna bilið er ágiskun; í
  raun eru veiðistaðir misþétt settir.

Fyrri útgáfa dreifði stöðunum á beina línu milli endapunkta sem voru lesnir af auga. Allir 76
staðirnir lentu meira en kílómetra frá ánni — miðgildi frávika var 2,6 km og mest 4,1 km, sumt
út á sjó. Sú villa er farin.

Eitt stendur eftir sem vert er að vita: svæði 2, frá brúnni niður að Æðarfossum, fær 16
veiðistaði á tæpa 2 km meðan önnur svæði hafa 350–400 m á milli staða. Kaflinn er kvíslóttur og
þéttnefndur, svo það getur staðist — en sé einhvers staðar skekkja eftir, er hún þar.

Öll áætluð hnit eru merkt `áætlað` og teiknuð með brotinni línu. Um leið og þú skráir stað með
„Ég er hér“ víkur ágiskunin fyrir mælingu, og bæði kortin batna: svæðalínan verður heil, og þegar
tveir staðir á svæðinu eru mældir er vörpunin á teikninguna reiknuð út frá þeim í stað ágiskananna.

Gögnin liggja í `localStorage` í tækinu þínu. Undir **Stillingar → Mín gögn** má vista þau í skrá
og lesa inn í annað tæki. Vilji maður festa mælingarnar í appið sjálft má færa `geo`-punktana í
`assets/js/data.js` til samræmis.

### Merkin á teikningunni

Staðsetning merkjanna ofan á skönnuninni er líka lesin af auga. Kveiktu á
**Stillingar → Færa merki á teikningu** (eða bættu `?edit=1` aftan við slóðina) og dragðu merki
á sinn rétta stað. Það vistast með hinum gögnunum.

## Heimildin

Handteiknað svæðakort, skannað 2026-07-29, fjórar síður. Myndirnar í `maps/` eru bein útsnið úr
þeirri skönnun:

| Skrá | Efni |
| --- | --- |
| `svaedi-1.jpg` | Æðarfossar, veiðistaðir 1–13 |
| `svaedi-2.jpg` | Brúarstrengur niður í Mjósund |
| `svaedi-3.jpg` | Malargryfja niður í Brúarflúð |
| `svaedi-4.jpg` | Merkjapollur niður í Fossbrún, ásamt reglunum |
| `svaedi-5.jpg` | Leirhólmi niður í Dýjaveitur |
| `svaedi-6.jpg` | Suðureyri niður í Neðri Grástraum |
| `skiptingar.jpg` | Skiptingataflan úr frumritinu |

Neðsta lína frumritsins er skorin af í skönnuninni, svo símanúmer veiðivarðanna lásust ekki.
Númer veiðihúsanna komust til skila og eru í appinu.

Nokkur örnefni sitja utan hinnar formlegu skiptingar — Fossavaðsbrot, Potturinn, Fossavað,
Langeyjareyri og Veiðimörk við girðingu. Þau eru höfð með, merkt `utan skiptingar`, því þau standa
á kortinu þótt þau falli utan bilanna í skiptingatöflunni.

## Keyrsla

Kyrrstæð skrár. Hvaða vefþjónn sem er dugar:

```bash
python3 -m http.server 8099
# http://127.0.0.1:8099/
```

Staðsetning krefst öruggs samhengis: `https://` eða `localhost`. Á `file://` gerist ekkert.

## Útgáfa

`.github/workflows/pages.yml` gefur út á GitHub Pages við hverja ýtingu á `main`. Pages er stillt
á **Source: GitHub Actions**, svo ýting á `main` dugar — ekkert handtak í viðbót.

## Uppbygging

```
index.html                 umgjörðin
assets/js/data.js          svæði, veiðistaðir, merki á teikningu, kaflar og akkeri
assets/js/river.js         farvegur Laxár úr OSM (unnið, ekki handskrifað)
assets/js/riverpath.js     stöðvar eftir ánni: punktur -> vegalengd og öfugt
assets/js/app.js           svæðaval, listi, veiðistaðaspjald, stillingar
assets/js/zonemap.js       handteiknaða kortið: þysj, merki, vörpun staðsetningar
assets/js/realmap.js       Leaflet-kortið
assets/js/geo.js           staðsetning, fjarlægð, stefna
assets/js/store.js         localStorage: mælingar, minnispunktar, færð merki
assets/css/app.css         útlit, ljóst og dökkt
vendor/leaflet/            Leaflet 1.9.4, afritað inn svo ekkert sé sótt annað
maps/                      útsnið úr skönnuninni
tools/                     sækir og vinnur OSM-gögnin (sjá tools/README.md)
sw.js                      þjónustuvinna fyrir notkun án sambands
```

Farvegurinn í `assets/js/river.js` er unninn úr OpenStreetMap og fellur því undir
[ODbL](https://opendatacommons.org/licenses/odbl/).

Kortaflísar raunkortsins koma frá Esri, OpenStreetMap og OpenTopoMap. Þær eru ekki geymdar
fyrirfram, svo raunkortið er autt þar sem ekkert samband er — teikningin, veiðistaðirnir,
fjarlægðirnar og mælingarnar virka áfram.
