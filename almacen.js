/* GH Cadenas — Copyright (c) 2026 Felipe Manrique. Todos los derechos reservados. */
/* Las cadenas se guardan SIEMPRE primero en el teléfono (IndexedDB) para poder trabajar sin señal.
   Cuando hay conexión se suben al servidor; lo que falta subir queda marcado como «pendiente». */
(function () {
  'use strict';
  const DB = 'gh-cadenas', ALMACEN = 'cadenas';
  let db = null;
  const memoria = new Map();           // respaldo si IndexedDB no está disponible (navegación privada)

  function abrir() {
    if (db) return Promise.resolve(db);
    return new Promise((ok) => {
      try {
        const r = indexedDB.open(DB, 1);
        r.onupgradeneeded = () => r.result.createObjectStore(ALMACEN, { keyPath: 'id' });
        r.onsuccess = () => { db = r.result; ok(db); };
        r.onerror = () => ok(null);
      } catch (e) { ok(null); }
    });
  }
  function tx(modo, fn) {
    return abrir().then((d) => new Promise((ok, mal) => {
      if (!d) return ok(fn(null));
      const t = d.transaction(ALMACEN, modo); let res;
      try { res = fn(t.objectStore(ALMACEN)); } catch (e) { return mal(e); }
      t.oncomplete = () => ok(res && res.result !== undefined ? res.result : res);
      t.onerror = () => mal(t.error);
    }));
  }
  const todas = () => tx('readonly', (s) => (s ? s.getAll() : Array.from(memoria.values()))).then((r) => r || []);
  const una = (id) => tx('readonly', (s) => (s ? s.get(id) : memoria.get(id))).then((r) => r || null);
  const poner = (c) => tx('readwrite', (s) => { if (s) s.put(c); else memoria.set(c.id, c); return c; }).then(() => c);
  const quitar = (id) => tx('readwrite', (s) => { if (s) s.delete(id); else memoria.delete(id); });

  function nuevoId() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  /* Guarda un cambio hecho en este dispositivo: queda pendiente de subir. */
  function guardar(c) { c.actualizado = Date.now(); c.pendiente = true; return poner(c); }

  /* Mezcla el índice del servidor con lo local. Gana la versión más nueva; lo local pendiente nunca se pisa con algo más viejo. */
  async function mezclar(remotas) {
    const locales = await todas(); const porId = new Map(locales.map((c) => [c.id, c]));
    const faltan = [];
    for (const r of remotas || []) {
      const l = porId.get(r.id);
      if (!l) { faltan.push(r.id); continue; }
      if ((r.actualizado || 0) > (l.actualizado || 0) && !l.pendiente) faltan.push(r.id);
    }
    return faltan;                                   // ids que hay que traer completos del servidor
  }

  window.Almacen = { todas, una, poner, guardar, quitar, mezclar, nuevoId };
})();
