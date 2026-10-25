import { useState } from 'react';
import { Filter, Search } from 'lucide-react';
import { Reveal } from '../../components/motion/Reveal';
import { formatEtiquetaMes, mesActualClave } from '../../lib/format';

export function MovimientosPage() {
  const [busqueda, setBusqueda] = useState('');
  const [mesFiltro, setMesFiltro] = useState(mesActualClave());
  const [tipoFiltro, setTipoFiltro] = useState('TODOS');

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Movimientos
          </h1>
          <p className="text-sm text-text-muted">
            Filtra por mes, tipo, categoría o texto para editar o eliminar registros.
          </p>
        </div>
      </header>

      <Reveal className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
          <Filter className="h-4 w-4 text-accent-cyan" aria-hidden="true" />
          <span>Filtros de búsqueda</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label htmlFor="filtro-texto" className="sr-only">
              Buscar por descripción u observación
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted"
                aria-hidden="true"
              />
              <input
                id="filtro-texto"
                type="search"
                placeholder="Buscar descripción, categoría u observación..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full min-h-[44px] rounded-xl bg-bg border border-border pl-10 pr-3.5 py-2 text-base text-text placeholder:text-text-muted/50 focus:border-accent-cyan"
              />
            </div>
          </div>

          <div>
            <label htmlFor="filtro-mes" className="sr-only">
              Mes
            </label>
            <input
              id="filtro-mes"
              type="month"
              value={mesFiltro}
              onChange={(e) => setMesFiltro(e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-bg border border-border px-3.5 py-2 font-mono text-base text-text focus:border-accent-cyan"
            />
          </div>

          <div>
            <label htmlFor="filtro-tipo" className="sr-only">
              Tipo
            </label>
            <select
              id="filtro-tipo"
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-bg border border-border px-3.5 py-2 text-base text-text focus:border-accent-cyan"
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="Ingreso">Solo Ingresos</option>
              <option value="Gasto">Solo Gastos</option>
            </select>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.05} className="bg-card border border-border rounded-2xl p-6 text-center space-y-2">
        <p className="text-sm font-medium text-text">
          Sin movimientos en {formatEtiquetaMes(mesFiltro)}
        </p>
        <p className="text-xs text-text-muted">
          Registra un ingreso o gasto desde Inicio para verlo listado aquí.
        </p>
      </Reveal>
    </div>
  );
}
