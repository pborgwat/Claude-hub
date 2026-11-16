/**
 * Selamat Jalan - gedeeld uitgavenlogboek.
 * Plak dit in Extensies > Apps Script van een lege Google Sheet en implementeer als web-app
 * (uitvoeren als: ikzelf, toegang: iedereen). Zie README.md in deze map.
 * De sheet zelf blijft prive. Alleen wie het web-app adres kent, kan uitgaven lezen en schrijven.
 */
const TAB = 'Uitgaven';
const KOP = ['id', 'datum', 'wie', 'categorie', 'bedrag', 'valuta', 'koers', 'euro', 'samen', 'notitie', 'ts'];
const CATS = { eten: 'Eten', slapen: 'Slapen', vervoer: 'Vervoer', leuk: 'Leuke dingen', overig: 'Overig' };

function tab_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(TAB);
  if (!sh) sh = ss.insertSheet(TAB);
  if (sh.getLastRow() === 0) {
    sh.appendRow(KOP);
    sh.setFrozenRows(1);
    sh.getRange('A:B').setNumberFormat('@');
    sh.getRange('J:J').setNumberFormat('@');
  }
  return sh;
}

function lees_(sh) {
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const catKey = {};
  Object.keys(CATS).forEach(function (k) { catKey[CATS[k]] = k; });
  const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, KOP.length).getValues() : [];
  return rows.filter(function (r) { return r[0] !== ''; }).map(function (r) {
    const d = r[1] instanceof Date ? Utilities.formatDate(r[1], tz, 'yyyy-MM-dd') : String(r[1]);
    return { id: String(r[0]), d: d, who: String(r[2]), cat: catKey[r[3]] || 'overig', amt: Number(r[4]), cur: String(r[5]),
      rate: Number(r[6]), shared: r[8] !== 'nee', note: String(r[9]), ts: Number(r[10]) || 0 };
  });
}

function uit_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doGet() { return uit_({ ok: true, entries: lees_(tab_()) }); }

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const b = JSON.parse((e.postData && e.postData.contents) || '{}');
    const sh = tab_();
    const del = {};
    (b.del || []).forEach(function (id) { del[String(id)] = 1; });
    const ids = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues() : [];
    const have = {};
    for (let i = ids.length - 1; i >= 0; i--) {
      const id = String(ids[i][0]);
      if (del[id]) sh.deleteRow(i + 2); else have[id] = 1;
    }
    const nieuw = (b.up || []).filter(function (x) {
      return x && x.id && !have[x.id] && !del[x.id] && Number(x.amt) > 0 && Number(x.rate) > 0 && /^\d{4}-\d\d-\d\d$/.test(String(x.d));
    }).slice(0, 2000).map(function (x) {
      const amt = Number(x.amt), rate = Number(x.rate), eur = x.cur === 'EUR' ? amt : amt / rate;
      return [String(x.id), String(x.d), x.who === 'Joost' ? 'Joost' : 'Pepijn', CATS[x.cat] || 'Overig', amt, x.cur === 'EUR' ? 'EUR' : 'IDR',
        rate, Math.round(eur * 100) / 100, x.shared === false ? 'nee' : 'ja', "'" + String(x.note || '').slice(0, 80), Number(x.ts) || 0];
    });
    if (nieuw.length) sh.getRange(sh.getLastRow() + 1, 1, nieuw.length, KOP.length).setValues(nieuw);
    return uit_({ ok: true, entries: lees_(sh) });
  } catch (err) {
    return uit_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}
