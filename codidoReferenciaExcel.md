const CFG = {
  TZ: 'America/Guayaquil',

  HOJAS: {
    INICIO: 'INICIO',
    MOV: 'MOVIMIENTOS',
    CAT: 'CATEGORIAS',
    DASH: 'DASHBOARD',
    HIST: 'HISTORIAL',
    DATOS: '_DATOS'
  },

  // Hojas de la versión original (datos que aún no migras)
  LEGADO_DATOS: ['Gastos', 'Ingresos', 'Resumen', 'Categorías'],
  // Hojas de V4 que ahora son redundantes (calculadas)
  LEGADO_V4: ['HISTORIAL_PERIODOS', '_DATOS_GRAFICOS'],

  TIPOS: ['Ingreso', 'Gasto'],
  METODOS: ['Efectivo', 'Transferencia', 'Tarjeta de débito', 'Tarjeta de crédito', 'Otro'],

  // Categoría de respaldo al eliminar una categoría en uso
  FALLBACK: { Ingreso: 'Otros ingresos', Gasto: 'Otros gastos' },

  CATEGORIAS_BASE: [
    ['Sueldo', 'Ingreso', 0],
    ['Ventas', 'Ingreso', 0],
    ['Otros ingresos', 'Ingreso', 0],
    ['Vivienda', 'Gasto', 300],
    ['Alimentación', 'Gasto', 250],
    ['Transporte', 'Gasto', 120],
    ['Servicios', 'Gasto', 100],
    ['Telefonía', 'Gasto', 50],
    ['Salud', 'Gasto', 80],
    ['Educación', 'Gasto', 100],
    ['Cuidado Personal', 'Gasto', 60],
    ['Antojos', 'Gasto', 50],
    ['Entretenimiento', 'Gasto', 60],
    ['Ahorro Laptop', 'Gasto', 100],
    ['Otros gastos', 'Gasto', 50]
  ],

  MOV_HEADERS: ['ID', 'Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto', 'Método', 'Observación', 'Última modificación'],
  COL: { ID: 1, FECHA: 2, TIPO: 3, CAT: 4, DESC: 5, MONTO: 6, METODO: 7, OBS: 8, MOD: 9 },
  NCOL: 9,

  // Formulario INICIO: columna B, filas 5-12
  FORM: { ID: 5, FECHA: 6, TIPO: 7, CAT: 8, DESC: 9, MONTO: 10, METODO: 11, OBS: 12 },
  // Botones INICIO: checkbox en columna G
  BTN: { GUARDAR: 5, ELIMINAR: 6, LIMPIAR: 7, RECALCULAR: 8, DASHBOARD: 9 },

  UMBRAL: { BIEN: 0.7, ALERTA: 0.9 },
  MAX_AUTO: 5000,

  FMT: { MONEDA: '$#,##0.00', PCT: '0.0%', FECHA: 'dd/MM/yyyy', FECHA_HORA: 'dd/MM/yyyy HH:mm' },

  C: {
    AZUL: '#1F4E78', AZUL_CLARO: '#D9EAF7',
    VERDE: '#16A34A', VERDE_CLARO: '#DCFCE7',
    ROJO: '#DC2626', ROJO_CLARO: '#FEE2E2',
    AMARILLO: '#D97706', AMARILLO_CLARO: '#FEF3C7',
    NARANJA_CLARO: '#FED7AA',
    MORADO: '#7C3AED',
    GRIS: '#F3F4F6', GRIS2: '#E5E7EB', GRIS_TEXTO: '#6B7280',
    TEXTO: '#1F2937', BLANCO: '#FFFFFF'
  }
};

const H = CFG.HOJAS;


/* ============================================================
 * MENÚ
 * ============================================================ */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('💰 Mis Finanzas')
    .addItem('🚀 Instalar / reparar sistema', 'instalarSistema')
    .addSeparator()
    .addItem('➕ Nuevo movimiento', 'irNuevoMovimiento')
    .addItem('✏️ Editar movimiento seleccionado', 'editarSeleccionado')
    .addItem('🗑️ Eliminar movimientos seleccionados', 'eliminarSeleccionados')
    .addItem('🏷️ Eliminar categoría seleccionada', 'eliminarCategoriaSeleccionada')
    .addItem('🔄 Recalcular todo', 'recalcular')
    .addSeparator()
    .addSubMenu(ui.createMenu('📦 Hojas antiguas')
      .addItem('📥 Importar Gastos / Ingresos / Categorías', 'importarHojasAntiguas')
      .addItem('🗂️ Eliminar hojas antiguas', 'eliminarHojasAntiguas'))
    .addSeparator()
    .addItem('🧹 Borrar todos los movimientos', 'borrarMovimientos')
    .addItem('⚠️ Reset de fábrica', 'resetFabrica')
    .addToUi();
}


/* ============================================================
 * INSTALACIÓN (idempotente: no borra MOVIMIENTOS ni CATEGORIAS)
 * ============================================================ */

function instalarSistema() {
  const ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetLocale('es_EC');
  ss.setSpreadsheetTimeZone(CFG.TZ);

  construirCategorias_(hoja_(H.CAT));
  construirMovimientos_(hoja_(H.MOV));
  construirInicio_(hoja_(H.INICIO));
  construirDashboard_(hoja_(H.DASH));
  construirHistorial_(hoja_(H.HIST));
  limpiarHoja_(hoja_(H.DATOS));

  eliminarHojas_(CFG.LEGADO_V4);
  aplicarValidaciones_();
  instalarTriggers_();
  ordenarPestanas_();
  protegerCalculadas_();
  recalcular_();

  hoja_(H.DATOS).hideSheet();
  ss.setActiveSheet(hoja_(H.INICIO));
  aviso_('✅ Sistema V5 instalado');
}

function instalarTriggers_() {
  const ss = SpreadsheetApp.getActive();
  const handlers = ['alCambiarEstructura', 'recalcularProgramado'];

  ScriptApp.getProjectTriggers()
    .filter(t => handlers.includes(t.getHandlerFunction()))
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('alCambiarEstructura').forSpreadsheet(ss).onChange().create();
  ScriptApp.newTrigger('recalcularProgramado').timeBased().everyDays(1).atHour(0).inTimezone(CFG.TZ).create();
}

function ordenarPestanas_() {
  const ss = SpreadsheetApp.getActive();
  [H.INICIO, H.MOV, H.CAT, H.DASH, H.HIST].forEach((n, i) => {
    const sh = ss.getSheetByName(n);
    if (!sh) return;
    ss.setActiveSheet(sh);
    ss.moveActiveSheet(i + 1);
  });
}

/** Protección "solo advertencia" en hojas calculadas: evita ediciones accidentales. */
function protegerCalculadas_() {
  const ss = SpreadsheetApp.getActive();
  const TAG = 'MisFinanzas:auto';

  ss.getProtections(SpreadsheetApp.ProtectionType.SHEET)
    .filter(p => p.getDescription() === TAG)
    .forEach(p => p.remove());

  [H.DASH, H.HIST, H.DATOS].forEach(n =>
    hoja_(n).protect().setDescription(TAG).setWarningOnly(true));
}


/* ============================================================
 * CONSTRUCCIÓN DE HOJAS
 * ============================================================ */

function construirCategorias_(sh) {
  const c = CFG.C;

  sh.setTabColor('#F59E0B');
  sh.getRange('A1:D1')
    .setValues([['Categoría', 'Tipo', 'Presupuesto mensual', 'Nº movimientos (auto)']])
    .setBackground(c.AZUL).setFontColor(c.BLANCO).setFontWeight('bold').setHorizontalAlignment('center');

  if (leerCategorias_().length === 0) {
    sh.getRange(2, 1, CFG.CATEGORIAS_BASE.length, 3).setValues(CFG.CATEGORIAS_BASE);
  }
  Object.keys(CFG.FALLBACK).forEach(tipo => asegurarCategoria_(CFG.FALLBACK[tipo], tipo, 0));

  sh.setFrozenRows(1);
  [220, 120, 170, 170].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.getRange('C2:C').setNumberFormat(CFG.FMT.MONEDA);
  sh.getRange('D2:D').setFontColor(c.GRIS_TEXTO).setHorizontalAlignment('center');
  sh.getRange('A1').setNote('Renombrar aquí actualiza todos los movimientos.\nPara eliminar: selecciona la fila → menú 💰 → Eliminar categoría seleccionada.');
  sh.getRange('D1').setNote('Calculado. No editar.');

  sh.getBandings().forEach(b => b.remove());
  sh.getRange(2, 1, Math.max(sh.getMaxRows() - 1, 1), 4)
    .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);
}

