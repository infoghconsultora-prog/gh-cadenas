// Ejecuta Code.gs del backend con los servicios de Apps Script simulados (va acá y no en la carpeta del backend
// porque clasp sube todo lo que haya ahí).   node pruebas/backend.test.mjs
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm'; import assert from 'node:assert/strict';
const gs = fs.readFileSync(path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', 'gh-cadenas-backend', 'Code.gs'), 'utf8');
const props = {}, cache = {}, archivos = {}, carpetas = {}, hojas = {};
let sec = 0;
const nuevoId = (p) => p + String(++sec).padStart(4, '0') + 'ABCDEFGHIJKLMNOPQRSTUVWX';
function archivo(nombre, texto, carpetaId) {
  const id = nuevoId('F'); const a = { id, nombre, texto, carpetaId, borrado: false,
    getId: () => id, getUrl: () => 'https://drive.google.com/file/d/' + id + '/view', setContent(t) { a.texto = t; return a; },
    getBlob: () => ({ getDataAsString: () => a.texto }), setTrashed(v) { a.borrado = v; return a; },
    getParents: () => { let d = false; return { hasNext: () => !d && !!carpetas[a.carpetaId], next: () => { d = true; return carpetas[a.carpetaId]; } }; } };
  archivos[id] = a; return a;
}
function carpeta(nombre) {
  const id = nuevoId('C'); const c = { id, nombre, getId: () => id, createFile: (n, t) => archivo(n, t, id),
    getFilesByName: (n) => { const l = Object.values(archivos).filter((a) => a.carpetaId === id && a.nombre === n && !a.borrado); let i = 0; return { hasNext: () => i < l.length, next: () => l[i++] }; } };
  carpetas[id] = c; return c;
}
function hoja(nombre) {
  const h = { nombre, filas: [], oculto: false, setName(n) { h.nombre = n; }, appendRow(f) { h.filas.push(f.slice()); }, setFrozenRows() {}, hideSheet() { h.oculto = true; },
    getLastRow: () => h.filas.length,
    getRange: (r, c, nr = 1, nc = 1) => ({
      getValues: () => h.filas.slice(r - 1, r - 1 + nr).map((f) => Array.from({ length: nc }, (_, i) => f[c - 1 + i] ?? '')),
      setValues: (v) => v.forEach((f, i) => { h.filas[r - 1 + i] = h.filas[r - 1 + i] || []; f.forEach((x, j) => { h.filas[r - 1 + i][c - 1 + j] = x; }); }),
      setValue: (x) => { h.filas[r - 1][c - 1] = x; } }) };
  return h;
}
function libro(nombre) { const id = nuevoId('S'); const l = { id, hojas: [hoja('Hoja 1')], getId: () => id, getSheets: () => l.hojas,
  getSheetByName: (n) => l.hojas.find((h) => h.nombre === n) || null, insertSheet: (n) => { const h = hoja(n); l.hojas.push(h); return h; } }; hojas[id] = l; return l; }
const ctx = { console, JSON, Date, Math, String, Number, Object, Array, RegExp, Error,
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null, setProperty: (k, v) => { props[k] = String(v); } }) },
  CacheService: { getScriptCache: () => ({ get: (k) => cache[k] ?? null, put: (k, v) => { cache[k] = v; }, remove: (k) => { delete cache[k]; } }) },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
  SpreadsheetApp: { create: libro, openById: (id) => hojas[id] },
  DriveApp: { createFolder: carpeta, getFolderById: (id) => carpetas[id], getFileById: (id) => { if (!archivos[id]) throw new Error('no existe ' + id); return archivos[id]; } },
  UrlFetchApp: { fetch: (u) => ({ getResponseCode: () => (/id_token=bueno/.test(u) ? 200 : 400),
    getContentText: () => JSON.stringify({ aud: ctx.OAUTH_CLIENT_ID, iss: 'accounts.google.com', email: /otro/.test(u) ? 'intruso@gmail.com' : 'FM.ghconsultora@gmail.com', email_verified: 'true', exp: String(Math.floor(Date.now() / 1000) + 3600) }) }) },
  Utilities: { sleep() {}, getUuid: () => 'uuid', base64EncodeWebSafe: (b) => Buffer.from(b).toString('base64url'), base64DecodeWebSafe: (s) => Buffer.from(s, 'base64url'),
    computeDigest: (_a, t) => Array.from(Buffer.from(String(t)).subarray(0, 24)), DigestAlgorithm: { SHA_256: 1 }, newBlob: (b) => ({ getDataAsString: () => Buffer.from(b).toString() }) },
  ContentService: { createTextOutput: (t) => ({ texto: t, setMimeType() { return this; } }), MimeType: { JSON: 'json' } },
};
vm.createContext(ctx); vm.runInContext(gs, ctx);
let nreq = 0;
const post = (cuerpo, token = 'bueno.x.y') => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(Object.assign({ idToken: token, requestId: 'req' + String(++nreq).padStart(8, '0') }, cuerpo)) } }).texto);

