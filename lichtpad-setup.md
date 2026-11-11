# Lichtpad

Lichtpad: https://pborgwat.github.io/Claude-hub/lichtpad.html

## Op je iPhone zetten

1. Open de link hierboven in Safari.
2. Deelknop → **Zet op beginscherm**. Het icoon en de naam Lichtpad staan al klaar.
3. Open hem vanaf het beginscherm, dan speelt hij schermvullend zonder adresbalk.

## Licht in de kamer

Het licht in de kamer volgt de echte stand van de zon boven Haarlem, dus ook de seizoenen.
Overdag valt zonlicht van rechts door een raam op de muur en is de plant groen, bij lage
zon wordt het licht oranje en 's nachts is alleen de lampenwand aan. Een ander moment
bekijken kan met `?uur=`, bijvoorbeeld `lichtpad.html?uur=16.5` voor half vijf.

## Gedeelde highscores

Na een game over vul je je naam in. Je ziet dan hoeveel wanden je haalde, hoe lang je op
de laatste wand stond en hoe lang de hele poging duurde. De lijst staat op volgorde van
meeste wanden, en bij gelijke stand gaat de kortste totale tijd voor.

GitHub Pages levert alleen bestanden, dus de gedeelde lijst staat in een Google Sheet,
net als bij Floorijn. Zolang die niet gekoppeld is, bewaart elk apparaat zijn eigen lijst
en staat dat ook onder de lijst in het spel.

## Eenmalig koppelen

1. Maak een lege spreadsheet op [sheets.new](https://sheets.new) en noem hem Lichtpad.
2. **Extensies → Apps Script**. Verwijder wat er staat en plak de inhoud van
   `lichtpad-appsscript.gs` erin. Opslaan.
3. **Implementeren → Nieuwe implementatie → Web-app**:
   - Uitvoeren als: **ikzelf**
   - Wie heeft toegang: **iedereen**
   - Implementeren, en de eerste keer de toegang goedkeuren. Google waarschuwt dat het
     script niet gecontroleerd is, dat is jouw eigen script.
4. Kopieer de **web-app URL**, die eindigt op `/exec`.
5. Zet die URL in `lichtpad.html` bij `const SCORES_URL = '';` (of geef hem aan Claude).

Het tabblad `scores` met de kolommen maakt het script zelf aan bij de eerste score.

## Goed om te weten

- Iedereen met de link kan een score insturen. Het script controleert naam en tijden op
  redelijke waarden, maar wie moeite doet kan een nepscore insturen. Opruimen doe je door
  de regel in de Sheet te verwijderen.
- Een naam is maximaal 16 tekens. Het spel onthoudt je naam voor de volgende keer.
- Lukt het opslaan niet (geen internet, script niet bereikbaar), dan komt de score in de
  lijst op het apparaat en zegt het spel dat erbij.
