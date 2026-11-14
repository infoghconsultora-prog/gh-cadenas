/* GH Cadenas — Copyright (c) 2026 Felipe Manrique. Todos los derechos reservados. */
/* Firma con el dedo: una hoja a pantalla completa con un lienzo. Devuelve un PNG (data URL) recortado al trazo. */
(function () {
  'use strict';
  function pedir(titulo, aclaracionInicial) {
    return new Promise((resolver) => {
      const dlg = document.createElement('div'); dlg.className = 'firma-hoja'; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true');
      dlg.innerHTML = '<div class="firma-caja"><h2></h2><p class="muted">Firmá con el dedo dentro del recuadro.</p>' +
        '<canvas class="firma-lienzo" aria-label="Recuadro para firmar"></canvas>' +
        '<label class="campo"><span>Aclaración (nombre y apellido)</span><input type="text" class="firma-nombre" autocomplete="off"></label>' +
        '<div class="barra"><button type="button" class="btn sec" data-a="borrar">Borrar</button><span class="grow"></span>' +
        '<button type="button" class="btn sec" data-a="cancelar">Cancelar</button><button type="button" class="btn" data-a="ok">Aceptar firma</button></div></div>';
      dlg.querySelector('h2').textContent = titulo;
      const nombre = dlg.querySelector('.firma-nombre'); nombre.value = aclaracionInicial || '';
      document.body.appendChild(dlg);
      const cv = dlg.querySelector('canvas'), ctx = cv.getContext('2d');
      const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
      let hayTrazo = false, dibujando = false, ultimo = null, minX = 1e9, minY = 1e9, maxX = -1, maxY = -1;
      function ajustar() {
        const r = cv.getBoundingClientRect();
        cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
        ctx.scale(dpr, dpr); ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0b1f5c';
        hayTrazo = false; minX = minY = 1e9; maxX = maxY = -1;
      }
      ajustar();
      const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      const marcar = (p) => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); };
      cv.addEventListener('pointerdown', (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); dibujando = true; ultimo = pos(e); marcar(ultimo);
        ctx.beginPath(); ctx.arc(ultimo.x, ultimo.y, 1.1, 0, 7); ctx.fillStyle = '#0b1f5c'; ctx.fill(); hayTrazo = true; });
      cv.addEventListener('pointermove', (e) => { if (!dibujando) return; e.preventDefault(); const p = pos(e);
        ctx.beginPath(); ctx.moveTo(ultimo.x, ultimo.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ultimo = p; marcar(p); });
      const soltar = () => { dibujando = false; };
      cv.addEventListener('pointerup', soltar); cv.addEventListener('pointercancel', soltar);
      function cerrar(v) { dlg.remove(); resolver(v); }
      dlg.addEventListener('click', (e) => {
        const a = e.target && e.target.dataset && e.target.dataset.a;
        if (a === 'borrar') { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ajustar(); }
        if (a === 'cancelar') cerrar(null);
        if (a === 'ok') {
          if (!hayTrazo) { nombre.focus(); cv.classList.add('falta'); setTimeout(() => cv.classList.remove('falta'), 900); return; }
          // se recorta al trazo (con margen) para que en el PDF la firma no quede chiquita
          const m = 8, x = Math.max(0, (minX - m) * dpr), y = Math.max(0, (minY - m) * dpr);
          const w = Math.min(cv.width - x, (maxX - minX + 2 * m) * dpr), h = Math.min(cv.height - y, (maxY - minY + 2 * m) * dpr);
          const rec = document.createElement('canvas'); rec.width = Math.max(4, Math.round(w)); rec.height = Math.max(4, Math.round(h));
          rec.getContext('2d').drawImage(cv, x, y, w, h, 0, 0, rec.width, rec.height);
          cerrar({ png: rec.toDataURL('image/png'), nombre: nombre.value.trim(), cuando: Date.now() });
        }
      });
    });
  }
  window.Firma = { pedir };
})();