function construirMovimientos_(sh) {
  const c = CFG.C, F = CFG.FMT;

  sh.setTabColor(c.ROJO);
  sh.getRange(1, 1, 1, CFG.NCOL).setValues([CFG.MOV_HEADERS])
    .setBackground(c.AZUL).setFontColor(c.BLANCO).setFontWeight('bold').setHorizontalAlignment('center');
  sh.setFrozenRows(1);

  [180, 110, 100, 190, 260, 120, 150, 240, 160].forEach((w, i) => sh.setColumnWidth(i + 1, w));

  sh.getRange('B2:B').setNumberFormat(F.FECHA);
  sh.getRange('F2:F').setNumberFormat(F.MONEDA);
  sh.getRange('I2:I').setNumberFormat(F.FECHA_HORA).setFontColor(c.GRIS_TEXTO);
  sh.getRange('A2:A').setFontColor(c.GRIS_TEXTO);
  sh.getRange('A1').setNote('Automático. Se genera al crear el movimiento. No lo edites.');
  sh.getRange('I1').setNote('Automático.');

  sh.getBandings().forEach(b => b.remove());
  sh.getRange(2, 1, Math.max(sh.getMaxRows() - 1, 1), CFG.NCOL)
    .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);

  const colTipo = sh.getRange('C2:C');
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Ingreso')
      .setBackground(c.VERDE_CLARO).setFontColor('#166534').setRanges([colTipo]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Gasto')
      .setBackground(c.ROJO_CLARO).setFontColor('#991B1B').setRanges([colTipo]).build()
  ]);

  // Filtro nativo = "Read" del CRUD (buscar, ordenar, filtrar)
  if (!sh.getFilter()) sh.getRange(1, 1, sh.getMaxRows(), CFG.NCOL).createFilter();
}

function construirInicio_(sh) {
  const c = CFG.C;

  limpiarHoja_(sh);
  sh.setHiddenGridlines(true).setTabColor(c.AZUL);

  sh.getRange('A1:H1').merge().setValue('💰  MIS FINANZAS PERSONALES')
    .setBackground(c.AZUL).setFontColor(c.BLANCO).setFontWeight('bold').setFontSize(18).setVerticalAlignment('middle');
  sh.setRowHeight(1, 42);

  sh.getRange('A2:H2').merge()
    .setValue('Crea, edita y elimina movimientos desde aquí. DASHBOARD e HISTORIAL se recalculan solos.')
    .setBackground('#EFF6FF').setFontColor(c.TEXTO).setFontSize(10);

  // --- Formulario
  sh.getRange('A4:D4').merge().setFontColor(c.BLANCO).setFontWeight('bold').setFontSize(12);

  const etiquetas = ['ID (vacío = nuevo)', 'Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto', 'Método de pago', 'Observación'];
  sh.getRange(5, 1, etiquetas.length, 1).setValues(etiquetas.map(x => [x])).setFontWeight('bold').setBackground(c.GRIS);

  for (let r = CFG.FORM.ID; r <= CFG.FORM.OBS; r++) sh.getRange(r, 2, 1, 3).merge();
  sh.getRange('B5:D12').setBackground(c.BLANCO)
    .setBorder(true, true, true, true, true, true, c.GRIS2, SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange('B5').setBackground(c.GRIS).setFontColor(c.GRIS_TEXTO)
    .setNote('Escribe o pega un ID para cargar ese movimiento y editarlo.\nVacío = nuevo movimiento.');
  sh.getRange('B6').setNumberFormat(CFG.FMT.FECHA);
  sh.getRange('B10').setNumberFormat(CFG.FMT.MONEDA);

  // --- Acciones
  sh.getRange('F4:G4').merge().setValue('⚙️ ACCIONES')
    .setBackground(c.AZUL).setFontColor(c.BLANCO).setFontWeight('bold');

  sh.getRange(5, 6, 5, 1).setValues([
    ['💾 Guardar (crear / actualizar)'],
    ['🗑️ Eliminar (marcar 2 veces)'],
    ['🧹 Limpiar / nuevo'],
    ['🔄 Recalcular todo'],
    ['📈 Ir al Dashboard']
  ]).setFontWeight('bold').setBackground(c.AZUL_CLARO);

  sh.getRange('G5:G9').insertCheckboxes().setHorizontalAlignment('center').setBackground(c.AMARILLO_CLARO);
  sh.getRange('F6:G6').setBackground(c.ROJO_CLARO);

  sh.getRange('F11:H11').merge()
    .setValue('Reset y borrado masivo: menú 💰 Mis Finanzas')
    .setFontColor(c.GRIS_TEXTO).setFontStyle('italic');

  // --- Estado
  sh.getRange('A14:H14').setBackground(c.GRIS);
  sh.getRange('A14').setValue('Estado:').setFontWeight('bold');
  sh.getRange('B14:D14').merge();
  sh.getRange('E14').setValue('Actualizado:').setFontWeight('bold');
  sh.getRange('F14:H14').merge();

  // --- Ayuda
  sh.getRange('A16:H16').merge().setValue('📌 CÓMO SE USA')
    .setBackground(c.AZUL).setFontColor(c.BLANCO).setFontWeight('bold');

  const ayuda = [
    'CREAR: deja el ID vacío, llena los campos y marca Guardar.',
    'EDITAR: escribe/pega un ID en el campo ID (o en MOVIMIENTOS selecciona la fila → menú Editar). Cambia y marca Guardar.',
    'ELIMINAR: con un movimiento cargado marca Eliminar dos veces, o en MOVIMIENTOS selecciona filas → menú Eliminar.',
    'MOVIMIENTOS también se edita directo: el ID y la fecha de modificación se generan solos.',
    'CATEGORIAS: renombrar actualiza los movimientos; el presupuesto se refleja en DASHBOARD; para borrar usa el menú.',
    'DASHBOARD e HISTORIAL son calculados: no se editan a mano.',
    'RESET: menú 💰 → Borrar todos los movimientos (conserva categorías) o Reset de fábrica (todo).'
  ];
  ayuda.forEach((txt, i) => {
    const r = 17 + i;
    sh.getRange(r, 1).setValue(i + 1).setFontWeight('bold').setHorizontalAlignment('center');
    sh.getRange(r, 2, 1, 7).merge().setValue(txt).setWrap(true);
  });

  [160, 170, 170, 170, 100, 230, 70, 120].forEach((w, i) => sh.setColumnWidth(i + 1, w));

  aplicarValidacionesFormulario_();
  limpiarFormulario_();
}

function construirDashboard_(sh) {
  const c = CFG.C, F = CFG.FMT;

  limpiarHoja_(sh);
  sh.setHiddenGridlines(true).setTabColor(c.VERDE);
  for (let i = 1; i <= 8; i++) sh.setColumnWidth(i, 145);

  sh.getRange('A1:H1').merge().setValue('📊  DASHBOARD FINANCIERO')
    .setBackground(c.AZUL).setFontColor(c.BLANCO).setFontWeight('bold').setFontSize(18).setVerticalAlignment('middle');
  sh.setRowHeight(1, 42);
  sh.getRange('A2:H2').merge().setFontColor(c.GRIS_TEXTO).setFontSize(10);

  tarjeta_(sh, 'A3:B3', 'A4:B5', '💵 INGRESOS DEL MES', c.VERDE_CLARO, F.MONEDA);
  tarjeta_(sh, 'C3:D3', 'C4:D5', '💸 GASTOS DEL MES', c.ROJO_CLARO, F.MONEDA);
  tarjeta_(sh, 'E3:F3', 'E4:F5', '💰 SALDO DEL MES', c.AZUL_CLARO, F.MONEDA);
  tarjeta_(sh, 'G3:H3', 'G4:H5', '📈 ESTADO DEL MES', c.AMARILLO_CLARO, '@');

  sh.getRange('A6:H6').merge().setHorizontalAlignment('center').setFontStyle('italic');

  [
    ['A8:B8', 'A9:B9', 'Saldo acumulado (histórico)', F.MONEDA],
    ['C8:D8', 'C9:D9', 'Ingresos del año', F.MONEDA],
    ['E8:F8', 'E9:F9', 'Gastos del año', F.MONEDA],
    ['G8:H8', 'G9:H9', '% gastado del mes', F.PCT]
  ].forEach(([rt, rv, txt, fmt]) => {
    sh.getRange(rt).merge().setValue(txt).setBackground(c.GRIS).setFontWeight('bold').setHorizontalAlignment('center');
    sh.getRange(rv).merge().setNumberFormat(fmt).setFontWeight('bold').setFontSize(13).setHorizontalAlignment('center');
  });

  sh.getRange('A11:F11').merge()
    .setValue('🎯 PRESUPUESTO DEL MES — se edita en CATEGORIAS (columna "Presupuesto mensual")')
    .setBackground(c.MORADO).setFontColor(c.BLANCO).setFontWeight('bold');
}

function tarjeta_(sh, rangoTitulo, rangoValor, titulo, color, formato) {
  sh.getRange(rangoTitulo).merge().setValue(titulo).setBackground(color)
    .setFontWeight('bold').setFontColor(CFG.C.TEXTO).setHorizontalAlignment('center');
  sh.getRange(rangoValor).merge().setBackground(CFG.C.BLANCO).setNumberFormat(formato)
    .setFontWeight('bold').setFontSize(17).setHorizontalAlignment('center').setVerticalAlignment('middle')
    .setBorder(true, true, true, true, false, false, '#CBD5E1', SpreadsheetApp.BorderStyle.SOLID);
}

function construirHistorial_(sh) {
  const c = CFG.C, F = CFG.FMT;

  limpiarHoja_(sh);
  sh.setTabColor(c.MORADO);

  const encabezado = (rango, valores) => sh.getRange(rango).setValues([valores])
    .setBackground(c.AZUL).setFontColor(c.BLANCO).setFontWeight('bold').setHorizontalAlignment('center');

  encabezado('A1:G1', ['Mes', 'Ingresos', 'Gastos', 'Saldo', '% gastado', 'Estado', 'Nº movimientos']);
  encabezado('I1:L1', ['Año', 'Ingresos', 'Gastos', 'Saldo']);
  sh.setFrozenRows(1);

  sh.getRange('A2:A').setNumberFormat('@');
  sh.getRange('I2:I').setNumberFormat('@');
  sh.getRange('B2:D').setNumberFormat(F.MONEDA);
  sh.getRange('E2:E').setNumberFormat(F.PCT);
  sh.getRange('J2:L').setNumberFormat(F.MONEDA);
  sh.getRange('A1').setNote('Calculado desde MOVIMIENTOS. Si corriges un movimiento antiguo, el historial se corrige solo.');

  [110, 120, 120, 120, 100, 130, 120, 30, 80, 120, 120, 120].forEach((w, i) => sh.setColumnWidth(i + 1, w));
}


/* ============================================================
 * VALIDACIONES
 * ============================================================ */

function aplicarValidaciones_() {
  const mov = hoja_(H.MOV), cat = hoja_(H.CAT);
  const nMov = Math.max(mov.getMaxRows() - 1, 1);
  const nCat = Math.max(cat.getMaxRows() - 1, 1);
  const V = () => SpreadsheetApp.newDataValidation();

  mov.getRange(2, CFG.COL.FECHA, nMov, 1).setDataValidation(V().requireDate().setAllowInvalid(false).build());
  mov.getRange(2, CFG.COL.TIPO, nMov, 1).setDataValidation(lista_(CFG.TIPOS, false));
  mov.getRange(2, CFG.COL.CAT, nMov, 1).setDataValidation(
    V().requireValueInRange(cat.getRange(2, 1, nCat, 1), true).setAllowInvalid(false).build());
  mov.getRange(2, CFG.COL.MONTO, nMov, 1).setDataValidation(V().requireNumberGreaterThan(0).setAllowInvalid(false).build());
  mov.getRange(2, CFG.COL.METODO, nMov, 1).setDataValidation(lista_(CFG.METODOS, true));

  cat.getRange(2, 2, nCat, 1).setDataValidation(lista_(CFG.TIPOS, false));
  cat.getRange(2, 3, nCat, 1).setDataValidation(V().requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).build());

  aplicarValidacionesFormulario_();
}

