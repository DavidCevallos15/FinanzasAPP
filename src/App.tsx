import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { asegurarSemillaInicial } from './db/database';
import { guardarAjuste } from './db/repositories';
import { MasPage } from './features/ajustes/MasPage';
import { CategoriasPage } from './features/categorias/CategoriasPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { InicioPage } from './features/movimientos/InicioPage';
import { MovimientosPage } from './features/movimientos/MovimientosPage';
import {
  leerEstadoPersistenciaLocal,
  solicitarPersistenciaAlmacenamiento,
  type BeforeInstallPromptEvent
} from './lib/storage';

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
          <Route path="movimientos" element={<MovimientosPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="categorias" element={<CategoriasPage />} />
          <Route
            path="mas"
            element={
              <MasPage
                deferredPrompt={deferredPrompt}
                onInstallApp={handleInstallApp}
                persistenciaConcedida={persistenciaConcedida}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
