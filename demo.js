/* GH Cadenas — datos de ejemplo para el modo de prueba (sin servidor). No son datos de clientes. */
window.DEMO_DATOS = {
  usuario: { email: 'tecnico@ejemplo.com', nombre: 'Felipe Manrique' },
  equipo: [{ email: 'tecnico@ejemplo.com', nombre: 'Felipe Manrique' }, { email: 'tecnico2@ejemplo.com', nombre: 'Elvio Palumbo' }],
  equiposCal: [
    { nombre: 'Decibelímetro Criffer Octava', numero_serie: '18042821', que_mide: 'Nivel de presión sonora', fecha_venc: '2027-07-03' },
    { nombre: 'Monitor de estrés térmico QUESTemp 34', numero_serie: 'TKG050012', que_mide: 'Carga térmica (TGBH)', fecha_venc: '2027-02-10' },
    { nombre: 'Luxómetro CEM DT-8809A', numero_serie: '190614725', que_mide: 'Nivel de iluminancia (lux)', fecha_venc: '2026-08-01' },
    { nombre: 'Radiómetro UV340B', numero_serie: 'UV-2231', que_mide: 'Radiación ultravioleta', fecha_venc: '2027-03-15' }],
  servicios: [
    { empresa: 'METALÚRGICA DEL OESTE S.A. (ejemplo)', presupuestoGH: '0911-00501', ordenCompra: '', fechaMuestreo: null,
      mediciones: [{ tipoMuestra: 'Ruido, iluminación y estrés térmico' }], ccSugeridas: ['CC RUIDO', 'CC Iluminación', 'CC Estrés Térmica'],
      checklist: { ccUrl: 'CC RUIDO | https://example.invalid/cc-ruido\nCC Iluminación | https://example.invalid/cc-ilum', fechaCoordinada: '2026-11-20',
        tecnicoAsignado: 'Felipe Manrique', ccLista: true, medicionRealizada: false, ccCompletadas: '' } },
    { empresa: 'BODEGA LOS ÁLAMOS S.R.L. (ejemplo)', presupuestoGH: '1011-00507', ordenCompra: 'OC 4471', fechaMuestreo: null,
      mediciones: [{ tipoMuestra: 'Efluentes' }, { tipoMuestra: 'Contaminantes químicos' }], ccSugeridas: ['CC Efluentes', 'CC Contaminantes Quimicos'],
      checklist: { ccUrl: '', fechaCoordinada: '2026-11-27', tecnicoAsignado: 'Elvio Palumbo', ccLista: false, medicionRealizada: false, ccCompletadas: '' } },
    { empresa: 'TRANSPORTES SAN JUAN S.A. (ejemplo)', presupuestoGH: '0210-00480', ordenCompra: '', fechaMuestreo: '2026-10-08',
      mediciones: [{ tipoMuestra: 'Vibraciones' }], ccSugeridas: ['CC VIBRACIONES'],
      checklist: { ccUrl: 'CC VIBRACIONES | https://example.invalid/cc-vib', fechaCoordinada: '2026-10-08', tecnicoAsignado: 'Felipe Manrique', ccLista: true,
        medicionRealizada: true, ccCompletadas: 'CC VIBRACIONES | https://example.invalid/hecha', envioFinal: true } }],
  cadenas: [],
  empresas: [
    { nombre: 'METALÚRGICA DEL OESTE S.A. (ejemplo)', cuit: '30-11111111-1', ubicacion: 'Ruta 40 km 12', localidad: 'Pocito', cp: '5427', provincia: 'San Juan', sitio: 'Planta 1' },
    { nombre: 'BODEGA LOS ÁLAMOS S.R.L. (ejemplo)', cuit: '30-22222222-2', ubicacion: 'Calle 9 y Mendoza', localidad: 'Caucete', cp: '5442', provincia: 'San Juan', sitio: '' }],
};