function aplicarValidacionesFormulario_() {
  const sh = hoja_(H.INICIO), F = CFG.FORM;
  const V = () => SpreadsheetApp.newDataValidation();

  sh.getRange(F.FECHA, 2).setDataValidation(V().requireDate().setAllowInvalid(false).build());
  sh.getRange(F.TIPO, 2).setDataValidation(lista_(CFG.TIPOS, false));
  sh.getRange(F.MONTO, 2).setDataValidation(V().requireNumberGreaterThan(0).setAllowInvalid(false).build());
  sh.getRange(F.METODO, 2).setDataValidation(lista_(CFG.METODOS, true));

  aplicarValidacionCategoriaForm_(str_(sh.getRange(F.TIPO, 2).getValue()));
}

/** Dropdown dependiente: Categoría filtrada por el Tipo elegido. */
function aplicarValidacionCategoriaForm_(tipo) {
  const celda = hoja_(H.INICIO).getRange(CFG.FORM.CAT, 2);
  const nombres = leerCategorias_().filter(c => !tipo || c.tipo === tipo).map(c => c.nombre);

  if (!nombres.length) {
    celda.clearDataValidations();
    return;
  }
  celda.setDataValidation(lista_(nombres, false));

  const actual = str_(celda.getValue());
  if (actual && !nombres.includes(actual)) celda.clearContent();
}

function lista_(valores, permitirOtros) {
  return SpreadsheetApp.newDataValidation().requireValueInList(valores, true).setAllowInvalid(permitirOtros).build();
}


/* ============================================================
 * CRUD MOVIMIENTOS — FORMULARIO
 * ============================================================ */

function leerFormulario_() {
  const v = hoja_(H.INICIO).getRange('B5:B12').getValues().map(f => f[0]);
  return {
    id: str_(v[0]),
    fecha: normalizarFecha_(v[1]),
    tipo: str_(v[2]),
    categoria: str_(v[3]),
    descripcion: str_(v[4]),
    monto: normalizarNumero_(v[5]),
    metodo: str_(v[6]),
    observacion: str_(v[7])
  };
}

function validarMovimiento_(m) {
  if (!m.fecha) return 'Ingresa una fecha válida';
  if (!CFG.TIPOS.includes(m.tipo)) return 'Selecciona Ingreso o Gasto';
  if (!m.categoria) return 'Selecciona una categoría';

  const cat = leerCategorias_().find(c => c.nombre === m.categoria);
  if (!cat) return `La categoría "${m.categoria}" no existe en CATEGORIAS`;
  if (cat.tipo !== m.tipo) return `"${m.categoria}" es de tipo ${cat.tipo}, no ${m.tipo}`;
  if (!(m.monto > 0)) return 'El monto debe ser mayor a cero';
  return '';
}

