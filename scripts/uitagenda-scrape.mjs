// Haalt het programma van vandaag t/m overmorgen op bij Haarlemse zalen
// en schrijft het naar uitagenda/events.json. Draait in GitHub Actions (Node 20+).
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const OUT = new URL('../uitagenda/events.json', import.meta.url);
const DAYS = 3;
const UA = 'Mozilla/5.0 (compatible; uitagenda-haarlem/1.0; persoonlijk gebruik)';
const MONTHS = { jan: 1, feb: 2, mrt: 3, maa: 3, apr: 4, mei: 5, jun: 6, jul: 7, aug: 8, sep: 9, okt: 10, nov: 11, dec: 12 };

// Datums in Amsterdamse tijd als 'YYYY-MM-DD'
const amsDate = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(d);
const today = amsDate(new Date());
const dayList = Array.from({ length: DAYS }, (_, i) => amsDate(new Date(Date.now() + i * 864e5)));
const inWindow = (date) => dayList.includes(date);

const pad = (n) => String(n).padStart(2, '0');
function dayMonthToDate(day, monthName) {
  const m = MONTHS[monthName.toLowerCase().slice(0, 3)];
  if (!m) return null;
  const y = Number(today.slice(0, 4));
  // Kies het jaar dat het dichtst bij vandaag ligt (jaarwisseling)
  const cands = [y - 1, y, y + 1].map((yy) => `${yy}-${pad(m)}-${pad(day)}`);
  return cands.sort((a, b) => Math.abs(Date.parse(a) - Date.parse(today)) - Math.abs(Date.parse(b) - Date.parse(today)))[0];
}

const decode = (s = '') =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&#0?39;|&rsquo;|&#8217;/g, '’').replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ').replace(/&euro;/g, '€').replace(/&egrave;/g, 'è').replace(/&eacute;/g, 'é')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n)).replace(/&shy;|­/g, '')
    .replace(/\s+/g, ' ')
    .trim();

async function get(url, type = 'text') {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'nl-NL,nl;q=0.9' } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return type === 'json' ? res.json() : res.text();
}

// ---------- Filmkoepel: eigen JSON-feed van hun agenda ----------
async function filmkoepel() {
  const feed = await get('https://filmkoepel.nl/fk-feed/agenda', 'json');
  const out = [];
  for (const film of Object.values(feed)) {
    for (const t of film.times || []) {
      const s = t.program_start || '';
      const date = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
      if (!inWindow(date)) continue;
      out.push({
        venue: 'Filmkoepel',
        kind: 'film',
        title: decode(film.title),
        info: [film.director_name?.value, t.location].filter(Boolean).join(' · '),
        date,
        time: `${s.slice(8, 10)}:${s.slice(10, 12)}`,
        url: t.provider_id ? `https://filmkoepel.nl/tickets/${t.provider_id}` : film.permalink,
        soldOut: /sold|uitverkocht/i.test(t.ticket_status || ''),
      });
    }
  }
  return out;
}

// ---------- Schuur: agendapagina, per dag een blok met tijd/titel/categorie ----------
async function schuur() {
  const html = await get('https://www.schuur.nl/agenda');
  const out = [];
  const parts = html.split(/<span>(?=(?:Ma|Di|Wo|Do|Vr|Za|Zo) \d{1,2} [a-z]{3}<\/span>)/);
  for (const part of parts.slice(1)) {
    const head = part.match(/^(?:Ma|Di|Wo|Do|Vr|Za|Zo) (\d{1,2}) ([a-z]{3})<\/span>/);
    if (!head) continue;
    const date = dayMonthToDate(Number(head[1]), head[2]);
    if (!inWindow(date)) continue;
    const items = part.split('<div class="flex lg:hidden mb-2').slice(1);
    for (const it of items) {
      const time = it.match(/<span class="mr-2\.5">(\d{1,2}:\d{2})<\/span>/)?.[1];
      const cat = decode(it.match(/<span class="uppercase">([^<]*)<\/span>/)?.[1]);
      const link = it.match(/<h4[^>]*>\s*<a href="([^"]+)"[^>]*>\s*<span>([\s\S]*?)<\/span>/);
      if (!time || !link) continue;
      const maker = decode(it.match(/<span class="mr-4 lg:mr-2\.5[^"]*">([\s\S]*?)<\/span>/)?.[1]);
      const isFilm = /\/film\//.test(link[1]);
      out.push({
        venue: 'Schuur',
        kind: isFilm ? 'film' : 'podium',
        title: decode(link[2]),
        info: [cat && cat.toLowerCase(), maker].filter(Boolean).join(' · '),
        date,
        time,
        url: link[1],
      });
    }
  }
  return out;
}

