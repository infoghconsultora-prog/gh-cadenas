# GH Cadenas

Cadenas de custodia digitales de GH Consultora: se completan desde el celular (también sin señal), con firma con el dedo,
y quedan enlazadas a Seguimiento de Mediciones y a GH Informes.

## Cómo se enlaza todo
1. **Seguimiento de Mediciones** → la app baja los servicios (empresa, presupuesto, fecha, técnico) y las CC que corresponden a cada uno, con el mismo ingreso de Google.
2. **GH Cadenas** → se elige la medición, se abre la cadena de ese tipo (16 tipos, los mismos de «6. CC»), se completa en el teléfono y firman el responsable y el cliente.
3. **Cerrar y entregar** → el PDF firmado entra a Seguimiento como «CC completada» del servicio (carpeta de la medición) y al lado queda `… - datos.json`.
4. **GH Informes** (Mac) → «Traer los datos» de la cadena digital: completa empresa, fecha, equipo y tablas, y usa el PDF firmado como anexo.

Qué dato va en cada cadena según de dónde sale el resultado: `cadenas.js` (`fuente`: equipo / lectura directa / laboratorio).

## Piezas
- `cadenas.js` definición de las 16 cadenas · `app.js` pantallas · `almacen.js` guardado en el teléfono (IndexedDB) · `firma.js` firma con el dedo · `pdf.js` PDF con pdf-lib · `backend.js` conexión con los dos servidores · `demo.js` datos de ejemplo.
- Backend propio: `~/Developer/gh-cadenas-backend` (Apps Script, cuenta info). Guarda las cadenas en curso (JSON en una carpeta privada + índice en una planilla). Se configura solo con `prepararTodo()`.
- Sin servidor configurado, o con `?demo`, la app funciona en **modo de prueba** (todo en el dispositivo, servicios de ejemplo).

## Pruebas
`node pruebas/backend.test.mjs` (backend con Google simulado) · `node pruebas/pdf.test.mjs <carpeta>` (PDF de los 16 tipos).