/** CREATE si no hay ID, UPDATE si hay ID. */
function guardarMovimiento_() {
  const m = leerFormulario_();
  const error = validarMovimiento_(m);
  if (error) return aviso_('⚠️ ' + error);

  const mov = hoja_(H.MOV);
  let fila;

  if (m.id) {
    fila = buscarFilaPorId_(m.id);
    if (fila < 0) return aviso_(`⚠️ El ID ${m.id} no existe. Borra el ID para crear uno nuevo.`);
  } else {
    fila = mov.getLastRow() + 1;
    asegurarFilas_(mov, fila);
  }

  const id = m.id || generarId_();
  mov.getRange(fila, 1, 1, CFG.NCOL).setValues([[
    id, m.fecha, m.tipo, m.categoria, m.descripcion, m.monto, m.metodo, m.observacion, new Date()
  ]]);

  limpiarFormulario_();
  recalcular_();
  aviso_(`${m.id ? '✏️ Actualizado' : '✅ Creado'} ${id} · ${m.tipo} $${m.monto.toFixed(2)}`);
}

/** READ: carga un movimiento en el formulario. */
function cargarPorId_(id) {
  const fila = buscarFilaPorId_(id);
  if (fila < 0) {
    setModo_(false);
    return aviso_('⚠️ No existe el ID ' + id);
  }

  const f = hoja_(H.MOV).getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
  aplicarValidacionCategoriaForm_(str_(f[2]));
  hoja_(H.INICIO).getRange('B5:B12').setValues([[f[0]], [f[1]], [f[2]], [f[3]], [f[4]], [f[5]], [f[6]], [f[7]]]);

  setModo_(true, id);
  estado_(`✏️ Editando ${id} — modifica y marca Guardar`);
}

/** DELETE con doble confirmación (simple trigger no permite diálogos). */
function eliminarDesdeFormulario_() {
  const id = str_(hoja_(H.INICIO).getRange('B5').getValue());
  if (!id) return aviso_('⚠️ Primero carga un movimiento (campo ID o menú → Editar movimiento seleccionado).');

  const fila = buscarFilaPorId_(id);
  if (fila < 0) return aviso_('⚠️ No existe el ID ' + id);

  const cache = CacheService.getDocumentCache();
  if (cache.get('confirmarEliminar') !== id) {
    cache.put('confirmarEliminar', id, 30);
    return aviso_(`⚠️ Marca "Eliminar" otra vez (30 s) para confirmar el borrado de ${id}`);
  }

  marcarCambioInterno_();
  borrarFila_(hoja_(H.MOV), fila);
  limpiarFormulario_();
  recalcular_();
  aviso_(`🗑️ Movimiento ${id} eliminado`);
}

function limpiarFormulario_() {
  const sh = hoja_(H.INICIO);
  sh.getRange('B5:B12').clearContent();
  sh.getRange('B6').setValue(hoy_());
  aplicarValidacionCategoriaForm_('');
  setModo_(false);
  CacheService.getDocumentCache().remove('confirmarEliminar');
}

function setModo_(editando, id) {
  hoja_(H.INICIO).getRange('A4')
    .setValue(editando ? '✏️ EDITANDO ' + id : '➕ NUEVO MOVIMIENTO')
    .setBackground(editando ? CFG.C.AMARILLO : CFG.C.MORADO);
}

function buscarFilaPorId_(id) {
  const mov = hoja_(H.MOV);
  if (mov.getLastRow() < 2) return -1;
  const celda = mov.getRange(2, CFG.COL.ID, mov.getLastRow() - 1, 1)
    .createTextFinder(id).matchEntireCell(true).findNext();
  return celda ? celda.getRow() : -1;
}


/* ============================================================
 * CRUD MOVIMIENTOS — MENÚ
 * ============================================================ */

function irNuevoMovimiento() {
  const ss = SpreadsheetApp.getActive();
  const sh = hoja_(H.INICIO);
  limpiarFormulario_();
  ss.setActiveSheet(sh);
  sh.getRange(CFG.FORM.TIPO, 2).activate();
}

function editarSeleccionado() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getActiveSheet();
  const fila = sh.getActiveRange().getRow();

  if (sh.getName() !== H.MOV || fila < 2) return ui.alert('Selecciona una fila con datos en MOVIMIENTOS.');

  const id = str_(sh.getRange(fila, CFG.COL.ID).getValue());
  if (!id) return ui.alert('La fila seleccionada no tiene ID.');

  const inicio = hoja_(H.INICIO);
  inicio.getRange('B5').setValue(id);
  cargarPorId_(id);
  ss.setActiveSheet(inicio);
  inicio.getRange(CFG.FORM.DESC, 2).activate();
}

