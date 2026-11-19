/* GH Cadenas — Copyright (c) 2026 Felipe Manrique. Todos los derechos reservados. */
/* Firma a distancia: el responsable de la empresa abre el enlace (WhatsApp o mail), ve la cadena y firma con el dedo.
   No usa cuenta: el código secreto del enlace (después de «#») habilita SOLO ver y firmar esa cadena, una vez. */
(function () {
  'use strict';
  const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbwqj4wAPmFieuKLWY3Ac7eN4zZPt5lTuFVpo5rwiQmguK9rMCVpYbn3diSmDW5SAaVfVQ/exec';
  const $ = (id) => document.getElementById(id);
  const codigo = (/[#&]c=([0-9a-f]{64,100})/.exec(location.hash) || [])[1] || '';
  const ERRORES = {
    enlace_invalido: 'El enlace está incompleto. Abrilo tal cual te llegó, sin cortarlo.',
    enlace_usado_o_anulado: 'Este enlace ya se usó para firmar o fue anulado.',
    enlace_vencido: 'El enlace venció (dura 7 días).',
    cadena_inexistente: 'La cadena ya no está disponible.',
    demasiados_intentos: 'Hubo demasiados intentos. Esperá unos minutos y probá de nuevo.',
    firma_invalida: 'No se pudo leer la firma. Volvé a firmar.',
    falta_aclaracion: 'Escribí tu nombre y apellido en «Aclaración».',
    ocupado: 'El servidor está ocupado. Probá de nuevo en un momento.',
  };
  let cad = null, def = null, rol = 'cliente', firma = null;

  function toast(msg) {
    const t = $('toast'); $('toastMsg').textContent = msg; t.classList.add('on');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 4500);
  }
  function mostrar(id) { ['fCargando', 'fError', 'fDatos', 'fFirma', 'fListo'].forEach((x) => { $(x).hidden = !(Array.isArray(id) ? id.includes(x) : x === id); }); }
  function error(code) { $('fErrorMsg').textContent = ERRORES[code] || 'No se pudo conectar. Revisá la señal y volvé a abrir el enlace.'; mostrar('fError'); }

  // pedidos al servidor: reintenta si Apps Script falla (pasa de vez en cuando)
  async function llamar(cuerpo, intentos) {
    let ultimo;
    for (let i = 0; i < (intentos || 3); i++) {
      try {
        const r = await fetch(BACKEND_URL, { method: 'POST', body: JSON.stringify(cuerpo) });   // sin Content-Type: sin preflight
        return await r.json();
      } catch (e) { ultimo = e; await new Promise((ok) => setTimeout(ok, 1500 * (i + 1))); }
    }
    throw ultimo;
  }
  const fecha = (iso) => { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(iso || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : (iso || '—'); };

  async function iniciar() {
    if (!codigo) return error('enlace_invalido');
    let r;
    try { r = await llamar({ action: 'verPedidoFirma', codigo }); } catch (e) { return error('red'); }
    if (!r.ok) return error(r.error);
    cad = r.cadena; rol = r.quien;
    def = Cadenas.def(cad.tipo);
    $('fRol').textContent = (r.etiqueta || 'cliente').toLowerCase();
    $('fEmpresa').textContent = (cad.rotulo || {}).empresa || '—';
    $('fTipo').textContent = def ? def.titulo : cad.tipo;
    $('fFecha').textContent = fecha((cad.rotulo || {}).fecha);
    const filas = Object.values(cad.tablas || {}).reduce((n, t) => n + (t || []).filter((f) => Object.values(f || {}).some((v) => String(v || '').trim())).length, 0);
    $('fFilas').textContent = filas ? String(filas) : '—';
    $('fVence').textContent = 'El enlace vence el ' + new Date(r.vence).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' }) + '.';
    mostrar(['fDatos', 'fFirma']);
  }

  $('fVerPdf').addEventListener('click', async () => {
    if (!cad || !def) return;
    const b = $('fVerPdf'); b.disabled = true; b.textContent = 'Armando el PDF…';
    try {
      const vista = Object.assign({}, cad, { firmas: Object.assign({}, cad.firmas || {}, firma ? { [rol]: firma } : {}) });
      const bytes = window.PdfOriginal && (window.PLANTILLAS_CC || {})[def.id] ? await PdfOriginal.generar(vista, def) : await PdfCadena.generar(vista, def);
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      if (!window.open(url, '_blank')) location.href = url;
    } catch (e) { toast('No se pudo armar el PDF: ' + e.message); }
    finally { b.disabled = false; b.textContent = 'Ver la cadena completa (PDF)'; }
  });

  $('fFirmar').addEventListener('click', async () => {
    const r = await Firma.pedir('Firma · ' + ($('fRol').textContent || 'cliente'), firma ? firma.nombre : '');
    if (!r) return;
    if ((r.nombre || '').length < 3) { toast('Escribí tu nombre y apellido en «Aclaración».'); return; }
    firma = r;
    const p = $('fPrevia'); p.replaceChildren();
    const img = document.createElement('img'); img.src = r.png; img.alt = 'Tu firma';
    const nom = document.createElement('div'); nom.className = 'firma-nom'; nom.textContent = r.nombre;
    p.append(img, nom); p.classList.add('hecha');
    $('fFirmar').textContent = 'Volver a firmar'; $('fEnviar').disabled = false;
  });

  $('fEnviar').addEventListener('click', async () => {
    if (!firma) return;
    const b = $('fEnviar'); b.disabled = true; b.textContent = 'Enviando…';
    try {
      const r = await llamar({ action: 'firmarPedido', codigo, nombre: firma.nombre, png: firma.png }, 2);
      if (!r.ok) { if (/usado|vencido|invalido/.test(r.error)) return error(r.error); throw new Error(ERRORES[r.error] || r.error); }
      history.replaceState(null, '', location.pathname);       // el código no queda en el historial
      mostrar('fListo');
    } catch (e) { toast(e.message || 'No se pudo enviar. Revisá la señal y probá de nuevo.'); b.disabled = false; b.textContent = 'Enviar firma'; }
  });

  iniciar();
})();
