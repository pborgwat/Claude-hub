# Claude-hub
Pepijns Claude omgeving

## Apps

| App | Bestand | Live |
| --- | --- | --- |
| Uit in Haarlem, uitagenda voor vandaag en morgen | `uitagenda/` | [openen](https://pborgwat.github.io/Claude-hub/uitagenda/) |
| Floorijn, tegoedmeter voor Floor | `floorijn.html` ([setup](floorijn-setup.md)) | [openen](https://pborgwat.github.io/Claude-hub/floorijn.html) |
| AI conversation tracker | `ai-tracker.html` | [openen](https://pborgwat.github.io/Claude-hub/ai-tracker.html) |
| The Office US quiz | `office-us-quiz.html` | [openen](https://pborgwat.github.io/Claude-hub/office-us-quiz.html) |
| Teckel vs Appels | `index.html` | [openen](https://pborgwat.github.io/Claude-hub/) |

## Uit in Haarlem

Web app (op je telefoon te installeren via *Zet op beginscherm*) met het programma van vandaag, morgen en overmorgen:
podium (Schuur theater, Phil, Patronaat) en film (Filmkoepel, Schuur). De Stadsschouwburg blokkeert automatisch ophalen, daarvoor staat er een directe link in de app.

- `scripts/uitagenda-scrape.mjs` haalt de agenda's op en schrijft `uitagenda/events.json`.
- `.github/workflows/uitagenda.yml` draait dat elke 3 uur (en handmatig via *Actions > Run workflow*).
- Lokaal testen: `node scripts/uitagenda-scrape.mjs`
