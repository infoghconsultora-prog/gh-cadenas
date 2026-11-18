// Genera el PDF de cada tipo de cadena con datos de relleno (sin navegador) para revisar el armado.
//   node pruebas/pdf.test.mjs <carpeta de salida>
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const salida = process.argv[2] || path.join(raiz, 'pruebas', 'salida');
fs.mkdirSync(salida, { recursive: true });
globalThis.window = globalThis;
globalThis.atob = (b) => Buffer.from(b, 'base64').toString('binary');
window.PDFLib = require(path.join(raiz, 'vendor', 'pdf-lib.min.js'));
globalThis.fetch = async (u) => ({ arrayBuffer: async () => fs.readFileSync(path.join(raiz, u)) });
for (const f of ['cadenas.js', 'pdf.js', 'plantillas-cc.js', 'pdf-original.js']) (0, eval)(fs.readFileSync(path.join(raiz, f), 'utf8'));
const firma = 'data:image/png;base64,' + fs.readFileSync(path.join(raiz, 'pruebas', 'firma_ejemplo.png')).toString('base64');
const relleno = (c, i) => c.tipo === 'num' ? String(((i + 1) * 12.5).toFixed(1)).replace('.', ',') : c.tipo === 'time' ? '10:' + String(10 + i).padStart(2, '0')
  : c.tipo === 'date' ? '2026-11-20' : (c.tipo === 'select' || c.tipo === 'combo') ? c.op[i % c.op.length] : c.tipo === 'sn' ? (i % 2 ? 'NO' : 'SI') : c.tipo === 'chips' ? c.op.slice(0, 2)
  : /obs/.test(c.id) ? 'Sin novedades durante la medición' : /lat/.test(c.id) ? '-31.537500' : /lon/.test(c.id) ? '-68.536400' : c.et.split(' ')[0] + ' ' + (i + 1);
let fallas = 0;
for (const d of Cadenas.LISTA) {
  const cad = { id: 'prueba123', tipo: d.id, hoja: 1, por: 'Felipe Manrique', actualizado: Date.now(), observaciones: 'Medición realizada en condiciones normales de trabajo. Ω µW/cm² ≥ 3 °C.',
    rotulo: { empresa: 'METALÚRGICA DEL OESTE S.A. (ejemplo)', cuit: '30-11111111-1', ubicacion: 'Ruta 40 km 12, Pocito, San Juan', sitio: 'Planta 1', presupuesto: '0911-00501',
      fecha: '2026-11-20', fecha_fin: '2026-11-20', equipo: 'Equipo de ejemplo · N/S 12345', metodologia: 'Según norma', t: '24,5', hr: '38', p: '938', control: 'J. Pérez' },
    tablas: {}, extras: {}, firmas: { responsable: { png: firma, nombre: 'Felipe Manrique', cuando: Date.now() }, cliente: { png: firma, nombre: 'Juan Pérez', cuando: Date.now() } } };
  const n = d.id === 'CC RUIDO' ? 38 : 6;
  d.tablas.forEach((t) => { cad.tablas[t.id] = Array.from({ length: n }, (_, i) => Object.fromEntries(t.campos.map((c) => [c.id, relleno(c, i)]))); });
  (d.extras || []).forEach((c, i) => { cad.extras[c.id] = relleno(c, i); });
  try {
    const bytes = await PdfCadena.generar(cad, d);
    const doc = await window.PDFLib.PDFDocument.load(bytes);
    fs.writeFileSync(path.join(salida, d.id + '.pdf'), bytes);
    // los mismos datos, como los deja la app al cerrar la cadena (para probar el pase a GH Informes)
    fs.writeFileSync(path.join(salida, d.id + ' - datos.json'), JSON.stringify({ formato: 'gh-cadena/1', id: cad.id, tipo: d.id, informe: d.informe || '', titulo: d.titulo,
      hoja: 1, rotulo: cad.rotulo, tablas: cad.tablas, extras: cad.extras, observaciones: cad.observaciones, por: cad.por }, null, 1));
    const orig = await PdfOriginal.generar(cad, d);
    const docO = await window.PDFLib.PDFDocument.load(orig);
    fs.writeFileSync(path.join(salida, d.id + ' (original).pdf'), orig);
    console.log('ok  ', d.id.padEnd(28), doc.getPageCount() + ' hoja(s)', Math.round(bytes.length / 1024) + ' KB', '· original', docO.getPageCount() + ' hoja(s)', Math.round(orig.length / 1024) + ' KB');
  } catch (e) { fallas++; console.log('FALLA', d.id, e.message); }
}
process.exit(fallas ? 1 : 0);
