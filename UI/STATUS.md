# Hvor vi slap — 17. juli

## Det åbne spørgsmål: Vercel bygger ikke

**Der blev aldrig oprettet en deployment** for nogen af de to commits:

| commit | hvad | deployment |
|---|---|---|
| `3ec94ef` | lydkontekst bygges i en gesture | grøn |
| `c780000` | startskærmen | **findes ikke** |
| `49eef2b` | ramme-vælgeren | **findes ikke** |

Det er ikke et build der fejlede — et fejlet build ville stå der som rødt. Der
står ingenting.

Og det er ikke pushet: `git log origin/feature/nia-dev` viser begge commits
liggende på GitHub, identisk med lokalt. **Fejlen sidder mellem GitHub og
Vercel.** Koden kan man holde op med at lede i.

Mistanken er nu integrationen selv: Vercel-appen koblet af repoet, projektet sat
på pause, eller en grænse ramt på kontoen. Alt sammen ting der kun kan ses i
**Vercel-dashboardet** — Nicolai har adgang, det har Claude ikke. Kig efter om
`feature/nia-dev` overhovedet dukker op på deployments-listen efter et push.

## Det der ikke længere er ukendt

Startskærmen, ramme-vælgeren og guld-ornamentet er nu **set virke** — i
`public/lab/`, uden om Vercel:

- **Lyden.** Klikket på Start bygger lydkonteksten inde i en gesture, og
  `AudioContext.state` bliver `running`, uden at nogen rører en reklame. Det er
  præcis kuren fra `c780000`, og det er første gang den er set gøre sit arbejde.
- **Ornamentet.** 13a tegner: guldkant, hjørne-bosser med ædelsten, nagler,
  krone. 24.636 pixels blæk på et 390×844 lærred.
- **Sækken.** Ti mønter falder i, og blækket går fra 27.563 til 31.987 pixels.
- **Geometrien.** Vinduet lander på 326×579 = 0.563 på en iPhone 12. CSS-
  kommentarens påstand om 9:16 holder.

Så de to ubekræftede commits er højst sandsynligt sunde. De er bare aldrig nået
ud.

## Lab'et

`public/lab/index.html` — rammen, startskærmen og møntsækken uden resten af
appen. **Åbnes ved dobbeltklik.** Intet build, ingen server, ingen Vercel. Den
ligger i `public/`, så den følger også med en deployment og kan ses på
`…/lab/index.html` — vejen til at se den på en rigtig telefon.

Se `public/lab/README.md`. Det vigtigste derfra: `coin-sack-engine.js` og
`frames.js` er **kopier** af filerne i `lib/`. Ret aldrig en fejl i kopien.

## Åbne beslutninger, ikke fejl

- `ads.txt` erklærer kun Google, som ikke bruges. Hverken Adcash eller
  HilltopAds står der. Koster formentlig fill hos begge. Magnus' opgave.
- AdSense-scriptet indlæses ved hver sidevisning og gør ingenting.
- Adcash har kun tre videoreklamer. Gentagelses-reglen ruter uden om dem, så
  blandingen skrider mod HilltopAds — og de betaler ikke det samme.
- HilltopAds' Video VAST-zone kan sættes til **mobil**. Vores er det næppe. Det
  er det billigste formatfix og kan måles på ti minutter.
- `AD_IN_AD` i `lib/adcash.js` er slået fra. Ét ord tænder den.

## Uroligt vand

Nicolais branch er **over tyve commits foran `main`**, og noget af det ændrer
appen markant — video-slideren er slået fra, og reklamerne starter nu med lyd.
Magnus har ikke set noget af det. `main` står urørt på `b3fcb53`.
