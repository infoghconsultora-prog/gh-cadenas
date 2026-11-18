/* GH Cadenas — Copyright (c) 2026 Felipe Manrique. Todos los derechos reservados. */
/* Definición de las cadenas de custodia. El «id» de cada una es el nombre de la plantilla que usa
   Seguimiento de Mediciones (carpeta «6. CC / Cadenas de custodia individuales»): así se enlazan.
   fuente: de dónde sale el dato que después va al informe
     'equipo'      → el informe sale del software del equipo; la cadena guarda lo que el equipo no sabe
     'directa'     → el equipo muestra el valor y se anota en la cadena
     'laboratorio' → se toma la muestra y el resultado lo da el laboratorio                           */
(function () {
  'use strict';
  const SN = ['SI', 'NO'];
  const c = (id, et, tipo, extra) => Object.assign({ id, et, tipo: tipo || 'text' }, extra || {});
  const ATM = [c('temp', 'Temperatura ambiente', 'num', { u: '°C' }), c('presion', 'Presión atmosférica', 'num', { u: 'hPa' }),
    c('humedad', 'Humedad relativa', 'num', { u: '%' })];
  const GPS = [c('lat', 'Latitud'), c('lon', 'Longitud')];
  const VIENTO_DIR = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO', 'Variable', 'Calmo'];
  const VIENTO = ['Calmo', 'Brisa (menos de 5 km/h)', 'Leve (5 a 20 km/h)', 'Moderado (20 a 30 km/h)', 'Fuerte (más de 30 km/h)'];
  const CIELO = ['Cielo despejado', 'Parcialmente nublado', 'Nublado', 'Lluvia', 'Noche (sin luz natural)'];
  const JORNADA = ['8 horas', '9 horas', '10 horas', '12 horas'];
  const ROPA = ['Camisa y pantalón largos (algodón)', 'Overol de material tejido', 'Overol de polipropileno SMS', 'Overol de poliolefina',
    'Ropa tejida de doble capa', 'Overol barrera de vapor con capucha'];
  const LIQ = [c('nombre', 'Nombre de muestra (punto, lugar)'), c('hora', 'Hora de muestreo', 'time'),
    c('tipo', 'Tipo de muestra', 'select', { op: ['Simple', 'Compuesta'] }),
    c('env_v', 'Envases de vidrio', 'num', { c: 'V' }), c('env_p', 'Envases de plástico', 'num', { c: 'P' }),
    c('env_t', 'Envases de teflón', 'num', { c: 'T' }), c('env_vial', 'Viales', 'num', { c: 'Vial' }),
    c('preservante', 'Preservante', 'chips', { op: ['HNO3', 'H2SO4', 'NaOH', 'HCl', 'Otro', 'S/P', 'Estéril'] }),
    c('ph', 'pH', 'num'), c('cond', 'Conductividad', 'num', { u: 'µS/cm', c: 'Cond' }), c('sdt', 'SDT', 'num', { u: 'mg/l' }),
    c('temp', 'Temperatura', 'num', { u: '°C', c: 'Temp' }), c('od', 'Oxígeno disuelto', 'num', { u: 'mg/l', c: 'OD' })];

  const LISTA = [
    { id: 'CC RUIDO', metodos: ['Res. SRT 85/12 – analizador de octavas (A 15 min y C 5 min)', 'Res. SRT 85/12 – dosimetría'], titulo: 'Ruido en ambiente laboral', fuente: 'equipo', informe: 'ruido', grupo: 'Ambiente laboral',
      nota: 'El informe sale del software del sonómetro. Acá va lo que el equipo no sabe: sector, puesto, tiempo de exposición y los dos números de muestreo de cada punto.',
      tablas: [{ id: 'filas', titulo: 'Puntos de medición', item: 'Punto', campos: [
        c('sector', 'Sector'), c('puesto', 'Puesto / puesto tipo / puesto móvil'),
        c('te', 'Tiempo de exposición del trabajador', 'num', { u: 'h', c: 'Te (h)' }),
        c('m1', 'N° de muestreo en A (15 min)', 'num', { c: 'Muestreo A' }), c('m2', 'N° de muestreo en C (5 min)', 'num', { c: 'Muestreo C' }),
        c('tint', 'Tiempo de integración', 'combo', { c: 'T. integr.', op: ['15 min (A) y 5 min (C)', '15 min', '5 min', '30 min', '60 min', 'Jornada completa (dosimetría)'] }),
        c('tipo', 'Características del ruido', 'select', { op: ['Continuo', 'Intermitente', 'De impulso o de impacto'], c: 'Ruido' }),
        c('obs', 'Observaciones')] }] },
    { id: 'CC RUIDO AMBIENTAL', metodos: ['IRAM 4062:2021 (mod. 2025), parte 2'], titulo: 'Ruidos molestos al vecindario', fuente: 'equipo', informe: 'ruido_ambiental', grupo: 'Ambiental',
      nota: 'El informe sale del software del sonómetro. Acá va qué número de muestra es cada medición: con la actividad (LM) y ruido de fondo (LF), por franja.',
      tablas: [{ id: 'filas', titulo: 'Sitios', item: 'Sitio', campos: [
        c('sitio', 'N° de rótulo / sitio'), c('lat', 'Latitud'), c('lon', 'Longitud'),
        c('d_ini', 'Diurno: hora de inicio', 'time', { c: 'Diurno ini' }), c('d_fin', 'Diurno: hora final', 'time', { c: 'Diurno fin' }),
        c('d_lm', 'Diurno: N° de muestra con actividad (LM)', 'num', { c: 'D · LM' }), c('d_lf', 'Diurno: N° de muestra de fondo (LF)', 'num', { c: 'D · LF' }),
        c('des_ini', 'Descanso: hora de inicio', 'time', { c: 'Desc ini' }), c('des_fin', 'Descanso: hora final', 'time', { c: 'Desc fin' }),
        c('des_lm', 'Descanso: N° de muestra con actividad (LM)', 'num', { c: 'Desc · LM' }), c('des_lf', 'Descanso: N° de muestra de fondo (LF)', 'num', { c: 'Desc · LF' }),
        c('n_ini', 'Nocturno: hora de inicio', 'time', { c: 'Noct ini' }), c('n_fin', 'Nocturno: hora final', 'time', { c: 'Noct fin' }),
        c('n_lm', 'Nocturno: N° de muestra con actividad (LM)', 'num', { c: 'N · LM' }), c('n_lf', 'Nocturno: N° de muestra de fondo (LF)', 'num', { c: 'N · LF' }),
        c('obs', 'Observaciones')] }],
      extras: ATM.concat([c('viento', 'Viento', 'combo', { op: VIENTO }), c('dir_viento', 'Dirección del viento', 'select', { op: VIENTO_DIR }),
        c('horario_empresa', 'Horario de trabajo de la empresa', 'combo', { op: ['De 6 a 22 horas', 'De 8 a 18 horas', 'Las 24 horas', 'Solo horario diurno'] })]) },
    { id: 'CC VIBRACIONES', metodos: ['ISO 2631-1 (cuerpo entero)', 'ISO 5349-1 (mano-brazo)'], titulo: 'Vibraciones', fuente: 'equipo', informe: 'vibraciones', grupo: 'Ambiente laboral',
      nota: 'El informe sale del software del medidor. Acá va qué se midió, a quién y cuántas horas por día está expuesto.',
      tablas: [{ id: 'filas', titulo: 'Mediciones', item: 'Medición', campos: [
        c('id', 'ID muestra (equipo o herramienta)'), c('operario', 'Operario / equipo'),
        c('tipo', 'Tipo de vibración', 'select', { op: ['Cuerpo entero', 'Mano-brazo'] }),
        c('inicio', 'Hora de inicio', 'time'), c('fin', 'Hora final', 'time'), c('duracion', 'Duración', 'num', { u: 'min' }),
        c('t_exp', 'Exposición diaria', 'num', { u: 'h', c: 'Exp. (h)' }), c('obs', 'Observaciones')] }],
      extras: ATM.concat(GPS) },
    { id: 'CC VIBRACIONES AMBIENTAL', metodos: ['ISO 2631-2', 'DIN 4150-3'], titulo: 'Vibraciones ambientales', fuente: 'equipo', grupo: 'Ambiental',
      nota: 'El informe sale del software del medidor.',
      tablas: [{ id: 'filas', titulo: 'Mediciones', item: 'Medición', campos: [
        c('id', 'ID muestra'), c('inicio', 'Hora de inicio', 'time'), c('fin', 'Hora final', 'time'), c('duracion', 'Duración', 'num', { u: 'min' }),
        c('tipo', 'Tipo de vibración', 'select', { op: ['Cuerpo entero', 'Mano-brazo'] }), c('obs', 'Observaciones')] }],
      extras: ATM.concat(GPS) },
    { id: 'CC Iluminación', metodos: ['Res. SRT 84/12 – método de la grilla', 'Res. SRT 84/12 – medición en el puesto'], titulo: 'Iluminación', fuente: 'directa', informe: 'iluminacion', grupo: 'Ambiente laboral',
      nota: 'El luxómetro muestra el valor: se anota acá. CTI: A natural · B1 artificial general · B2 artificial localizada · C1 mixta con general · C2 mixta con localizada.',
      tablas: [{ id: 'filas', titulo: 'Puntos de muestreo', item: 'Punto', campos: [
        c('id', 'ID muestra / punto'), c('hora', 'Hora', 'time'), c('sector', 'Sector'), c('puesto', 'Sección / puesto'),
        c('cti', 'Código de iluminación (CTI)', 'select', { op: ['A', 'B1', 'B2', 'C1', 'C2'], c: 'CTI' }),
        c('m1', 'Medición I', 'num', { u: 'lux', c: 'I' }), c('m2', 'Medición II', 'num', { u: 'lux', c: 'II' }), c('m3', 'Medición III', 'num', { u: 'lux', c: 'III' }),
        c('mas', 'Más lecturas (grilla), separadas por punto y coma', 'text', { c: 'Otras' }),
        c('vn', 'Valor requerido Dec. 351/79 (lux)', 'combo', { c: 'VN (lux)', op: ['100', '200', '300', '400', '500', '600', '700', '750', '1000', '1500', '2000'] }), c('lat', 'Latitud'), c('lon', 'Longitud'), c('obs', 'Observaciones')] }],
      extras: [c('condiciones', 'Condiciones atmosféricas', 'combo', { op: CIELO })] },
    { id: 'CC Estrés Térmica', metodos: ['Res. SRT 30/2023 – índice TGBH (ISO 7243:2017)'], titulo: 'Estrés térmico', fuente: 'directa', informe: 'estres_termico', grupo: 'Ambiente laboral',
      nota: 'El monitor muestra las temperaturas y el TGBH: se anotan acá junto con ropa, tarea y aclimatación.',
      tablas: [{ id: 'filas', titulo: 'Puntos', item: 'Punto', campos: [
        c('id', 'ID muestra'), c('sector', 'Sector'), c('inicio', 'Hora de inicio', 'time'), c('fin', 'Hora final', 'time'),
        c('ropa', 'Indumentaria', 'select', { op: ROPA }), c('trab', '% de trabajo', 'num', { c: '%Trab' }), c('desc', '% de descanso', 'num', { c: '%Desc' }),
        c('aclim', 'Aclimatado', 'sn', { c: 'Aclim' }), c('act', 'Actividad', 'select', { op: ['Reposo', 'Ligera', 'Moderada', 'Pesada', 'Muy pesada'], c: 'Act.' }),
        c('tarea', 'Tarea que realiza (para la tasa metabólica)', 'combo', { op: ['Sentado, actividad sedentaria (oficina, laboratorio)', 'De pie, actividad ligera',
          'De pie, actividad media', 'Caminar sin carga', 'Caminar con carga', 'Máquina herramienta ligera (ajuste, montaje)', 'Máquina herramienta media (carga)',
          'Máquina herramienta pesada', 'Herramienta manual ligera', 'Herramienta manual media (pulido)', 'Herramienta manual pesada (taladrado)',
          'Empujar o tirar de carros', 'Palear, cavar', 'Conducir vehículo o autoelevador'] }), c('sitio', 'Sitio', 'select', { op: ['Interior', 'Exterior'] }),
        c('tbs', 'TBS', 'num', { u: '°C' }), c('tbh', 'TBH', 'num', { u: '°C' }), c('tg', 'TG', 'num', { u: '°C' }), c('hr', 'HR', 'num', { u: '%' }),
        c('tgbh_in', 'TGBH interior (equipo)', 'num', { u: '°C', c: 'TGBH IN' }), c('tgbh_ex', 'TGBH exterior (equipo)', 'num', { u: '°C', c: 'TGBH EX' })] }],
      extras: [c('jornada', 'Jornada laboral', 'combo', { op: JORNADA })] },
    { id: 'CC UVB', metodos: ['Res. MTESS 295/03 – lectura directa con radiómetro UV'], titulo: 'Radiación UV', fuente: 'directa', informe: 'uv', grupo: 'Ambiente laboral',
      nota: 'El radiómetro muestra la lectura en µW/cm²: se anota acá con los tiempos.',
      tablas: [{ id: 'filas', titulo: 'Lecturas', item: 'Lectura', campos: [
        c('sitio', 'Sitio de medición (posición del cuerpo)', 'combo', { c: 'Sitio', op: ['Frente Izq.', 'Frente Der.', 'Pecho Izq.', 'Pecho Der.', 'Abdomen Izq.',
          'Abdomen Der.', 'Cadera Izq.', 'Cadera Der.', 'Mano Izq.', 'Mano Der.', 'Antebrazo Izq.', 'Antebrazo Der.', 'Cuello', 'Ojos (a la altura de la careta)'] }),
        c('lectura', 'Lectura', 'num', { u: 'µW/cm²' }),
        c('t_medicion', 'Tiempo de medición', 'num', { u: 'min', c: 'T. med.' }), c('t_exposicion', 'Tiempo de exposición', 'num', { u: 'h', c: 'T. exp.' })] }],
      extras: [c('jornada', 'Tiempo de jornada laboral', 'num', { u: 'h' }),
        c('tarea', 'Tarea evaluada', 'combo', { op: ['Soldadura eléctrica (electrodo revestido)', 'Soldadura MIG/MAG', 'Soldadura TIG', 'Oxicorte', 'Corte por plasma',
          'Trabajo a la intemperie (radiación solar)', 'Lámparas germicidas / curado UV'] }), c('sector', 'Sector')] },
    { id: 'CC Puesta a tierra', metodos: ['IRAM 2281 – caída de potencial (regla del 62 %)', 'Medición con pinza de tierra'], titulo: 'Puesta a tierra', fuente: 'directa', informe: 'pat', grupo: 'Ambiente laboral',
      nota: 'El telurímetro muestra el valor: se anota acá por toma.',
      tablas: [{ id: 'filas', titulo: 'Tomas de tierra', item: 'Toma', campos: [
        c('n', 'N° de toma'), c('sector', 'Sector'), c('inicio', 'Hora de inicio', 'time'), c('fin', 'Hora final', 'time'),
        c('valor', 'PAT medida', 'num', { u: 'Ω', c: 'PAT (Ω)' }), c('continuidad', 'Continuidad de las masas', 'sn', { c: 'Contin.' }),
        c('terreno', 'Condición del terreno', 'select', { op: ['Lecho seco', 'Arcilloso', 'Pantanoso', 'Lluvias recientes', 'Arenoso seco o húmedo', 'Otro'] }),
        c('esquema', 'Esquema de conexión', 'select', { op: ['TT', 'TN-S', 'TN-C', 'TN-C-S', 'IT'] }),
        c('proteccion', 'Protección', 'select', { op: ['DD', 'IA', 'FUS'], c: 'Prot.' }), c('desconexion', 'Desconexión automática actúa', 'sn', { c: 'Descon.' }),
        c('obs', 'Observaciones')] }] },
    { id: 'CC VENTILACION', metodos: ['Anemometría en aberturas', 'Dec. 351/79 Anexo VI – renovaciones de aire'], titulo: 'Ventilación', fuente: 'directa', grupo: 'Ambiente laboral',
      nota: 'El anemómetro muestra el valor: se anota acá.',
      tablas: [{ id: 'filas', titulo: 'Puntos', item: 'Punto', campos: [
        c('id', 'ID muestra'), c('inicio', 'Hora de inicio', 'time'), c('fin', 'Hora final', 'time'), c('duracion', 'Duración', 'num', { u: 'min' }),
        c('tipo', 'Tipo de ventilación', 'select', { op: ['Forzada', 'Natural'] }), c('egreso', 'Egreso', 'num', { u: 'm/s' }), c('ingreso', 'Ingreso', 'num', { u: 'm/s' }),
        c('ab_tipo', 'Abertura: tipo', 'combo', { op: ['Puerta', 'Portón', 'Ventana', 'Extractor', 'Inyector', 'Rejilla', 'Campana'] }), c('ab_ancho', 'Abertura: ancho', 'num', { u: 'm' }), c('ab_alto', 'Abertura: alto', 'num', { u: 'm' }),
        c('volumen', 'Volumen del lugar', 'num', { u: 'm³' }), c('trabajadores', 'Cantidad de trabajadores', 'num', { c: 'Trab.' }), c('obs', 'Observaciones')] }],
      extras: ATM.concat([c('viento', 'Velocidad del viento', 'num', { u: 'm/s' }), c('dir_viento', 'Dirección del viento', 'select', { op: VIENTO_DIR })], GPS) },
    { id: 'CC Contaminantes Quimicos', metodos: ['NIOSH 0600 (polvo respirable)', 'NIOSH 0500 (polvo total)', 'NIOSH 7500 (sílice)', 'NIOSH 7300 (metales)', 'NIOSH 1500/1501 (hidrocarburos)', 'Lectura directa con sensores'], titulo: 'Contaminantes químicos', fuente: 'laboratorio', informe: 'quimicos', grupo: 'Ambiente laboral',
      nota: 'Con bomba: la muestra va al laboratorio y acá queda caudal, tiempo y rótulo. Lectura directa (CO, CO2, O2, SO2, NO2): el valor se anota acá.',
      tablas: [{ id: 'filas', titulo: 'Mediciones', item: 'Muestra', campos: [
        c('muestra', 'Muestra N° / rótulo'), c('fecha', 'Fecha', 'date'), c('sector', 'Sección / sector'), c('puesto', 'Puesto de trabajo'),
        c('tarea', 'Tarea realizada'), c('t_exp', 'Tiempo de exposición', 'num', { u: 'min', c: 'Exp.' }),
        c('frecuencia', 'Frecuencia de exposición', 'select', { c: 'Frec.', op: ['Diaria', 'Semanal', 'Quincenal', 'Mensual', 'Ocasional'] }),
        c('temp', 'T° del sector', 'num', { u: '°C', c: 'T°' }), c('presion', 'Presión del sector', 'num', { u: 'hPa', c: 'P' }),
        c('habitual', 'Condiciones habituales de trabajo', 'sn', { c: 'Habit.' }),
        c('contaminante', 'Contaminante', 'combo', { op: ['PM10', 'Polvo total', 'Cuarzo', 'Cristobalita', 'Plomo', 'Hierro', 'Manganeso', 'Humos de soldadura',
          'Nieblas de aceite', 'Benceno', 'Tolueno', 'Xileno', 'Etilbenceno', 'TPH', 'CO', 'CO2', 'O2', 'SO2', 'NO2', 'H2S', 'NH3'] }),
        c('equipo', 'Dispositivo (toma de muestra o lectura directa)', 'combo', { c: 'Dispositivo', op: ['Bomba Criffer Accura', 'Bomba SKC', 'BOSEAN 4 en 1',
          'BOSEAN SO2', 'BOSEAN NO2', 'BOSEAN NH3', 'TESTO 535 (CO2)', 'Multigas'] }),
        c('directa', 'Lectura directa', 'sn', { c: 'Directa' }),
        c('caudal', 'Caudal', 'num', { u: 'l/min' }), c('tiempo', 'Tiempo de muestreo', 'num', { u: 'min' }),
        c('valor', 'Valor leído (lectura directa)', 'text', { c: 'Valor' }), c('unidad', 'Unidad', 'select', { op: ['ppm', 'mg/m³', '%', 'µg/m³', 'fibras/cm³'] }), c('obs', 'Observaciones')] }] },
    { id: 'CC AIRE', metodos: ['EPA IO-2.3 (PM10, bajo volumen)', 'EPA IO-2.1 (PM10, alto volumen)'], titulo: 'Calidad de aire', fuente: 'laboratorio', informe: 'aire', grupo: 'Ambiental', control: true,
      nota: 'El filtro se pesa en laboratorio. Acá va el muestreo de cada sitio y, cuando estén, los pesos.',
      tablas: [{ id: 'filas', titulo: 'Sitios', item: 'Sitio', campos: [
        c('sitio', 'ID sitio'), c('filtro', 'ID filtro'), c('f_ini', 'Fecha de inicio', 'date'), c('h_ini', 'Hora de inicio', 'time'),
        c('horas', 'Tiempo total de muestreo', 'num', { u: 'h' }), c('caudal', 'Caudal de muestreo', 'num', { u: 'l/min' }),
        c('temp', 'Temperatura', 'num', { u: '°C' }), c('presion', 'Presión atmosférica', 'num', { u: 'hPa' }),
        c('dir_viento', 'Dirección del viento', 'select', { c: 'Dir. viento', op: VIENTO_DIR }), c('vel_viento', 'Velocidad del viento', 'num', { u: 'm/s', c: 'Vel. viento' }),
        c('humedad', 'Humedad', 'num', { u: '%' }), c('lat', 'Latitud'), c('lon', 'Longitud'),
        c('p_ini', 'Peso inicial', 'num', { u: 'g' }), c('f_p_ini', 'Fecha de pesada inicial', 'date', { c: 'F. pesada ini' }),
        c('p_fin', 'Peso final', 'num', { u: 'g' }), c('f_p_fin', 'Fecha de pesada final', 'date', { c: 'F. pesada fin' })] }] },
    { id: 'CC Agua', metodos: ['Standard Methods 1060 – toma y conservación de muestras', 'ISO 5667'], titulo: 'Agua', fuente: 'laboratorio', informe: 'agua', grupo: 'Ambiental', control: true,
      nota: 'La muestra va al laboratorio. Acá van envases, preservantes y los datos de campo.',
      tablas: [{ id: 'filas', titulo: 'Muestras', item: 'Muestra', campos: LIQ }] },
    { id: 'CC Efluentes', metodos: ['Standard Methods 1060 – toma y conservación de muestras', 'ISO 5667-10'], titulo: 'Efluentes', fuente: 'laboratorio', informe: 'efluentes', grupo: 'Ambiental',
      nota: 'La muestra va al laboratorio. Acá van envases, preservantes y los datos de campo.',
      tablas: [{ id: 'filas', titulo: 'Muestras', item: 'Muestra', campos: LIQ }] },
    { id: 'CC LODO suelo', metodos: ['EPA SW-846 – toma de muestras de sólidos', 'ISO 18400'], titulo: 'Lodo / suelo', fuente: 'laboratorio', informe: 'lodos', grupo: 'Ambiental',
      nota: 'La muestra va al laboratorio. Acá van el punto, la profundidad y los datos de campo.',
      tablas: [{ id: 'filas', titulo: 'Muestras', item: 'Muestra', campos: [
        c('nombre', 'Nombre de muestra'), c('fecha', 'Fecha de muestreo', 'date'), c('hora', 'Hora de muestreo', 'time'), c('lat', 'Latitud'), c('lon', 'Longitud'),
        c('tipo', 'Tipo de muestra', 'select', { op: ['Simple', 'Compuesta'] }), c('suelo', 'Tipo', 'select', { op: ['Suelo', 'Sedimento', 'Lodo'] }),
        c('temp', 'Temperatura', 'num', { u: '°C' }), c('ph', 'pH', 'num', { u: 'UpH' }), c('profundidad', 'Profundidad', 'num', { u: 'cm', c: 'Prof.' }), c('obs', 'Observaciones')] }] },
    { id: 'CC Emisiones Gaseosas', metodos: ['EPA Métodos 1 a 4 (chimenea)', 'EPA Método 5 (material particulado)', 'Celdas electroquímicas (gases de combustión)'], titulo: 'Emisiones gaseosas', fuente: 'laboratorio', informe: 'gases', grupo: 'Ambiental',
      nota: 'Los gases de combustión son lectura directa del analizador. Material particulado y soluciones absorbentes van al laboratorio.',
      extras: [c('altura', 'Altura de chimenea', 'num', { u: 'm' }), c('diametro', 'Diámetro de chimenea', 'num', { u: 'm' })].concat(GPS, ATM,
        [c('vel_viento', 'Velocidad del viento', 'num', { u: 'm/s' }), c('dir_viento', 'Dirección del viento', 'select', { op: VIENTO_DIR })]),
      tablas: [
        { id: 'gases', titulo: 'Gases de combustión (celdas electroquímicas)', item: 'Lectura', campos: [
          c('punto', 'Chimenea / punto'), c('t_humos', 'Temperatura de humos', 'num', { u: '°C', c: 'T humos' }), c('co2', 'CO2', 'num', { u: '%' }), c('o2', 'O2', 'num', { u: '%' }),
          c('co', 'CO', 'num', { u: 'mg/Nm³' }), c('nox', 'NOx', 'num', { u: 'mg/Nm³' }), c('no', 'NO', 'num', { u: 'mg/Nm³' }), c('no2', 'NO2', 'num', { u: 'mg/Nm³' }),
          c('so2', 'SO2', 'num', { u: 'mg/Nm³' }), c('sh2', 'SH2', 'num', { u: 'mg/Nm³' }), c('velocidad', 'Velocidad de los gases', 'num', { u: 'm/s', c: 'Vel.' }),
          c('combustible', 'Combustible utilizado', 'combo', { c: 'Combust.', op: ['Gas natural', 'GLP', 'Gasoil', 'Fuel oil', 'Leña', 'Biomasa', 'Residuos (incineración)'] })] },
        { id: 'otras', titulo: 'Otras mediciones', item: 'Muestra', campos: [
          c('rotulo', 'N° de rótulo'), c('tipo', 'Tipo de medición', 'combo', { op: ['Material particulado', 'HCl', 'HF', 'NH3', 'VOC', 'Metales', 'Dioxinas y furanos', 'SO2', 'NOx'] }), c('vol', 'Volumen de solución', 'num', { u: 'ml' }),
          c('h_ini', 'Hora de inicio', 'time'), c('tiempo', 'Tiempo total de muestreo', 'num', { u: 'min' }), c('caudal', 'Caudal de muestreo', 'num', { u: 'ml/min' }),
          c('sol_prep', 'Solución absorbente: preparación', 'date', { c: 'Sol. prep.' }), c('sol_venc', 'Solución absorbente: vencimiento', 'date', { c: 'Sol. venc.' }),
          c('conservacion', 'Conservación', 'select', { op: ['Refrigerada (4 °C)', 'Temperatura ambiente', 'Al resguardo de la luz', 'Refrigerada y al resguardo de la luz'] })] },
        { id: 'gravimetria', titulo: 'Gravimetría de membranas filtrantes', item: 'Filtro', campos: [
          c('rotulo', 'N° de rótulo'), c('codigo', 'Código de filtro'), c('tipo', 'Tipo de filtro', 'combo', { op: ['Fibra de vidrio', 'Fibra de cuarzo', 'PVC', 'PTFE (teflón)', 'Ésteres de celulosa'] }),
          c('diametro', 'Diámetro de filtro', 'select', { op: ['25 mm', '37 mm', '47 mm', '90 mm'] }),
          c('p_ini', 'Peso inicial', 'num', { u: 'g' }), c('p_fin', 'Peso final', 'num', { u: 'g' })] }] },
    { id: 'CC Ergonomia', metodos: ['Res. SRT 886/15 – método REBA'], titulo: 'Ergonomía', fuente: 'directa', informe: 'ergonomia', grupo: 'Ambiente laboral',
      nota: 'La evaluación se hace en la app GH Ergonomía. Esta cadena deja constancia de los puestos relevados y la firma del cliente.',
      tablas: [{ id: 'filas', titulo: 'Puestos relevados', item: 'Puesto', campos: [
        c('area', 'Área y sector de estudio'), c('puesto', 'Puesto de trabajo'), c('n', 'N° de trabajadores', 'num', { c: 'N° trab.' }), c('nombre', 'Nombre del trabajador'),
        c('planillas', 'Planillas', 'chips', { op: ['Matriz IFR', '2-a', '2-b', '2-c', '2-d', '2-e', '2-f', '2-g', '2-h', '2-i', 'Matriz IMP', 'Seguimiento'] }),
        c('obs', 'Observaciones')] }] },
  ];
  const FUENTES = { equipo: 'Informe del software del equipo', directa: 'Lectura directa del equipo', laboratorio: 'Resultado del laboratorio' };
  const ROTULO = [c('empresa', 'Nombre de empresa'), c('cuit', 'CUIT'), c('ubicacion', 'Ubicación'), c('sitio', 'Sitio / planta'),
    c('presupuesto', 'Presupuesto'), c('fecha', 'Fecha de muestreo', 'date'), c('fecha_fin', 'Fecha de finalización', 'date'),
    c('equipo', 'Equipo utilizado'), c('metodologia', 'Metodología')];
  const ROTULO_ATM = [c('t', 'T (°C)', 'num'), c('hr', 'HR %', 'num'), c('p', 'P (hPa)', 'num')];
  const ROTULO_CONTROL = [c('control', 'Control / personal interno')];
  // Mismas palabras clave que usa Seguimiento de Mediciones (CC_PALABRAS_CLAVE) para unir cada CC con su medición.
  const CLAVES = {
    'CC Agua': ['agua'], 'CC AIRE': ['aire', 'pm10', 'pm 10', 'particulado', 'calidad de aire'],
    'CC Contaminantes Quimicos': ['contaminante', 'quimic', 'silice', 'gases', 'vapores'], 'CC Efluentes': ['efluente'],
    'CC Emisiones Gaseosas': ['emision', 'chimenea'], 'CC Ergonomia': ['ergonom'],
    'CC Estrés Térmica': ['estres termic', 'termic', 'tgbh', 'calor'], 'CC Iluminación': ['iluminac'],
    'CC LODO suelo': ['lodo', 'suelo', 'barro'], 'CC Puesta a tierra': ['puesta a tierra', 'pat', 'tierra'],
    'CC RUIDO': ['ruido', 'dosimetr', 'sonor'], 'CC RUIDO AMBIENTAL': ['ruido ambiental', 'ruidos molestos', 'vecindario'],
    'CC UVB': ['uvb', 'ultravioleta', 'uv'], 'CC VENTILACION': ['ventilac', 'caudal'], 'CC VIBRACIONES': ['vibracion'],
    'CC VIBRACIONES AMBIENTAL': ['vibracion ambiental'],
  };
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const POR_ID = {}; LISTA.forEach((d) => { POR_ID[norm(d.id)] = d; });
  window.Cadenas = {
    LISTA, FUENTES, norm,
    def: (id) => POR_ID[norm(id)] || null,
    /* De las mediciones del servicio, cuál corresponde a esta cadena (el texto tal cual está en Seguimiento). */
    tipoMedicion(id, tipos) {
      const claves = CLAVES[(POR_ID[norm(id)] || {}).id] || [];
      const tiene = (t, k) => (k.length <= 3 ? new RegExp('(^|[^a-z0-9])' + k + '([^a-z0-9]|$)').test(t) : t.includes(k));
      const lista = (tipos || []).filter(Boolean);
      return lista.find((t) => claves.some((k) => tiene(norm(t), k))) || (lista.length === 1 ? lista[0] : '');
    },
    rotulo: (d) => ROTULO.map((x) => (x.id === 'metodologia' && d.metodos ? Object.assign({}, x, { tipo: 'combo', op: d.metodos }) : x))
      .concat(d.control ? ROTULO_CONTROL : ROTULO_ATM),
    todosLosCampos: (d) => (d.tablas || []).reduce((a, t) => a.concat(t.campos), []).concat(d.extras || []),
  };
})();
