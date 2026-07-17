# UI-lab

Rammen, startskærmen og møntsækken — uden resten af appen.

**Åbn `index.html` ved at dobbeltklikke den.** Der er intet build, ingen server,
ingen Vercel. Ret en værdi, tryk F5, se det med det samme.

Den ligger i `public/`, så den følger også med en deployment og kan ses på
`…/lab/index.html` — det er vejen til at se den på en **rigtig telefon**, hvilket
`file://` ikke kan.

## Hvorfor den findes

Appen kan ikke bygges på denne maskine, og browserruden i Claude Code tegner
ikke. Alt visuelt skulle derfor pushes, bygges af Vercel og ses af et menneske
før nogen vidste om det virkede — og da Vercel holdt op med at bygge, var vi
helt blinde. Lab'et fjerner hele den kæde for den del af arbejdet der er UI.

Det er også stedet at *designe*: panelet skruer på de rigtige CSS-variabler, og
fortæller hvad de koster, mens du gør det.

## Hvad der er ægte, og hvad der er stand-in

| | |
|---|---|
| Rammen, de syv stilarter, bjælker, vindue | **Ægte** — samme CSS |
| Guld-ornamentet (13a/13b) | **Ægte** — samme `drawOrnate` |
| Møntsækken og dens lyd | **Ægte** — samme motor |
| Købe-animationen og ka-ching'en | **Ægte** — motorens `spendCoins()` |
| De 14 møntklip | **Ægte** — handoff'ens wav'er |
| Startskærmen | **Ægte** — samme markup og styling |
| Reklamerne | **Stand-in.** SVG-firkanter i et valgt format |
| Telefonen | **Stand-in.** En kasse med en påstået sikker zone |
| Prisen på et køb | **Stand-in.** En skyder. Appen bestemmer selv |

Reklamerne er stand-ins med vilje: rigtige reklamer kræver netværkene, og de
skifter under dig hver gang du loader. Men de bruger samme `object-fit` og samme
slørrede baggrund som appen, så rammen behandler dem ens.

Appen fjerner også bagte sorte bjælker inde i reklamefilerne (`lib/letterbox.js`).
Det gør lab'et ikke — dets stand-ins har ingen bjælker at fjerne.

## De tre temaer

`14b` Dæmpet messing, `14c` Kobber / rosa, `14f` Gunmetal + kobber. De blev
valgt ud af seks metaller, som selv var én vægt af syv rammer — resten er væk.

Et tema er **fire ting der skal være enige**:

| | hvor |
|---|---|
| Ornamentets palet | `PALETTES` i `lib/frames.js` — males på et lærred |
| Chrome og vignette | `[data-frame]` i `globals.css` — skærm, bjælker, hårlinje |
| Sækkens grafik | `public/sack/14b\|14c\|14f/` — tonede PNG'er |
| Telefonens kant | kun lab'et; appen bor i en rigtig telefon |

Sækkens tre sæt hedder 16a/16b/16c hos designerne, én til hvert tema — så
rammens eget id navngiver mappen, og der er ikke noget at holde i takt.
`shade.png` er fælles: det er en mørk kopi af kroppen der lægges over mønterne
ved 30%, så mønter dybt i sækken læses som nedsænkede. Den er ligeglad med farven.

**Sækkene er tonede, mønterne er ikke.** Ét guld i alle tre — handoff'en er
udtrykkelig om det. Og hele sækken males nu i en `1/2.4` buffer og skaleres op
nearest-neighbour, så kunsten er lige så klodset som mønterne. Det træder i
stedet for `devicePixelRatio`, så sækken er lav-opløst med vilje: lærredet måler
92×150 hvor det før var 220×360.

## Lyden

Tre lag, og de er uafhængige af reklamens lyd:

- **Når en mønt fødes:** en flip-lyd (`coin-flip.mp3`), afspillet ved én af fire
  tilfældige hastigheder plus en lille rysten, så ingen to mønter lyder ens.
- **Når den lander:** motorens synth-klink, med ét af **fjorten rigtige møntklip**
  lagt ovenpå ved lav volumen. Kun *hvilket* klip er tilfældigt — der er aldrig
  stilhed.
- **Ved et køb:** en pixel-ka-ching. Fire nære afarter, **A–D**; handoff'en peger
  på A. Panelet kan skifte mellem dem, men sækken bygges om når du gør —
  motoren læser varianten når den fødes, ikke løbende.

Lyd kræver et klik først (browserens regel). Startskærmen er dét klik.