function eliminarSeleccionados() {
  const ui = SpreadsheetApp.getUi();
  const sh = SpreadsheetApp.getActive().getActiveSheet();
  if (sh.getName() !== H.MOV) return ui.alert('Selecciona las filas a eliminar en MOVIMIENTOS.');

  const last = sh.getLastRow();
  const filas = new Set();
  sh.getActiveRangeList().getRanges().forEach(r => {
    for (let i = Math.max(r.getRow(), 2); i <= Math.min(r.getLastRow(), last); i++) filas.add(i);
  });
  if (!filas.size) return ui.alert('No hay filas de datos seleccionadas.');

  if (ui.alert('Eliminar movimientos', `¿Eliminar ${filas.size} movimiento(s)? No se puede deshacer.`, ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  marcarCambioInterno_();
  [...filas].sort((a, b) => b - a).forEach(f => borrarFila_(sh, f));
  recalcular_();
  aviso_(`🗑️ ${filas.size} movimiento(s) eliminado(s)`);
}


/* ============================================================
 * CRUD CATEGORÍAS
 * ============================================================ */

function leerCategorias_() {
  const sh = hoja_(H.CAT);
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 3).getValues()
    .map((f, i) => ({
      nombre: str_(f[0]),
      tipo: str_(f[1]) || 'Gasto',
      presupuesto: normalizarNumero_(f[2]),
      fila: i + 2
    }))
    .filter(c => c.nombre);
}

function asegurarCategoria_(nombre, tipo, presupuesto) {
  const existe = leerCategorias_().some(c => normalizarTexto_(c.nombre) === normalizarTexto_(nombre));
  if (existe) return;
  const sh = hoja_(H.CAT);
  sh.getRange(sh.getLastRow() + 1, 1, 1, 3).setValues([[nombre, tipo, presupuesto || 0]]);
}

function contarUso_(nombre) {
  const sh = hoja_(H.MOV);
  const last = sh.getLastRow();
  if (last < 2) return 0;
  return sh.getRange(2, CFG.COL.CAT, last - 1, 1).getValues().filter(f => str_(f[0]) === nombre).length;
}

/** Reemplaza una categoría en todos los movimientos (renombrar / reasignar). */
function reemplazarCategoriaEnMovimientos_(viejo, nuevo) {
  const sh = hoja_(H.MOV);
  const last = sh.getLastRow();
  if (last < 2) return 0;

  const rango = sh.getRange(2, CFG.COL.CAT, last - 1, 1);
  const v = rango.getValues();
  let n = 0;
  v.forEach(f => {
    if (str_(f[0]) === viejo) {
      f[0] = nuevo;
      n++;
    }
  });
  if (n) rango.setValues(v);
  return n;
}

function eliminarCategoriaSeleccionada() {
  const ui = SpreadsheetApp.getUi();
  const sh = SpreadsheetApp.getActive().getActiveSheet();
  const fila = sh.getActiveRange().getRow();

  if (sh.getName() !== H.CAT || fila < 2) return ui.alert('Selecciona una categoría (fila) en CATEGORIAS.');

  const nombre = str_(sh.getRange(fila, 1).getValue());
  const tipo = str_(sh.getRange(fila, 2).getValue()) || 'Gasto';
  if (!nombre) return ui.alert('La fila seleccionada está vacía.');

  const destino = CFG.FALLBACK[tipo];
  if (nombre === destino) return ui.alert(`"${destino}" es la categoría de respaldo y no se puede eliminar.`);

  const uso = contarUso_(nombre);
  const msg = uso
    ? `"${nombre}" tiene ${uso} movimiento(s). Se reasignarán a "${destino}". ¿Continuar?`
    : `¿Eliminar la categoría "${nombre}"?`;
  if (ui.alert('Eliminar categoría', msg, ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  if (uso) {
    asegurarCategoria_(destino, tipo, 0);
    reemplazarCategoriaEnMovimientos_(nombre, destino);
  }
  marcarCambioInterno_();
  borrarFila_(sh, fila);
  aplicarValidacionCategoriaForm_('');
  recalcular_();
  aviso_(`🗑️ Categoría "${nombre}" eliminada${uso ? ` (${uso} → ${destino})` : ''}`);
}


/* ============================================================
 * EVENTOS
 * ============================================================ */

function onEdit(e) {
  if (!e || !e.range) return;
  const nombre = e.range.getSheet().getName();

  try {
    if (nombre === H.INICIO) return onEditInicio_(e);
    if (nombre === H.MOV) return onEditMovimientos_(e);
    if (nombre === H.CAT) return onEditCategorias_(e);
  } catch (err) {
    console.error(err);
    estado_('❌ ' + err.message);
  }
}

function onEditInicio_(e) {
  const r = e.range.getRow(), c = e.range.getColumn();
  const B = CFG.BTN;

  // Botones (checkbox en G)
  if (c === 7 && r >= B.GUARDAR && r <= B.DASHBOARD && e.range.getNumRows() === 1) {
    if (String(e.value).toUpperCase() !== 'TRUE') return;
    try {
      if (r === B.GUARDAR) guardarMovimiento_();
      if (r === B.ELIMINAR) eliminarDesdeFormulario_();
      if (r === B.LIMPIAR) { limpiarFormulario_(); estado_('🧹 Formulario listo para un nuevo movimiento'); }
      if (r === B.RECALCULAR) { recalcular_(); aviso_('🔄 Todo recalculado'); }
      if (r === B.DASHBOARD) SpreadsheetApp.getActive().setActiveSheet(hoja_(H.DASH));
    } finally {
      e.range.setValue(false);
    }
    return;
  }

  // Campo ID → cargar para edición
  if (c === 2 && r === CFG.FORM.ID) {
    const id = str_(e.range.getValue());
    if (id) cargarPorId_(id);
    else setModo_(false);
    return;
  }

  // Campo Tipo → filtrar categorías
  if (c === 2 && r === CFG.FORM.TIPO) {
    aplicarValidacionCategoriaForm_(str_(e.range.getValue()));
  }
}

function onEditMovimientos_(e) {
  const sh = e.range.getSheet();
  const r0 = Math.max(e.range.getRow(), 2);
  const r1 = Math.min(e.range.getLastRow(), sh.getLastRow());

  if (r1 >= r0) {
    const n = r1 - r0 + 1;
    const v = sh.getRange(r0, 1, n, CFG.NCOL).getValues();

    // IDs fuera del rango editado → detectar duplicados al copiar/pegar filas
    const todos = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map(f => str_(f[0]));
    const usados = new Set(todos.filter((id, i) => id && (i + 2 < r0 || i + 2 > r1)));

    const ahora = new Date();
    const ids = [], mods = [];

    v.forEach(f => {
      const tieneDatos = f.slice(1, 8).some(x => x !== '' && x !== null);
      if (!tieneDatos) { // fila vaciada → limpiar ID y fecha de modificación
        ids.push(['']);
        mods.push(['']);
        return;
      }
      let id = str_(f[0]);
      if (!id || usados.has(id)) id = generarId_();
      usados.add(id);
      ids.push([id]);
      mods.push([ahora]);
    });

    sh.getRange(r0, CFG.COL.ID, n, 1).setValues(ids);
    sh.getRange(r0, CFG.COL.MOD, n, 1).setValues(mods).setNumberFormat(CFG.FMT.FECHA_HORA);
  }

  if (sh.getLastRow() <= CFG.MAX_AUTO) recalcular_();
}

function onEditCategorias_(e) {
  const r = e.range, sh = r.getSheet();
  if (r.getRow() < 2) return;

  if (r.getNumRows() === 1 && r.getNumColumns() === 1) {
    const fila = r.getRow();

    // Columna A: nombre
    if (r.getColumn() === 1) {
      const viejo = str_(e.oldValue);
      const nuevo = str_(r.getValue());

      if (viejo && !nuevo) {
        const uso = contarUso_(viejo);
        if (uso > 0) {
          r.setValue(viejo);
          return aviso_(`⚠️ "${viejo}" tiene ${uso} movimiento(s). Usa menú 💰 → Eliminar categoría seleccionada.`);
        }
        sh.getRange(fila, 1, 1, 4).clearContent();
      } else if (nuevo) {
        const duplicada = leerCategorias_()
          .some(c => c.fila !== fila && normalizarTexto_(c.nombre) === normalizarTexto_(nuevo));
        if (duplicada) {
          if (viejo) r.setValue(viejo); else r.clearContent();
          return aviso_(`⚠️ Ya existe la categoría "${nuevo}"`);
        }
        if (!str_(sh.getRange(fila, 2).getValue())) sh.getRange(fila, 2).setValue('Gasto');
        if (viejo && viejo !== nuevo) {
          const n = reemplazarCategoriaEnMovimientos_(viejo, nuevo);
          aviso_(`🏷️ "${viejo}" → "${nuevo}" (${n} movimiento(s) actualizados)`);
        }
      }
    }

    // Columna B: tipo → avisar incoherencias
    if (r.getColumn() === 2) {
      const nombre = str_(sh.getRange(fila, 1).getValue());
      const tipo = str_(r.getValue());
      const n = leerMovimientos_().filter(m => m.categoria === nombre && m.tipo !== tipo).length;
      if (n) aviso_(`⚠️ ${n} movimiento(s) de "${nombre}" están registrados con otro tipo. Revísalos en MOVIMIENTOS.`);
    }
  }

  aplicarValidacionCategoriaForm_(str_(hoja_(H.INICIO).getRange(CFG.FORM.TIPO, 2).getValue()));
  recalcular_();
}

/** Trigger instalable: eliminación de filas (onEdit no se dispara). */
function alCambiarEstructura(e) {
  if (!e || e.changeType !== 'REMOVE_ROW') return;
  if (CacheService.getDocumentCache().get('cambioInterno')) return; // ya lo recalculó el script
  recalcular_();
}

/** Trigger diario: el "mes actual" cambia aunque nadie edite. */
function recalcularProgramado() {
  recalcular_();
}

function recalcular() {
  recalcular_();
  aviso_('🔄 Todo recalculado');
}


/* ============================================================
 * CÁLCULO (DASHBOARD + HISTORIAL + GRÁFICOS)
 * ============================================================ */

function recalcular_() {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(5000)) {
    estado_('⏳ Otro proceso está recalculando. Intenta de nuevo.');
    return;
  }
  try {
    calcular_();
  } finally {
    lock.releaseLock();
  }
}

function calcular_() {
  const ss = SpreadsheetApp.getActive();
  const tz = ss.getSpreadsheetTimeZone();
  const movs = leerMovimientos_();
  const cats = leerCategorias_();

  const ahora = new Date();
  const mesHoy = Utilities.formatDate(ahora, tz, 'yyyy-MM');
  const anioHoy = mesHoy.slice(0, 4);

  const porMes = {}, porSemana = {}, porAnio = {}, gastoCatMes = {}, usoCat = {};
  let saldoTotal = 0, ingAnio = 0, gasAnio = 0;

  movs.forEach(m => {
    const kMes = Utilities.formatDate(m.fecha, tz, 'yyyy-MM');
    const kAnio = kMes.slice(0, 4);
    const kSem = Utilities.formatDate(inicioSemana_(m.fecha, tz), tz, 'yyyy-MM-dd');

    acumular_(porMes, kMes, m);
    acumular_(porAnio, kAnio, m);
    acumular_(porSemana, kSem, m);

    saldoTotal += m.tipo === 'Ingreso' ? m.monto : -m.monto;
    if (kAnio === anioHoy) {
      if (m.tipo === 'Ingreso') ingAnio += m.monto;
      else gasAnio += m.monto;
    }
    if (kMes === mesHoy && m.tipo === 'Gasto') {
      gastoCatMes[m.categoria] = (gastoCatMes[m.categoria] || 0) + m.monto;
    }
    usoCat[m.categoria] = (usoCat[m.categoria] || 0) + 1;
  });

  const mes = porMes[mesHoy] || { ing: 0, gas: 0, n: 0 };

  const filaGraficos = escribirDashboard_({ tz, ahora, mesHoy, mes, saldoTotal, ingAnio, gasAnio, cats, gastoCatMes });
  escribirHistorial_(porMes, porAnio);
  const dims = escribirDatosGraficos_(porSemana, porMes, gastoCatMes);
  sincronizarGraficos_(dims, filaGraficos);
  escribirUsoCategorias_(usoCat);

  SpreadsheetApp.flush();
}

function leerMovimientos_() {
  const sh = hoja_(H.MOV);
  const last = sh.getLastRow();
  if (last < 2) return [];

  return sh.getRange(2, 1, last - 1, CFG.NCOL).getValues()
    .map(f => ({
      id: str_(f[0]),
      fecha: normalizarFecha_(f[1]),
      tipo: str_(f[2]),
      categoria: str_(f[3]),
      monto: normalizarNumero_(f[5])
    }))
    .filter(m => m.fecha && CFG.TIPOS.includes(m.tipo) && m.monto > 0);
}

function acumular_(mapa, clave, m) {
  const x = mapa[clave] || (mapa[clave] = { ing: 0, gas: 0, n: 0 });
  if (m.tipo === 'Ingreso') x.ing += m.monto;
  else x.gas += m.monto;
  x.n++;
}

/** Lunes de la semana, calculado en la zona horaria de la hoja (no la del script). */
function inicioSemana_(fecha, tz) {
  const diaIso = Number(Utilities.formatDate(fecha, tz, 'u')); // 1 = lunes … 7 = domingo
  return new Date(fecha.getTime() - (diaIso - 1) * 86400000);
}

function escribirDashboard_(x) {
  const sh = hoja_(H.DASH), c = CFG.C, F = CFG.FMT;

  const est = evaluarEstado_(x.mes.ing, x.mes.gas);
  const saldoMes = x.mes.ing - x.mes.gas;
  const pct = x.mes.ing > 0 ? x.mes.gas / x.mes.ing : (x.mes.gas > 0 ? 1 : 0);

  sh.getRange('A2').setValue(`Mes en curso: ${etiquetaMes_(x.mesHoy)}   ·   Actualizado: ${Utilities.formatDate(x.ahora, x.tz, 'dd/MM/yyyy HH:mm')}`);
  sh.getRange('A4').setValue(x.mes.ing);
  sh.getRange('C4').setValue(x.mes.gas);
  sh.getRange('E4').setValue(saldoMes).setFontColor(saldoMes < 0 ? c.ROJO : c.TEXTO);
  sh.getRange('G4').setValue(est.texto).setBackground(est.color);
  sh.getRange('A6').setValue(est.descripcion).setBackground(est.color);
  sh.getRange('A9').setValue(x.saldoTotal).setFontColor(x.saldoTotal < 0 ? c.ROJO : c.TEXTO);
  sh.getRange('C9').setValue(x.ingAnio);
  sh.getRange('E9').setValue(x.gasAnio);
  sh.getRange('G9').setValue(pct);

  // --- Tabla de presupuesto (fila 12 en adelante, se regenera completa)
  const T = 12;
  asegurarFilas_(sh, T + 80);
  sh.getRange(T, 1, sh.getMaxRows() - T + 1, 8).clear();

  const filas = [];
  const deGasto = new Set();
  x.cats.filter(k => k.tipo === 'Gasto').forEach(k => {
    deGasto.add(k.nombre);
    filas.push(filaPresupuesto_(k.nombre, k.presupuesto, x.gastoCatMes[k.nombre] || 0, false));
  });
  // Gastos con categoría inexistente o de tipo Ingreso → se muestran para corregir
  Object.keys(x.gastoCatMes).filter(n => !deGasto.has(n)).forEach(n =>
    filas.push(filaPresupuesto_(n || '(sin categoría)', 0, x.gastoCatMes[n], true)));

  sh.getRange(T, 1, 1, 6)
    .setValues([['Categoría', 'Presupuesto', 'Gastado (mes)', 'Disponible', '% usado', 'Estado']])
    .setBackground(c.AZUL).setFontColor(c.BLANCO).setFontWeight('bold').setHorizontalAlignment('center');

  const n = filas.length;
  if (n) {
    sh.getRange(T + 1, 1, n, 6).setValues(filas.map(f => f.valores));
    sh.getRange(T + 1, 6, n, 1).setBackgrounds(filas.map(f => [f.color]));
  }

  const tp = filas.reduce((s, f) => s + f.valores[1], 0);
  const tg = filas.reduce((s, f) => s + f.valores[2], 0);
  const filaTotal = T + 1 + n;
  sh.getRange(filaTotal, 1, 1, 6)
    .setValues([['TOTAL', tp, tg, tp - tg, tp > 0 ? tg / tp : '', '']])
    .setFontWeight('bold').setBackground(c.GRIS);

  sh.getRange(T + 1, 2, n + 1, 3).setNumberFormat(F.MONEDA);
  sh.getRange(T + 1, 5, n + 1, 1).setNumberFormat(F.PCT);
  sh.getRange(T, 1, n + 2, 6).setBorder(true, true, true, true, true, true, c.GRIS2, SpreadsheetApp.BorderStyle.SOLID);

  return filaTotal + 2;
}

function filaPresupuesto_(nombre, presupuesto, gastado, huerfana) {
  const c = CFG.C;
  const pct = presupuesto > 0 ? gastado / presupuesto : '';
  let estado = '—', color = c.BLANCO;

  if (huerfana) { estado = '⚠️ Revisar categoría'; color = c.AMARILLO_CLARO; }
  else if (presupuesto > 0 && pct > 1) { estado = '🔴 Excedido'; color = c.ROJO_CLARO; }
  else if (presupuesto > 0 && pct >= 0.8) { estado = '🟡 Cerca del límite'; color = c.AMARILLO_CLARO; }
  else if (presupuesto > 0) { estado = '🟢 OK'; color = c.VERDE_CLARO; }
  else if (gastado > 0) { estado = '⚪ Sin presupuesto'; }

  return { valores: [nombre, presupuesto, gastado, presupuesto - gastado, pct, estado], color };
}

function escribirHistorial_(porMes, porAnio) {
  const sh = hoja_(H.HIST);
  const max = sh.getMaxRows();

  sh.getRange(2, 1, max - 1, 7).clearContent().setBackground(null);
  sh.getRange(2, 9, max - 1, 4).clearContent();

  const meses = Object.keys(porMes).sort().reverse();
  if (meses.length) {
    asegurarFilas_(sh, meses.length + 1);
    const estados = meses.map(k => evaluarEstado_(porMes[k].ing, porMes[k].gas));
    sh.getRange(2, 1, meses.length, 7).setValues(meses.map((k, i) => {
      const x = porMes[k];
      return [etiquetaMes_(k), x.ing, x.gas, x.ing - x.gas, x.ing > 0 ? x.gas / x.ing : '', estados[i].texto, x.n];
    }));
    sh.getRange(2, 6, meses.length, 1).setBackgrounds(estados.map(e => [e.color]));
  }

  const anios = Object.keys(porAnio).sort().reverse();
  if (anios.length) {
    asegurarFilas_(sh, anios.length + 1);
    sh.getRange(2, 9, anios.length, 4).setValues(anios.map(a => {
      const x = porAnio[a];
      return [a, x.ing, x.gas, x.ing - x.gas];
    }));
  }
}

function escribirDatosGraficos_(porSemana, porMes, gastoCatMes) {
  const sh = hoja_(H.DATOS);
  sh.clearContents();
  ['A:A', 'E:E', 'I:I'].forEach(r => sh.getRange(r).setNumberFormat('@')); // etiquetas como texto

  const semanas = Object.keys(porSemana).sort().slice(-12)
    .map(k => ['Sem ' + k.slice(8, 10) + '/' + k.slice(5, 7), porSemana[k].ing, porSemana[k].gas]);
  const meses = Object.keys(porMes).sort().slice(-12)
    .map(k => [etiquetaMes_(k), porMes[k].ing, porMes[k].gas]);
  const cats = Object.keys(gastoCatMes)
    .map(k => [k || '(sin categoría)', gastoCatMes[k]])
    .sort((a, b) => b[1] - a[1]);

  const s = semanas.length ? semanas : [['Sin datos', 0, 0]];
  const m = meses.length ? meses : [['Sin datos', 0, 0]];
  const k = cats.length ? cats : [['Sin gastos este mes', 0]];

  sh.getRange(1, 1, s.length + 1, 3).setValues([['Semana', 'Ingresos', 'Gastos']].concat(s));
  sh.getRange(1, 5, m.length + 1, 3).setValues([['Mes', 'Ingresos', 'Gastos']].concat(m));
  sh.getRange(1, 9, k.length + 1, 2).setValues([['Categoría', 'Gasto']].concat(k));

  return { sem: s.length, mes: m.length, cat: k.length };
}

/** Rangos de gráficos ajustados al tamaño real de los datos (sin filas vacías). */
function sincronizarGraficos_(dims, fila) {
  const dash = hoja_(H.DASH), datos = hoja_(H.DATOS), c = CFG.C;

  const base = (b, titulo, w, h) => b
    .setOption('title', titulo)
    .setOption('legend', { position: 'bottom' })
    .setOption('width', w)
    .setOption('height', h);

  const defs = [
    b => base(b.setChartType(Charts.ChartType.COLUMN)
      .addRange(datos.getRange(1, 5, dims.mes + 1, 3))
      .setPosition(fila, 1, 0, 0), 'Ingresos vs Gastos — últimos 12 meses', 570, 320)
      .setOption('colors', [c.VERDE, c.ROJO]),

    b => base(b.setChartType(Charts.ChartType.COLUMN)
      .addRange(datos.getRange(1, 1, dims.sem + 1, 3))
      .setPosition(fila, 5, 0, 0), 'Ingresos vs Gastos — últimas 12 semanas', 570, 320)
      .setOption('colors', [c.VERDE, c.ROJO]),

    b => base(b.setChartType(Charts.ChartType.PIE)
      .addRange(datos.getRange(1, 9, dims.cat + 1, 2))
      .setPosition(fila + 17, 1, 0, 0), '¿En qué gastas este mes?', 570, 340)
      .setOption('pieHole', 0.45)
  ];

  const actuales = dash.getCharts();
  if (actuales.length !== defs.length) {
    actuales.forEach(g => dash.removeChart(g));
    defs.forEach(d => dash.insertChart(d(dash.newChart()).build()));
    return;
  }
  actuales.forEach((g, i) => dash.updateChart(defs[i](g.modify().clearRanges()).build()));
}

function escribirUsoCategorias_(uso) {
  const sh = hoja_(H.CAT);
  const last = sh.getLastRow();
  if (last < 2) return;
  const nombres = sh.getRange(2, 1, last - 1, 1).getValues();
  sh.getRange(2, 4, last - 1, 1).setValues(nombres.map(f => [str_(f[0]) ? (uso[str_(f[0])] || 0) : '']));
}

function evaluarEstado_(ingreso, gasto) {
  const c = CFG.C;
  if (ingreso === 0 && gasto === 0) return { texto: '⚪ SIN DATOS', descripcion: 'Aún no hay movimientos este mes', color: c.GRIS };
  if (ingreso === 0) return { texto: '🔴 CRÍTICO', descripcion: 'Hay gastos pero ningún ingreso registrado', color: c.ROJO_CLARO };

  const p = gasto / ingreso;
  if (p <= CFG.UMBRAL.BIEN) return { texto: '🟢 BIEN', descripcion: 'Tus gastos están controlados', color: c.VERDE_CLARO };
  if (p <= CFG.UMBRAL.ALERTA) return { texto: '🟡 ALERTA', descripcion: 'Estás usando gran parte de tus ingresos', color: c.AMARILLO_CLARO };
  if (p <= 1) return { texto: '🟠 RIESGO', descripcion: 'Estás muy cerca de gastar todos tus ingresos', color: c.NARANJA_CLARO };
  return { texto: '🔴 MAL', descripcion: 'Tus gastos superan tus ingresos', color: c.ROJO_CLARO };
}


/* ============================================================
 * RESET
 * ============================================================ */

/** Nivel 1: borra movimientos, conserva categorías y presupuestos. */
function borrarMovimientos() {
  const ui = SpreadsheetApp.getUi();
  const ok = ui.alert(
    'Borrar todos los movimientos',
    'Se eliminarán TODOS los movimientos. Categorías y presupuestos se conservan.\nDASHBOARD e HISTORIAL quedarán en cero. ¿Continuar?',
    ui.ButtonSet.YES_NO
  );
  if (ok !== ui.Button.YES) return;

  const mov = hoja_(H.MOV);
  if (mov.getMaxRows() > 1) mov.getRange(2, 1, mov.getMaxRows() - 1, CFG.NCOL).clearContent();

  limpiarFormulario_();
  recalcular_();
  aviso_('🧹 Movimientos eliminados');
}

/** Nivel 2: deja el archivo como recién instalado. No toca hojas ajenas al sistema. */
function resetFabrica() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt(
    '⚠️ RESET DE FÁBRICA',
    'Borra movimientos, categorías personalizadas, historial, dashboard y las hojas antiguas ' +
    '(Gastos, Ingresos, Resumen, Categorías). Otras hojas tuyas no se tocan.\n\nEscribe RESET para confirmar:',
    ui.ButtonSet.OK_CANCEL
  );
  if (r.getSelectedButton() !== ui.Button.OK || r.getResponseText().trim().toUpperCase() !== 'RESET') {
    ui.alert('Reset cancelado.');
    return;
  }

  const ss = SpreadsheetApp.getActive();
  const temporal = ss.insertSheet('_reset_' + Date.now()); // evita borrar la última hoja

  marcarCambioInterno_();
  eliminarHojas_(Object.values(H).concat(CFG.LEGADO_DATOS, CFG.LEGADO_V4));
  PropertiesService.getDocumentProperties().deleteAllProperties();

  instalarSistema();
  ss.deleteSheet(temporal);
  aviso_('⚠️ Reset de fábrica completado');
}


/* ============================================================
 * MIGRACIÓN DE HOJAS ANTIGUAS (manual, una sola vez)
 * ============================================================ */

function importarHojasAntiguas() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActive();
  const props = PropertiesService.getDocumentProperties();

  const existentes = CFG.LEGADO_DATOS.filter(n => ss.getSheetByName(n));
  if (!existentes.length) return ui.alert('No hay hojas antiguas para importar.');

  const previa = props.getProperty('LEGADO_IMPORTADO');
  if (previa && ui.alert('Importación previa detectada',
    `Ya importaste estas hojas el ${previa}. Importar de nuevo DUPLICARÁ movimientos. ¿Continuar?`,
    ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  const filas = leerLegado_(ss, 'Gastos', 'Gasto', { fecha: 0, desc: 1, cat: 2, monto: 4 })
    .concat(leerLegado_(ss, 'Ingresos', 'Ingreso', { fecha: 0, desc: -1, cat: -1, monto: -1 }));

  importarCategoriasLegado_(ss, filas); // también normaliza la categoría de cada fila

  if (filas.length) {
    const mov = hoja_(H.MOV);
    const desde = mov.getLastRow() + 1;
    asegurarFilas_(mov, desde + filas.length);
    mov.getRange(desde, 1, filas.length, CFG.NCOL).setValues(filas);
  }

  props.setProperty('LEGADO_IMPORTADO', Utilities.formatDate(new Date(), CFG.TZ, 'dd/MM/yyyy HH:mm'));
  aplicarValidacionCategoriaForm_('');
  recalcular_();

  const borrar = ui.alert('Importación lista',
    `${filas.length} movimiento(s) importados.\n\n¿Eliminar ahora las hojas antiguas (${existentes.join(', ')})?`,
    ui.ButtonSet.YES_NO);
  if (borrar === ui.Button.YES) eliminarHojas_(CFG.LEGADO_DATOS);

  aviso_(`📥 ${filas.length} movimiento(s) importados`);
}

function leerLegado_(ss, nombre, tipo, porDefecto) {
  const sh = ss.getSheetByName(nombre);
  if (!sh || sh.getLastRow() < 2) return [];

  const v = sh.getDataRange().getValues();
  const h = v[0].map(normalizarTexto_);
  const col = (claves, def) => {
    const i = h.findIndex(x => claves.some(k => x.includes(k)));
    return i >= 0 ? i : def;
  };
  const ix = {
    fecha: col(['fecha'], porDefecto.fecha),
    desc: col(['descripcion', 'concepto', 'detalle'], porDefecto.desc),
    cat: col(['categoria'], porDefecto.cat),
    monto: col(['monto', 'valor', 'importe', 'total'], porDefecto.monto)
  };
  const ahora = new Date();

  return v.slice(1).map(f => {
    const fecha = ix.fecha >= 0 ? normalizarFecha_(f[ix.fecha]) : null;
    const monto = ix.monto >= 0 ? normalizarNumero_(f[ix.monto]) : detectarMonto_(f);
    if (!fecha || monto <= 0) return null;
    return [
      generarId_(), fecha, tipo,
      (ix.cat >= 0 && str_(f[ix.cat])) || CFG.FALLBACK[tipo],
      ix.desc >= 0 ? str_(f[ix.desc]) : '',
      monto, '', 'Importado desde ' + nombre, ahora
    ];
  }).filter(Boolean);
}

function importarCategoriasLegado_(ss, filas) {
  const canonico = new Map(leerCategorias_().map(c => [normalizarTexto_(c.nombre), c.nombre]));
  const nuevas = [];
  const registrar = (nombre, tipo, presupuesto) => {
    const k = normalizarTexto_(nombre);
    if (!k) return nombre;
    if (!canonico.has(k)) {
      canonico.set(k, nombre);
      nuevas.push([nombre, tipo, presupuesto]);
    }
    return canonico.get(k);
  };

  const vieja = ss.getSheetByName('Categorías');
  if (vieja && vieja.getLastRow() >= 2) {
    vieja.getRange(2, 1, vieja.getLastRow() - 1, Math.min(3, vieja.getLastColumn())).getValues()
      .forEach(f => registrar(str_(f[0]), CFG.TIPOS.includes(str_(f[1])) ? str_(f[1]) : 'Gasto', normalizarNumero_(f[2])));
  }

  // Mismo nombre con distinta tilde/mayúscula → se unifica al nombre existente
  filas.forEach(f => { f[3] = registrar(f[3], f[2], 0); });

  if (nuevas.length) {
    const sh = hoja_(H.CAT);
    sh.getRange(sh.getLastRow() + 1, 1, nuevas.length, 3).setValues(nuevas);
  }
}

function eliminarHojasAntiguas() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActive();
  const existentes = CFG.LEGADO_DATOS.filter(n => ss.getSheetByName(n));
  if (!existentes.length) return ui.alert('No hay hojas antiguas.');

  const ok = ui.alert('Eliminar hojas antiguas',
    `Se eliminarán: ${existentes.join(', ')}.\nSi no las importaste antes, perderás esos datos. ¿Continuar?`,
    ui.ButtonSet.YES_NO);
  if (ok !== ui.Button.YES) return;

  eliminarHojas_(existentes);
  aviso_('🗂️ Hojas antiguas eliminadas');
}


/* ============================================================
 * UTILIDADES
 * ============================================================ */

function hoja_(nombre) {
  const ss = SpreadsheetApp.getActive();
  return ss.getSheetByName(nombre) || ss.insertSheet(nombre);
}

function eliminarHojas_(nombres) {
  const ss = SpreadsheetApp.getActive();
  nombres.forEach(n => {
    const sh = ss.getSheetByName(n);
    if (sh) ss.deleteSheet(sh);
  });
}

/** Deja una hoja en blanco: contenido, formato, merges, validaciones, notas, gráficos, banding, filtros. */
function limpiarHoja_(sh) {
  sh.getCharts().forEach(g => sh.removeChart(g));
  sh.getBandings().forEach(b => b.remove());
  if (sh.getFilter()) sh.getFilter().remove();
  sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns())
    .breakApart().clearDataValidations().clearNote();
  sh.clear();
  sh.setConditionalFormatRules([]);
  sh.setFrozenRows(0);
}

