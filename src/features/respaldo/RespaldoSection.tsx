import { useRef, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  HardDriveDownload,
  Upload
} from 'lucide-react';
import { Reveal } from '../../components/motion/Reveal';
import { LiveNotice, type AvisoEstado } from '../../components/ui/LiveNotice';
import { Modal } from '../../components/ui/Modal';
import { db } from '../../db/database';
import { useAjuste, useCategorias, useMovimientos } from '../../db/hooks';
import { guardarAjuste } from '../../db/repositories';
import { formatFechaCorta } from '../../lib/format';
import {
  MAX_BACKUP_BYTES,
  exportarMovimientosCsvV5,
  serializarRespaldoJson,
  validarEImportarCsvV5,
  validarRespaldoJsonTexto,
  type BackupJsonPayload
} from './backupService';

function descargarArchivoTexto(nombreArchivo: string, contenido: string, mimeType: string) {
  const blob = new Blob([contenido], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function RespaldoSection() {
  const categorias = useCategorias();
  const movimientos = useMovimientos();
  const ultimoRespaldoEn = useAjuste<string | null>('ultimoRespaldoEn', null);

  const [aviso, setAviso] = useState<AvisoEstado | null>(null);
  const [respaldoJsonPendiente, setRespaldoJsonPendiente] = useState<BackupJsonPayload | null>(null);
  const [modoImportacionCsv, setModoImportacionCsv] = useState<'combinar' | 'reemplazar'>('combinar');

  const inputJsonRef = useRef<HTMLInputElement | null>(null);
  const inputCsvRef = useRef<HTMLInputElement | null>(null);

  const handleExportarJson = async () => {
    const ahoraIso = new Date().toISOString();
    const json = serializarRespaldoJson(categorias, movimientos, ahoraIso);
    const fechaNombre = ahoraIso.slice(0, 10);
    descargarArchivoTexto(
      `mis-finanzas-respaldo-${fechaNombre}.json`,
      json,
      'application/json;charset=utf-8'
    );
    await guardarAjuste('ultimoRespaldoEn', ahoraIso);
    setAviso({
      tipo: 'exito',
      mensaje: `Respaldo JSON exportado (${movimientos.length} movimientos y ${categorias.length} categorías).`
    });
  };

  const handleExportarCsv = async () => {
    const ahoraIso = new Date().toISOString();
    const csv = exportarMovimientosCsvV5(movimientos);
    const fechaNombre = ahoraIso.slice(0, 10);
    descargarArchivoTexto(
      `mis-finanzas-movimientos-${fechaNombre}.csv`,
      '\uFEFF' + csv,
      'text/csv;charset=utf-8'
    );
    await guardarAjuste('ultimoRespaldoEn', ahoraIso);
    setAviso({
      tipo: 'exito',
      mensaje: `Archivo CSV exportado (${movimientos.length} movimientos, compatible con Google Sheets V5).`
    });
  };

  const handleSeleccionarJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setAviso(null);
    if (file.size > MAX_BACKUP_BYTES) {
      setAviso({
        tipo: 'error',
        mensaje: 'El archivo seleccionado supera el límite máximo de 5 MB.'
      });
      return;
    }

    const texto = await file.text();
    const validacion = validarRespaldoJsonTexto(texto, file.size);
    if (!validacion.ok) {
      setAviso({ tipo: 'error', mensaje: validacion.error });
      return;
    }

    setRespaldoJsonPendiente(validacion.data);
  };

  const confirmarRestaurarJson = async () => {
    if (!respaldoJsonPendiente) return;
    const datos = respaldoJsonPendiente;

    await db.transaction('rw', db.categorias, db.movimientos, db.ajustes, async () => {
      await db.categorias.clear();
      await db.movimientos.clear();
      await db.categorias.bulkPut(datos.categorias);
      if (datos.movimientos.length > 0) {
        await db.movimientos.bulkPut(datos.movimientos);
      }
      await db.ajustes.put({
        clave: 'ultimoRespaldoEn',
        valor: new Date().toISOString()
      });
    });

    setRespaldoJsonPendiente(null);
    setAviso({
      tipo: 'exito',
      mensaje: `Respaldo restaurado con éxito: ${datos.movimientos.length} movimiento(s) y ${datos.categorias.length} categoría(s).`
    });
  };

  const handleSeleccionarCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setAviso(null);
    if (file.size > MAX_BACKUP_BYTES) {
      setAviso({
        tipo: 'error',
        mensaje: 'El archivo CSV supera el límite máximo permitido de 5 MB.'
      });
      return;
    }

    const textoRaw = await file.text();
    const texto = textoRaw.replace(/^\uFEFF/, '');
    const resultado = validarEImportarCsvV5(texto, categorias, file.size);

    if (!resultado.ok) {
      setAviso({ tipo: 'error', mensaje: resultado.error });
      return;
    }

    await db.transaction('rw', db.categorias, db.movimientos, async () => {
      if (resultado.nuevasCategorias.length > 0) {
        await db.categorias.bulkPut(resultado.nuevasCategorias);
      }
      if (modoImportacionCsv === 'reemplazar') {
        await db.movimientos.clear();
      }
      if (resultado.movimientos.length > 0) {
        await db.movimientos.bulkPut(resultado.movimientos);
      }
    });

    setAviso({
      tipo: 'exito',
      mensaje: `CSV importado correctamente: ${resultado.movimientos.length} movimiento(s)${
        resultado.nuevasCategorias.length > 0
          ? ` y ${resultado.nuevasCategorias.length} categoría(s) nueva(s)`
          : ''
      }.`
    });
  };

  return (
    <Reveal className="panel p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2.5">
          <HardDriveDownload className="h-5 w-5 text-coral" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold text-text">
              Respaldo e importación (JSON y CSV V5)
            </h2>
            <p className="text-xs text-text-muted">
              Máximo 5 MB por archivo. Si un archivo tiene errores o datos manipulados, se rechaza
              por completo sin alterar tu base de datos.
            </p>
          </div>
        </div>
        <span className="font-mono text-xs text-text-muted">
          Último respaldo:{' '}
          {ultimoRespaldoEn ? formatFechaCorta(ultimoRespaldoEn.slice(0, 10)) : 'Nunca'}
        </span>
      </div>

      <LiveNotice aviso={aviso} onDismiss={() => setAviso(null)} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bloque JSON completo */}
        <div className="panel-inset p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-sand" aria-hidden="true" />
            <h3 className="text-sm font-bold text-text">Respaldo completo JSON</h3>
          </div>
          <p className="text-xs text-text-muted">
            Guarda y restaura exactamente tus categorías, presupuestos mensuales y todos tus
            movimientos.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => void handleExportarJson()}
              className="tappable tappable-hover min-h-[44px] inline-flex items-center gap-2 rounded-full pill-sand px-4 py-2 text-xs font-bold "
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Exportar JSON</span>
            </button>

            <button
              type="button"
              onClick={() => inputJsonRef.current?.click()}
              className="tappable min-h-[44px] inline-flex items-center gap-2 rounded-full pill-plum px-4 py-2 text-xs font-semibold "
            >
              <Upload className="h-4 w-4 text-coral" aria-hidden="true" />
              <span>Importar JSON</span>
            </button>
            <input
              ref={inputJsonRef}
              type="file"
              accept=".json,application/json"
              onChange={(e) => void handleSeleccionarJson(e)}
              className="sr-only"
              aria-label="Seleccionar archivo de respaldo JSON"
            />
          </div>
        </div>

        {/* Bloque CSV Hoja V5 */}
        <div className="panel-inset p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-ok" aria-hidden="true" />
            <h3 className="text-sm font-bold text-text">Hoja de Google Sheets (CSV V5)</h3>
          </div>
          <p className="text-xs text-text-muted">
            Importa o exporta la pestaña MOVIMIENTOS con formato{' '}
            <span className="font-mono">dd/MM/yyyy</span> y decimales con coma.
          </p>

          <div className="flex items-center gap-3 text-xs">
            <label htmlFor="modo-csv-select" className="text-text-muted">
              Al importar CSV:
            </label>
            <select
              id="modo-csv-select"
              value={modoImportacionCsv}
              onChange={(e) =>
                setModoImportacionCsv(e.target.value as 'combinar' | 'reemplazar')
              }
              className="field min-h-[40px] px-3 py-1.5 text-xs"
            >
              <option value="combinar">Combinar / actualizar por ID</option>
              <option value="reemplazar">Reemplazar movimientos actuales</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => void handleExportarCsv()}
              className="tappable min-h-[44px] inline-flex items-center gap-2 rounded-full pill-plum px-4 py-2 text-xs font-semibold "
            >
              <Download className="h-4 w-4 text-ok" aria-hidden="true" />
              <span>Exportar CSV</span>
            </button>

            <button
              type="button"
              onClick={() => inputCsvRef.current?.click()}
              className="tappable min-h-[44px] inline-flex items-center gap-2 rounded-full pill-plum px-4 py-2 text-xs font-semibold "
            >
              <Upload className="h-4 w-4 text-ok" aria-hidden="true" />
              <span>Importar CSV V5</span>
            </button>
            <input
              ref={inputCsvRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => void handleSeleccionarCsv(e)}
              className="sr-only"
              aria-label="Seleccionar archivo CSV exportado de la hoja"
            />
          </div>
        </div>
      </div>

      {/* Modal de confirmación para restaurar respaldo JSON */}
      <Modal
        open={Boolean(respaldoJsonPendiente)}
        onClose={() => setRespaldoJsonPendiente(null)}
        title="Confirmar restauración de respaldo JSON"
        description="El archivo fue validado correctamente."
      >
        {respaldoJsonPendiente && (
          <div className="space-y-4">
            <div className="panel-inset p-3.5 text-xs space-y-1">
              <p className="text-text font-semibold">
                Resumen del archivo a restaurar:
              </p>
              <p className="text-text-muted">
                • Categorías: <strong className="font-mono text-text">{respaldoJsonPendiente.categorias.length}</strong>
              </p>
              <p className="text-text-muted">
                • Movimientos: <strong className="font-mono text-text">{respaldoJsonPendiente.movimientos.length}</strong>
              </p>
              <p className="text-text-muted">
                • Exportado en: <strong className="font-mono text-text">{formatFechaCorta(respaldoJsonPendiente.exportadoEn.slice(0, 10))}</strong>
              </p>
            </div>
            <p className="text-xs text-text-muted">
              Al confirmar, tus categorías y movimientos actuales serán reemplazados por los de este
              respaldo.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRespaldoJsonPendiente(null)}
                className="tappable min-h-[44px] rounded-full pill-plum px-4 py-2 text-sm font-medium "
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmarRestaurarJson()}
                className="tappable min-h-[44px] rounded-full pill-sand px-4 py-2 text-sm font-bold "
              >
                Restaurar datos
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Reveal>
  );
}