// sin configurar: avisa qué falta, no explota
assert.match(post({ action: 'getData' }).error, /falta_configurar_SHEET_ID/);
console.log(ctx.prepararTodo());
assert.equal(post({ action: 'getData' }, 'malo.x.y').error, 'auth_failed');
assert.equal(post({ action: 'getData' }, 'bueno.otro.y').error, 'auth_failed');            // cuenta fuera del equipo
let d = post({ action: 'getData' }); assert.equal(d.ok, true); assert.deepEqual(d.cadenas, []); assert.equal(d.email, 'fm.ghconsultora@gmail.com');
const v0 = d.version;
const cad = { id: 'cabc123xyz', servicio: '0911-00501', tipo: 'CC RUIDO', hoja: 1, estado: 'borrador', creada: 1000, actualizado: 2000, por: 'Felipe',
  rotulo: { empresa: 'Empresa X' }, tablas: { filas: [{ sector: 'Taller' }] }, firmas: {}, pendiente: true };
assert.equal(post({ action: 'guardarCadena', cadena: cad }).ok, true);
d = post({ action: 'getData' }); assert.equal(d.cadenas.length, 1); assert.equal(d.cadenas[0].empresa, 'Empresa X'); assert.notEqual(d.version, v0);
let g = post({ action: 'getCadena', id: 'cabc123xyz' }); assert.equal(g.cadena.tablas.filas[0].sector, 'Taller'); assert.equal(g.cadena.pendiente, undefined);
// una versión más vieja (otro teléfono atrasado) no pisa
assert.equal(post({ action: 'guardarCadena', cadena: Object.assign({}, cad, { actualizado: 1500, tablas: { filas: [] } }) }).ignorada, true);
assert.equal(post({ action: 'getCadena', id: 'cabc123xyz' }).cadena.tablas.filas.length, 1);
// una más nueva sí, y no duplica la fila ni el archivo
assert.equal(post({ action: 'guardarCadena', cadena: Object.assign({}, cad, { actualizado: 3000, tablas: { filas: [{ sector: 'Taller' }, { sector: 'Pintura' }] } }) }).ok, true);
assert.equal(post({ action: 'getData' }).cadenas.length, 1); assert.equal(post({ action: 'getCadena', id: 'cabc123xyz' }).cadena.tablas.filas.length, 2);
assert.equal(Object.values(archivos).filter((a) => a.nombre === 'cabc123xyz.json').length, 1);
// el mismo pedido repetido (reintento del teléfono) devuelve lo mismo sin volver a ejecutar
const rep = { action: 'guardarCadena', cadena: Object.assign({}, cad, { actualizado: 4000 }), requestId: 'repetido01', idToken: 'bueno.x.y' };
const r1 = JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(rep) } }).texto), r2 = JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(rep) } }).texto);
assert.deepEqual(r1, r2);
// ids raros se rechazan
assert.equal(post({ action: 'guardarCadena', cadena: { id: '../x', tipo: 'CC RUIDO' } }).error, 'id_invalido');
assert.equal(post({ action: 'getCadena', id: 'noexiste99' }).error, 'no_existe');
// cierre: deja los datos junto al PDF que guardó Seguimiento
const carpetaMedicion = carpeta('RUIDO'); const pdf = carpetaMedicion.createFile('CC RUIDO - Empresa X.pdf', '%PDF');
let c = post({ action: 'cerrarCadena', cadena: Object.assign({}, cad, { actualizado: 5000, pdfUrl: pdf.getUrl() }), datos: { formato: 'gh-cadena/1', tipo: 'CC RUIDO' }, pdfUrl: pdf.getUrl(), nombre: 'CC RUIDO - Empresa X - 2026-11-20 - datos.json' });
assert.equal(c.ok, true); assert.match(c.datosUrl, /drive\.google\.com/);
const datos = Object.values(archivos).filter((a) => a.carpetaId === carpetaMedicion.id && /datos\.json$/.test(a.nombre));
assert.equal(datos.length, 1); assert.equal(JSON.parse(datos[0].texto).formato, 'gh-cadena/1');
assert.equal(post({ action: 'getData' }).cadenas[0].estado, 'cerrada');
// reabrir y cerrar de nuevo reemplaza el archivo de datos, no lo duplica
post({ action: 'cerrarCadena', cadena: Object.assign({}, cad, { actualizado: 6000 }), datos: { formato: 'gh-cadena/1', v: 2 }, pdfUrl: pdf.getUrl(), nombre: 'CC RUIDO - Empresa X - 2026-11-20 - datos.json' });
assert.equal(Object.values(archivos).filter((a) => a.carpetaId === carpetaMedicion.id && /datos\.json$/.test(a.nombre)).length, 1);
// borrar: sale del índice, el archivo va a la papelera, y un guardado atrasado no la revive
assert.equal(post({ action: 'borrarCadena', id: 'cabc123xyz' }).ok, true);
assert.equal(post({ action: 'getData' }).cadenas.length, 0);
assert.equal(post({ action: 'guardarCadena', cadena: Object.assign({}, cad, { actualizado: Date.now() + 99999 }) }).ignorada, true);
assert.equal(post({ action: 'getData' }).cadenas.length, 0);
assert.equal(post({ action: 'cualquiera' }).error, 'unknown_action');
assert.equal(JSON.parse(ctx.doGet().texto).error, 'use_post');
// ---- base de empresas
const amb = libro('ambiental'); hojas['1eAe3FV63yoQu0aLAvakGikaWf4MXwOheFPA9hC9HQ0o'] = amb; amb.hojas[0].setName('habilitaciones vencimientos');
const filaAmb = (emp, cuit) => { const f = Array(22).fill(''); f[3] = emp; f[20] = cuit; return f; };
amb.hojas[0].appendRow(Array(22).fill('enc')); amb.hojas[0].appendRow(filaAmb('ACER', '')); amb.hojas[0].appendRow(filaAmb('', ''));
amb.hojas[0].appendRow(filaAmb('BIOESTANCIA', '30-71890427-3')); amb.hojas[0].appendRow(filaAmb('Don Evaristo', '30-1'));
let im = post({ action: 'importarEmpresas', empresas: [{ nombre: 'ACER SAN JUAN S.R.L.', cuit: '30-71406014-3', ubicacion: 'Ruta 20 Km 8.5', localidad: '9 de Julio', cp: '5402', provincia: 'San Juan' },
  { nombre: 'BIO ESTANCIA S.R.L.', ubicacion: 'Juan Díaz de Solís' }] });
