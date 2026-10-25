import {
  CalendarRange,
  Download,
  ExternalLink,
  HardDriveDownload,
  Info,
  RotateCcw,
  ShieldAlert,
  Smartphone,
  Upload
} from 'lucide-react';
import { Reveal } from '../../components/motion/Reveal';
import type { BeforeInstallPromptEvent } from '../../lib/storage';

interface MasPageProps {
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstallApp: () => Promise<void>;
  persistenciaConcedida: boolean;
}

export function MasPage({
  deferredPrompt,
  onInstallApp,
  persistenciaConcedida
}: MasPageProps) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
          Más opciones
        </h1>
        <p className="text-sm text-text-muted">
          Historial mensual y anual, respaldos locales, instalación de la app y mantenimiento.
        </p>
      </header>

      {/* Aviso honesto sobre persistencia local */}
      <Reveal className="bg-card border border-accent-cyan/30 rounded-2xl p-4 sm:p-5 space-y-2">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-accent-cyan shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1 text-sm">
            <h2 className="font-semibold text-text">
              Tus datos viven únicamente en este dispositivo
            </h2>
            <p className="text-text-muted leading-relaxed">
              Mis Finanzas funciona sin cuentas ni servidores externos. Si borras los datos del
              navegador, perderás tus registros. En iPhone (Safari), el sistema puede limpiar los
              datos si la app no está instalada en la pantalla de inicio y pasas varios días sin
              abrirla. Te recomendamos exportar un respaldo JSON periódicamente.
            </p>
            <p className="font-mono text-xs text-accent-cyan pt-1">
              Estado de persistencia del navegador:{' '}
              {persistenciaConcedida ? 'Concedida (protegida)' : 'Estándar del navegador'}
            </p>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Historial */}
        <Reveal className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <CalendarRange className="h-5 w-5 text-accent-gold" aria-hidden="true" />
            <h2 className="text-base font-semibold text-text">Historial por mes y año</h2>
          </div>
          <p className="text-xs text-text-muted">
            Consulta el resumen histórico de ingresos, gastos, saldo, porcentaje gastado y estado
            mes a mes o consolidado por año.
          </p>
        </Reveal>

        {/* Respaldo */}
        <Reveal delay={0.04} className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <HardDriveDownload className="h-5 w-5 text-accent-cyan" aria-hidden="true" />
            <h2 className="text-base font-semibold text-text">Respaldo (JSON / CSV)</h2>
          </div>
          <p className="text-xs text-text-muted">
            Exporta o importa tu respaldo completo en JSON o importa movimientos en CSV desde la
            hoja de Google Sheets V5.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-bg border border-border px-3 py-1.5 text-xs text-text-muted">
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Exportar JSON
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-bg border border-border px-3 py-1.5 text-xs text-text-muted">
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              Importar JSON / CSV
            </span>
          </div>
        </Reveal>

        {/* Instalar App PWA */}
        <Reveal delay={0.08} className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <Smartphone className="h-5 w-5 text-ok" aria-hidden="true" />
            <h2 className="text-base font-semibold text-text">Instalar aplicación</h2>
          </div>
          <p className="text-xs text-text-muted">
            Instala Mis Finanzas en tu teléfono o computadora para abrirla en pantalla completa y
            usarla sin conexión.
          </p>
          {deferredPrompt ? (
            <button
              type="button"
              onClick={() => void onInstallApp()}
              className="tappable tappable-hover min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-accent-gold px-4 py-2 text-sm font-bold text-bg"
            >
              <Smartphone className="h-4 w-4" aria-hidden="true" />
              <span>Instalar Mis Finanzas</span>
            </button>
          ) : (
            <p className="text-xs text-text-muted bg-bg border border-border rounded-xl p-3">
              En Android/Chrome o Desktop usa el ícono de instalar en la barra de direcciones. En
              iPhone/iPad abre el menú Compartir en Safari y elige{' '}
              <strong className="text-text">«Agregar a pantalla de inicio»</strong>.
            </p>
          )}
        </Reveal>

        {/* Reset en dos niveles */}
        <Reveal delay={0.12} className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 text-mal" aria-hidden="true" />
            <h2 className="text-base font-semibold text-text">Restablecer datos</h2>
          </div>
          <p className="text-xs text-text-muted">
            Dos niveles de limpieza: borrar únicamente los movimientos conservando tus categorías y
            presupuestos, o hacer un Reset de fábrica escribiendo RESET.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-bg border border-border px-3 py-1.5 text-xs text-text-muted">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Borrar movimientos
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-mal/10 border border-mal/30 px-3 py-1.5 text-xs text-mal">
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
              Reset de fábrica
            </span>
          </div>
        </Reveal>
      </div>

      {/* Créditos */}
      <footer className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-text">Mis Finanzas · PWA Local-First</p>
          <p className="text-xs text-text-muted">
            Paridad funcional con Hoja de Control Financiero V5 (es-EC · USD).
          </p>
        </div>
        <a
          href="https://davidcevallos.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="tappable min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-bg border border-border px-4 py-2 text-sm font-medium text-accent-gold hover:border-accent-gold/50"
        >
          <span>Creado por David Cevallos</span>
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}