function asegurarFilas_(sh, filasNecesarias) {
  const max = sh.getMaxRows();
  if (max < filasNecesarias) sh.insertRowsAfter(max, filasNecesarias - max + 50);
}

/** deleteRow falla si es la única fila no congelada → en ese caso solo se vacía. */
function borrarFila_(sh, fila) {
  if (sh.getMaxRows() - sh.getFrozenRows() <= 1) {
    sh.getRange(fila, 1, 1, sh.getMaxColumns()).clearContent();
  } else {
    sh.deleteRow(fila);
  }
}

/** Evita que alCambiarEstructura recalcule de nuevo lo que el script ya recalculó. */
function marcarCambioInterno_() {
  CacheService.getDocumentCache().put('cambioInterno', '1', 15);
}

function estado_(texto) {
  const sh = SpreadsheetApp.getActive().getSheetByName(H.INICIO);
  if (!sh) return;
  sh.getRange('B14').setValue(texto);
  sh.getRange('F14').setValue(new Date()).setNumberFormat('dd/MM/yyyy HH:mm:ss');
}

function aviso_(texto) {
  estado_(texto);
  SpreadsheetApp.getActive().toast(texto, 'Mis Finanzas', 5);
}

function generarId_() {
  // UUID → sin colisiones (V4 usaba random de 4 dígitos: colisiona al migrar cientos de filas en el mismo segundo)
  return 'MOV-' + Utilities.formatDate(new Date(), CFG.TZ, 'yyMMdd') + '-' + Utilities.getUuid().slice(0, 6).toUpperCase();
}

