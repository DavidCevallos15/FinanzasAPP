# Mis Finanzas (FinanzasAPP)

Aplicación web progresiva (**PWA**) **local-first** (móvil primero y desktop) para registrar ingresos y gastos, repartir presupuesto mensual por categoría, visualizar un dashboard con semáforo financiero y consultar el historial mes a mes y año a año.

Diseñada con **paridad funcional completa** respecto a la hoja de Google Sheets + Apps Script (**V5**), localizada para **Ecuador (`es-EC`, moneda `USD`)**, sin cuentas, sin servidores externos y 100 % funcional sin conexión tras la primera visita.

---

## Características principales

1. **CRUD de movimientos**:
   - Registro rápido desde **Inicio** (fecha por defecto hoy, selector segmentado Ingreso/Gasto, categoría dependiente del tipo, monto con teclado decimal `inputMode="decimal"`, descripción, método de pago y observación) y vista de los últimos 5 movimientos.
   - Pantalla **Movimientos** con búsqueda de texto y filtros combinables por mes, tipo y categoría (tarjetas en móvil y tabla en desktop).
   - Confirmación explícita antes de eliminar cualquier registro.
2. **CRUD de categorías y presupuesto mensual**:
   - 15 categorías iniciales sembradas automáticamente con presupuesto `$0,00`.
   - Renombrar una categoría propaga el nuevo nombre automáticamente a todos sus movimientos asociados.
   - Eliminar una categoría con movimientos exige elegir a qué otra categoría del mismo tipo se reasignarán antes de borrarla.
3. **Dashboard financiero con semáforo e indicadores**:
   - Navegación mes a mes.
   - Tarjetas de Ingresos, Gastos, Saldo del mes y **Estado del mes** (`SIN DATOS`, `CRÍTICO`, `BIEN`, `ALERTA`, `RIESGO`, `MAL`) comunicado siempre con **icono + texto**.
   - Saldo acumulado histórico, ingresos/gastos del año y porcentaje gastado del mes.
   - Tabla/tarjetas de ejecución presupuestaria por categoría (`OK`, `Cerca del límite`, `Excedido`, `Sin presupuesto`, `Revisar categoría`) con fila `TOTAL`.
   - 3 gráficos propios en SVG/CSS: Ingresos vs Gastos por semana del mes, Ingresos vs Gastos por mes (últimos 12 meses) y Dona de distribución de gastos por categoría.
4. **Historial mensual y anual**:
   - Consolidado automático por mes y por año calculado en tiempo real desde los movimientos.
5. **Respaldo local seguro (JSON y CSV V5)**:
   - Exportación e importación de respaldo completo en **JSON** validado íntegramente con **Zod** (límite de 5 MB; si un dato está manipulado, se rechaza el archivo completo).
   - Exportación e importación de **CSV** compatible con la pestaña `MOVIMIENTOS` de Google Sheets V5 (`dd/MM/yyyy` y coma decimal), con neutralización contra inyección de fórmulas (`=`, `+`, `-`, `@`).
   - Banner automático de recordatorio cuando existen movimientos y han pasado más de 30 días desde el último respaldo.
6. **Reset en dos niveles**:
   - **Nivel 1 — Borrar movimientos**: elimina todos los movimientos conservando tus categorías y presupuestos.
   - **Nivel 2 — Reset de fábrica**: restaura toda la base de datos a su estado original exigiendo escribir `RESET`.

---

## Stack tecnológico

- **Vite + React 19 + TypeScript estricto** (`verbatimModuleSyntax`, `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`)
- **Tailwind CSS v4** (`@tailwindcss/vite`) con tokens centralizados en `src/styles/globals.css` (`@theme`)
- **Persistencia local**: IndexedDB mediante **Dexie** (`dexie` + `dexie-react-hooks`) y `navigator.storage.persist()`
- **Validación**: **Zod**
- **Animaciones**: **Motion** (`motion/react`) respetando `prefers-reduced-motion`
- **PWA**: `vite-plugin-pwa` (Service Worker `autoUpdate` + Web App Manifest)
- **Pruebas unitarias**: **Vitest**

---

## Cómo correr el proyecto localmente

### Requisitos previos
- **Node.js** `>= 20` y **npm** `>= 10`

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar servidor de desarrollo
```bash
npm run dev
```
Abre `http://localhost:5173` en tu navegador.

### 3. Ejecutar pruebas unitarias (Vitest) y verificación de tipos
```bash
npm test
npm run typecheck
```

### 4. Compilar para producción y probar la PWA offline
```bash
npm run build
npm run preview
```

---

## Cómo desplegar en Vercel

El proyecto incluye `vercel.json` preconfigurado con:
- **Rewrite de SPA** hacia `/index.html` (respetando el manifiesto y el Service Worker de la PWA).
- **Cabeceras de seguridad**: `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY` y `Content-Security-Policy` restrictiva compatible con el Service Worker.

### Opción A: Desde el panel web de Vercel (recomendado)
1. Sube este repositorio a GitHub (`https://github.com/DavidCevallos15/FinanzasAPP`).
2. Entra en [vercel.com/new](https://vercel.com/new) e importa el repositorio `FinanzasAPP`.
3. Verifica la configuración detectada automáticamente:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Haz clic en **Deploy**.

### Opción B: Desde la terminal con Vercel CLI
```bash
npx vercel
# Para producción:
npx vercel --prod
```

---

## Créditos

Creado por [David Cevallos](https://davidcevallos.vercel.app)
