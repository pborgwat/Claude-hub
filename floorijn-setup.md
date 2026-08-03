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

## Op de telefoon zetten

1. Open de link hierboven in Safari.
2. Deelknop → **Zet op beginscherm**.
3. Openen vanaf het beginscherm, dan staat hij schermvullend zonder adresbalk.
4. Bij de eerste keer kies je wie je bent. Dat kan later om in de instellingen.

## Samen dezelfde stand zien

Zonder deze stap houdt de app de kas alleen op één telefoon bij. GitHub Pages levert
alleen bestanden, dus de gedeelde stand moet in een database staan. Dit is eenmalig
werk, daarna hoef je er nooit meer naar te kijken.

Een echt account-vrije dienst was het uitgangspunt, maar die bleken zonder uitzondering
onbruikbaar: jsonblob gooit data na 24 uur weg, kvdb.io en keyvalue.xyz zijn offline,
extendsclass en jsonstorage vragen inmiddels een sleutel, en Pantry was uit de lucht.
Voor een salarisadministratie wil je geen opslag die na een dag leeg is, dus staat de
kas nu in je eigen gratis Supabase-project.

1. Maak een gratis project op [supabase.com](https://supabase.com).
2. Open in dat project de **SQL Editor** en voer dit uit:

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

3. Ga naar **Project Settings → API** en kopieer de **Project URL** en de **anon public key**.
4. Open Floorijn → tandwiel → vul beide velden in → **Verbinden**.
5. Tik op **Kopieer instel-link** en stuur die naar Floor. Zij opent de link één keer op
   haar telefoon en is dan meteen gekoppeld, zonder iets in te vullen.

Vanaf dat moment verversen jullie telefoons elke 15 seconden, en ook zodra je de app
weer opent. Onder de bedragen staat of hij verbonden is.

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
- **Wie de instel-link heeft, kan bij de kas.** De anon key zit in die link, en de
  regel hierboven geeft iedereen met die sleutel lees- en schrijfrechten op deze ene tabel.
  Dat past bij wat het is, een tegoedmeter tussen twee mensen, maar deel de link dus niet
  breder en zet hem niet in een openbaar bericht.

## Techniek

Vanilla HTML, CSS en JavaScript in één bestand, geen build en geen dependencies.
Data staat in `localStorage` en optioneel in Supabase via de REST-api (`fetch`, geen SDK).
Getest met Playwright op iPhone-formaat: 32 checks op saldo-berekening, bedragparsing
met Nederlandse komma's en duizendscheidingstekens, historie, praatje, rolverschil tussen
Floor en Pepijn, bewaren na herladen, verwijderen, en of omschrijvingen veilig als tekst
worden weergegeven.
