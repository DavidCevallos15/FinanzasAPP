import { Link } from 'react-router';
import { AlertTriangle, Download } from 'lucide-react';
import { useAjuste, useCategorias, useMovimientos } from '../../db/hooks';
import { guardarAjuste } from '../../db/repositories';
import {
  debeMostrarBannerRespaldo,
  serializarRespaldoJson
} from './backupService';

export function BackupReminderBanner() {
  const movimientos = useMovimientos();
  const categorias = useCategorias();
  const ultimoRespaldoEn = useAjuste<string | null>('ultimoRespaldoEn', null);

  const evaluacion = debeMostrarBannerRespaldo(movimientos.length, ultimoRespaldoEn);

  if (!evaluacion.mostrar) {
    return null;
  }

  const exportarAhora = async () => {
    const ahoraIso = new Date().toISOString();
    const json = serializarRespaldoJson(categorias, movimientos, ahoraIso);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mis-finanzas-respaldo-${ahoraIso.slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    await guardarAjuste('ultimoRespaldoEn', ahoraIso);
  };

  return (
    <div
      role="region"
      aria-label="Recordatorio de respaldo"
      className="mb-5 rounded-2xl bg-alerta/12 border border-alerta/35 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div className="flex items-start sm:items-center gap-2.5 text-xs sm:text-sm">
        <AlertTriangle className="h-4 w-4 text-alerta shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
        <p className="text-text">
          <strong className="text-alerta">Haz un respaldo:</strong>{' '}
          {evaluacion.diasSinRespaldo !== null
            ? `Pasaron ${evaluacion.diasSinRespaldo} días desde tu último respaldo local.`
            : 'Tienes movimientos guardados en este dispositivo y aún no has descargado un respaldo.'}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => void exportarAhora()}
          className="tappable min-h-[44px] inline-flex items-center gap-1.5 rounded-full pill-sand px-3.5 py-2 text-xs font-bold "
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Descargar JSON</span>
        </button>
        <Link
          to="/mas"
          className="tappable min-h-[44px] inline-flex items-center rounded-full pill-plum px-3 py-2 text-xs font-medium "
        >
          Ver opciones
        </Link>
      </div>
    </div>
  );
}
