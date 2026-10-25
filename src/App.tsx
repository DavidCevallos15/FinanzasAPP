import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { asegurarSemillaInicial } from './db/database';
import { guardarAjuste } from './db/repositories';
import { InicioPage } from './features/movimientos/InicioPage';
import {
  leerEstadoPersistenciaLocal,
  solicitarPersistenciaAlmacenamiento,
  type BeforeInstallPromptEvent
} from './lib/storage';

const MovimientosPage = lazy(async () => {
  const m = await import('./features/movimientos/MovimientosPage');
  return { default: m.MovimientosPage };
});

const DashboardPage = lazy(async () => {
  const m = await import('./features/dashboard/DashboardPage');
  return { default: m.DashboardPage };
});

const CategoriasPage = lazy(async () => {
  const m = await import('./features/categorias/CategoriasPage');
  return { default: m.CategoriasPage };
});

const MasPage = lazy(async () => {
  const m = await import('./features/ajustes/MasPage');
  return { default: m.MasPage };
});

function PantallaCargando() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl bg-card border border-border p-8 text-center space-y-2"
    >
      <p className="text-sm font-medium text-text-muted">Cargando sección...</p>
    </div>
  );
}

export function App() {
  const [persistenciaConcedida, setPersistenciaConcedida] = useState<boolean>(
    () => leerEstadoPersistenciaLocal().concedida
  );
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    void asegurarSemillaInicial();
    void solicitarPersistenciaAlmacenamiento().then((concedida) => {
      setPersistenciaConcedida(concedida);
      void guardarAjuste('persistenciaConcedida', concedida);
    });
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell persistenciaConcedida={persistenciaConcedida} />}>
          <Route index element={<InicioPage />} />
          <Route
            path="movimientos"
            element={
              <Suspense fallback={<PantallaCargando />}>
                <MovimientosPage />
              </Suspense>
            }
          />
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<PantallaCargando />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="categorias"
            element={
              <Suspense fallback={<PantallaCargando />}>
                <CategoriasPage />
              </Suspense>
            }
          />
          <Route
            path="mas"
            element={
              <Suspense fallback={<PantallaCargando />}>
                <MasPage
                  deferredPrompt={deferredPrompt}
                  onInstallApp={handleInstallApp}
                  persistenciaConcedida={persistenciaConcedida}
                />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
