/* GH Cadenas — Copyright (c) 2026 Felipe Manrique. Todos los derechos reservados. */
/* Cliente del backend Apps Script: login Google (GIS), pedidos a prueba de fallas, sondeo de versión.
   Reglas (ver references/04-gas-backend.md): el idToken dura ~1 h y no se renueva solo; los pedidos de
   Apps Script fallan de forma intermitente (3-15 %) → pedidos paralelos escalonados; las escrituras llevan
   requestId para que un reintento no duplique; el sondeo pregunta getVersion (barato), nunca getData. */
(function () {
  'use strict';
  // Mismo OAuth Client ID que Seguimiento de Mediciones: el mismo ingreso sirve para los dos servidores.
  const CLIENT_ID = '585469655594-8aj9hjmf7d4noglr1th673dbiia8ftkv.apps.googleusercontent.com';
  const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbwqj4wAPmFieuKLWY3Ac7eN4zZPt5lTuFVpo5rwiQmguK9rMCVpYbn3diSmDW5SAaVfVQ/exec';      // servidor propio de GH Cadenas (guarda las cadenas en curso)
  const BACKEND_ESPEJO = '';
  // Seguimiento de Mediciones: de ahí salen los servicios y ahí se entregan las cadenas completadas.
  const SEGUIMIENTO_URL = 'https://script.google.com/macros/s/AKfycbwZC6NAzLDUleScxQb57m8T675gvtHvkn7m0R_qoPfU7_Gtv9E34_VgPmCiekUk_KHU/exec';
  const SEGUIMIENTO_ESPEJO = 'https://script.google.com/macros/s/AKfycbwz5Eu-ScQ0qgUJQpMDE8GyotV92qIZNZn4aL1zsb269LiW0USACRPrZ1uwGG1POfxnTQ/exec';
  const MS_SONDEO = 30000;
  // Sin servidor propio configurado la app funciona en modo de prueba: todo queda en el dispositivo.
  const DEMO = /PEGAR_/.test(BACKEND_URL) || new URLSearchParams(location.search).has('demo');

  const $ = (id) => document.getElementById(id);
  let idToken = null, versionVista = null, timerSondeo = null, rechazos = 0, ultimoFallo = '';

  /* ---------- pedidos ---------- */
  const LECTURAS = { getData: 1, getVersion: 1, getCadena: 1, getCalibraciones: 1 };
  const PLAN_LECTURA   = { escalones: [0, 4000, 8000, 13000, 20000], max: 5, porIntento: 25000, tope: 50000 };
  const PLAN_SONDEO    = { escalones: [0, 5000], max: 2, porIntento: 15000, tope: 22000 };
  const PLAN_ESCRITURA = { escalones: [0, 12000, 24000], max: 3, porIntento: 30000, tope: 55000 };

  function nuevoRequestId() {
    const b = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
    return b.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
  }

  // destino: 'propio' (GH Cadenas) o 'seguimiento' (Seguimiento de Mediciones)
  function llamar(action, extra, destino) {
    const seg = destino === 'seguimiento';
    const URL_BASE = seg ? SEGUIMIENTO_URL : BACKEND_URL, URL_ESPEJO = seg ? SEGUIMIENTO_ESPEJO : BACKEND_ESPEJO;
    const lectura = !!LECTURAS[action];
    const plan = action === 'getVersion' ? PLAN_SONDEO : lectura ? PLAN_LECTURA : PLAN_ESCRITURA;
    const cuerpo = Object.assign({ action, idToken }, extra || {});
    if (!lectura) cuerpo.requestId = nuevoRequestId();
    const texto = JSON.stringify(cuerpo);          // sin Content-Type: pedido "simple", sin preflight CORS
    const t0 = Date.now();
    return new Promise((resolve, reject) => {
      let fin = false, lanzados = 0, activos = 0, ultimoError = null;
      const controles = [], relojes = [];
      const cerrar = (f, v) => { if (fin) return; fin = true; relojes.forEach(clearTimeout); controles.forEach((c) => c.abort()); f(v); };
      function lanzar() {
        if (fin || lanzados >= plan.max) return;
        const n = ++lanzados; activos++;
        const corte = new AbortController(); controles.push(corte);
        const enEspejo = lectura && URL_ESPEJO && n % 2 === 0;
        const base = enEspejo ? URL_ESPEJO : URL_BASE;
        const url = n <= 2 ? base : base + '?r=' + Date.now() + '_' + n;   // parámetro distinto = pedido nuevo
        const reloj = setTimeout(() => corte.abort(), plan.porIntento);
        fetch(url, { method: 'POST', body: texto, signal: corte.signal })
          .then((r) => r.text())
          .then((txt) => { try { return JSON.parse(txt); } catch (e) { const er = new Error('no es JSON'); er.name = 'RespuestaInvalida'; throw er; } })
          .then((j) => cerrar(resolve, j))
          .catch((err) => { if (!fin) { ultimoError = err; ultimoFallo = action + ' · ' + (err.name || 'error') + ' a los ' + Math.round((Date.now() - t0) / 1000) + ' s (intento ' + n + ')'; } })
          .finally(() => {
            clearTimeout(reloj); activos--;
            if (fin) return;
            if (lanzados < plan.max) lanzar();
            else if (activos === 0) cerrar(reject, ultimoError || new Error('sin respuesta'));
          });
      }
      plan.escalones.slice(1).forEach((ms) => relojes.push(setTimeout(lanzar, ms)));
      relojes.push(setTimeout(() => cerrar(reject, ultimoError || Object.assign(new Error('tiempo agotado'), { name: 'AbortError' })), plan.tope));
      lanzar();
    });
  }

  /* ---------- sesión ---------- */
  function exp(token) { try { return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp * 1000; } catch (e) { return 0; } }

  /* Aviso dentro de la app cuando no hay sesión (sin señal, o venció): la app sigue andando con lo guardado en el teléfono. */
  function cartel(msg) {
    const b = $('bannerSesion'); if (!b) return;
    b.hidden = !msg; $('bannerSesionMsg').textContent = msg || '';
  }
  const CLAVE_SESION = 'gh-cadenas:v1:sesion';
  function guardarSesion(d) { try { localStorage.setItem(CLAVE_SESION, JSON.stringify({ usuario: d.usuario, equipo: d.equipo, servicios: d.servicios, equiposCal: d.equiposCal, empresas: d.empresas, cuando: Date.now() })); } catch (e) {} }
  function leerSesion() { try { return JSON.parse(localStorage.getItem(CLAVE_SESION) || 'null'); } catch (e) { return null; } }

  function sesionVencida() {
    clearInterval(timerSondeo); timerSondeo = null; idToken = null;
    if (navigator.onLine) {      // con señal no se sigue sin sesión: vuelve a la pantalla de ingreso (lo cargado queda en el teléfono)
      $('app').hidden = true; $('login').hidden = false;
      $('loginMsg').hidden = false; $('loginMsg').textContent = 'La sesión venció. Ingresá de nuevo; lo que cargaste quedó guardado.';
    } else cartel('La sesión venció y no hay señal: lo que cargues queda guardado en el teléfono hasta que vuelvas a ingresar.');
    try { google.accounts.id.prompt(); } catch (e) {}
  }

  function alIniciarSesion(resp) {
    idToken = resp.credential; rechazos = 0;
    setTimeout(sesionVencida, Math.max(5000, exp(idToken) - Date.now() - 30000));
    cargar(true);
  }

  function nombreDe(token) { try { const p = JSON.parse(decodeURIComponent(escape(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))))); return { email: p.email || '', nombre: p.name || '' }; } catch (e) { return { email: '', nombre: '' }; } }

  async function cargar(primera) {
    try {
      // servicios (Seguimiento) y cadenas en curso (propio), en paralelo
      const [seg, propio] = await Promise.all([llamar('getData', null, 'seguimiento'), llamar('getData')]);
      if (!seg.ok || !propio.ok) {
        if (seg.error === 'auth_failed' || propio.error === 'auth_failed') { $('loginMsg').hidden = false; $('loginMsg').textContent = 'Esta cuenta no tiene acceso.'; return; }
        throw new Error(seg.error || propio.error);
      }
      $('login').hidden = true; $('app').hidden = false; cartel(''); $('btnSalir').hidden = false;
      versionVista = propio.version;
      const datos = { usuario: Object.assign(nombreDe(idToken), { email: seg.email }), equipo: seg.equipo || [], servicios: seg.servicios || [],
        equiposCal: seg.equiposCal || [], cadenas: propio.cadenas || [], empresas: propio.empresas || [] };
      guardarSesion(datos);
      App.iniciar(datos);
      if (primera) arrancarSondeo();
    } catch (e) {
      if ($('app').hidden) { $('loginMsg').hidden = false; $('loginMsg').textContent = 'No se pudo conectar. ' + ultimoFallo; }
      else cartel('Sin conexión con el servidor: se trabaja con lo guardado en el teléfono y se sube cuando vuelva la señal.');
    }
  }

  /* ---------- sincronización entre usuarios ---------- */
  async function chequear() {
    if (document.visibilityState !== 'visible' || !idToken) return;
    try {
      const r = await llamar('getVersion');
      if (!r.ok) { if (r.error === 'auth_failed' && ++rechazos >= 2) sesionVencida(); return; }
      rechazos = 0;
      if (r.version !== versionVista) cargar(false);
    } catch (e) { /* red caída: se reintenta en el próximo ciclo */ }
  }
  function arrancarSondeo() {
    if (timerSondeo) return;
    timerSondeo = setInterval(chequear, MS_SONDEO);
    document.addEventListener('visibilitychange', chequear);
    window.addEventListener('focus', chequear);
  }

  function iniciarGIS() {
    if (!(window.google && google.accounts && google.accounts.id)) return setTimeout(iniciarGIS, 200);
    google.accounts.id.initialize({ client_id: CLIENT_ID, callback: alIniciarSesion, auto_select: true, cancel_on_tap_outside: false });
    google.accounts.id.renderButton($('gsiButton'), { theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill' });
    if ($('gsiButton2')) google.accounts.id.renderButton($('gsiButton2'), { theme: 'outline', size: 'medium', text: 'signin_with', shape: 'pill' });
    google.accounts.id.prompt();            // si ya había ingresado en este teléfono, entra solo
  }
  const HORAS_SIN_SENAL = 24;
  function abrirSinSenal(previa) {
    $('login').hidden = true; $('app').hidden = false; $('btnSalir').hidden = false;
    cartel('Sin señal: trabajando con lo guardado en el teléfono. Al volver la señal, ingresá para subir los cambios.');
    App.iniciar(Object.assign({}, previa, { cadenas: null }));
  }
  window.addEventListener('load', () => {
    if (DEMO) {
      // modo de prueba: sin ingreso ni servidor; los servicios salen de demo.js
      $('login').hidden = true; $('app').hidden = false;
      App.iniciar(Object.assign({ demo: true }, window.DEMO_DATOS || { usuario: { email: '', nombre: 'Prueba' }, equipo: [], servicios: [], equiposCal: [], cadenas: [] }));
      return;
    }
    // Siempre se entra con Google: nadie que agarre el teléfono ve los datos sin ingresar.
    // Única excepción: SIN SEÑAL (el ingreso de Google no anda) y con un ingreso de las últimas 24 h en este teléfono,
    // para no dejar al técnico trabado en el campo. Al volver la señal se le pide ingresar.
    const previa = leerSesion();
    const reciente = previa && previa.usuario && Date.now() - (previa.cuando || 0) < HORAS_SIN_SENAL * 3600000;
    if (!navigator.onLine && reciente) abrirSinSenal(previa);
    else if (!navigator.onLine) { $('loginMsg').hidden = false; $('loginMsg').textContent = 'No hay señal. Para entrar hace falta conexión (o haber ingresado en este teléfono en las últimas ' + HORAS_SIN_SENAL + ' horas).'; }
    window.addEventListener('offline', () => {           // se cortó la señal en la pantalla de ingreso
      const p = leerSesion();
      if (!$('app').hidden || !p || Date.now() - (p.cuando || 0) >= HORAS_SIN_SENAL * 3600000) return;
      abrirSinSenal(p);
    });
    $('btnSalir').addEventListener('click', salir);
    iniciarGIS();
  });
  /* Cerrar sesión (teléfono compartido): borra lo bajado del servidor y no vuelve a entrar solo.
     Las cadenas sin subir NO se borran: quedan en el teléfono y se suben en el próximo ingreso. */
  function salir() {
    if (!confirm('¿Cerrar sesión en este teléfono?\n\nLo que todavía no se subió queda guardado y se sube cuando vuelvas a entrar.')) return;
    clearInterval(timerSondeo); timerSondeo = null; idToken = null;
    try { localStorage.removeItem(CLAVE_SESION); } catch (e) {}
    try { google.accounts.id.disableAutoSelect(); } catch (e) {}
    cartel(''); $('app').hidden = true; $('login').hidden = false;
    $('loginMsg').hidden = false; $('loginMsg').textContent = 'Cerraste la sesión.';
    history.replaceState(null, '', location.pathname);
  }
  window.addEventListener('online', () => {
    if (DEMO) return;
    if (idToken) cargar(false);
    else if (!$('app').hidden) { cartel('Volvió la señal: ingresá con Google para seguir y subir los cambios.'); try { google.accounts.id.prompt(); } catch (e) {} }
  });

  window.Backend = { llamar, demo: DEMO, conSesion: () => !!idToken, recargar: () => cargar(false) };
})();
