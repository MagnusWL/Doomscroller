# Doomscroller — UI-rammen (mobil)

Åbn `frame.html` i en browser. Ingen build, ingen React, intet netværk. Det er
UI'et omkring reklamerne, skilt fra appen, så det kan laves om uden at røre
resten.

To slides ligger i filen — scroll ned til den anden:

1. **En lodret reklame**, der fylder vinduet helt ud.
2. **En 16:9-reklame**, skaleret ned med sløret kopi bagved.

De to er ikke pynt. De er de to tilfælde rammen skal kunne rumme, og de trækker
i hver sin retning. Se begge, før du beslutter noget.

Øverst i vinduet står en aflæsning af hvad rammen efterlader til reklamen. Den
findes kun i denne fil.

## Rammen er tre tal

```css
--bar-h: 52px;    /* bjælken foroven og forneden */
--frame-x: 32px;  /* sort margin i hver side */
--frame-y: 40px;  /* sort mellem bjælke og reklame */
```

På en iPhone 14 (390×844, med safe areas) giver de et vindue på **326×579**.

## Det der er værd at vide, før du ændrer dem

**`--frame-x` og `--frame-y` hører sammen.** De bestemmer ikke bare hvor stort
vinduet er, men hvilken *facon* det har — og faconen bærer noget:

- Vinduet er 326×579, altså forholdet **0,563**.
- En lodret reklame er 9:16 = **0,5625**.

Fordi de to praktisk talt er samme facon, kan en lodret reklame fylde rammen ud
og kun miste **0,1%** af billedet. Appen har en regel: fylder en reklame rammen
for under 15% beskæring, gør den det; ellers skaleres den ned og en sløret kopi
af den selv fylder resten.

Gør man kun siderne bredere, skrider forholdet, og lodrette reklamer begynder at
blive beskåret for at passe. Flyt dem sammen, eller accepter beskæringen bevidst.

**Hvorfor 16:9 bliver så lille.** Cirka 97% af det, netværkene leverer, er
liggende 16:9. I en lodret ramme er bredden det bindende mål, så en 16:9-video
i et 326px bredt vindue bliver 326×183 — omkring en fjerdedel af sliden. Den kan
ikke blive større uden at blive beskåret, og at beskære den ville koste omkring
70% af billedet. Det er derfor sløringen findes: den fylder rammen uden at ofre
noget.

**Hvorfor bjælker frem for en søjle i siden.** Vi prøvede en venstre søjle. Den
kostede præcis den dimension der gør ondt — bredden — og reklamerne blev 47%
mindre i areal. En bjælke tager fra højden, som der er rigeligt af.

**Hvorfor bjælkerne ligger ovenpå.** En skaleret reklame når aldrig op til
toppen af en telefonskærm, så bjælken lægger sig i sort der alligevel var tomt.
Målt: 261px luft ned til en 16:9-video, 24px ned til en lodret.

## Hvad der ligger hvor

| | Indhold |
|---|---|
| Topbjælke | mønt-tæller til venstre, Inventory + Autoscroll til højre |
| Bundbjælke | Buy ad |
| På vinduet | "Ad"-badge øverst til venstre, lyd nederst til venstre, skip nederst til højre |

Bundbjælken er ret tom med kun én knap. Lyd og skip ligger på reklamen frem for
i bjælken. Begge dele er til diskussion.

## Farver

```
baggrund          #000
bjælker           rgba(0,0,0,0.55) + backdrop-filter: blur(8px)
knapper i bjælken rgba(255,255,255,0.12)
knapper på vinduet rgba(0,0,0,0.6)
vinduets hjørner  16px
```

## Tilbage i appen

Værdierne står i `app/globals.css` under `:root`. Klassenavnene i `frame.html`
er de samme som i appen på nær `.window`, der hedder `.vad` (video) og
`.fake-ad` (KLODS) — de deler mål, men ikke navn.