// ---------- Phil (philhaarlem.nl): kaarten met "vr 25 sep — 20:00" ----------
async function phil() {
  const html = await get('https://philhaarlem.nl/agenda');
  const out = [];
  for (const art of html.match(/<article[\s\S]*?<\/article>/g) || []) {
    const url = art.match(/href="(\/agenda\/[^"/?]+)"/)?.[1];
    const title = decode(art.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1]);
    const sub = decode(art.match(/<\/h3>\s*<p>([\s\S]*?)<\/p>/)?.[1]);
    const genres = [...art.matchAll(/genre\[\]=[^"]*"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => decode(m[1]));
    const when = [...art.matchAll(/<p[^>]*>\s*((?:ma|di|wo|do|vr|za|zo) [^<]*?)\s*<\/p>/g)].map((m) => decode(m[1]))[0];
    if (!url || !title || !when) continue;
    // "vr 25 sep — 20:00" | "zo 27 sep — 15:00, 20:00" | "di 29 sep 14:00" | "do 1, vr 2 okt"
    const [datePart, timePart = ''] = when.split(/\s+[—-]\s+(?=\d{1,2}:\d{2})|\s+(?=\d{1,2}:\d{2})/);
    if (/ - /.test(datePart)) continue; // meerdaagse festivals/reeksen overslaan, losse concerten staan er apart in
    const month = datePart.match(/([a-z]{3})\s*$/)?.[1];
    const days = [...datePart.matchAll(/(?:ma|di|wo|do|vr|za|zo) (\d{1,2})/g)].map((m) => Number(m[1]));
    const times = timePart.match(/\d{1,2}:\d{2}/g) || [null];
    for (const d of days) {
      const date = month && dayMonthToDate(d, month);
      if (!date || !inWindow(date)) continue;
      for (const time of times) {
        out.push({
          venue: 'Phil',
          kind: 'podium',
          title,
          info: [genres.join(', '), sub].filter(Boolean).join(' · '),
          date,
          time,
          url: `https://philhaarlem.nl${url}`,
          soldOut: /uitverkocht/i.test(art),
        });
      }
    }
  }
  return out;
}

// ---------- Patronaat: programmapagina + detailpagina voor aanvangstijd ----------
async function patronaat() {
  const html = await get('https://patronaat.nl/programma/');
  const out = [];
  for (const block of html.split('<div class="event-program">').slice(1)) {
    const url = block.match(/href="(https:\/\/patronaat\.nl\/event\/[^"]+)"/)?.[1];
    const dm = block.match(/event-program__date">\s*<a[^>]*>\s*[a-z]{2} (\d{1,2}) ([a-z]{3}) (\d{4})/);
    if (!url || !dm) continue;
    const date = `${dm[3]}-${pad(MONTHS[dm[2]])}-${pad(dm[1])}`;
    if (!inWindow(date)) continue;
    const title = decode(block.match(/event-program__name">\s*<a[^>]*>([\s\S]*?)<\/a>/)?.[1]);
    const sub = decode(block.match(/event-program__subtitle">([\s\S]*?)<\/div>/)?.[1]);
    const genres = [...block.matchAll(/genre\/[^"]*"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => decode(m[1]));
    let time = null, room = '', soldOut = /uitverkocht|sold out/i.test(block);
    try {
      const page = decode(await get(url));
      time = page.match(/Start: (\d{1,2}:\d{2})/)?.[1] || page.match(/Deuren: (\d{1,2}:\d{2})/)?.[1] || null;
      room = page.match(/\b20\d\d ([^€:]{2,25}?) (?:€|Gratis|Uitverkocht|Deuren)/i)?.[1] || '';
      soldOut ||= /uitverkocht/i.test(page.slice(0, 3000));
    } catch (e) {
      console.warn('Patronaat detail mislukt:', url, e.message);
    }
    out.push({
      venue: 'Patronaat',
      kind: 'podium',
      title,
      info: [genres.join(', '), room, sub].filter(Boolean).join(' · '),
      date,
      time,
      url,
      soldOut,
    });
  }
  return out;
}

const sources = { Filmkoepel: filmkoepel, Schuur: schuur, Phil: phil, Patronaat: patronaat };
const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { events: [] };
const events = [];
const status = {};

for (const [name, fn] of Object.entries(sources)) {
  try {
    const list = await fn();
    events.push(...list);
    status[name] = { ok: true, count: list.length };
  } catch (e) {
    // Bron tijdelijk stuk: bewaar de vorige gegevens van die zaal zodat de app niet leeg raakt
    const old = previous.events.filter((ev) => ev.venue === name && ev.date >= today);
    events.push(...old);
    status[name] = { ok: false, error: e.message, kept: old.length };
  }
  console.log(name, status[name]);
}

// Dubbelingen eruit en sorteren op datum en tijd
const seen = new Set();
const unique = events.filter((e) => {
  const k = [e.venue, e.date, e.time, e.title].join('|');
  return seen.has(k) ? false : seen.add(k);
});
unique.sort((a, b) => (a.date + (a.time || '99')).localeCompare(b.date + (b.time || '99')) || a.title.localeCompare(b.title));

const same = JSON.stringify(previous.events) === JSON.stringify(unique) && JSON.stringify(previous.status) === JSON.stringify(status);
if (same) {
  console.log(`Geen wijzigingen (${unique.length} items)`);
} else {
  writeFileSync(OUT, JSON.stringify({ generated: new Date().toISOString(), days: dayList, status, events: unique }, null, 1) + '\n');
  console.log(`Klaar: ${unique.length} items`);
}
