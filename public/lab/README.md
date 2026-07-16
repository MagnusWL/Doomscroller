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
| Startskærmen | **Ægte** — samme markup og styling |
| Reklamerne | **Stand-in.** SVG-firkanter i et valgt format |
| Telefonen | **Stand-in.** En kasse med en påstået sikker zone |

Reklamerne er stand-ins med vilje: rigtige reklamer kræver netværkene, og de
skifter under dig hver gang du loader. Men de bruger samme `object-fit` og samme
slørrede baggrund som appen, så rammen behandler dem ens.

Appen fjerner også bagte sorte bjælker inde i reklamefilerne (`lib/letterbox.js`).
Det gør lab'et ikke — dets stand-ins har ingen bjælker at fjerne.

## De to kopier

`coin-sack-engine.js` og `frames.js` er **kopier**. Originalerne er
`lib/coin-sack-engine.js` og `lib/frames.js`.

Der er én forskel: `export` er væk, og tingene hænger på `window` i stedet.
Grunden er kedelig — ES-moduler nægter at loade over `file://`, og hele pointen
er at filen åbner ved dobbeltklik.

**Ret aldrig en fejl i kopien.** Ret den i `lib/`, og kør så kopien igen:

```sh
{
sed -n '1,8p' public/lab/coin-sack-engine.js
sed 's/^export class CoinSack/class CoinSack/' lib/coin-sack-engine.js
echo 'window.CoinSack = CoinSack;'
} > /tmp/e.js && mv /tmp/e.js public/lab/coin-sack-engine.js
```

(Første linje beholder kopi-advarslen øverst. Samme øvelse for `frames.js` med
`sed -E 's/^export (const|function) /\1 /'` og
`window.Frames = { FRAMES, DEFAULT_FRAME, isOrnate, drawOrnate };`.)

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
browservindue. Geometrien er den samme, så knappen **Kopiér CSS** giver et
`:root`-blok der kan sættes direkte ind i `globals.css`.

## De to tal panelet holder øje med

**Forholdet.** `--frame-x` og `--frame-y` sætter vinduets *form*, ikke bare dets
størrelse. Ved 32/40 på en iPhone 12 lander vinduet på 326×579 = **0.563**, og
9:16 er 0.5625. Derfor møder reklamer i højformat rammen uden at blive beskåret.
Flytter du den ene variabel alene, skrider forholdet, og så begynder rammen at
koste billede. Panelet siger til.

**Sækkens loft.** Sækken står med foden på vinduets overkant og hænger op over
bjælken, så den kan kun blive `--bar-h + --frame-y` høj. Bliver den højere,
rager den op i notchen. Ved 52+40 er loftet 92px, og sækken er 90.

## Hvad lab'et ikke kan svare på

Reklamernes egen opførsel: om de fylder, om de loader, om lyden i dem spiller,
om Adcash sender noget. Det kræver appen og en deployment.
