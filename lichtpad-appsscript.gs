/**
 * Lichtpad highscores, kant van de Google Sheet.
 *
 * Plak dit in Extensies -> Apps Script van een lege Google Spreadsheet en
 * publiceer het als web-app (Implementeren -> Nieuwe implementatie ->
 * Web-app, uitvoeren als "ikzelf", toegang "Iedereen"). De /exec-link die je
 * dan krijgt komt bovenin het script van lichtpad.html bij SCORES_URL.
 *
 * Alles loopt via GET met parameters, net als bij Floorijn: een GET zonder
 * eigen headers vraagt geen CORS-preflight aan en blijft een GET na de
 * doorverwijzing die Apps Script maakt.
 *
 *   ?action=list                                   -> top 10
 *   ?action=add&id=..&name=..&walls=..&total=..&last=..  -> score opslaan, top 10 + plek
 */

var SHEET_NAME = 'scores';
var HEADERS = ['id', 'name', 'walls', 'total', 'last', 'at'];
var TOP = 10;

function doGet(e) {
  var p = (e && e.parameter) || {};
  var action = p.action || 'list';
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    if (action === 'list') return respond(board(null));
    if (action === 'add') return respond(addScore(p));
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
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange('B:B').setNumberFormat('@'); // namen als tekst, ook "007"
  }
  return sh;
}

function readAll() {
  var sh = getSheet();
  if (sh.getLastRow() < 2) return [];
  var values = sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.length).getValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    if (!r[0]) continue;
    out.push({
      id: String(r[0]),
      name: String(r[1]),
      walls: Number(r[2]) || 0,
      total: Number(r[3]) || 0,
      last: Number(r[4]) || 0,
      at: r[5] instanceof Date ? r[5].toISOString() : String(r[5])
    });
  }
  return out;
}

// Meeste wanden eerst, bij gelijkspel de kortste totale tijd.
function sortScores(a) {
  a.sort(function (x, y) {
    return (y.walls - x.walls) || (x.total - y.total) || (x.at < y.at ? -1 : 1);
  });
  return a;
}

function board(id) {
  var all = sortScores(readAll());
  var rank = 0;
  if (id) {
    for (var i = 0; i < all.length; i++) if (all[i].id === id) { rank = i + 1; break; }
  }
  var mine = rank > TOP ? all[rank - 1] : null;
  return { ok: true, top: all.slice(0, TOP), rank: rank, count: all.length, mine: mine };
}

function findRow(sh, id) {
  if (sh.getLastRow() < 2) return -1;
  var ids = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return -1;
}

function addScore(p) {
  var id = String(p.id || '');
  if (!/^[a-z0-9-]{6,40}$/i.test(id)) throw new Error('ongeldige id');
  var name = String(p.name || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 16);
  if (!name) throw new Error('naam ontbreekt');
  var walls = Math.floor(Number(p.walls));
  var total = Number(p.total), last = Number(p.last);
  if (!(walls >= 0 && walls <= 500)) throw new Error('ongeldig aantal wanden');
  if (!(total >= 0 && total < 36000)) throw new Error('ongeldige totale tijd');
  if (!(last >= 0 && last <= total + 0.05)) throw new Error('ongeldige tijd laatste wand');

  var sh = getSheet();
  // Opnieuw versturen na een mislukte poging mag geen dubbele regel opleveren.
  if (findRow(sh, id) === -1) {
    // Een naam die met = + - @ begint zou de Sheet als formule lezen.
    var safe = /^[=+\-@]/.test(name) ? "'" + name : name;
    sh.appendRow([id, safe, walls, Math.round(total * 100) / 100, Math.round(last * 100) / 100, new Date().toISOString()]);
  }
  return board(id);
}
