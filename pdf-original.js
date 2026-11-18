/* GH Cadenas — Copyright (c) 2026 Felipe Manrique. Todos los derechos reservados. */
/* PDF «Original»: dibuja la segunda hoja de la plantilla de Excel de «6. CC» (grilla en plantillas-cc.js, generada por
   herramientas/extraer_plantillas.py) y escribe cada dato en la misma celda donde se anota a mano.
   Si hay más filas de las que entran, sigue en otra hoja igual (HOJA N° 2 DE 2…), como en papel. */
(function () {
  'use strict';
  const A4 = [595.28, 841.89], MARGEN = 18;
  const REEMPLAZOS = { 'Ω': 'ohm', '≥': '>=', '≤': '<=', '→': '->', '−': '-', ' ': ' ', '₂': '2', '₃': '3', '✓': 'x', '³': '3' };
  const EXTRA_OK = '–—‘’“”•…€™';
  function limpio(v) {
    let out = '';
    for (const ch of String(v === null || v === undefined ? '' : v).replace(/[\r\n\t]+/g, ' ')) {
      if (REEMPLAZOS[ch] !== undefined) out += REEMPLAZOS[ch];
      else if (ch.charCodeAt(0) < 256 || EXTRA_OK.includes(ch)) out += ch; else out += '?';
    }
    return out;
  }
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const fechaEs = (iso) => { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(iso || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : (iso || ''); };
  const num = (v) => { const n = parseFloat(String(v === undefined || v === null ? '' : v).replace(/[^\d,.\-]/g, '').replace(',', '.')); return isFinite(n) ? n : null; };
  const fmt = (n, d) => (n === null || n === undefined ? '' : (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toString().replace('.', ','));
  const X = (cond) => (cond ? 'X' : '');
  const col = (letras) => letras.split('').reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0);
  function rango(txt) {          // 'D27:F27' | 'D27' -> [r1,c1,r2,c2]
    const m = /^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/.exec(txt);
    return [+m[2], col(m[1]), +(m[4] || m[2]), col(m[3] || m[1])];
  }
  const hayDato = (f) => Object.values(f || {}).some((v) => v !== '' && v !== null && v !== undefined && !(Array.isArray(v) && !v.length));
  const corto = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  const sn = (v) => (v === 'SI' ? 'S' : v === 'NO' ? 'N' : '');

  /* ---------------------------------------------------------------- qué dato va en cada celda, por plantilla
     tablas: filas que ocupa cada tabla en la hoja; cols: columna de inicio -> función (fila, n°, cadena) que da el texto.
     celdas: celdas fijas fuera de las tablas. extraObs: texto que no tiene lugar en la hoja y va a Observaciones. */
  const T = (id, filas, cols, extra) => Object.assign({ id, filas, cols }, extra || {});
  const ex = (c, k) => (c.extras || {})[k] || '';
  const MAPA = {
    'CC RUIDO': { tablas: [T('filas', [14, 28], {
      A: (f, i) => [i, (f.m1 || f.m2) ? 'M ' + [f.m1, f.m2].filter(Boolean).join(' y ') : ''].filter(Boolean).join(' · '),
      C: (f) => f.sector, E: (f) => f.puesto, G: (f) => f.te, I: (f) => f.tint, K: (f) => [f.tipo, f.obs].filter(Boolean).join(' · ') })] },
    'CC RUIDO AMBIENTAL': {
      tablas: [T('filas', [13, 24], {
        A: (f) => f.sitio,
        D: (f) => franja(f, 'd'), E: (f) => franja(f, 'des'), F: (f) => franja(f, 'n'), G: (f) => f.obs })],
      celdas: { 'D27:F27': (c) => ex(c, 'temp'), 'D28:F28': (c) => ex(c, 'presion'), 'D29:F29': (c) => ex(c, 'humedad'),
        'G28:J28': (c) => primera(c, 'lat'), 'K28:P28': (c) => primera(c, 'lon') },
      extraObs: (c) => [ex(c, 'viento') && 'Viento: ' + ex(c, 'viento'), ex(c, 'dir_viento') && 'Dirección del viento: ' + ex(c, 'dir_viento'),
        ex(c, 'horario_empresa') && 'Horario de la empresa: ' + ex(c, 'horario_empresa')] },
    'CC VIBRACIONES': {
      tablas: [T('filas', [14, 23], { A: (f) => f.id, D: (f) => f.inicio, E: (f) => f.fin, F: (f) => f.duracion && f.duracion + ' min',
        G: (f) => X(/cuerpo/i.test(f.tipo || '')), H: (f) => X(/mano/i.test(f.tipo || '')),
        I: (f) => [f.operario, f.t_exp && f.t_exp + ' h/día'].filter(Boolean).join(' · '), J: (f) => f.obs })],
      celdas: { 'A26:D26': (c) => ex(c, 'temp'), 'E26:G26': (c) => ex(c, 'presion'), 'H26:I26': (c) => ex(c, 'humedad'),
        'J26:L26': (c) => ex(c, 'lat'), 'M26:P26': (c) => ex(c, 'lon') } },
    'CC VIBRACIONES AMBIENTAL': {
      tablas: [T('filas', [14, 29], { A: (f) => f.id, D: (f) => f.inicio, E: (f) => f.fin, F: (f) => f.duracion && f.duracion + ' min',
        G: (f) => X(/cuerpo/i.test(f.tipo || '')), H: (f) => X(/mano/i.test(f.tipo || '')), I: (f) => f.obs })],
      celdas: { 'A32:D32': (c) => ex(c, 'temp'), 'E32:G32': (c) => ex(c, 'presion'), 'H32:I32': (c) => ex(c, 'humedad'),
        'J32:L32': (c) => ex(c, 'lat'), 'M32:P32': (c) => ex(c, 'lon') } },
    'CC Iluminación': {
      tablas: [T('filas', [15, 29], { A: (f) => f.id, C: (f) => f.hora, D: (f) => f.cti, E: (f) => f.m1, F: (f) => f.m2, G: (f) => f.m3,
        H: (f) => promedio(f), I: (f) => f.vn, J: (f) => f.lat, K: (f) => f.lon,
        L: (f) => [[f.sector, f.puesto].filter(Boolean).join(' – '), f.mas && 'Más lecturas: ' + f.mas, f.obs].filter(Boolean).join(' · ') })],
      extraObs: (c) => [ex(c, 'condiciones') && 'Condiciones atmosféricas: ' + ex(c, 'condiciones')] },
    'CC Estrés Térmica': {
      tablas: [T('filas', [15, 25], { A: (f) => f.id, C: (f) => f.inicio, D: (f) => f.fin, E: (f) => ropaCorta(f.ropa), F: (f) => f.trab, G: (f) => f.desc,
        H: (f) => sn(f.aclim), I: (f) => actividad(f.act), J: (f) => (f.sitio ? f.sitio.slice(0, 3) : ''), K: (f) => f.tbs, L: (f) => f.tbh, M: (f) => f.tg,
        N: (f) => f.hr, O: (f) => f.tgbh_in, P: (f) => f.tgbh_ex })],
      extraObs: (c) => [ex(c, 'jornada') && 'Jornada laboral: ' + ex(c, 'jornada')].concat(filasDe(c).map((f) => [f.id, [f.sector, f.tarea].filter(Boolean).join(' – ')].filter(Boolean).join(': ')).filter((t) => t.includes(':'))) },
    'CC UVB': {
      tablas: [T('filas', [12, 25], { A: (f, i, c) => fechaEs((c.rotulo || {}).fecha), C: (f) => f.sitio, E: (f) => f.lectura,
        G: (f) => fmt(num(f.lectura) === null ? null : num(f.lectura) / 100, 4), I: (f) => f.t_medicion && f.t_medicion + ' min',
        K: (f) => f.t_exposicion && f.t_exposicion + ' h', M: (f, i, c) => ex(c, 'jornada') && ex(c, 'jornada') + ' h' }, { soloConDato: ['lectura', 't_medicion', 't_exposicion'] })],
      extraObs: (c) => [ex(c, 'tarea') && 'Tarea evaluada: ' + ex(c, 'tarea'), ex(c, 'sector') && 'Sector: ' + ex(c, 'sector')] },
    'CC Puesta a tierra': {
      tablas: [T('filas', [13, 28], { A: (f) => f.n, B: (f) => f.sector, C: (f, i, c) => fechaEs((c.rotulo || {}).fecha), D: (f) => f.inicio, E: (f) => f.fin,
        F: (f) => f.valor && f.valor + ' ohm', G: (f) => f.continuidad,
        I: (f) => [f.terreno, f.esquema && 'Esquema ' + f.esquema, f.proteccion && 'Prot. ' + f.proteccion,
          f.desconexion && 'Descon. ' + f.desconexion, f.obs].filter(Boolean).join(' · ') })] },
    'CC VENTILACION': {
      tablas: [T('filas', [14, 23], { A: (f) => f.id, D: (f) => f.inicio, E: (f) => f.fin, F: (f) => f.duracion && f.duracion + ' min',
        G: (f) => X(f.tipo === 'Forzada'), H: (f) => X(f.tipo === 'Natural'), I: (f) => f.egreso, J: (f) => f.ingreso, K: (f) => f.ab_tipo,
        L: (f) => f.ab_ancho, M: (f) => f.ab_alto, N: (f) => f.volumen, O: (f) => f.trabajadores, P: (f) => f.obs })],
      celdas: { 'A26:D26': (c) => ex(c, 'temp'), 'E26:G26': (c) => ex(c, 'presion'), 'H26:J26': (c) => ex(c, 'humedad'),
        'K26:M26': (c) => ex(c, 'viento') && ex(c, 'viento') + ' m/s' + (ex(c, 'dir_viento') ? ' ' + ex(c, 'dir_viento') : ''),
        'N26:P26': (c) => [ex(c, 'lat'), ex(c, 'lon')].filter(Boolean).join(' ; ') } },
    'CC Contaminantes Quimicos': {
      tablas: [T('filas', [15, 26], { A: (f) => f.muestra, B: (f) => fechaEs(f.fecha), C: (f) => f.sector, D: (f) => f.puesto, E: (f) => f.tarea,
        F: (f) => f.t_exp, G: (f) => f.frecuencia, H: (f) => f.temp, I: (f) => fmt(num(f.presion) === null ? null : num(f.presion) * 0.750064, 1),
        J: (f) => X(f.habitual === 'SI'), K: (f) => X(f.habitual === 'NO'), L: (f) => (f.directa === 'SI' ? '' : f.equipo), M: (f) => (f.directa === 'SI' ? f.equipo : ''),
        N: (f) => f.caudal, O: (f) => f.tiempo, P: (f) => fmt(num(f.caudal) !== null && num(f.tiempo) !== null ? num(f.caudal) * num(f.tiempo) : null, 1),
        Q: (f) => f.contaminante, R: (f) => [f.valor, f.unidad].filter(Boolean).join(' ') })],
      extraObs: (c) => filasDe(c).filter((f) => f.obs).map((f) => (f.muestra ? f.muestra + ': ' : '') + f.obs) },
    'CC AIRE': { columnas: { grupos: ['D', 'F', 'H', 'J', 'L'], filas: {
      12: (f) => f.sitio, 13: (f) => f.filtro, 14: (f) => fechaEs(f.f_ini), 15: (f) => f.h_ini, 16: (f) => f.horas, 17: (f) => f.caudal,
      18: (f) => f.temp, 19: (f) => f.presion, 20: (f) => f.dir_viento, 21: (f) => f.vel_viento, 22: (f) => f.humedad,
      24: (f) => f.p_ini, 25: (f) => fechaEs(f.f_p_ini), 26: (f) => f.p_fin, 27: (f) => fechaEs(f.f_p_fin),
      28: (f) => fmt(num(f.p_fin) !== null && num(f.p_ini) !== null ? num(f.p_fin) - num(f.p_ini) : null, 6), 33: (f) => f.lat, 34: (f) => f.lon } },
      etiquetas: { 'equipos utilizados': (c) => (c.rotulo || {}).equipo } },
    'CC Agua': { tablas: [T('filas', [14, 30], liquidos())] },
    'CC Efluentes': { tablas: [T('filas', [14, 30], liquidos())] },
    'CC LODO suelo': { tablas: [T('filas', [14, 30], { A: (f) => f.nombre, D: (f) => fechaEs(f.fecha), E: (f) => f.hora, F: (f) => f.lat, G: (f) => f.lon,
      H: (f) => (f.tipo ? f.tipo[0] : ''), I: (f) => f.suelo, J: (f) => f.temp, K: (f) => f.ph, L: (f) => f.profundidad, M: (f) => f.obs })] },
    'CC Emisiones Gaseosas': {
      tablas: [
        T('gases', [18, 20], { A: (f) => f.t_humos, B: (f) => f.co2, C: (f) => f.o2, D: (f) => f.co, E: (f) => f.nox, F: (f) => f.no, G: (f) => f.no2,
          H: (f) => f.so2, I: (f) => f.sh2, J: (f) => f.velocidad, K: (f) => [f.combustible, f.punto && '(' + f.punto + ')'].filter(Boolean).join(' ') }),
        T('otras', [25, 30], { A: (f) => f.rotulo, B: (f) => f.tipo, D: (f) => f.vol, E: (f) => f.h_ini, F: (f) => f.tiempo,
          'H:I': (f) => f.caudal, 'J:K': (f) => fechaEs(f.sol_prep), 'L:M': (f) => fechaEs(f.sol_venc), 'N:P': (f) => f.conservacion }),
        T('gravimetria', [34, 35], { A: (f) => f.rotulo, B: (f) => f.codigo, C: (f) => f.tipo, E: (f) => f.diametro, G: (f) => f.p_ini, I: (f) => f.p_fin,
          M: (f) => fmt(num(f.p_fin) !== null && num(f.p_ini) !== null ? num(f.p_fin) - num(f.p_ini) : null, 6) })],
      celdas: { 'A13:D13': (c) => ex(c, 'altura'), 'E13:H13': (c) => ex(c, 'diametro'), 'I13:P13': (c) => [ex(c, 'lat'), ex(c, 'lon')].filter(Boolean).join(' ; '),
        'A39:B39': (c) => ex(c, 'temp'), 'C39:E39': (c) => ex(c, 'presion'), 'F39:G39': (c) => ex(c, 'humedad'), 'H39:J39': (c) => ex(c, 'vel_viento'),
        'M39:P39': (c) => ex(c, 'dir_viento') } },
    'CC Ergonomia': { porPagina: 'filas',
      etiquetas: { 'area y sector de estudio': (c, f) => f.area, 'puesto de trabajo': (c, f) => f.puesto, 'n de trabajadores': (c, f) => f.n,
        'nombre del trabajador': (c, f) => f.nombre },
      marcas: { fila: 18, cols: ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'],
        op: ['Matriz IFR', '2-a', '2-b', '2-c', '2-d', '2-e', '2-f', '2-g', '2-h', '2-i', 'Matriz IMP', 'Seguimiento'], campo: 'planillas' },
      obsFila: (f) => f.obs },
  };
  function franja(f, p) {
    const h = [f[p + '_ini'], f[p + '_fin']].filter(Boolean).join(' a ');
    return [h, f[p + '_lm'] && 'LM ' + f[p + '_lm'], f[p + '_lf'] && 'LF ' + f[p + '_lf']].filter(Boolean).join(' · ');
  }
  function liquidos() {
    const pres = (o) => (f) => X((f.preservante || []).includes(o));
    return { A: (f) => f.nombre, D: (f) => f.hora, E: (f) => f.tipo, F: (f) => f.env_v, G: (f) => f.env_p, H: (f) => f.env_t, I: (f) => f.env_vial,
      J: pres('HNO3'), K: pres('H2SO4'), L: pres('NaOH'), M: pres('HCl'), N: pres('Otro'), O: pres('S/P'), P: pres('Estéril'),
      Q: (f) => f.ph, R: (f) => f.cond, S: (f) => f.sdt, T: (f) => f.temp, U: (f) => f.od };
  }
  const filasDe = (c, id) => ((c.tablas || {})[id || 'filas'] || []).filter(hayDato);
  const primera = (c, k) => (filasDe(c).find((f) => f[k]) || {})[k] || '';
  function promedio(f) {
    const v = [f.m1, f.m2, f.m3].concat(String(f.mas || '').split(/[;\s]+/)).map(num).filter((n) => n !== null);
    return v.length ? fmt(v.reduce((a, b) => a + b, 0) / v.length, 0) : '';
  }
  const ropaCorta = (r) => ({ 'Camisa y pantalón largos (algodón)': 'Camisa/pantalón', 'Overol de material tejido': 'Overol tejido',
    'Overol de polipropileno SMS': 'Overol SMS', 'Overol de poliolefina': 'Overol poliolef.', 'Ropa tejida de doble capa': 'Doble capa',
    'Overol barrera de vapor con capucha': 'Barrera vapor' }[r] || r || '');
  const actividad = (a) => ({ Reposo: 'R', Ligera: 'L', Moderada: 'M', Pesada: 'P', 'Muy pesada': 'MP' }[a] || a || '');

  /* ---------------------------------------------------------------- rótulo: etiqueta de la hoja -> dato */
  const ROTULO = [
    ['nombre de empresa', (r) => r.empresa], ['sitio/planta', (r) => r.sitio], ['cuit', (r) => r.cuit], ['presupuesto', (r) => r.presupuesto],
    ['ubicacion', (r) => [r.ubicacion, r.localidad, r.cp && '(' + r.cp + ')', r.provincia].filter(Boolean).join(', ').replace(', (', ' (')],
    ['t(°c)', (r) => r.t], ['hr%', (r) => r.hr], ['p(hpa)', (r) => r.p],
    ['fecha de muestreo', (r) => fechaEs(r.fecha)], ['fecha de finalizacion', (r) => fechaEs(r.fecha_fin)],
    ['equipo utilizado', (r) => r.equipo], ['metodologia', (r) => r.metodologia]];

  /* ---------------------------------------------------------------- dibujo */
  async function generar(cad, def) {
    const P = (window.PLANTILLAS_CC || {})[def.id];
    if (!P) throw new Error('No está la plantilla original de ' + def.titulo);
    const M = MAPA[def.id] || {};
    const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
    const doc = await PDFDocument.create();
    const FUENTES = { '00': await doc.embedFont(StandardFonts.Helvetica), '10': await doc.embedFont(StandardFonts.HelveticaBold),
      '01': await doc.embedFont(StandardFonts.HelveticaOblique), '11': await doc.embedFont(StandardFonts.HelveticaBoldOblique) };
    const fuente = (b, i) => FUENTES[(b ? 1 : 0) + '' + (i ? 1 : 0)];
    const hex = (h) => rgb(parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255);
    const imgs = {};
    for (const im of P.imagenes) {
      if (imgs[im.img]) continue;
      const d = (window.IMAGENES_CC || {})[im.img]; if (!d) continue;
      const b = Uint8Array.from(atob(d.split(',')[1]), (ch) => ch.charCodeAt(0));
      try { imgs[im.img] = d.startsWith('data:image/png') ? await doc.embedPng(b) : await doc.embedJpg(b); } catch (e) { /* imagen ilegible */ }
    }
    // geometría: ancho de columna de Excel (caracteres) -> puntos; alto de fila ya viene en puntos
    const anchoCol = P.cols.map((w) => (w * 7 + 5) * 0.75);
    const x0 = [0]; anchoCol.forEach((w, i) => x0.push(x0[i] + w));
    const y0 = [0]; P.filas.forEach((h, i) => y0.push(y0[i] + h));
    const W = x0[x0.length - 1], H = y0[y0.length - 1];
    const apaisada = P.apaisada || (W / H > 1.15);
    const pagina = apaisada ? [A4[1], A4[0]] : A4;
    const esc = Math.min((pagina[0] - 2 * MARGEN) / W, (pagina[1] - 2 * MARGEN) / H);
    const ox = (pagina[0] - W * esc) / 2, oy = pagina[1] - MARGEN;
    const mergeDe = {};
    P.merges.forEach((m) => { for (let r = m[0]; r <= m[2]; r++) for (let c = m[1]; c <= m[3]; c++) mergeDe[r + ',' + c] = m; });
    const rect = (r1, c1, r2, c2) => ({ x: ox + x0[c1 - 1] * esc, y: oy - y0[r2] * esc, w: (x0[c2] - x0[c1 - 1]) * esc, h: (y0[r2] - y0[r1 - 1]) * esc });
    const rectCelda = (r, c) => { const m = mergeDe[r + ',' + c]; return m ? rect(m[0], m[1], m[2], m[3]) : rect(r, c, r, c); };

    function partir(f, t, tam, ancho) {
      const pal = limpio(t).split(' '); const ls = []; let l = '';
      for (let p of pal) {
        while (f.widthOfTextAtSize(p, tam) > ancho && p.length > 1) { let n = p.length; while (n > 1 && f.widthOfTextAtSize(p.slice(0, n), tam) > ancho) n--; if (l) { ls.push(l); l = ''; } ls.push(p.slice(0, n)); p = p.slice(n); }
        const k = l ? l + ' ' + p : p;
        if (f.widthOfTextAtSize(k, tam) <= ancho) l = k; else { if (l) ls.push(l); l = p; }
      }
      if (l || !ls.length) ls.push(l);
      return ls;
    }
    /* Escribe un texto dentro de un rectángulo: achica la letra hasta que entre (con varias líneas si hay alto). */
    function escribir(pg, R, texto, o) {
      o = o || {};
      texto = limpio(texto); if (!texto) return;
      const f = fuente(o.b, o.i);
      const pad = 2 * esc + 1.2, ancho = R.w - 2 * pad - (o.dx || 0), alto = R.h - 2;
      let tam = Math.min(o.tam || 9 * esc + 2, alto * 0.82), ls;
      for (; tam >= 3.2; tam -= 0.3) { ls = partir(f, texto, tam, ancho); if (ls.length * tam * 1.12 <= alto + 0.5) break; }
      const altoT = ls.length * tam * 1.12;
      let y = o.arriba ? R.y + R.h - tam - 1.5 : R.y + (R.h + altoT) / 2 - tam * 0.95;
      ls.forEach((l) => {
        const w = f.widthOfTextAtSize(l, tam);
        const x = o.h === 'left' ? R.x + pad + (o.dx || 0) : o.h === 'right' ? R.x + R.w - pad - w : R.x + (R.w - w) / 2;
        pg.drawText(l, { x, y, size: tam, font: f, color: rgb(0.04, 0.12, 0.36) });
        y -= tam * 1.12;
      });
    }

    // celdas con etiqueta (rótulo, observaciones, firmas, etiquetas propias de la plantilla)
    const etiq = P.celdas.filter((c) => c.t).map((c) => Object.assign({ n: norm(c.t) }, c));
    const textoEn = {};
    etiq.forEach((c) => { const m = mergeDe[c.r + ',' + c.c] || [c.r, c.c, c.r, c.c]; for (let k = m[1]; k <= m[3]; k++) textoEn[c.r + ',' + k] = 1; });
    const filasTabla = new Set();
    (M.tablas || []).forEach((t) => { for (let r = t.filas[0]; r <= t.filas[1]; r++) filasTabla.add(r); });
    const obsCelda = etiq.find((c) => /^obs(v|e)/.test(c.n) && c.r > 11 && (mergeDe[c.r + ',' + c.c] || [0, 0, 0])[2] - c.r >= 1);
    const firmaCeldas = etiq.filter((c) => c.r > 11 && /^firma/.test(c.n));
    const hojaCelda = etiq.find((c) => /^hoja n/.test(c.n));

    // cuántas hojas hacen falta
    let paginas = 1;
    const datosTabla = {};
    (M.tablas || []).forEach((t) => {
      let filas = filasDe(cad, t.id);
      if (t.soloConDato) filas = filas.filter((f) => t.soloConDato.some((k) => f[k]));
      datosTabla[t.id] = filas;
      paginas = Math.max(paginas, Math.ceil(filas.length / (t.filas[1] - t.filas[0] + 1)) || 1);
    });
    if (M.columnas) { datosTabla.filas = filasDe(cad); paginas = Math.max(1, Math.ceil(datosTabla.filas.length / M.columnas.grupos.length)); }
    if (M.porPagina) { datosTabla.filas = filasDe(cad, M.porPagina); paginas = Math.max(1, datosTabla.filas.length); }

    const obsGeneral = [cad.observaciones].concat(M.extraObs ? M.extraObs(cad) : []).filter(Boolean);
    const r0 = cad.rotulo || {};
    for (let p = 0; p < paginas; p++) {
      const pg = doc.addPage(pagina);
      // 1) rellenos
      P.celdas.forEach((c) => { if (c.f) { const R = rectCelda(c.r, c.c); const m = mergeDe[c.r + ',' + c.c]; if (!m || (m[0] === c.r && m[1] === c.c)) pg.drawRectangle({ x: R.x, y: R.y, width: R.w, height: R.h, color: hex(c.f) }); } });
      // 2) textos de la plantilla (los de las filas de datos no: ahí van los datos)
      P.celdas.forEach((c) => {
        if (!c.t || filasTabla.has(c.r) || /^hoja n/.test(norm(c.t))) return;
        const R = rectCelda(c.r, c.c), f = fuente(c.b, c.i), tam = c.sz * esc;
        const ls = c.w ? partir(f, c.t, tam, R.w - 3) : [limpio(c.t).trim()];
        const altoT = ls.length * tam * 1.15;
        let y = c.v === 'top' ? R.y + R.h - tam - 1 : c.v === 'center' ? R.y + (R.h + altoT) / 2 - tam : R.y + altoT - tam + 1.5;
        ls.forEach((l) => {
          const w = f.widthOfTextAtSize(l, tam);
          const x = c.h === 'center' || c.h === 'centerContinuous' ? R.x + (R.w - w) / 2 : c.h === 'right' ? R.x + R.w - w - 2 : R.x + 2;
          pg.drawText(l, { x, y, size: tam, font: f, color: c.col ? hex(c.col) : rgb(0, 0, 0) });
          if (c.u) pg.drawLine({ start: { x, y: y - tam * 0.12 }, end: { x: x + w, y: y - tam * 0.12 }, thickness: Math.max(0.4, tam / 16), color: c.col ? hex(c.col) : rgb(0, 0, 0) });
          y -= tam * 1.15;
        });
      });
      // 3) bordes
      P.celdas.forEach((c) => {
        if (!c.bd) return;
        const R = rect(c.r, c.c, c.r, c.c), k = rgb(0, 0, 0), m = mergeDe[c.r + ',' + c.c];
        const bd = Object.assign({}, c.bd);
        if (m) { if (c.r > m[0]) bd.top = 0; if (c.r < m[2]) bd.bottom = 0; if (c.c > m[1]) bd.left = 0; if (c.c < m[3]) bd.right = 0; }
        const L = (a, b, t) => pg.drawLine({ start: a, end: b, thickness: t * Math.max(0.6, esc), color: k });
        if (bd.top) L({ x: R.x, y: R.y + R.h }, { x: R.x + R.w, y: R.y + R.h }, bd.top);
        if (bd.bottom) L({ x: R.x, y: R.y }, { x: R.x + R.w, y: R.y }, bd.bottom);
        if (bd.left) L({ x: R.x, y: R.y }, { x: R.x, y: R.y + R.h }, bd.left);
        if (bd.right) L({ x: R.x + R.w, y: R.y }, { x: R.x + R.w, y: R.y + R.h }, bd.right);
      });
      // 4) logo
      P.imagenes.slice(0, 1).forEach((im) => {
        const e = imgs[im.img]; if (!e) return;
        const a = im.de, b = im.hasta || [a[0], a[1]];
        const xa = ox + (x0[a[1] - 1] + a[3]) * esc, ya = oy - (y0[a[0] - 1] + a[2]) * esc;
        let w, h;
        if (im.hasta) { w = (x0[b[1] - 1] + b[3]) * esc - (x0[a[1] - 1] + a[3]) * esc; h = (y0[b[0] - 1] + b[2]) * esc - (y0[a[0] - 1] + a[2]) * esc; }
        else { w = im.ext[0] * esc; h = im.ext[1] * esc; }
        const k = Math.min(w / e.width, h / e.height);
        pg.drawImage(e, { x: xa + (w - e.width * k) / 2, y: ya - h + (h - e.height * k) / 2, width: e.width * k, height: e.height * k });
      });
      // 5) HOJA N° x DE y
      if (hojaCelda) escribir(pg, rectCelda(hojaCelda.r, hojaCelda.c), 'HOJA N° ' + (p + 1) + ' DE ' + paginas, { b: 1, tam: hojaCelda.sz * esc, h: 'center' });
      // 6) rótulo: el dato se escribe a continuación de la etiqueta, en la misma celda
      const conDato = (c, valor, filaP) => {
        if (!valor) return;
        const R = rectCelda(c.r, c.c), f = fuente(c.b, c.i), tam = c.sz * esc;
        const wt = f.widthOfTextAtSize(limpio(c.t).trim(), tam);
        const izq = c.h === 'center' || c.h === 'centerContinuous' ? (R.w - wt) / 2 : c.h === 'right' ? R.w - wt - 2 : 2;
        let dx = izq + wt + 3 - (2 * esc + 1.2), Rv = R;
        if (R.w - dx < 28) {           // la etiqueta llena su celda: el dato va en la celda vacía de la derecha
          const m = mergeDe[c.r + ',' + c.c] || [c.r, c.c, c.r, c.c], cs = m[3] + 1;
          if (cs <= P.cols.length && !textoEn[c.r + ',' + cs]) { Rv = rectCelda(c.r, cs); dx = 0; }
        }
        escribir(pg, Rv, valor, { h: 'left', dx, tam: Math.max(tam, 8 * esc), arriba: (mergeDe[c.r + ',' + c.c] || [0, 0, 0])[2] > c.r });
      };
      etiq.filter((c) => c.r <= 10).forEach((c) => { const m = ROTULO.find(([k]) => c.n.startsWith(k)); if (m) conDato(c, m[1](r0)); });
      // 7) tablas
      (M.tablas || []).forEach((t) => {
        const cap = t.filas[1] - t.filas[0] + 1, filas = datosTabla[t.id].slice(p * cap, (p + 1) * cap);
        filas.forEach((f, i) => {
          const r = t.filas[0] + i;
          Object.entries(t.cols).forEach(([letra, fn]) => {
            const v = fn(f, p * cap + i + 1, cad);
            const ab = letra.split(':'), R = ab[1] ? rect(r, col(ab[0]), r, col(ab[1])) : rectCelda(r, col(letra));
            if (v !== undefined && v !== null && v !== '') escribir(pg, R, String(v), { h: 'center' });
          });
        });
      });
      // 8) hojas con un sitio por columna (calidad de aire)
      if (M.columnas) {
        const g = M.columnas.grupos, filas = datosTabla.filas.slice(p * g.length, (p + 1) * g.length);
        filas.forEach((f, i) => Object.entries(M.columnas.filas).forEach(([r, fn]) => {
          const v = fn(f); if (v) escribir(pg, rectCelda(+r, col(g[i])), String(v), { h: 'center' });
        }));
      }
      // 9) una fila de datos por hoja (ergonomía) y etiquetas propias de la plantilla
      const filaP = M.porPagina ? datosTabla.filas[p] || {} : null;
      if (M.etiquetas) etiq.forEach((c) => { const k = Object.keys(M.etiquetas).find((x) => c.n.replace(/[°:]/g, '').replace(/\s+/g, ' ').startsWith(x)); if (k) conDato(c, M.etiquetas[k](cad, filaP || {})); });
      if (M.marcas && filaP) (filaP[M.marcas.campo] || []).forEach((o) => { const i = M.marcas.op.indexOf(o); if (i >= 0) escribir(pg, rectCelda(M.marcas.fila, col(M.marcas.cols[i])), 'X', { h: 'center', b: 1 }); });
      // 10) celdas fijas
      Object.entries(M.celdas || {}).forEach(([rg, fn]) => { const v = fn(cad); if (v) { const [a, b, c2, d] = rango(rg); escribir(pg, rect(a, b, c2, d), String(v), { h: 'center' }); } });
      // 11) observaciones (lo de la hoja + lo que no tiene celda propia)
      if (obsCelda) {
        const obs = obsGeneral.concat(M.obsFila && filaP ? [M.obsFila(filaP)] : []).filter(Boolean).join(' · ');
        if (obs) {
          const m = mergeDe[obsCelda.r + ',' + obsCelda.c] || [obsCelda.r, obsCelda.c, obsCelda.r, obsCelda.c];
          const R = rect(m[0], m[1], m[2], m[3]), tl = obsCelda.sz * esc * 1.35;
          escribir(pg, { x: R.x, y: R.y, w: R.w, h: R.h - tl }, obs, { h: 'left', arriba: true, tam: 8.5 * esc + 1.5 });
        }
      }
      // 12) firmas
      for (const c of firmaCeldas) {
        const quien = /cliente/.test(c.n) ? 'cliente' : /recep|ingreso/.test(c.n) ? 'recepcion' : 'responsable';
        const fi = (cad.firmas || {})[quien]; if (!fi) continue;
        const m = mergeDe[c.r + ',' + c.c] || [c.r, c.c, c.r, c.c], R = rect(m[0], m[1], m[2], m[3]);
        const tl = c.sz * esc * 2.4, pie = 8 * esc + 2;
        if (fi.png) {
          try {
            const img = await doc.embedPng(Uint8Array.from(atob(fi.png.split(',')[1]), (ch) => ch.charCodeAt(0)));
            let disp = { w: R.w - 10, h: R.h - tl - pie - 2 }, xi = R.x + 5;
            if (disp.h < 14) { disp = { w: R.w * 0.42, h: R.h - 2 }; xi = R.x + R.w * 0.55; }   // casillero bajo: la firma va a la derecha de la etiqueta
            const k = Math.min(disp.w / img.width, disp.h / img.height);
            pg.drawImage(img, { x: xi + (disp.w - img.width * k) / 2, y: R.y + (disp.h < R.h - 3 ? pie + 1 : 1) + (disp.h - img.height * k) / 2, width: img.width * k, height: img.height * k });
          } catch (e) { /* firma ilegible */ }
        }
        const txt = [fi.nombre, fi.cuando && new Date(fi.cuando).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })].filter(Boolean).join(' · ');
        escribir(pg, { x: R.x, y: R.y, w: R.w, h: pie }, txt, { h: 'center', tam: 6.5 * esc + 1.5 });
      }
      // pie mínimo para identificar el archivo
      const sello = limpio('GH Cadenas · ' + (cad.por || '') + ' · ' + cad.id);
      pg.drawText(sello, { x: MARGEN, y: 6, size: 5.5, font: FUENTES['00'], color: rgb(0.55, 0.55, 0.55) });
    }
    doc.setTitle(limpio(def.titulo + ' - ' + (r0.empresa || ''))); doc.setAuthor('GH Consultora'); doc.setCreator('GH Cadenas');
    return doc.save();
  }
  window.PdfOriginal = { generar, MAPA };
})();
