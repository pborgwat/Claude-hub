# Floorijn

Tegoedmeter tussen Floor en Pepijn, met een praatje-functie erbij.
Eén bestand, werkt in Safari op de telefoon: `floorijn.html`

Live: https://pborgwat.github.io/Claude-hub/floorijn.html

## Wat de app doet

- **Nog te goed** groot in beeld, als een bankbiljet.
- **Fee erbij** (alleen Pepijn): bedrag, waarvoor, en voor welke maand. Bij het invullen
  rekent de app meteen voor wat er aan Paviljoen Loef gefactureerd wordt (1,5×).
- **Afboeken** (Floor en Pepijn): iets dat voorgeschoten of betaald is gaat van het tegoed af.
- **Historie** per maand, met wie het geboekt heeft en wanneer. Tik een regel aan om te verwijderen.
- **Praatje**: berichtjes heen en weer. Geen notificaties, precies zoals afgesproken.

## Het slot

Bij openen zie je alleen een hangslot, de keuze tussen Floor en Pepijn, en een
wachtwoordveld. Het wachtwoord is **Houdoe01**, staat vast en is niet te wijzigen in de
app. Pas na het openen verschijnt de naam Floorijn, en ook de titel van het tabblad
verandert dan. Op het beginscherm van je telefoon staat de app als **Kas**, zodat er ook
daar niets te zien is.

Het wachtwoord wordt bij elke keer openen gevraagd. Wie je bent onthoudt hij wel, dat
staat al voor je klaar.

Wat dit slot wel en niet doet, zodat je er niet meer van verwacht dan het waard is: het
houdt iemand tegen die je telefoon oppakt, en het houdt de naam en de bedragen uit het
zicht. Het houdt niemand tegen die de openbare URL heeft en in de broncode gaat kijken,
want dit is een statische pagina zonder server die iets kan weigeren. Het wachtwoord staat
er als SHA-256-hash in en dus niet leesbaar, maar de controle gebeurt in de pagina zelf en
daar kun je omheen. Wil je echte afscherming, dan is er een inlog met een server voor
nodig, en dat is een ander soort project.

## Op de telefoon zetten

1. Open de link hierboven in Safari.
2. Deelknop → **Zet op beginscherm**.
3. Openen vanaf het beginscherm, dan staat hij schermvullend zonder adresbalk.
4. Kies wie je bent, vul het wachtwoord in. Van persoon wisselen kan later in de
   instellingen, zonder het wachtwoord opnieuw.

## Samen dezelfde stand zien

Zonder deze stap houdt de app de kas alleen op één telefoon bij. GitHub Pages levert
alleen bestanden, dus de gedeelde stand moet ergens anders staan. Dit is eenmalig werk,
daarna hoef je er nooit meer naar te kijken.

Een dienst zonder account was het uitgangspunt, maar die bleken zonder uitzondering
onbruikbaar: jsonblob gooit data na 24 uur weg en verlengt dat niet bij gebruik,
kvdb.io en keyvalue.xyz zijn offline, extendsclass en jsonstorage vragen inmiddels een
sleutel, en Pantry was uit de lucht. Voor een salarisadministratie wil je geen opslag
die na een dag leeg is.

De app werkt met twee soorten kas en ziet zelf welke je invult. **Google Sheets is de
eenvoudigste**, want je hebt Google al en er komt geen sleutel bij kijken.

### Optie A, Google Sheet (aanbevolen)

