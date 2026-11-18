# Progreso

## 14/11/2026 — v1.2.2 PUBLICADA
- App: https://infoghconsultora-prog.github.io/gh-cadenas/ (repo infoghconsultora-prog/gh-cadenas, GitHub Pages).
- Backend: Apps Script «GH Cadenas Backend» en info.ghconsultora (scriptId 1ByZDF2k9TDoblFKHdj122C6feSHHWbTlCORpeE2FcaBUpr0jpE1EzVoA),
  implementación AKfycbwqj4wAPmFieuKLWY3Ac7eN4zZPt5lTuFVpo5rwiQmguK9rMCVpYbn3diSmDW5SAaVfVQ. Cambios: `./desplegar.sh "mensaje"`.
  `prepararTodo()` ya corrido (planilla índice y carpeta en el Drive de info; IDs en las propiedades del script).
- Seguimiento de Mediciones: paso 7 «Ejecución» tiene el botón que abre GH Cadenas en ese servicio.

Probado en vivo con la cuenta info: lee los servicios y equipos reales; guardar, subir, sincronizar a otro dispositivo, firmar, cerrar,
reabrir y borrar (con una cadena suelta de prueba, ya borrada). La entrega a Seguimiento usa el mismo pedido que el panel
(subirArchivoPaso, destino ccCompletadas, tipo = medición del servicio); no se probó con un servicio real para no ensuciar sus carpetas.

Notas: el ingreso de Google y la autorización de permisos abren ventanas emergentes; en el navegador integrado las tiene que tocar Felipe.

## 18/11/2026 — v1.5.0
- PDF «Original» (igual a la 2.ª hoja del Excel de cada CC) además del «Compacto»; elección en la cadena.
- Base de empresas (backend @3): hoja Empresas + Ambiental + semilla de informes; aprende de CC cerradas.
- UV con las 8 posiciones fijas, listas desplegables, calendario y fechas a ancho completo, rótulo único sin «Proyecto».
- El service worker revalida siempre (no sirve copias viejas del navegador).

## 18/11/2026 — v1.6.0 (revisión con las reglas de /nueva-webapp)
- Siempre se entra con Google; sin señal solo con ingreso de las últimas 24 h; sesión vencida con señal → vuelve al ingreso.
- Botón «Salir» (como Seguimiento Ambiental): borra lo bajado del servidor y desactiva el ingreso automático; lo no subido queda.
- Flecha en listas desplegables; fecha por defecto = día de creación; guardado al cerrar la pestaña (pagehide).
- Chequeos: check-shell OK, probar-offline OK, 375 px claro, CSP, sin innerHTML con datos, backend valida iss/aud/email_verified/exp + lista blanca.
