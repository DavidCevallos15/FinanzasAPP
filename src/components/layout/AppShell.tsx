import { NavLink, Outlet, useLocation } from 'react-router';
import {
  ArrowLeftRight,
  BarChart3,
  ExternalLink,
  Home,
  MoreHorizontal,
  ShieldCheck,
  Tags,
  Wallet
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

interface AppShellProps {
  persistenciaConcedida: boolean;
}

export function AppShell({ persistenciaConcedida }: AppShellProps) {
  const location = useLocation();
  const etiquetaMesActual = formatEtiquetaMes(mesActualClave());

  return (
    <div className="min-h-dvh w-full bg-bg text-text flex flex-col md:flex-row overflow-x-hidden">
      {/* Barra lateral Desktop (>=768px) */}
      <aside
        aria-label="Navegación lateral"
        className="hidden md:flex md:w-64 lg:w-72 md:flex-col md:fixed md:inset-y-0 md:left-0 bg-card border-r border-border z-30 select-none"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-gold/15 border border-accent-gold/30 text-accent-gold">
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="block text-base font-bold tracking-tight text-text">
                Mis Finanzas
              </span>
              <span className="block text-xs text-text-muted font-mono">
                USD · {etiquetaMesActual}
              </span>
            </div>
          </div>
        </div>

        <nav aria-label="Principal" className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'tappable flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/30'
                    : 'text-text-muted hover:text-text hover:bg-bg/60 border border-transparent'
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-3 bg-bg/40">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <ShieldCheck
              className={cn(
                'h-4 w-4 shrink-0',
                persistenciaConcedida ? 'text-ok' : 'text-alerta'
              )}
              aria-hidden="true"
            />
            <span>
              {persistenciaConcedida
                ? 'Almacenamiento local protegido'
                : 'Datos guardados en este navegador'}
            </span>
          </div>

          <div className="pt-2 border-t border-border/60 text-xs text-text-muted">
            <a
              href="https://davidcevallos.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="tappable inline-flex items-center gap-1.5 text-text-muted hover:text-accent-gold transition-colors py-1"
            >
              <span>Creado por David Cevallos</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </a>
          </div>
        </div>
      </aside>

      {/* Cabecera Móvil (<768px) */}
      <header className="md:hidden sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-gold/15 border border-accent-gold/30 text-accent-gold">
              <Wallet className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="text-base font-bold tracking-tight text-text">
              Mis Finanzas
            </span>
          </div>
          <span className="rounded-full bg-bg border border-border px-2.5 py-1 text-xs font-mono text-text-muted">
            {etiquetaMesActual}
          </span>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="flex-1 md:pl-64 lg:pl-72 flex flex-col min-w-0">
        <main
          id="contenido-principal"
          className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:pb-10"
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
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-border pb-[env(safe-area-inset-bottom,0px)]"
      >
        <ul className="grid grid-cols-5 h-16">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'tappable flex flex-1 flex-col items-center justify-center gap-1 min-h-[44px] min-w-[44px] px-1 text-[11px] font-medium transition-colors',
                    isActive
                      ? 'text-accent-gold'
                      : 'text-text-muted hover:text-text'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex items-center justify-center rounded-full px-3 py-1 transition-colors',
                        isActive ? 'bg-accent-gold/15' : 'bg-transparent'
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    </span>
                    <span className="truncate max-w-full">{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
