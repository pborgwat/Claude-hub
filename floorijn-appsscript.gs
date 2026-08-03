/**
 * Floorijn, kant van de Google Sheet.
 *
 * Plak dit in Extensies -> Apps Script van een lege Google Spreadsheet en
 * publiceer het als web-app (Implementeren -> Nieuwe implementatie ->
 * Web-app, uitvoeren als "ikzelf", toegang "Iedereen"). De /exec-link die je
 * dan krijgt vul je in bij de instellingen van Floorijn.
 *
 * Alles loopt via GET met parameters. Dat is bewust: een GET zonder eigen
 * headers vraagt geen CORS-preflight aan, en bij de doorverwijzing die Apps
 * Script maakt blijft een GET een GET. Een POST zou daar op stuk lopen.
 */

var SHEET_NAME = 'floorijn';
var HEADERS = ['id', 'kind', 'amount', 'text', 'author', 'at', 'period', 'deleted'];

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'list';
  var lock = LockService.getScriptLock();
  try {
    // Zonder slot kunnen twee telefoons tegelijk op dezelfde rij schrijven.
    lock.waitLock(20000);
    if (action === 'list') return respond({ ok: true, items: readAll() });
    if (action === 'add')  return respond({ ok: true, items: addItem(e.parameter.item) });
    if (action === 'del')  return respond({ ok: true, items: deleteItem(e.parameter.id) });
    return respond({ error: 'onbekende actie: ' + action });
  } catch (err) {
    return respond({ error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function readAll() {
  var sh = getSheet();
  if (sh.getLastRow() < 2) return [];
  var values = sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.length).getValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue;
    out.push({
      id: String(row[0]),
      kind: String(row[1]),
      amount: Number(row[2]) || 0,
      text: String(row[3] == null ? '' : row[3]),
      author: String(row[4]),
      // Datums komen als Date terug uit de Sheet, de app verwacht ISO-tekst.
      at: row[5] instanceof Date ? row[5].toISOString() : String(row[5]),
      period: String(row[6] == null ? '' : row[6]),
      deleted: row[7] === true || String(row[7]).toLowerCase() === 'true'
    });
  }
  out.sort(function (a, b) { return a.at < b.at ? -1 : (a.at > b.at ? 1 : 0); });
  return out;
}

function findRow(sh, id) {
  if (sh.getLastRow() < 2) return -1;
  var ids = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function addItem(raw) {
  if (!raw) throw new Error('geen boeking meegegeven');
  var it = JSON.parse(raw);
  if (!it.id) throw new Error('boeking zonder id');
  if (['fee', 'debit', 'msg'].indexOf(it.kind) === -1) throw new Error('onbekende soort: ' + it.kind);

  var sh = getSheet();
  // Opnieuw versturen na een mislukte poging mag geen dubbele regel opleveren.
  if (findRow(sh, it.id) === -1) {
    sh.appendRow([
      String(it.id),
      String(it.kind),
      Number(it.amount) || 0,
      String(it.text == null ? '' : it.text).slice(0, 500),
      String(it.author || ''),
      String(it.at || new Date().toISOString()),
      String(it.period || ''),
      it.deleted === true
    ]);
  }
  return readAll();
}

function deleteItem(id) {
  if (!id) throw new Error('geen id meegegeven');
  var sh = getSheet();
  var row = findRow(sh, id);
  // Als vlag markeren en niet echt weggooien, anders komt de regel terug
  // zodra de telefoon van de ander zijn eigen kopie weer aanbiedt.
  if (row !== -1) sh.getRange(row, HEADERS.indexOf('deleted') + 1).setValue(true);
  return readAll();
}
