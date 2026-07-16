# Hvor vi slap — 17. juli

## Det åbne spørgsmål

**Nicolai ser ikke startskærmen på preview'et.** Han ser coinbag'en, men ikke
gaten — og dermed opfører lyden sig som før.

Det peger på at Vercel er blevet stående på en ældre version:

| commit | hvad | build |
|---|---|---|
| `3ec94ef` | lydkontekst bygges i en gesture | **bekræftet grøn** |
| `c780000` | startskærmen | **aldrig bekræftet** |
| `49eef2b` | ramme-vælgeren | **aldrig bekræftet** |

Sækken kom i `909f281`, startskærmen i `c780000`. At han ser den ene og ikke den
anden, passer på at Vercel serverer `3ec94ef` — altså at `c780000` fejlede.

Koden er gennemsøgt for det der plejer at vælte et build: ingen døde referencer
til den `setMuted` der blev fjernet fra VideoAdSlide, og hver eneste import
peger på en eksport der findes. Fejlen kan altså ikke ses ved at læse.

**Næste skridt, i den rækkefølge:**

1. Kig i Vercel-dashboardet på deployments for `feature/nia-dev`. Er de øverste
   røde? Byggeloggen har svaret.
2. Ellers: `curl api.github.com/repos/MagnusWL/Doomscroller/deployments?sha=<sha>`
   → tag `id` → `/deployments/<id>/statuses`. Kvoten var opbrugt; den nulstilles
   en time efter den løb tør.

Ret ikke noget før vi ved hvad der er galt. At ændre kode mens man ikke kan se
om det virker, laver to fejl i stedet for én.

## Hvad der ligger klar, men aldrig er set af et menneske

- **Ramme-vælgeren** — alle syv stilarter i startskærmen. Værdier og geometri er
  verificeret mod handoff'ens README, men ornamentet (13a/13b) er aldrig set
  tegnet. Kig især på 13a: krone, nagler og ædelsten, og den mest ambitiøse.
- **Startskærmen** — tekst og udseende er et gæt. Det er det første brugerne ser.

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

Nicolais branch er **18 commits foran `main`**, og noget af det ændrer appen
markant — video-slideren er slået fra, og reklamerne starter nu med lyd. Magnus
har ikke set noget af det. `main` står urørt på `b3fcb53`.
