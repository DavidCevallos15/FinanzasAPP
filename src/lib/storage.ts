export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const STORAGE_PERSIST_KEY = 'mis-finanzas:persistencia-concedida';

export async function solicitarPersistenciaAlmacenamiento(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persist) {
    return false;
  }
  try {
    const yaPersistente = await navigator.storage.persisted();
    if (yaPersistente) {
       guardarEstadoPersistenciaLocal(true);
      return true;
    }
    const concedida = await navigator.storage.persist();
    guardarEstadoPersistenciaLocal(concedida);
    return concedida;
  } catch {
    return false;
  }
}

function guardarEstadoPersistenciaLocal(concedida: boolean): void {
  try {
    localStorage.setItem(STORAGE_PERSIST_KEY, JSON.stringify({
      concedida,
      verificadoEn: new Date().toISOString()
    }));
  } catch {
    // Ignorar errores de acceso a localStorage en modo privado estricto
  }
}

export function leerEstadoPersistenciaLocal(): { concedida: boolean; verificadoEn: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_PERSIST_KEY);
    if (!raw) return { concedida: false, verificadoEn: null };
    const parsed = JSON.parse(raw) as { concedida?: unknown; verificadoEn?: unknown };
    return {
      concedida: Boolean(parsed.concedida),
      verificadoEn: typeof parsed.verificadoEn === 'string' ? parsed.verificadoEn : null
    };
  } catch {
    return { concedida: false, verificadoEn: null };
  }
}
