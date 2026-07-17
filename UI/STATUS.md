# Hvor vi slap — 17. juli

## Det lukkede spørgsmål: Vercel byggede hele tiden

**Der var aldrig noget galt.** Den her note påstod hele 17. juli at Vercel var
holdt op med at bygge `feature/nia-dev`. Det var forkert, og fejlen var min.

Opslaget der "beviste" det spurgte med **korte** SHA'er, og deployments-API'ets
`?sha=`-filter matcher kun den fulde 40-tegns. En kort SHA giver `[]`, og det
læses nøjagtig som "aldrig bygget". Med fuld SHA:

| commit | deployment | build |
|---|---|---|
| `c780000` startskærmen | findes ikke | — |
| `49eef2b` ramme-vælgeren | findes | **success** |
| `a28092c` alt fra i dag | findes | **success** |

At `c780000` mangler er heller ikke en fejl: **Vercel bygger kun toppen af et
push**, ikke hver commit undervejs. `c780000` var aldrig en top.

**Sådan gøres det rigtigt:**

```sh
full=$(git rev-parse <commit>)
id=$(curl -s -A "Mozilla/5.0" ".../deployments?sha=$full" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
curl -s -A "Mozilla/5.0" ".../deployments/$id/statuses"
```

Svaret rummer `state` og et `environment_url` — et link til præcis den commit,
uden om cache og branch-aliaser. Brug det frem for at gætte.

## Det der stadig ikke er forklaret

Nicolai så ikke startskærmen 17. juli om morgenen, selvom `49eef2b` var bygget
grønt og indeholdt den. Det er stadig ubesvaret — men det er *ikke* Vercel.
Næste gang: giv ham `environment_url` for den præcise commit i stedet for
branch-URL'en, så cache og aliaser er ude af ligningen.

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
