# Selamat Jalan

Reisgids voor Indonesië, 16 november tot 6 december 2026: https://pborgwat.github.io/Claude-hub/indonesie/

Omrekenen, uitgaven loggen, reisschema, woordjes en culturele achtergrond. Bovenin de tijd in Nederland,
Bali en Raja Ampat en de eerstvolgende vlucht.

## Op je telefoon zetten

1. Open de link hierboven terwijl je internet hebt.
2. Deelknop of menu, dan **Zet op beginscherm**.
3. Open hem een keer vanaf het beginscherm. Daarna werkt alles ook zonder internet.

## Gedeeld logboek koppelen (eenmalig, een van de twee)

Zonder koppeling bewaart elke telefoon zijn eigen logboek. Met koppeling komen de uitgaven van allebei
in dezelfde Google Sheet, net als bij Lichtpad en Floorijn.

1. Maak een lege spreadsheet op [sheets.new](https://sheets.new) en noem hem bijvoorbeeld Indonesië uitgaven.
2. **Extensies > Apps Script**. Verwijder wat er staat en plak de inhoud van `uitgaven-appsscript.gs` erin. Opslaan.
3. **Implementeren > Nieuwe implementatie > Web-app**:
   - Uitvoeren als: **ikzelf**
   - Wie heeft toegang: **iedereen**
   - Implementeren, en de eerste keer de toegang goedkeuren. Google waarschuwt dat het script niet
     gecontroleerd is, dat is je eigen script.
4. Kopieer de **web-app URL**, die eindigt op `/exec`.
5. In de app: tab **Uitgaven**, onderaan bij *Delen en bewaren* de URL plakken en op **Koppel** tikken.
6. Tik daarna op **Kopieer link voor de ander** en stuur die link door. Wie hem opent is meteen gekoppeld.

De URL staat bewust niet in deze repo, want die is openbaar. De sheet zelf deel je met niemand.
Wie de web-app URL kent kan uitgaven lezen en toevoegen, dus stuur hem alleen aan elkaar.

Zonder internet log je gewoon door. De app bewaart de wijzigingen en stuurt ze na zodra er bereik is.
In de sheet kun je meekijken, sorteren en optellen. Rijen verwijderen kan daar ook, de app neemt dat over.