**Klippene ligger som `data:`-URI'er i `coin-samples.js`, ikke som filstier.**
Grunden er kedelig og vigtig: motoren henter samples med `fetch()`, og `fetch()`
mod en `file://`-URL er spærret i en almindelig Chrome. Motoren sluger fejlen
(`.catch(() => {})`), så lydene ville bare ikke være der — uden et ord i
konsollen. En `data:`-URI kan hentes overalt.

Panelet skriver hvor mange klip der faktisk er afkodet (`14 af 14`), fordi det
ellers ikke er til at se.

## De tre genererede filer

`coin-sack-engine.js`, `frames.js` og `coin-samples.js` er **genereret**.
Originalerne er `lib/coin-sack-engine.js`, `lib/frames.js` og
`public/sack/coin/*.wav`.

De to js-filer er ikke skrevet — de er lavet af originalen med to mekaniske
ændringer: `export` er væk og tingene hænger på `window`, og hver fil er pakket
ind i sin egen funktion.

ES-moduler nægter at loade over `file://`, og hele pointen er at filen åbner ved
dobbeltklik — deraf almindelige `<script>`-tags. Og **indpakningen er ikke pynt**:
motoren og `frames.js` erklærer begge en `const GOLD`. Som moduler har de hver
sit rum; som almindelige scripts deler de ét, og så dør den fil der læses sidst
med *"Identifier 'GOLD' has already been declared"* — hele filen, uden en lyd i
konsollen. Det skete, og det var ikke til at se.

**Ret aldrig en fejl her.** Ret den i `lib/`, og kør så generatoren igen. Den
første `sed` i hver beholder advarslen øverst:

```sh
# motoren
{ sed -n '1,15p' public/lab/coin-sack-engine.js
  echo '(function () {'
  sed 's/^export class CoinSack/class CoinSack/' lib/coin-sack-engine.js
  echo 'window.CoinSack = CoinSack;'; echo '})();'
} > /tmp/e && mv /tmp/e public/lab/coin-sack-engine.js

# frames
{ sed -n '1,4p' public/lab/frames.js
  echo '(function () {'
  sed -E 's/^export (const|function) /\1 /' lib/frames.js
  echo 'window.Frames = { FRAMES, DEFAULT_FRAME, isOrnate, drawOrnate };'; echo '})();'
} > /tmp/f && mv /tmp/f public/lab/frames.js

# møntlydene — kun hvis wav'erne skiftes ud
{ sed -n '1,10p' public/lab/coin-samples.js
  echo 'window.COIN_SAMPLES = ['
  for i in $(seq 1 14); do
    printf "  'data:audio/wav;base64,%s',\n" "$(base64 -w 0 public/sack/coin/coin-$i.wav)"
  done
  echo '];'
} > /tmp/s && mv /tmp/s public/lab/coin-samples.js
```

## CSS'en tilbage i appen

`index.html`s style-blok er delt i to. Del 2 er ordret fra `app/globals.css` på
nær tre mekaniske erstatninger:

```
position: fixed              →  position: absolute
env(safe-area-inset-top)     →  var(--safe-top)
env(safe-area-inset-bottom)  →  var(--safe-bottom)
100dvh                       →  100%
```

De findes kun fordi telefonen her er en kasse på en side og ikke et
browservindue. Geometrien er den samme.

Knappen **Kopiér alle indstillinger** giver hele lab'ets tilstand, ikke bare
CSS'en — for ikke alt hvad man beslutter herinde er en CSS-variabel. Rammen står
i JavaScript, ka-ching'en er et tal i sækkens opsætning, og sløret er et helt
lag. De står som kommentarer med adressen på, så hele blokken stadig kan sættes
direkte ind i `globals.css` uden at gå i stykker:

```css
/* ── Ikke CSS. Hvad de hedder, og hvor de bor: ──────────────────────

   Ramme             11c · Glas           → DEFAULT_FRAME i lib/frames.js
   Slør bag reklamen tændt                → .vad-backdrop i globals.css
   Købe-lyd          A (spendStyle: 1)    → AdCoinCounter.js
   Pris pr. køb      5 mønter             → app-side, ikke besluttet endnu

   ── Sammenhængen tallene blev målt i ──

   Telefon   iPhone 12–14, 390×844, sikker zone 47/34
   Vindue    326 × 579 px = 0.563  ✓ 9:16
   Sækken    rører lydknappen, den sikre zone forneden
   Reklame   stand-in i 9:16-format
*/
```

Telefonen og reklameformatet er ikke indstillinger, men målene afhænger af dem
— derfor står de nederst, så tallene kan læses i den sammenhæng de blev til i.