function hoy_() {
  const s = Utilities.formatDate(new Date(), CFG.TZ, 'yyyy-MM-dd').split('-').map(Number);
  return new Date(s[0], s[1] - 1, s[2]);
}

function etiquetaMes_(clave) {
  const M = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return M[Number(clave.slice(5, 7)) - 1] + ' ' + clave.slice(0, 4);
}

function str_(v) {
  return v === null || v === undefined ? '' : String(v).trim();
}

function normalizarNumero_(valor) {
  if (typeof valor === 'number') return isFinite(valor) ? valor : 0;
  if (valor === null || valor === undefined || valor === '') return 0;

  let t = String(valor).replace(/[$\s]/g, '');
  if (t.includes(',') && t.includes('.')) {
    // El último separador es el decimal: 1.234,56 o 1,234.56
    t = t.lastIndexOf(',') > t.lastIndexOf('.')
      ? t.replace(/\./g, '').replace(',', '.')
      : t.replace(/,/g, '');
  } else if (t.includes(',')) {
    t = t.replace(',', '.');
  }
  const n = parseFloat(t);
  return isNaN(n) ? 0 : n;
}

function normalizarFecha_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) return valor;
  if (typeof valor !== 'string') return null;

  const t = valor.trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));

  return null;
}

function normalizarTexto_(texto) {
  return String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function detectarMonto_(fila) {
  for (let i = fila.length - 1; i >= 0; i--) {
    const n = normalizarNumero_(fila[i]);
    if (n > 0) return n;
  }
  return 0;
}