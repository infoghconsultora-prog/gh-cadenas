/* GH Cadenas — Copyright (c) 2026 Felipe Manrique. Todos los derechos reservados. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const KEY = 'gh-cadenas:v1';
  const el = (tag, attrs, ...hijos) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'value') e.value = v; else e.setAttribute(k, v === true ? '' : v);
    }
    for (const h of hijos.flat()) if (h !== null && h !== undefined && h !== false) e.append(h.nodeType ? h : document.createTextNode(h));
    return e;
  };
  const S = { usuario: {}, servicios: [], equiposCal: [], empresas: [], cadenas: new Map(), demo: false, iniciada: false, verTerminados: false, busca: '' };
  let C = null, DEF = null;                 // cadena abierta y su definición
  let tLocal = null, tSubir = null;

  /* ---------- tema y avisos ---------- */
  const tema = { get() { try { return localStorage.getItem(KEY + ':tema'); } catch (e) { return null; } },
                 set(v) { try { localStorage.setItem(KEY + ':tema', v); } catch (e) {} } };
  function aplicarTema() { const t = tema.get(); if (t) document.documentElement.dataset.theme = t; }
  aplicarTema();
  $('btnTema').addEventListener('click', () => {
    const oscuro = (document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark';
    tema.set(oscuro ? 'light' : 'dark'); aplicarTema();
  });
  let tToast;
  function toast(msg, accion, fn) {
    $('toastMsg').textContent = msg; const b = $('toastBtn');
    b.hidden = !accion; b.textContent = accion || ''; b.onclick = () => { $('toast').classList.remove('on'); fn && fn(); };
    $('toast').classList.add('on'); clearTimeout(tToast); tToast = setTimeout(() => $('toast').classList.remove('on'), accion ? 7000 : 2800);
  }
  const recordar = { get(k) { try { return JSON.parse(localStorage.getItem(KEY + ':' + k) || 'null'); } catch (e) { return null; } },
                     set(k, v) { try { localStorage.setItem(KEY + ':' + k, JSON.stringify(v)); } catch (e) {} } };

  /* ---------- utilidades ---------- */
  const hoy = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const ahora = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  const fechaEs = (iso) => { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(iso || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : (iso || ''); };
  const claveServicio = (s) => s.presupuestoGH || s.claveServicio || s.empresa;
  const parseCCs = (v) => String(v || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const i = l.indexOf('|'); return i < 0 ? { tipo: '', url: l } : { tipo: l.slice(0, i).trim(), url: l.slice(i + 1).trim() }; });
  const terminado = (s) => !!(s.checklist && (s.checklist.envioFinal || s.checklist.terminadoManual));
  const cadenasDe = (clave) => Array.from(S.cadenas.values()).filter((c) => c.servicio === clave && !c.borrada).sort((a, b) => (a.creada || 0) - (b.creada || 0));
  const conDato = (f) => Object.values(f).some((v) => v !== '' && v !== null && v !== undefined && !(Array.isArray(v) && !v.length));
  const filasCon = (c) => Object.values(c.tablas || {}).reduce((a, f) => a + f.filter(conDato).length, 0);

  /* ---------- base de empresas ---------- */
  const CAMPOS_EMP = ['cuit', 'ubicacion', 'localidad', 'cp', 'provincia', 'sitio'];
  function claveEmpresa(nombre) {
    let t = Cadenas.norm(nombre);
    // la razón social (S.A., S.R.L.…) no cuenta en ningún lugar del nombre; lo de entre paréntesis SÍ (es el sitio: «(Veladero)»)
    t = ' ' + t.replace(/[.,\-()\/]/g, ' ').replace(/\s+/g, ' ') + ' ';
    const leg = / (s a i c|i c s a|s a s|s r l|s c a|s a|saic|icsa|sas|srl|sca|scop|ltda|sa) /;
    while (leg.test(t)) t = t.replace(leg, ' ');
    return t.replace(/\s+/g, ' ').trim();
  }
  /* La empresa que corresponde a un nombre: la misma, o una cuyo nombre completo empieza con el escrito («ACER» → «ACER SAN JUAN»).
     Un nombre más específico NO toma los datos de uno más general: «CINCA (Veladero)» no es la planta de «CINCA»;
     de esa solo se toma el CUIT (parcial). */
  function buscarEmpresa(nombre) {
    const k = claveEmpresa(nombre);
    if (!k) return null;
    const local = (recordar.get('empresas') || {});
    const todas = S.empresas.concat(Object.entries(local).map(([n, e]) => Object.assign({ nombre: n }, e)));
    const igual = todas.find((e) => claveEmpresa(e.nombre) === k || (e.ambiental && claveEmpresa(e.ambiental) === k));
    if (igual) return igual;
    if (k.length < 3) return null;
    // sin el sitio entre paréntesis el nombre tiene que ser más largo: «CINCA» no toma los datos de «CINCA (Veladero)»
    const larga = todas.find((e) => claveEmpresa(String(e.nombre).replace(/\(.*?\)/g, ' ')).indexOf(k + ' ') === 0);
    if (larga) return larga;
    const general = todas.find((e) => { const x = claveEmpresa(e.nombre); return x.length >= 3 && k.indexOf(x + ' ') === 0; });
    return general && general.cuit ? { nombre: general.nombre, cuit: general.cuit, parcial: true } : null;
  }
  /* Completa los datos vacíos del rótulo con los de la base. Devuelve cuántos completó. */
  function completarEmpresa(rot) {
    const e = buscarEmpresa(rot.empresa);
    if (!e) return 0;
    let n = 0;
    CAMPOS_EMP.forEach((k) => { if (e[k] && !String(rot[k] || '').trim()) { rot[k] = e[k]; n++; } });
    return n;
  }

  /* Lista de sugerencias propia (la del navegador casi no se ve en el celular): botones grandes con nombre y detalle
     debajo del campo. fuente() da [{v, sub, dato}]; se filtra por lo escrito (sin acentos ni mayúsculas). */
  function sugerencias(inp, fuente, alElegir) {
    const caja = el('div', { class: 'sug', role: 'listbox', hidden: true });
    const flecha = el('button', { type: 'button', class: 'sug-flecha', 'aria-label': 'Ver la lista', tabindex: '-1' });
    flecha.innerHTML = '<svg viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5l5 5 5-5"/></svg>';
    const envol = el('div', { class: 'sug-envol' });
    inp.replaceWith(envol); envol.append(inp, flecha, caja);
    inp.removeAttribute('list'); inp.setAttribute('autocomplete', 'off'); inp.setAttribute('aria-autocomplete', 'list');
    let todo = false;
    function pintar() {
      const q = Cadenas.norm(inp.value).trim();
      const items = fuente().filter((x) => todo || !q || Cadenas.norm(x.v + ' ' + (x.sub || '')).includes(q)).slice(0, todo ? 80 : 12);
      caja.replaceChildren(...items.map((x) => {
        const b = el('button', { type: 'button', class: 'sug-item', role: 'option' }, el('b', { text: x.v }), x.sub ? el('small', { text: x.sub }) : '');
        b.addEventListener('pointerdown', (e) => e.preventDefault());       // que el campo no pierda el foco antes del toque
        b.addEventListener('click', () => { inp.value = x.v; cerrar(); alElegir(x); });
        return b;
      }));
      if (!items.length) caja.append(el('div', { class: 'sug-vacio', text: q ? 'No hay coincidencias: se guarda lo que escribiste.' : 'No hay datos cargados.' }));
      caja.hidden = false; envol.classList.add('abierta');
    }
    function cerrar() { caja.hidden = true; todo = false; envol.classList.remove('abierta'); }
    inp.addEventListener('focus', () => { todo = false; pintar(); });
    inp.addEventListener('input', () => { todo = false; pintar(); });
    inp.addEventListener('blur', () => setTimeout(cerrar, 150));
    inp.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
    flecha.addEventListener('pointerdown', (e) => e.preventDefault());
    flecha.addEventListener('click', () => { if (!caja.hidden && todo) return cerrar(); todo = true; inp.focus(); pintar(); });
    return envol;
  }
  const detalleEmpresa = (e) => [e.cuit, [e.ubicacion, e.localidad].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
  function fuenteEmpresas() {
    const vistos = new Set(), out = [];
    S.empresas.forEach((e) => { if (e.nombre && !vistos.has(e.nombre)) { vistos.add(e.nombre); out.push({ v: e.nombre, sub: detalleEmpresa(e), dato: e }); } });
    S.servicios.forEach((x) => { if (x.empresa && !vistos.has(x.empresa)) { vistos.add(x.empresa); out.push({ v: x.empresa, sub: 'De Seguimiento de Mediciones' }); } });
    return out.sort((a, b) => a.v.localeCompare(b.v, 'es'));
  }
  const fuenteEquipos = () => S.equiposCal.map((e) => ({ v: [e.nombre, e.numero_serie && 'N/S ' + e.numero_serie].filter(Boolean).join(' · '),
    sub: [e.que_mide, e.fecha_venc && 'Calibración vence ' + fechaCorta(e.fecha_venc)].filter(Boolean).join(' · ') }));
  const fechaCorta = (iso) => { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(iso || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : iso; };

  /* =============================================================== lista de servicios */
  function pintarServicios() {
    const cont = $('listaServicios'); cont.replaceChildren();
    const q = S.busca.trim().toLowerCase();
    const lista = S.servicios.filter((s) => (S.verTerminados || !terminado(s)) && (!q || (s.empresa + ' ' + s.presupuestoGH).toLowerCase().includes(q)));
    const fechaDe = (s) => (s.checklist && s.checklist.fechaCoordinada) || s.fechaMuestreo || '';
    lista.sort((a, b) => (fechaDe(a) || '9999').localeCompare(fechaDe(b) || '9999'));
    const yo = (S.usuario.nombre || '~').split(' ')[0].toLowerCase();
    const mias = lista.filter((s) => String((s.checklist && s.checklist.tecnicoAsignado) || '').toLowerCase().includes(yo));
    const grupo = (titulo, ss) => {
      if (!ss.length) return;
      cont.append(el('div', { class: 'grupo-t', text: titulo }));
      ss.forEach((s) => {
        const k = claveServicio(s), cs = cadenasDe(k), f = fechaDe(s);
        const abiertas = cs.filter((c) => c.estado !== 'cerrada').length, cerradas = cs.length - abiertas;
        cont.append(el('button', { class: 'servicio', type: 'button', onclick: () => { location.hash = 's=' + encodeURIComponent(k); } },
          el('div', { class: 'grow' },
            el('div', { class: 'serv-emp', text: s.empresa || '(sin empresa)' }),
            el('div', { class: 'serv-sub', text: [s.presupuestoGH && 'Presupuesto ' + s.presupuestoGH, f && 'Medición ' + fechaEs(f), s.checklist && s.checklist.tecnicoAsignado].filter(Boolean).join(' · ') }),
            el('div', { class: 'serv-med', text: (s.mediciones || []).map((m) => m.tipoMuestra).filter(Boolean).join(' · ') })),
          el('div', { class: 'serv-est' },
            abiertas ? el('span', { class: 'pill amarillo', text: abiertas + ' en curso' }) : null,
            cerradas ? el('span', { class: 'pill verde', text: cerradas + (cerradas === 1 ? ' entregada' : ' entregadas') }) : null,
            !cs.length ? el('span', { class: 'pill', text: 'sin cadenas' }) : null)));
      });
    };
    grupo('Mis mediciones', mias); grupo(mias.length ? 'Las demás' : 'Mediciones', lista.filter((s) => !mias.includes(s)));
    const sueltas = cadenasDe('');
    if (sueltas.length) { cont.append(el('div', { class: 'grupo-t', text: 'Cadenas sueltas (sin servicio)' })); sueltas.forEach((c) => cont.append(filaCadena(c))); }
    if (!lista.length && !sueltas.length) cont.append(el('p', { class: 'muted', text: q ? 'No hay servicios que coincidan.' : 'No hay mediciones pendientes.' }));
    $('chkTerminados').checked = S.verTerminados;
  }

  function filaCadena(c) {
    const d = Cadenas.def(c.tipo) || { titulo: c.tipo };
    const n = filasCon(c);
    return el('button', { class: 'servicio', type: 'button', onclick: () => { location.hash = 'c=' + c.id; } },
      el('div', { class: 'grow' }, el('div', { class: 'serv-emp', text: d.titulo + (c.hoja > 1 ? ' · hoja ' + c.hoja : '') }),
        el('div', { class: 'serv-sub', text: [c.servicio ? null : (c.rotulo || {}).empresa, n + (n === 1 ? ' fila cargada' : ' filas cargadas'), c.por].filter(Boolean).join(' · ') })),
      el('div', { class: 'serv-est' },
        c.estado === 'cerrada' ? el('span', { class: 'pill verde', text: 'entregada' }) : el('span', { class: 'pill amarillo', text: 'en curso' }),
        c.pendiente && !S.demo ? el('span', { class: 'pill', text: 'sin subir' }) : null));
  }

  /* =============================================================== un servicio */
  function pintarServicio(clave) {
    const s = S.servicios.find((x) => claveServicio(x) === clave);
    if (!s) { location.hash = ''; return; }
    $('servTitulo').textContent = s.empresa;
    const f = (s.checklist && s.checklist.fechaCoordinada) || s.fechaMuestreo;
    $('servSub').textContent = [s.presupuestoGH && 'Presupuesto ' + s.presupuestoGH, s.ordenCompra && 'OC ' + s.ordenCompra, f && 'Medición ' + fechaEs(f), s.checklist && s.checklist.tecnicoAsignado].filter(Boolean).join(' · ');
    const lista = $('servCadenas'); lista.replaceChildren();
    const cs = cadenasDe(clave);
    cs.forEach((c) => lista.append(filaCadena(c)));
    if (!cs.length) lista.append(el('p', { class: 'muted', text: 'Todavía no hay cadenas digitales para esta medición. Elegí abajo cuál empezar.' }));
    // qué cadenas le corresponden: las que Seguimiento ya generó y las que sugiere por el tipo de medición
    const generadas = parseCCs(s.checklist && s.checklist.ccUrl).map((c) => c.tipo).filter(Boolean);
    const sugeridas = Array.from(new Set(generadas.concat(s.ccSugeridas || []).map((t) => Cadenas.def(t)).filter(Boolean)));
    const cont = $('servAgregar'); cont.replaceChildren();
    sugeridas.forEach((d) => cont.append(el('button', { class: 'tipo-cc', type: 'button', onclick: () => crearCadena(s, d) },
      el('span', { class: 'tipo-t', text: d.titulo }), el('span', { class: 'tipo-f f-' + d.fuente, text: Cadenas.FUENTES[d.fuente] }))));
    const sel = el('select', { 'aria-label': 'Otra cadena' }, el('option', { value: '', text: sugeridas.length ? 'Otra cadena…' : 'Elegí la cadena…' }),
      Cadenas.LISTA.filter((d) => !sugeridas.includes(d)).map((d) => el('option', { value: d.id, text: d.titulo })));
    sel.addEventListener('change', () => { const d = Cadenas.def(sel.value); sel.value = ''; if (d) crearCadena(s, d); });
    cont.append(sel);
  }

  async function crearCadena(s, d) {
    const clave = s ? claveServicio(s) : '';
    const previas = cadenasDe(clave).filter((c) => Cadenas.norm(c.tipo) === Cadenas.norm(d.id));
    const c = {
      id: Almacen.nuevoId(), servicio: clave, tipo: d.id, hoja: previas.length + 1, estado: 'borrador', creada: Date.now(), por: S.usuario.nombre || S.usuario.email || '',
      ordenCompra: s ? s.ordenCompra || '' : '',
      rotulo: { empresa: s ? s.empresa : '', presupuesto: s ? s.presupuestoGH || '' : '', fecha: hoy(),   // el día en que se crea la cadena
        metodologia: (d.metodos || []).length === 1 ? d.metodos[0] : '' },
      tablas: {}, extras: {}, observaciones: '', firmas: {},
    };
    completarEmpresa(c.rotulo);
    (d.tablas || []).forEach((t) => { c.tablas[t.id] = t.filasIniciales ? t.filasIniciales.map((f) => Object.assign({}, f)) : [{}]; });
    S.cadenas.set(c.id, c); await Almacen.guardar(c); programarSubida();
    location.hash = 'c=' + c.id;
  }

  /* =============================================================== editor de una cadena */
  function campoInput(campo, valor, alCambiar, bloqueada) {
    if (campo.tipo === 'select') {
      // un valor guardado que ya no está en la lista (versión anterior) se conserva como una opción más
      const ops = campo.op.concat(valor && !campo.op.includes(valor) ? [valor] : []);
      const s = el('select', { disabled: bloqueada }, el('option', { value: '', text: '—' }), ops.map((o) => el('option', { value: o, text: o })));
      s.value = valor || ''; s.addEventListener('change', () => alCambiar(s.value)); return s;
    }
    if (campo.tipo === 'combo') {
      // lista con los valores habituales y «Otro…» al final para escribir uno distinto
      const OTRO = '__otro__';
      const esOtro = !!valor && !campo.op.includes(valor);
      const s = el('select', { disabled: bloqueada }, el('option', { value: '', text: '—' }),
        campo.op.map((o) => el('option', { value: o, text: o })), el('option', { value: OTRO, text: 'Otro…' }));
      const txt = el('input', { type: 'text', autocomplete: 'off', placeholder: 'Escribí cuál', 'aria-label': campo.et + ' (otro)', disabled: bloqueada, hidden: !esOtro });
      s.value = esOtro ? OTRO : (valor || ''); txt.value = esOtro ? valor : '';
      s.addEventListener('change', () => {
        if (s.value === OTRO) { txt.hidden = false; txt.focus(); alCambiar(txt.value.trim()); }
        else { txt.hidden = true; alCambiar(s.value); }
      });
      txt.addEventListener('input', () => alCambiar(txt.value));
      return el('div', { class: 'combo' }, s, txt);
    }
    if (campo.tipo === 'sn') {
      const caja = el('div', { class: 'seg', role: 'group' });
      ['SI', 'NO'].forEach((o) => {
        const b = el('button', { type: 'button', class: 'seg-b' + (valor === o ? ' on' : ''), 'aria-pressed': valor === o ? 'true' : 'false', disabled: bloqueada, text: o });
        b.addEventListener('click', () => { const nuevo = b.classList.contains('on') ? '' : o; alCambiar(nuevo);
          caja.querySelectorAll('.seg-b').forEach((x) => { const on = x === b && !!nuevo; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); }); });
        caja.append(b);
      });
      return caja;
    }
    if (campo.tipo === 'chips') {
      const sel = new Set(Array.isArray(valor) ? valor : []);
      const caja = el('div', { class: 'chips', role: 'group' });
      campo.op.forEach((o) => {
        const b = el('button', { type: 'button', class: 'chip' + (sel.has(o) ? ' on' : ''), 'aria-pressed': sel.has(o) ? 'true' : 'false', disabled: bloqueada, text: o });
        b.addEventListener('click', () => { if (sel.has(o)) sel.delete(o); else sel.add(o); b.classList.toggle('on'); b.setAttribute('aria-pressed', sel.has(o) ? 'true' : 'false'); alCambiar(campo.op.filter((x) => sel.has(x))); });
        caja.append(b);
      });
      return caja;
    }
    const inp = el('input', { type: campo.tipo === 'date' ? 'date' : campo.tipo === 'time' ? 'time' : 'text', inputmode: campo.tipo === 'num' ? 'decimal' : null,
      autocomplete: 'off', autocapitalize: campo.tipo === 'num' ? 'off' : 'sentences', disabled: bloqueada, enterkeyhint: 'next' });
    inp.value = valor === null || valor === undefined ? '' : valor;
    inp.addEventListener('input', () => alCambiar(inp.value));
    if (campo.tipo === 'date' && !bloqueada) {
      const cal = el('button', { type: 'button', class: 'mini cal', 'aria-label': 'Abrir el calendario', title: 'Calendario' });
      cal.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';
      cal.addEventListener('click', () => { try { inp.showPicker(); } catch (e) { inp.focus(); inp.click(); } });
      const b = el('button', { type: 'button', class: 'mini', text: 'Hoy' });
      b.addEventListener('click', () => { inp.value = hoy(); alCambiar(inp.value); });
      return el('div', { class: 'con-boton' }, inp, cal, b);
    }
    if (campo.tipo === 'time' && !bloqueada) {
      const b = el('button', { type: 'button', class: 'mini', text: 'Ahora' });
      b.addEventListener('click', () => { inp.value = ahora(); alCambiar(inp.value); });
      return el('div', { class: 'con-boton' }, inp, b);
    }
    if (campo.u) return el('div', { class: 'con-unidad' }, inp, el('span', { class: 'unidad', text: campo.u }));
    return inp;
  }
  function campoBloque(campo, valor, alCambiar, bloqueada, idp) {
    const ctrl = campoInput(campo, valor, alCambiar, bloqueada);
    const inp = ctrl.matches('input,select') ? ctrl : ctrl.querySelector('input,select');
    const id = idp + '_' + campo.id;
    if (inp) inp.id = id;
    const ancho = campo.tipo === 'chips' || campo.tipo === 'date' || /^(obs|tarea|nombre|puesto|sector|sitio|mas|equipo|contaminante|area|empresa|ubicacion|metodologia)$/.test(campo.id);
    return el('div', { class: 'campo' + (ancho ? ' ancho' : '') }, inp ? el('label', { for: id, text: campo.et }) : el('span', { class: 'lbl', text: campo.et }), ctrl);
  }
  function botonGps(destino, campos, repintar) {
    if (!campos.some((c) => c.id === 'lat') || !campos.some((c) => c.id === 'lon')) return null;
    return el('button', { type: 'button', class: 'mini gps', onclick: () => {
      if (!navigator.geolocation) return toast('Este dispositivo no da la ubicación');
      toast('Buscando la ubicación…');
      navigator.geolocation.getCurrentPosition((p) => { destino.lat = p.coords.latitude.toFixed(6); destino.lon = p.coords.longitude.toFixed(6); cambio(); repintar(); toast('Ubicación tomada (±' + Math.round(p.coords.accuracy) + ' m)'); },
        () => toast('No se pudo tomar la ubicación. Revisá el permiso.'), { enableHighAccuracy: true, timeout: 15000 });
    } }, 'Tomar ubicación');
  }
  const resumenFila = (t, f) => t.campos.filter((c) => c.tipo !== 'chips').map((c) => f[c.id]).filter((v) => v !== undefined && v !== '' && v !== null).slice(0, 3).join(' · ');
  // al «copiar el anterior» no se copia lo propio de cada punto (identificación, horas, lecturas)
  const PROPIO = /^(id|n|muestra|nombre|sitio|rotulo|punto|hora|inicio|fin|lectura|valor|m\d|mas|d_|des_|n_|tbs|tbh|tg|hr|tgbh|lat|lon|p_|f_p|filtro|codigo|ph|cond|sdt|od|obs|duracion|h_ini)/;

  function pintarCadena() {
    const bloq = C.estado === 'cerrada';
    $('cadTitulo').textContent = DEF.titulo + (C.hoja > 1 ? ' · hoja ' + C.hoja : '');
    $('cadEmpresa').textContent = [(C.rotulo || {}).empresa, (C.rotulo || {}).presupuesto && 'Presupuesto ' + C.rotulo.presupuesto].filter(Boolean).join(' · ');
    const f = $('cadFuente'); f.className = 'tipo-f f-' + DEF.fuente; f.textContent = Cadenas.FUENTES[DEF.fuente];
    $('cadNota').textContent = DEF.nota || '';
    $('cadCerrada').hidden = !bloq;
    const rot = $('cadRotulo'); rot.replaceChildren();
    Cadenas.rotulo(DEF).forEach((campo) => {
      const b = campoBloque(campo, C.rotulo[campo.id], (v) => { C.rotulo[campo.id] = v; cambio(); if (campo.id === 'equipo') avisoEquipo(); }, bloq, 'r');
      const refrescar = () => CAMPOS_EMP.forEach((k) => { const x = $('r_' + k); if (x && x.value !== (C.rotulo[k] || '')) x.value = C.rotulo[k] || ''; });
      if (campo.id === 'equipo' && !bloq) {
        const inp = b.querySelector('input');
        sugerencias(inp, fuenteEquipos, (x) => { C.rotulo.equipo = x.v; cambio(); avisoEquipo(); });
        b.append(el('small', { id: 'avisoEquipo', class: 'aviso-eq' }));
      }
      if (campo.id === 'empresa' && !bloq) {
        const inp = b.querySelector('input');
        // elegida de la lista: se ponen SUS datos (CUIT, ubicación, localidad, CP, provincia, sitio), aunque hubiera otros
        sugerencias(inp, fuenteEmpresas, (x) => {
          C.rotulo.empresa = x.v;
          const e = x.dato || buscarEmpresa(x.v);
          let n = 0;
          if (e) CAMPOS_EMP.forEach((k) => { if (e[k] && C.rotulo[k] !== e[k]) { C.rotulo[k] = e[k]; n++; } });
          cambio(); refrescar();
          if (n) toast('Se cargaron ' + n + ' datos de ' + x.v);
        });
        // escrita a mano: se completan solo los datos vacíos
        inp.addEventListener('change', () => { const n = completarEmpresa(C.rotulo); if (n) { cambio(); refrescar(); toast('Se completaron ' + n + ' datos de la empresa'); } });
      }
      rot.append(b);
    });
    avisoEquipo();
    const cont = $('cadTablas'); cont.replaceChildren();
    (DEF.tablas || []).forEach((t) => {
      C.tablas[t.id] = C.tablas[t.id] || [{}];
      const filas = C.tablas[t.id];
      const sec = el('section', { class: 'card' }, el('h2', { text: t.titulo }));
      const caja = el('div', { class: 'filas' }); sec.append(caja);
      let abierta = filas.length - 1;
      const repintar = () => {
        caja.replaceChildren();
        filas.forEach((fila, i) => {
          const det = el('details', { class: 'fila' }); det.open = i === abierta;
          const res = el('span', { class: 'fila-res', text: resumenFila(t, fila) || 'sin datos' });
          det.append(el('summary', {}, el('span', { class: 'fila-n', text: t.item + ' ' + (i + 1) }), res));
          const grid = el('div', { class: 'grid' });
          t.campos.forEach((campo) => grid.append(campoBloque(campo, fila[campo.id], (v) => { fila[campo.id] = v; res.textContent = resumenFila(t, fila) || 'sin datos'; cambio(); }, bloq, t.id + i)));
          det.append(grid);
          if (!bloq) det.append(el('div', { class: 'barra' }, botonGps(fila, t.campos, repintar), el('span', { class: 'grow' }),
            el('button', { type: 'button', class: 'mini peligro', onclick: () => {
              if (conDato(fila) && !confirm('¿Quitar ' + t.item.toLowerCase() + ' ' + (i + 1) + '?')) return;
              filas.splice(i, 1); if (!filas.length) filas.push({}); abierta = Math.min(i, filas.length - 1); cambio(); repintar(); } }, 'Quitar')));
          det.addEventListener('toggle', () => { if (det.open) abierta = i; });
          caja.append(det);
        });
      };
      repintar();
      if (!bloq) sec.append(el('div', { class: 'barra' },
        el('button', { type: 'button', class: 'btn', onclick: () => { filas.push({}); abierta = filas.length - 1; cambio(); repintar(); enfocarUltima(caja); } }, 'Agregar ' + t.item.toLowerCase()),
        el('button', { type: 'button', class: 'btn sec', onclick: () => {
          const ult = filas[filas.length - 1] || {}; const copia = {};
          t.campos.forEach((c) => { if (!PROPIO.test(c.id) && ult[c.id] !== undefined) copia[c.id] = Array.isArray(ult[c.id]) ? ult[c.id].slice() : ult[c.id]; });
          filas.push(copia); abierta = filas.length - 1; cambio(); repintar(); enfocarUltima(caja); } }, 'Copiar el anterior')));
      cont.append(sec);
    });
    $('secExtras').hidden = !(DEF.extras || []).length;
    const ex = $('cadExtras');
    const pintarExtras = () => {
      ex.replaceChildren();
      (DEF.extras || []).forEach((campo) => ex.append(campoBloque(campo, C.extras[campo.id], (v) => { C.extras[campo.id] = v; cambio(); }, bloq, 'x')));
      const g = !bloq && botonGps(C.extras, DEF.extras || [], pintarExtras); if (g) ex.append(el('div', { class: 'campo ancho' }, g));
    };
    pintarExtras();
    $('cadObs').value = C.observaciones || ''; $('cadObs').disabled = bloq;
    pintarFirmas();
    $('accAbierta').hidden = bloq; $('accCerrada').hidden = !bloq;
    $('lnkPdf').hidden = !C.pdfUrl; if (C.pdfUrl) $('lnkPdf').href = C.pdfUrl;
    estadoGuardado();
  }
  function enfocarUltima(caja) { const d = caja.lastElementChild; if (d) { d.scrollIntoView({ block: 'start', behavior: 'smooth' }); const i = d.querySelector('input,select'); if (i) setTimeout(() => i.focus({ preventScroll: true }), 250); } }
  function avisoEquipo() {
    const a = $('avisoEquipo'); if (!a) return;
    const v = Cadenas.norm((C.rotulo || {}).equipo); a.textContent = ''; a.className = 'aviso-eq';
    if (!v) return;
    const eq = S.equiposCal.find((e) => (e.nombre && v.includes(Cadenas.norm(e.nombre))) || (e.numero_serie && v.includes(Cadenas.norm(e.numero_serie))));
    if (!eq || !eq.fecha_venc) return;
    const vencido = String(eq.fecha_venc) < hoy();
    a.textContent = (vencido ? 'Calibración VENCIDA el ' : 'Calibración vigente hasta el ') + fechaEs(String(eq.fecha_venc));
    a.classList.add(vencido ? 'mal' : 'ok');
  }
  const FIRMAS = [['responsable', 'Responsable de muestreo'], ['cliente', 'Cliente'], ['recepcion', 'Recepción (en la oficina)']];
  function pintarFirmas() {
    const cont = $('cadFirmas'); cont.replaceChildren();
    const bloq = C.estado === 'cerrada';
    FIRMAS.forEach(([k, et]) => {
      const f = (C.firmas || {})[k];
      const caja = el('div', { class: 'firma-slot' + (f ? ' hecha' : '') },
        el('div', { class: 'firma-et', text: et }),
        f ? el('img', { src: f.png, alt: 'Firma de ' + (f.nombre || et) }) : el('div', { class: 'firma-vacia', text: 'Sin firmar' }),
        f ? el('div', { class: 'firma-nom', text: [f.nombre, f.cuando && new Date(f.cuando).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })].filter(Boolean).join(' · ') }) : null);
      if (!bloq) caja.append(el('div', { class: 'barra' },
        el('button', { type: 'button', class: 'btn' + (f ? ' sec' : ''), onclick: async () => {
          const r = await Firma.pedir('Firma · ' + et, f ? f.nombre : (k === 'responsable' ? (S.usuario.nombre || '') : ''));
          if (!r) return; C.firmas = C.firmas || {}; C.firmas[k] = r; cambio(); pintarFirmas(); } }, f ? 'Volver a firmar' : 'Firmar'),
        f ? el('button', { type: 'button', class: 'mini peligro', onclick: () => { if (confirm('¿Borrar esta firma?')) { delete C.firmas[k]; cambio(); pintarFirmas(); } } }, 'Borrar') : null));
      cont.append(caja);
    });
  }

  /* ---------- guardado: primero en el teléfono, después al servidor ---------- */
  function cambio() {
    C.actualizado = Date.now(); C.pendiente = true; $('cadGuardado').textContent = 'Guardando…';
    clearTimeout(tLocal); tLocal = setTimeout(guardarLocal, 500);
  }
  async function guardarLocal() {
    clearTimeout(tLocal); tLocal = null;
    if (!C) return;
    try {
      await Almacen.poner(C);
      const e = recordar.get('empresas') || {}, r = C.rotulo || {};
      if (r.empresa && C.estado === 'cerrada') { e[r.empresa] = Object.fromEntries(CAMPOS_EMP.map((k) => [k, r[k] || ''])); recordar.set('empresas', e); }
    } catch (err) { toast('No se pudo guardar en este teléfono'); return; }
    estadoGuardado(); programarSubida();
  }
  function estadoGuardado() {
    if (!C) return;
    $('cadGuardado').textContent = S.demo ? 'Guardado en este dispositivo (modo de prueba)'
      : C.pendiente ? (navigator.onLine ? 'Guardado en el teléfono · subiendo…' : 'Guardado en el teléfono · sin señal, se sube después') : 'Guardado y subido';
  }
  function programarSubida() { if (S.demo) return; clearTimeout(tSubir); tSubir = setTimeout(subirPendientes, 3500); }
  let subiendo = false;
  async function subirPendientes() {
    if (S.demo || subiendo || !navigator.onLine || !Backend.conSesion()) return;
    subiendo = true;
    try {
      for (const c of Array.from(S.cadenas.values()).filter((x) => x.pendiente)) {
        const marca = c.actualizado;
        try {
          const r = await Backend.llamar(c.borrada ? 'borrarCadena' : 'guardarCadena', c.borrada ? { id: c.id } : { cadena: Object.assign({}, c, { pendiente: undefined }) });
          if (r && r.ok) {
            if (c.borrada) { S.cadenas.delete(c.id); await Almacen.quitar(c.id); }
            else if (c.actualizado === marca) { c.pendiente = false; await Almacen.poner(c); }
          }
        } catch (e) { break; }             // sin conexión: se reintenta después
      }
    } finally { subiendo = false; estadoGuardado(); if (!C) repintarLista(); }
  }
  window.addEventListener('online', () => { estadoGuardado(); subirPendientes(); });
  window.addEventListener('offline', estadoGuardado);

  /* ---------- PDF, entrega y otras acciones ---------- */
  function nombreArchivo(ext) {
    const limpio = (s) => String(s || '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
    return limpio(C.tipo + (C.hoja > 1 ? ' hoja ' + C.hoja : '') + ' - ' + ((C.rotulo || {}).empresa || 'sin empresa') + ' - ' + ((C.rotulo || {}).fecha || hoy())) + ext;
  }
  const CLAVE_FMT = 'gh-cadenas:v1:formatoPdf';
  function formatoPdf() { const r = document.querySelector('input[name=fmtPdf]:checked'); return r ? r.value : 'original'; }
  function iniciarFormatoPdf() {
    let f = 'original'; try { f = localStorage.getItem(CLAVE_FMT) || 'original'; } catch (e) { /* sin almacenamiento */ }
    document.querySelectorAll('input[name=fmtPdf]').forEach((r) => {
      r.checked = r.value === f;
      r.addEventListener('change', () => { try { localStorage.setItem(CLAVE_FMT, formatoPdf()); } catch (e) { /* sin almacenamiento */ } });
    });
  }
  async function hacerPdf() {
    if (tLocal) await guardarLocal();
    const bytes = formatoPdf() === 'original' && window.PdfOriginal && (window.PLANTILLAS_CC || {})[DEF.id]
      ? await PdfOriginal.generar(C, DEF) : await PdfCadena.generar(C, DEF);
    try { return await PdfCadena.adjuntarDatos(bytes, datosParaInforme()); } catch (e) { return bytes; }   // sin adjunto, el PDF igual sirve
  }
  function bajar(bytes, nombre, tipo) {
    const url = URL.createObjectURL(new Blob([bytes], { type: tipo })); const a = el('a', { href: url, download: nombre });
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  async function verPdf() {
    try { const b = await hacerPdf(); const url = URL.createObjectURL(new Blob([b], { type: 'application/pdf' })); if (!window.open(url, '_blank')) bajar(b, nombreArchivo('.pdf'), 'application/pdf'); }
    catch (e) { toast('No se pudo armar el PDF: ' + e.message); }
  }
  function datosParaInforme() {
    return { formato: 'gh-cadena/1', id: C.id, tipo: C.tipo, informe: DEF.informe || '', titulo: DEF.titulo, hoja: C.hoja, servicio: C.servicio, rotulo: C.rotulo,
      tablas: C.tablas, extras: C.extras, observaciones: C.observaciones, por: C.por, actualizado: C.actualizado,
      firmas: Object.fromEntries(Object.entries(C.firmas || {}).map(([k, f]) => [k, { nombre: f.nombre, cuando: f.cuando }])) };
  }
  const aBase64 = (bytes) => { let s = ''; const u = new Uint8Array(bytes); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };

  async function entregar() {
    const faltan = [];
    if (!filasCon(C)) faltan.push('no hay ninguna fila con datos');
    if (!(C.firmas || {}).responsable) faltan.push('falta la firma del responsable');
    if (!(C.firmas || {}).cliente) faltan.push('falta la firma del cliente');
    if (faltan.length && !confirm('Atención: ' + faltan.join('; ') + '.\n\n¿Cerrar y entregar igual?')) return;
    const btn = $('btnEntregar'); btn.disabled = true; btn.textContent = 'Entregando…';
    try {
      const pdf = await hacerPdf();
      if (S.demo) {
        bajar(pdf, nombreArchivo('.pdf'), 'application/pdf');
        bajar(new TextEncoder().encode(JSON.stringify(datosParaInforme(), null, 1)), nombreArchivo(' - datos.json'), 'application/json');
        C.estado = 'cerrada'; C.cerrada = Date.now(); C.actualizado = Date.now(); await Almacen.poner(C);
        toast('Modo de prueba: se descargaron el PDF y los datos.');
      } else {
        if (!navigator.onLine) throw new Error('No hay señal. La cadena queda guardada en el teléfono; entregala cuando vuelva la conexión.');
        let pdfUrl = '';
        const serv = S.servicios.find((x) => claveServicio(x) === C.servicio);
        if (serv && serv.presupuestoGH) {
          // la cadena firmada entra a Seguimiento de Mediciones como «CC completada» del servicio, en la carpeta de su
          // medición: el tipo tiene que ser el de la medición tal cual figura en Seguimiento (así se nombra la carpeta)
          const tipoMed = Cadenas.tipoMedicion(C.tipo, (serv.mediciones || []).map((m) => m.tipoMuestra)) || DEF.titulo;
          const r = await Backend.llamar('subirArchivoPaso', { presupuestoGH: serv.presupuestoGH, empresa: serv.empresa, ordenCompra: serv.ordenCompra || '',
            destino: 'ccCompletadas', tipo: tipoMed, filename: nombreArchivo('.pdf'), contentMimeType: 'application/pdf', fileBase64: aBase64(pdf) }, 'seguimiento');
          if (!r.ok) throw new Error('Seguimiento de Mediciones no la recibió (' + (r.detalle || r.error) + ')');
          pdfUrl = r.url || '';
        }
        C.estado = 'cerrada'; C.cerrada = Date.now(); C.actualizado = Date.now(); C.pdfUrl = pdfUrl;
        const r2 = await Backend.llamar('cerrarCadena', { cadena: Object.assign({}, C, { pendiente: undefined }), datos: datosParaInforme(), pdfUrl, nombre: nombreArchivo(' - datos.json') });
        if (!r2.ok) throw new Error('No se pudo cerrar en el servidor (' + r2.error + ')');
        C.pendiente = false; await Almacen.poner(C);
        toast(pdfUrl ? 'Entregada: quedó en Seguimiento de Mediciones.' : 'Cerrada. No estaba ligada a un servicio: descargá el PDF.');
      }
      pintarCadena();
    } catch (e) { toast(e.message || 'No se pudo entregar'); }
    finally { btn.disabled = false; btn.textContent = 'Cerrar y entregar'; }
  }
  function reabrir() {
    if (!confirm('¿Reabrir la cadena para corregirla? Al entregar de nuevo se sube otra versión del PDF.')) return;
    C.estado = 'borrador'; cambio(); pintarCadena();
  }
  async function borrarCadena() {
    if (!confirm('¿Eliminar esta cadena? No se puede deshacer.')) return;
    const c = C; clearTimeout(tLocal); tLocal = null; C = null;
    c.borrada = true; c.pendiente = true; c.actualizado = Date.now();
    if (S.demo) { S.cadenas.delete(c.id); await Almacen.quitar(c.id); } else { await Almacen.poner(c); programarSubida(); }
    location.hash = c.servicio ? 's=' + encodeURIComponent(c.servicio) : '';
  }

  /* =============================================================== rutas */
  function mostrar(vista) { ['vServicios', 'vServicio', 'vCadena'].forEach((v) => { $(v).hidden = v !== vista; }); $('btnVolver').hidden = vista === 'vServicios'; window.scrollTo(0, 0); }
  function repintarLista() { const m = location.hash.match(/^#s=(.+)$/); if (m) pintarServicio(decodeURIComponent(m[1])); else if (!location.hash || location.hash === '#') pintarServicios(); }
  async function ruta() {
    if (!S.iniciada) return;
    if (tLocal) await guardarLocal();
    C = null; DEF = null;
    let m = location.hash.match(/^#c=(.+)$/);
    if (m) {
      const c = S.cadenas.get(m[1]); const d = c && Cadenas.def(c.tipo);
      if (!c || !d || c.borrada) { location.hash = ''; return; }
      C = c; DEF = d; C.rotulo = C.rotulo || {}; C.tablas = C.tablas || {}; C.extras = C.extras || {}; C.firmas = C.firmas || {};
      pintarCadena(); mostrar('vCadena'); return;
    }
    m = location.hash.match(/^#s=(.+)$/);
    if (m) { pintarServicio(decodeURIComponent(m[1])); mostrar('vServicio'); return; }
    pintarServicios(); mostrar('vServicios');
  }
  window.addEventListener('hashchange', ruta);

  /* =============================================================== arranque */
  async function iniciar(d) {
    S.usuario = d.usuario || {}; S.servicios = d.servicios || []; S.equiposCal = d.equiposCal || []; S.demo = !!d.demo;
    if (d.empresas) S.empresas = d.empresas;
    const nombres = new Set(S.empresas.map((e) => e.nombre).concat(S.servicios.map((x) => x.empresa)).filter(Boolean));
    // si el teléfono todavía tiene la página anterior en caché, la lista no existe: se crea
    if (!$('dlEmpresas')) document.body.append(el('datalist', { id: 'dlEmpresas' }));
    $('dlEmpresas').replaceChildren(...Array.from(nombres).sort((a, b) => a.localeCompare(b)).map((n) => el('option', { value: n })));
    (await Almacen.todas()).forEach((c) => { if (!S.cadenas.has(c.id)) S.cadenas.set(c.id, c); });
    if (!S.demo && d.cadenas) {              // d.cadenas es null cuando se abre sin sesión: no se toca lo local
      try {
        const faltan = await Almacen.mezclar(d.cadenas || []);
        for (const id of faltan) {
          if (C && C.id === id) continue;                       // la que se está editando no se pisa
          const r = await Backend.llamar('getCadena', { id });
          if (r.ok && r.cadena) { r.cadena.pendiente = false; S.cadenas.set(id, r.cadena); await Almacen.poner(r.cadena); }
        }
        // lo que otro borró en el servidor y acá no tiene cambios sin subir, se quita
        const vivos = new Set((d.cadenas || []).map((x) => x.id));
        for (const c of Array.from(S.cadenas.values())) if (!vivos.has(c.id) && !c.pendiente && !(C && C.id === c.id)) { S.cadenas.delete(c.id); await Almacen.quitar(c.id); }
      } catch (e) { /* sin conexión: se sigue con lo local */ }
    }
    const dl = $('dlEquipos'); dl.replaceChildren();
    S.equiposCal.forEach((e) => dl.append(el('option', { value: [e.nombre, e.numero_serie && 'N/S ' + e.numero_serie].filter(Boolean).join(' · ') })));
    $('bannerDemo').hidden = !S.demo;
    $('usuario').textContent = S.usuario.nombre || S.usuario.email || '';
    const primera = !S.iniciada; S.iniciada = true;
    if (primera) ruta(); else if (!C) repintarLista();
    subirPendientes();
  }

  $('busca').addEventListener('input', () => { S.busca = $('busca').value; pintarServicios(); });
  $('chkTerminados').addEventListener('change', () => { S.verTerminados = $('chkTerminados').checked; pintarServicios(); });
  $('btnVolver').addEventListener('click', () => {
    const m = location.hash.match(/^#c=(.+)$/); const c = m && S.cadenas.get(m[1]);
    location.hash = c && c.servicio ? 's=' + encodeURIComponent(c.servicio) : '';
  });
  $('btnSuelta').addEventListener('click', () => {
    const sel = $('selSuelta'); const d = Cadenas.def(sel.value); if (!d) return toast('Elegí primero qué cadena');
    sel.value = ''; crearCadena(null, d);
  });
  $('cadObs').addEventListener('input', () => { if (C) { C.observaciones = $('cadObs').value; cambio(); } });
  iniciarFormatoPdf();
  $('btnPdf').addEventListener('click', verPdf); $('btnPdf2').addEventListener('click', verPdf);
  $('btnEntregar').addEventListener('click', entregar);
  $('btnReabrir').addEventListener('click', reabrir);
  $('btnBorrar').addEventListener('click', borrarCadena);
  $('btnDatos').addEventListener('click', () => bajar(new TextEncoder().encode(JSON.stringify(datosParaInforme(), null, 1)), nombreArchivo(' - datos.json'), 'application/json'));
  Cadenas.LISTA.forEach((d) => $('selSuelta').append(el('option', { value: d.id, text: d.titulo })));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && tLocal) guardarLocal(); });
  window.addEventListener('pagehide', () => { if (tLocal) guardarLocal(); });   // cerrar la pestaña no pierde lo último escrito

  window.App = { iniciar, toast, sinConexion: () => toast('Sin conexión: se trabaja con lo guardado en el teléfono.'), estado: S };
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