assert.equal(im.guardadas, 2);
let emps = post({ action: 'getData' }).empresas;
const acer = emps.find((e) => e.nombre === 'ACER SAN JUAN S.R.L.');
assert.equal(acer.cp, '5402'); assert.equal(acer.ambiental, 'ACER');                  // «ACER» de Ambiental se une con la de la base
assert.ok(emps.find((e) => e.nombre === 'Don Evaristo' && e.cuit === '30-1'));          // las que solo están en Ambiental entran con su CUIT
assert.equal(emps.filter((e) => /acer/i.test(e.nombre)).length, 1);
// mientras se escribe (borrador) no aprende
post({ action: 'guardarCadena', cadena: { id: 'cemp000000', tipo: 'CC UVB', actualizado: Date.now(), rotulo: { empresa: 'Metal', cuit: '30-9' } } });
assert.ok(!post({ action: 'getData' }).empresas.find((e) => e.nombre === 'Metal'));
// una cadena entregada enseña los datos nuevos, sin borrar los que ya estaban
post({ action: 'guardarCadena', cadena: { id: 'cemp000001', tipo: 'CC UVB', estado: 'cerrada', actualizado: Date.now(), rotulo: { empresa: 'Acer San Juan SRL', sitio: 'Taller de soldadura', cuit: '' } } });
emps = post({ action: 'getData' }).empresas;
const acer2 = emps.find((e) => /acer/i.test(e.nombre));
assert.equal(acer2.sitio, 'Taller de soldadura'); assert.equal(acer2.cuit, '30-71406014-3'); assert.equal(emps.filter((e) => /acer/i.test(e.nombre)).length, 1);
post({ action: 'guardarCadena', cadena: { id: 'cemp000002', tipo: 'CC AIRE', estado: 'cerrada', actualizado: Date.now(), rotulo: { empresa: 'Nueva Empresa SA', ubicacion: 'Calle 5' } } });
assert.ok(post({ action: 'getData' }).empresas.find((e) => e.nombre === 'Nueva Empresa SA' && e.ubicacion === 'Calle 5'));
// CINCA: la planta y Veladero son dos empresas distintas (Veladero con los datos de Iglesia)
amb.hojas[0].appendRow(filaAmb('CINCA', '33-71229872-9')); amb.hojas[0].appendRow(filaAmb('CINCA VELADERO', '33-71229872-9'));
post({ action: 'importarEmpresas', empresas: [{ nombre: 'CINCA S.A.', ubicacion: 'Lateral de Ruta 40', localidad: 'Rawson' }] });
emps = post({ action: 'getData' }).empresas;
const planta = emps.find((e) => e.nombre === 'CINCA S.A.'), vel = emps.find((e) => /veladero/i.test(e.nombre));
assert.equal(planta.ubicacion, 'Lateral de Ruta 40');
assert.ok(vel, 'falta CINCA Veladero'); assert.equal(vel.localidad, 'Iglesia'); assert.equal(vel.ambiental, 'CINCA VELADERO');
assert.equal(emps.filter((e) => /cinca/i.test(e.nombre)).length, 2);
console.log('backend: todas las pruebas pasaron');
