// Versleutelt of ontsleutelt het reisschema van Selamat Jalan. Het leesbare schema staat niet in de repo.
//   node versleutel.mjs versleutel reis.json "<wachtwoord>"   -> zet de nieuwe versleutelde tekst in index.html
//   node versleutel.mjs ontsleutel "<wachtwoord>"             -> toont het schema uit index.html als JSON
import { readFileSync, writeFileSync } from 'node:fs';
import { webcrypto as c } from 'node:crypto';
const html = new URL('./index.html', import.meta.url);
const RE = /var BLOB='([A-Za-z0-9+/=]*)';/;
const norm = p => String(p).toLowerCase().replace(/[^a-z0-9]/g, '');
async function key(pw, salt, use) {
  const k = await c.subtle.importKey('raw', new TextEncoder().encode(norm(pw)), 'PBKDF2', false, ['deriveKey']);
  return c.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, [use]);
}
const [cmd, a, b] = process.argv.slice(2);
if (cmd === 'versleutel' && a && b) {
  const text = JSON.stringify(JSON.parse(readFileSync(a, 'utf8')));
  const salt = c.getRandomValues(new Uint8Array(16)), iv = c.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await c.subtle.encrypt({ name: 'AES-GCM', iv }, await key(b, salt, 'encrypt'), new TextEncoder().encode(text)));
  const blob = Buffer.concat([salt, iv, ct]).toString('base64');
  const src = readFileSync(html, 'utf8');
  if (!RE.test(src)) throw new Error("var BLOB='...' niet gevonden in index.html");
  writeFileSync(html, src.replace(RE, "var BLOB='" + blob + "';"));
  console.log('index.html bijgewerkt, ' + blob.length + ' tekens');
} else if (cmd === 'ontsleutel' && a) {
  const d = Buffer.from(readFileSync(html, 'utf8').match(RE)[1], 'base64');
  const pt = await c.subtle.decrypt({ name: 'AES-GCM', iv: d.subarray(16, 28) }, await key(a, d.subarray(0, 16), 'decrypt'), d.subarray(28));
  console.log(JSON.stringify(JSON.parse(new TextDecoder().decode(pt)), null, 1));
} else {
  console.log('Gebruik: node versleutel.mjs versleutel reis.json "<wachtwoord>" | node versleutel.mjs ontsleutel "<wachtwoord>"');
}