1. Maak een lege spreadsheet op [sheets.new](https://sheets.new) en noem hem Floorijn.
2. **Extensies → Apps Script**. Verwijder wat er staat en plak de inhoud van
   `floorijn-appsscript.gs` erin. Opslaan.
3. **Implementeren → Nieuwe implementatie → Web-app**:
   - Uitvoeren als: **ikzelf**
   - Wie heeft toegang: **iedereen**
   - Implementeren, en de eerste keer de toegang goedkeuren. Google waarschuwt dat het
     script niet gecontroleerd is, dat is jouw eigen script.
4. Kopieer de **web-app URL**, die eindigt op `/exec`.
5. Open Floorijn → tandwiel → plak de URL in het eerste veld, het tweede veld leeg
   laten → **Verbinden**.

Het tabblad `floorijn` met de kolommen maakt het script zelf aan bij de eerste boeking.

### Optie B, Supabase

1. Maak een gratis project op [supabase.com](https://supabase.com).
2. Open de **SQL Editor** en voer dit uit:

   ```sql
   create table if not exists floorijn_items (
     id       text primary key,
     kind     text not null check (kind in ('fee','debit','msg')),
     amount   numeric(10,2) not null default 0,
     text     text default '',
     author   text not null,
     at       timestamptz not null default now(),
     period   text,
     deleted  boolean not null default false
   );

   alter table floorijn_items enable row level security;

   create policy floorijn_open on floorijn_items
     for all to anon using (true) with check (true);

   grant select, insert, update on floorijn_items to anon;
   ```

3. Ga naar **Project Settings → API**, kopieer de **Project URL** en de **anon public key**,
   en vul beide velden in bij de instellingen.

### De tweede telefoon

Tik op **Kopieer instel-link** en stuur die naar Floor. Zij opent de link één keer op haar
telefoon en is dan gekoppeld, zonder iets in te vullen.

Vanaf dat moment verversen jullie telefoons elke 15 seconden, en ook zodra je de app weer
opent of op het rondje linksboven tikt. Onder de bedragen staat of hij verbonden is.

## Goed om te weten

- **Zonder internet werkt hij door.** Boekingen worden lokaal bewaard en later automatisch
  verstuurd. De statusregel zegt het als er nog iets klaarstaat.
- **Niemand kan de ander overschrijven.** Elke boeking is een eigen regel met een eigen id,
  dus als jullie tegelijk iets invoeren komt alles netjes naast elkaar te staan.
- **Verwijderen** haalt de regel uit het overzicht en uit het saldo, maar laat een spoor in
  de database. Dat is bewust: zo komt een verwijderde regel niet terug via de telefoon van
  de ander.
- **Back-up.** Onder instellingen kun je alles als JSON-bestand opslaan en terugzetten.
  Handig voor je eigen administratie, of als je ooit van database wisselt.
- **Wie de instel-link heeft, kan bij de kas.** Bij een web-app met toegang "iedereen"
  kan iedereen die de `/exec`-link kent lezen en schrijven, en bij Supabase geldt hetzelfde
  voor wie de anon key heeft. Dat past bij wat het is, een tegoedmeter tussen twee mensen,
  maar deel de link dus niet breder en zet hem niet in een openbaar bericht. Raakt hij toch
  op straat, dan maak je bij Google een nieuwe implementatie aan, waarmee de oude link
  ongeldig wordt.

## Techniek

Vanilla HTML, CSS en JavaScript in één bestand, geen build en geen dependencies.
Data staat in `localStorage`, en optioneel in een Google Sheet of in Supabase.

De Sheet wordt aangesproken met losse GET-aanroepen (`?action=list|add|del`). Dat is
bewust: een GET zonder eigen headers is voor de browser een simple request, dus zonder
CORS-preflight, en bij de doorverwijzing die Apps Script maakt naar
`googleusercontent.com` blijft een GET een GET. Een POST zou daar op stuk lopen.
Supabase gaat via de gewone REST-api met `fetch`, zonder SDK.

Elke boeking is een eigen regel met een eigen id, en samenvoegen gebeurt op dat id.
Daardoor kan gelijktijdige invoer op twee telefoons elkaar niet overschrijven.
Verwijderen zet een vlag in plaats van de regel weg te gooien, anders zou hij terugkomen
zodra de andere telefoon zijn eigen kopie weer aanbiedt.

Getest met Playwright op iPhone-formaat:

- 41 checks op de app zelf: het slot (verkeerd wachtwoord, zonder persoon, en of de naam
  Floorijn en Paviljoen Loef echt nergens in de pagina staan zolang het dicht is),
  saldoberekening, bedragparsing met Nederlandse komma's en duizendscheidingstekens, de
  1,5×-berekening, historie per maand, praatje, rolverschil tussen Floor en Pepijn,
  bewaren na herladen, verwijderen, weigeren van lege bedragen, de instel-link zonder
  sleutel, geen horizontaal scrollen, en omschrijvingen die veilig als tekst worden
  weergegeven.
- 42 checks op de synchronisatie, met twee telefoons tegen een nagebouwde backend, voor
  beide soorten kas: boeking van de een bij de ander, berichten heen en weer, verwijderen
  dat niet terugkomt, offline boeken dat later wordt nagestuurd, en geen dubbele regels.
