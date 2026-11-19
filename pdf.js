/* GH Cadenas — Copyright (c) 2026 Felipe Manrique. Todos los derechos reservados. */
/* Arma el PDF de una cadena de custodia (A4 apaisado) en el propio teléfono, con pdf-lib. */
(function () {
  'use strict';
  const A4 = [841.89, 595.28], M = 28;
  const VERDE = [0.31, 0.38, 0.16], GRIS = [0.93, 0.94, 0.91], LINEA = [0.6, 0.62, 0.58], NEGRO = [0.1, 0.11, 0.09];
  const REEMPLAZOS = { 'Ω': 'ohm', '≥': '>=', '≤': '<=', '→': '->', '−': '-', ' ': ' ', '₂': '2', '₃': '3', '✓': 'x' };
  const EXTRA_OK = '–—‘’“”•…€™';
  function limpio(v) {
    let s = v === null || v === undefined ? '' : String(v);
    s = s.replace(/[\r\n\t]+/g, ' ');
    let out = '';
    for (const ch of s) {
      if (REEMPLAZOS[ch] !== undefined) out += REEMPLAZOS[ch];
      else if (ch.charCodeAt(0) < 256 || EXTRA_OK.includes(ch)) out += ch;
      else out += '?';
    }
    return out;
  }
  const fechaEs = (iso) => { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(iso || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : (iso || ''); };
  function valor(campo, v) {
    if (v === null || v === undefined || v === '') return '';
    if (Array.isArray(v)) return v.join(', ');
    if (campo.tipo === 'date') return fechaEs(v);
    return String(v).replace('.', campo.tipo === 'num' ? ',' : '.');
  }
  function partir(font, texto, tam, ancho) {
    const palabras = limpio(texto).split(' '); const lineas = []; let l = '';
    for (let p of palabras) {
      while (font.widthOfTextAtSize(p, tam) > ancho && p.length > 1) {         // palabra más ancha que la celda
        let n = p.length; while (n > 1 && font.widthOfTextAtSize(p.slice(0, n), tam) > ancho) n--;
        if (l) { lineas.push(l); l = ''; }
        lineas.push(p.slice(0, n)); p = p.slice(n);
      }
      const t = l ? l + ' ' + p : p;
      if (font.widthOfTextAtSize(t, tam) <= ancho) l = t; else { if (l) lineas.push(l); l = p; }
    }
    if (l || !lineas.length) lineas.push(l);
    return lineas;
  }
  async function bytesDe(url) { const r = await fetch(url); return new Uint8Array(await r.arrayBuffer()); }
  function bytesDeDataUrl(d) { const b = atob(d.split(',')[1]); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }

  async function generar(cad, def) {
    const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
    const doc = await PDFDocument.create();
    const F = await doc.embedFont(StandardFonts.Helvetica), FB = await doc.embedFont(StandardFonts.HelveticaBold);
    let logo = null;
    try { logo = await doc.embedPng(await bytesDe('logo-gh.png')); } catch (e) { /* sin logo */ }
    const col = (c) => rgb(c[0], c[1], c[2]);
    const paginas = []; let pg = null, y = 0;
    const ANCHO = A4[0] - 2 * M;
    const titulo = 'CADENA DE CUSTODIA ' + limpio((def.titulo || cad.tipo)).toUpperCase();

    function nuevaPagina() {
      pg = doc.addPage(A4); paginas.push(pg); y = A4[1] - M;
      if (logo) { const h = 30, w = h * logo.width / logo.height; pg.drawImage(logo, { x: M, y: y - h, width: w, height: h }); }
      pg.drawText(titulo, { x: M + 78, y: y - 13, size: 13, font: FB, color: col(VERDE) });
      pg.drawText(limpio('GH Consultora · Agustín Gómez – Rawson – San Juan · RPEM 01-010 · Tel. +54 9 264-5853897 / 264-5051024'),
        { x: M + 78, y: y - 26, size: 7.5, font: F, color: col(NEGRO) });
      y -= 38;
      pg.drawLine({ start: { x: M, y }, end: { x: A4[0] - M, y }, thickness: 1.2, color: col(VERDE) });
      y -= 8;
    }
    function lugar(alto) { if (y - alto < M + 16) nuevaPagina(); }
    function barra(texto) {
      lugar(40);
      pg.drawRectangle({ x: M, y: y - 14, width: ANCHO, height: 14, color: col(VERDE) });
      pg.drawText(limpio(texto).toUpperCase(), { x: M + 5, y: y - 10.5, size: 8, font: FB, color: rgb(1, 1, 1) });
      y -= 14;
    }
    /* Grilla de pares etiqueta: valor, en n columnas */
    function pares(lista, columnas) {
      const w = ANCHO / columnas, tam = 8;
      for (let i = 0; i < lista.length; i += columnas) {
        const fila = lista.slice(i, i + columnas);
        const lineas = fila.map(([et, v]) => { const we = FB.widthOfTextAtSize(limpio(et) + ': ', tam); return partir(F, v, tam, Math.max(30, w - we - 10)); });
        const alto = Math.max.apply(null, lineas.map((l) => l.length)) * 10 + 5;
        lugar(alto);
        fila.forEach(([et, v], j) => {
          const x = M + j * w;
          pg.drawRectangle({ x, y: y - alto, width: w, height: alto, borderColor: col(LINEA), borderWidth: 0.5 });
          const e = limpio(et) + ': '; const we = FB.widthOfTextAtSize(e, tam);
          pg.drawText(e, { x: x + 4, y: y - 10, size: tam, font: FB, color: col(NEGRO) });
          lineas[j].forEach((l, k) => pg.drawText(l, { x: x + 4 + we, y: y - 10 - k * 10, size: tam, font: F, color: col(NEGRO) }));
        });
        y -= alto;
      }
    }
    function tabla(t, filas) {
      const campos = t.campos, tam = campos.length > 13 ? 6.3 : campos.length > 9 ? 7 : 7.8, alt = tam + 2.2;
      const enc = campos.map((c) => limpio((c.c || c.et) + (c.u ? ' (' + c.u + ')' : '')));
      const textos = filas.map((f) => campos.map((c) => valor(c, f[c.id])));
      // ancho de cada columna: proporcional a lo más largo que lleva, con piso y techo
      const numW = 22;
      let pesos = campos.map((c, i) => {
        const largos = textos.map((f) => F.widthOfTextAtSize(limpio(f[i]), tam));
        const pal = Math.max.apply(null, enc[i].split(' ').map((p) => FB.widthOfTextAtSize(p, tam)));
        return Math.min(150, Math.max(pal + 6, Math.min(110, Math.max.apply(null, largos.concat([0])) + 8), 26));
      });
      const suma = pesos.reduce((a, b) => a + b, 0), esc = (ANCHO - numW) / suma;
      pesos = pesos.map((p) => p * esc);
      const cabeza = () => {
        const lin = enc.map((e, i) => partir(FB, e, tam, pesos[i] - 5));
        const alto = Math.max.apply(null, lin.map((l) => l.length)) * alt + 5;
        lugar(alto + 30);
        let x = M;
        pg.drawRectangle({ x, y: y - alto, width: numW, height: alto, color: col(GRIS), borderColor: col(LINEA), borderWidth: 0.5 });
        pg.drawText('N°', { x: x + 6, y: y - alto / 2 - 3, size: tam, font: FB, color: col(NEGRO) });
        x += numW;
        lin.forEach((ls, i) => {
          pg.drawRectangle({ x, y: y - alto, width: pesos[i], height: alto, color: col(GRIS), borderColor: col(LINEA), borderWidth: 0.5 });
          ls.forEach((l, k) => pg.drawText(l, { x: x + 2.5, y: y - alt - k * alt + 1.5, size: tam, font: FB, color: col(NEGRO) }));
          x += pesos[i];
        });
        y -= alto;
      };
      barra(t.titulo); cabeza();
      const filasPdf = textos.length ? textos : [campos.map(() => '')];
      filasPdf.forEach((f, n) => {
        const lin = f.map((v, i) => partir(F, v, tam, pesos[i] - 5));
        const alto = Math.max(14, Math.max.apply(null, lin.map((l) => l.length)) * alt + 5);
        if (y - alto < M + 16) { nuevaPagina(); barra(t.titulo + ' (continuación)'); cabeza(); }
        let x = M;
        pg.drawRectangle({ x, y: y - alto, width: numW, height: alto, borderColor: col(LINEA), borderWidth: 0.5 });
        pg.drawText(String(n + 1), { x: x + 6, y: y - alt - 1, size: tam, font: F, color: col(NEGRO) });
        x += numW;
        lin.forEach((ls, i) => {
          pg.drawRectangle({ x, y: y - alto, width: pesos[i], height: alto, borderColor: col(LINEA), borderWidth: 0.5 });
          ls.forEach((l, k) => pg.drawText(l, { x: x + 2.5, y: y - alt - k * alt, size: tam, font: F, color: col(NEGRO) }));
          x += pesos[i];
        });
        y -= alto;
      });
      y -= 6;
    }

    nuevaPagina();
    const r = cad.rotulo || {};
    pares(window.Cadenas.rotulo(def).map((c) => [c.et, valor(c, r[c.id])]), 3);
    y -= 6;
    (def.tablas || []).forEach((t) => tabla(t, ((cad.tablas || {})[t.id] || []).filter((f) => Object.keys(f).some((k) => f[k] !== '' && f[k] !== null && !(Array.isArray(f[k]) && !f[k].length)))));
    if ((def.extras || []).length) {
      barra('Condiciones y datos generales');
      pares(def.extras.map((c) => [c.et + (c.u ? ' (' + c.u + ')' : ''), valor(c, (cad.extras || {})[c.id])]), 3);
      y -= 6;
    }
    barra('Observaciones generales');
    const obs = partir(F, cad.observaciones || '', 8, ANCHO - 10);
    const altoObs = Math.max(26, obs.length * 10 + 8);
    lugar(altoObs);
    pg.drawRectangle({ x: M, y: y - altoObs, width: ANCHO, height: altoObs, borderColor: col(LINEA), borderWidth: 0.5 });
    obs.forEach((l, k) => pg.drawText(l, { x: M + 5, y: y - 11 - k * 10, size: 8, font: F, color: col(NEGRO) }));
    y -= altoObs + 8;

    // firmas: tres casillas, siempre juntas
    const ALTO_F = 84; lugar(ALTO_F + 4);
    const casillas = [['Firma y aclaración del responsable de muestreo', 'responsable'], ['Firma y aclaración del cliente', 'cliente'],
      ['Firma y fecha de recepción', 'recepcion']];
    const wf = ANCHO / 3;
    for (let i = 0; i < 3; i++) {
      const [et, clave] = casillas[i], f = (cad.firmas || {})[clave], x = M + i * wf;
      pg.drawRectangle({ x, y: y - ALTO_F, width: wf, height: ALTO_F, borderColor: col(LINEA), borderWidth: 0.5 });
      pg.drawText(limpio(et), { x: x + 5, y: y - 10, size: 7.5, font: FB, color: col(NEGRO) });
      if (f && f.png) {
        try {
          const img = await doc.embedPng(bytesDeDataUrl(f.png));
          const e = Math.min((wf - 30) / img.width, 46 / img.height);
          pg.drawImage(img, { x: x + (wf - img.width * e) / 2, y: y - 14 - 46 + (46 - img.height * e) / 2, width: img.width * e, height: img.height * e });
        } catch (err) { /* firma ilegible: queda la casilla vacía */ }
      }
      pg.drawLine({ start: { x: x + 18, y: y - 64 }, end: { x: x + wf - 18, y: y - 64 }, thickness: 0.5, color: col(LINEA) });
      const pie = f ? [f.nombre || '', f.cuando ? new Date(f.cuando).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : ''].filter(Boolean).join(' · ') : '';
      const wp = F.widthOfTextAtSize(limpio(pie), 7.5);
      pg.drawText(limpio(pie), { x: x + Math.max(5, (wf - wp) / 2), y: y - 75, size: 7.5, font: F, color: col(NEGRO) });
    }
    y -= ALTO_F;

    const sello = limpio('Cadena digital GH Cadenas · ' + (cad.por || '') + ' · ' + new Date(cad.actualizado || Date.now()).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) + ' · ' + cad.id);
    paginas.forEach((p, i) => {
      const t = 'HOJA N° ' + (i + 1) + ' DE ' + paginas.length, w = FB.widthOfTextAtSize(t, 8);
      p.drawText(t, { x: A4[0] - M - w, y: A4[1] - M - 12, size: 8, font: FB, color: col(NEGRO) });
      p.drawText(sello, { x: M, y: M - 12, size: 6.5, font: F, color: col(LINEA) });
    });
    doc.setTitle(titulo + ' - ' + limpio(r.empresa || '')); doc.setAuthor('GH Consultora'); doc.setCreator('GH Cadenas');
    return doc.save();
  }
  /* Mete los datos de la cadena DENTRO del PDF (adjunto «gh-cadena-datos.json», el mismo contenido que «… - datos.json»):
     subiendo solo el PDF a GH Informes se completan la empresa, la fecha, el equipo y las tablas. */
  const ADJUNTO = 'gh-cadena-datos.json';
  async function adjuntarDatos(bytes, datos) {
    const { PDFDocument } = window.PDFLib;
    const doc = await PDFDocument.load(bytes);
    const ahora = new Date();
    await doc.attach(new TextEncoder().encode(JSON.stringify(datos)), ADJUNTO, {
      mimeType: 'application/json', description: 'Datos de la cadena de custodia (GH Cadenas) para GH Informes',
      creationDate: ahora, modificationDate: ahora });
    return doc.save();
  }
  window.PdfCadena = { generar, fechaEs, adjuntarDatos, ADJUNTO };
})();