## Sækkens plads

Sækken hænger i et **hjørne af reklamevinduet** og skubbes derfra:

```css
--sack-x: 0px;   /* fra hjørnets lodrette kant; positivt = ind over reklamen */
--sack-y: 0px;   /* fra hjørnets vandrette kant; positivt = ind over reklamen */
```

Hjørnet vælges med `data-sack` på roden: `tl`, `tr`, `bl`, `br`. **`tl` med
`0, 0` er præcis den plads sækken har i appen i dag** — venstre kant flugtende
med vinduets, foden på dets overkant.

Et hjørne frem for rå x/y, fordi sækken så følger med når rammen ændrer sig.
Og `--sack-h` står i CSS-formlen frem for i tallene, så foden bliver stående når
sækken vokser: den vokser opad i stedet for at synke ned i reklamen.

Skift hjørne, og sækken bliver hvor den er — kun tallene skifter. Eller **træk i
den med musen**, så regnes skubbet ud af sig selv. (I appen er sækken
`pointer-events: none`, så den ikke stjæler klik fra reklamen; det er kun
ophævet her.)

## De to ting panelet holder øje med

**Forholdet.** `--frame-x` og `--frame-y` sætter vinduets *form*, ikke bare dets
størrelse. Ved 32/40 på en iPhone 12 lander vinduet på 326×579 = **0.563**, og
9:16 er 0.5625. Derfor møder reklamer i højformat rammen uden at blive beskåret.
Flytter du den ene variabel alene, skrider forholdet, og så begynder rammen at
koste billede. Panelet siger til.

**Men 9:16 gælder kun på iPhone.** Målene er faste pixels, og skærmene er det
ikke — så forholdet flytter sig med telefonen. Med de samme 32/40:

| Telefon | Vindue | Forhold | |
|---|---|---|---|
| iPhone 12–14 | 326 × 579 | 0.563 | ✓ |
| 15 Pro Max | 366 × 655 | 0.559 | ✓ |
| Pixel 7 | 348 × 683 | **0.510** | ✗ for højt |
| iPhone SE | 311 × 463 | **0.672** | ✗ for firkantet |

De to iPhones passer fordi deres notch og hjemmestreg tilfældigvis æder det
rigtige. Pixel'en har en mindre sikker zone, SE'en har ingen og en kort skærm.
Kommentaren i `globals.css` siger "0.563 … 9:16 to within a tenth of a percent"
uden at nævne hvilken telefon — det er en uskrevet antagelse, ikke en egenskab
ved rammen.

En ramme der holder 9:16 overalt kræver at `--frame-y` regnes ud af skærmen
frem for at stå fast. På en SE bliver det tal negativt, så dér kan man ikke få
både 9:16, 32px sider og 52px bjælker. Noget skal give. Det er en beslutning,
ikke en fejl — skift telefon i panelet og se selv.

**Hvad sækken lægger sig oven i.** Panelet måler sækkens kasse mod Ad-mærket,
lydknappen, Skip-knappen, "Køb reklamen", topbjælkens knapper, de sikre zoner og
skærmkanten. Det er målt på de rigtige kasser frem for regnet ud af tal, så det
også fanger det der ikke er tænkt på.

## Vignetten og sløret kan ikke begge vinde

De seks metaller (14a–14f) har hver sin **vignette** bag reklamen — metallet i
midten, mørkebrunt ude ved kanten, så en reklame der ikke fylder viser noget af
den.

Men appen lægger allerede reklamens egne farver, slørrede, i præcis det samme
rum: `.vad-backdrop` med `object-fit: cover`. Og **cover fylder altid vinduet
helt**, uanset reklamens format. Målt i lab'et på 14a med en 16:9-reklame: med
sløret tændt er der ikke ét bronzefarvet pixel tilbage.

Så det er et valg, ikke to lag der kan ligge oven på hinanden:

- **Sløret** — vinduet tilhører reklamen. Hver reklame ser forskellig ud, og at
  den ikke fylder bliver sløret væk.
- **Vignetten** — vinduet tilhører rammen. Samme metal hver gang; reklamen læses
  som et billede i en indfatning. Til gengæld ser man at den er lille.

Kontakten **Slør bag reklamen** slukker sløret, så de to kan sammenlignes.

## Hvad lab'et ikke kan svare på

Reklamernes egen opførsel: om de fylder, om de loader, om lyden i dem spiller,
om Adcash sender noget. Det kræver appen og en deployment.
