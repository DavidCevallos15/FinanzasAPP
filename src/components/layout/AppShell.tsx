import { NavLink, Outlet, useLocation } from 'react-router';
import {
  ArrowLeftRight,
  BarChart3,
  ExternalLink,
  Home,
  MoreHorizontal,
  Tags
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { formatEtiquetaMes, mesActualClave } from '../../lib/format';
import { BackupReminderBanner } from '../../features/respaldo';
import { PageTransition } from '../motion/PageTransition';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/categorias', label: 'Categorías', icon: Tags },
  { to: '/mas', label: 'Más', icon: MoreHorizontal }
] as const;

/** Monograma de la marca: una moneda de arena con la "F" recortada. */
function MarcaMonograma({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="var(--color-sand)" />
      <circle cx="20" cy="20" r="14.5" fill="none" stroke="var(--color-ink)" strokeWidth="1.5" strokeDasharray="3 3" />
      <path
        d="M15 12h11v3.2h-7.4v4.1h6.4v3.1h-6.4V28H15z"
        fill="var(--color-ink)"
      />
    </svg>
  );
}

interface AppShellProps {
  persistenciaConcedida: boolean;
}

export function AppShell({ persistenciaConcedida }: AppShellProps) {
  const location = useLocation();
  const etiquetaMesActual = formatEtiquetaMes(mesActualClave());

  return (
    <div className="min-h-dvh w-full bg-bg text-text flex flex-col md:flex-row overflow-x-hidden">
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:pill-sand focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold"
      >
        Saltar al contenido principal
      </a>

      {/* Barra lateral Desktop (>=768px) */}
      <aside
        aria-label="Navegación lateral"
        className="hidden md:flex md:w-64 lg:w-72 md:flex-col md:fixed md:inset-y-0 md:left-0 bg-bg-deep z-30 select-none"
      >
        <div className="flex items-center gap-3 px-6 pt-7 pb-6">
          <MarcaMonograma className="h-11 w-11 shrink-0" />
          <div className="leading-tight">
            <span className="block text-lg font-bold tracking-tight text-text">Mis Finanzas</span>
            <span className="block text-xs text-text-muted">{etiquetaMesActual} · USD</span>
          </div>
        </div>

        <nav aria-label="Principal" className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'tappable flex items-center gap-3 min-h-[48px] px-4 py-2.5 rounded-full text-sm font-semibold',
                  isActive
                    ? 'pill-sand'
                    : 'text-text-muted hover:text-text hover:bg-card/70'
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-5 space-y-3">
          <div className="panel p-4 text-xs leading-relaxed">
            <p className="font-semibold text-text">
              {persistenciaConcedida ? 'Guardado en este dispositivo' : 'Guardado en este navegador'}
            </p>
            <p className="text-text-muted mt-0.5">
              Sin cuentas ni nube. Descarga un respaldo desde «Más».
            </p>
          </div>
          <a
            href="https://davidcevallos.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="tappable inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-sand py-1"
          >
            <span>Creado por David Cevallos</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </a>
        </div>
      </aside>

      {/* Cabecera Móvil (<768px) */}
      <header className="md:hidden sticky top-0 z-30 bg-bg/92 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2.5">
            <MarcaMonograma className="h-9 w-9 shrink-0" />
            <span className="text-lg font-bold tracking-tight text-text">Mis Finanzas</span>
          </div>
          <span className="rounded-full bg-card px-3 py-1.5 text-xs font-medium text-text-muted">
            {etiquetaMesActual}
          </span>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="flex-1 md:pl-64 lg:pl-72 flex flex-col min-w-0">
        <main
          id="contenido-principal"
          className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-4 md:py-8 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] md:pb-10"
        >
          <BackupReminderBanner />
          <PageTransition routeKey={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      {/* Barra inferior Móvil (<768px) */}
      <nav
        aria-label="Navegación móvil"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] pt-2 bg-gradient-to-t from-bg via-bg/95 to-transparent"
      >
        <ul className="grid grid-cols-5 h-16 rounded-full bg-bg-deep shadow-[var(--shadow-card)] px-1.5 py-1.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'tappable flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] rounded-full text-[11px] font-semibold',
                    isActive ? 'pill-sand' : 'text-text-muted hover:text-text'
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="truncate max-w-full">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
