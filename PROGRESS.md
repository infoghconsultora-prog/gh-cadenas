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

## PENDIENTE (18/11/2026) — cadenas sueltas: elegir carpeta en 1. INFORMES
- HECHO, SIN DESPLEGAR: gh-cadenas-backend/Code.gs tiene listarCarpetas_, crearCarpeta_ y guardarEnCarpeta_ (INFORMES_ID 1N0lloh4…; solo dentro de INFORMES, nunca pisa ni borra). Sintaxis OK, sin pruebas.
- FALTA:
  - prueba con mocks (carpetas con getParents encadenados);
  - en app.js, entregar(): si C.servicio está vacío, abrir un selector con migas de pan, lista de subcarpetas, buscador, «Nueva carpeta» y «Guardar acá»;
  - después llamar guardarEnCarpeta → pdfUrl → cerrarCadena con nombre = PDF final + « - datos.json»;
  - sumar listarCarpetas a LECTURAS en backend.js;
  - ./desplegar.sh, subir VERSION del SW, probar a 375 px claro/oscuro y publicar.

## 19/11/2026 — v1.7.0: firma a distancia
- «Mandar a firmar» en la firma del cliente: enlace firmar.html#c=<código 96 hex> para WhatsApp/mail (menú compartir del teléfono o WhatsApp/mail/copiar).
- Backend: crearPedidoFirma/anularPedidoFirma (con login) y verPedidoFirma/firmarPedido (públicas, solo con el código). Se guarda la huella SHA-256, vence a los 7 días, una sola vez, límite de intentos. La firma queda con remota:true y no se pierde si el teléfono guarda una versión sin ella (firmada_remota_<id>).
- La app revisa sola en cada sincronización si ya firmó («¿Ya firmó?» para mirar a mano).

## v1.8.0 (20/11/2026) — empresas
- `empresas.js`: base tomada de los informes reales de 1. INFORMES (19 empresas, todas con datos; CINCA S.A. planta Rawson y CINCA S.A. (Veladero) aparte) con `alias` para los nombres cortos de Seguimiento («Salentein», «SCOP», «Milicic», «LIEBHERR»…). La misma lista está en Code.gs (SEMILLA_EMP, deploy @7) y en GH Informes (datos/empresas_semilla.json).
- Los datos de los informes mandan sobre lo aprendido; lo de Ambiental sin ningún dato ya no entra a la lista; los nombres de Seguimiento que son una empresa de la base no se repiten en blanco.
- Elegir o escribir «Salentein» deja la razón social completa y carga CUIT, dirección, localidad, CP y provincia.
- Regenerar la base: `python3 ~/Developer/gh-informes/herramientas/extraer_empresas.py salida.json` (lee los Word del Drive, tarda ~10 min la primera vez) y curar a mano empresas.js.
