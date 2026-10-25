ROL Y MODO DE TRABAJO
Eres un ingeniero full-stack senior. Vas a construir una app web desde cero, por fases. Al terminar cada fase te detienes, muestras un resumen (archivos creados, cómo probarla, qué falta) y esperas mi OK. No avances sin OK. Si algo es ambiguo, pregunta con opciones; no inventes requisitos. No añadas dependencias fuera de la lista del stack sin consultarme. No toques archivos fuera de esta carpeta. Commits pequeños con Conventional Commits.

OBJETIVO
"Mis Finanzas": PWA responsiva (móvil primero, también desktop) para registrar ingresos y gastos, repartir presupuesto por categoría, ver un dashboard con semáforo y un historial mes a mes. Es la versión web de una hoja de Google Sheets + Apps Script (V5) que ya existe; debe tener paridad funcional con ella. Idioma: español (es-EC). Moneda: USD.

USUARIO
Una persona que recibe pagos puntuales (bono, beca, sueldo pequeño) y quiere ordenar su plata sin cuentas ni complicaciones. Cada persona ve solo sus propios datos.

DECISIONES CERRADAS (no reabrir)
- Persistencia: local-first en IndexedDB, sin cuentas ni backend. Respaldo por exportar/importar JSON.
- Alcance: paridad con la hoja V5 (ver "Dentro de alcance").
- Animación: base sobria (ver Motion Spec).
- Créditos: texto "Creado por David Cevallos" enlazado a https://davidcevallos.vercel.app (target="_blank", rel="noopener noreferrer").

DENTRO DE ALCANCE
1. CRUD de movimientos (crear, editar, eliminar con confirmación).
2. CRUD de categorías con presupuesto mensual; renombrar propaga a sus movimientos; borrar una categoría con movimientos exige reasignarlos a otra del mismo tipo.
3. Dashboard del mes en curso con navegación a otros meses.
4. Historial por mes y por año.
5. Reset en dos niveles: "Borrar movimientos" (conserva categorías) y "Reset de fábrica" (todo, pide escribir RESET).
6. Exportar e importar respaldo JSON (validado). Importar CSV exportado de la hoja (columnas: ID, Fecha, Tipo, Categoría, Descripción, Monto, Método, Observación, Última modificación; fecha dd/MM/yyyy, decimal con coma).
7. PWA instalable y funcional offline.

FUERA DE ALCANCE (no lo implementes)
Cuentas/login, backend, sincronización entre dispositivos, metas de ahorro, gastos recurrentes, multi-moneda, i18n, publicidad, analytics, notificaciones push.

STACK CERRADO
Vite + React (última estable) + TypeScript estricto + Tailwind CSS v4 (@tailwindcss/vite) + motion (import desde 'motion/react') + dexie + dexie-react-hooks + zod + react-router + vite-plugin-pwa + lucide-react + clsx + tailwind-merge. Pruebas: vitest. Sin librería de gráficos: los gráficos son SVG/CSS propios. Prohibido: Lenis, GSAP, Three.js, Docker, UI kits pesados, cursor custom.
Reglas TS: tsconfig con verbatimModuleSyntax, noUnusedLocals/Parameters, erasableSyntaxOnly (nada de enums ni parameter properties). Código modular y tipado.

MODELO DE DATOS (Dexie, DB "mis-finanzas")
- movimientos: { id: string (crypto.randomUUID), fecha: string 'YYYY-MM-DD', tipo: 'Ingreso'|'Gasto', categoria: string, descripcion: string, montoCentavos: number (entero >0), metodo: string, observacion: string, actualizadoEn: string ISO }
- categorias: { nombre: string (clave única), tipo: 'Ingreso'|'Gasto', presupuestoCentavos: number (>=0) }
- ajustes: { clave: string, valor: unknown } (último respaldo, persistencia concedida, etc.)
Dinero SIEMPRE en centavos enteros; solo se formatea al mostrar (Intl.NumberFormat 'es-EC', USD).
Los totales, dashboard, historial y datos de gráficos se CALCULAN desde movimientos; nunca se guardan.
Categorías iniciales (presupuesto 0): Ingreso: Sueldo, Ventas, Otros ingresos. Gasto: Vivienda, Alimentación, Transporte, Servicios, Telefonía, Salud, Educación, Cuidado Personal, Antojos, Entretenimiento, Ahorro Laptop, Otros gastos.

REGLAS DE NEGOCIO (tomadas de la hoja V5; implementa como funciones puras en src/domain/ con pruebas vitest)
Estado del mes (gasto/ingreso del mes):
- ingreso=0 y gasto=0 → "SIN DATOS"
- ingreso=0 y gasto>0 → "CRÍTICO"
- p<=0,70 → "BIEN"; p<=0,90 → "ALERTA"; p<=1,00 → "RIESGO"; p>1 → "MAL"
Estado por categoría (gastado/presupuesto del mes):
- categoría con movimientos pero que ya no existe → "Revisar categoría"
- presupuesto>0 y pct>1 → "Excedido"; pct>=0,80 → "Cerca del límite"; presupuesto>0 → "OK"
- presupuesto=0 y gastado>0 → "Sin presupuesto"; si no, "—"
El estado nunca se comunica solo con color: siempre icono + texto.
Dashboard del mes: ingresos, gastos, saldo, % gastado, estado; saldo acumulado histórico; ingresos y gastos del año; tabla de presupuesto por categoría (Presupuesto, Gastado, Disponible, % usado, Estado) con fila TOTAL; gráficos: ingresos vs gastos por semana del mes, ingresos vs gastos por mes, y gasto por categoría del mes.
Historial: por mes (Ingresos, Gastos, Saldo, % gastado, Estado, Nº movimientos) y por año (Ingresos, Gastos, Saldo).
Formulario: la categoría depende del tipo elegido (solo categorías de ese tipo). Validación con zod: monto>0, fecha válida, categoría existente.
Eliminar siempre pide confirmación explícita. Reset de fábrica exige escribir "RESET".

PANTALLAS Y NAVEGACIÓN
- Móvil (<768px): barra inferior con Inicio, Movimientos, Dashboard, Categorías, Más. "Más": historial, respaldo (exportar/importar), reset, instalar app, créditos.
- Desktop: barra lateral con las mismas secciones y los créditos al pie.
- Inicio: formulario de registro (fecha por defecto hoy, tipo como segmentado, categoría dependiente, monto con inputMode="decimal", descripción, método de pago, observación) + últimos 5 movimientos con editar/eliminar.
- Movimientos: lista filtrable (mes, tipo, categoría, búsqueda de texto) con editar y eliminar.
Responsividad: probar en 360, 390, 768, 1280 px. Sin scroll horizontal. Zonas táctiles >=44px. Usar svh/dvh, no vh. Respetar env(safe-area-inset-*). Tablas anchas se convierten en tarjetas en móvil.

MARCA Y TOKENS
Todo el color/tipografía vive en UN archivo (src/styles/globals.css, bloque @theme) para poder cambiar la marca luego sin tocar componentes. Paleta inicial, oscura por defecto: fondo #0B0F19, tarjeta #161B2A, borde #242C42, texto #F4F6FC, texto secundario #8A99AD, acento dorado #E2B65C, acento cian #00B4D8, ok #34D399, alerta #FBBF24, riesgo #FB923C, mal #F87171. Fuentes: Space Grotesk (texto) y Geist Mono (cifras), con @fontsource-variable o equivalente self-hosted, solo los pesos usados.

MOTION SPEC (skill web-animation-stack; todo respeta prefers-reduced-motion)
Solo se animan transform, opacity, clip-path y filter. Tokens de easing/duración en src/lib/motion.ts y @theme (feedback 160ms, interactive 240ms, disclosure 320ms, reveal 980ms).
| Elemento | Técnica | Trigger | Duración | Reduced-motion |
| Tarjetas al entrar | Reveal (opacity + y) | whileInView, once | 0,98s reveal | sin animación |
| Cifras del dashboard | Contador numérico | al montar | 0,6s | valor final directo |
| Barras de presupuesto | scaleX | al montar | 0,5s | sin animación |
| Cambio de pantalla | fade + slide corto | navegación | 0,24s | fade simple |
| Botones y filas | feedback hover/press (CSS) | hover/press | 0,16s | sin animación |
Estructura: src/components/motion/ (Reveal, CountUp, ...), src/lib/motion.ts.

PWA Y PERSISTENCIA
- vite-plugin-pwa (autoUpdate), manifest: name "Mis Finanzas", short_name "Finanzas", display standalone, theme_color #0B0F19, íconos 192/512 y maskable.
- Funciona sin conexión tras la primera visita.
- Al iniciar, llamar navigator.storage.persist() y guardar el resultado.
- Aviso honesto en "Más": los datos viven en este dispositivo; si se borran los datos del navegador se pierden; Safari en iPhone puede limpiarlos si no está instalada. Mostrar un banner de "haz un respaldo" si hay datos y pasaron >30 días desde el último respaldo.

SEGURIDAD Y PRIVACIDAD
- Cero llamadas de red salvo los assets propios. Sin analytics ni terceros.
- Importación: máximo 5 MB, validar todo con zod, rechazar el archivo completo si algo es inválido; nunca ejecutar ni interpretar HTML. Prohibido dangerouslySetInnerHTML.
- Exportar CSV/JSON: neutralizar inyección de fórmulas (celdas de texto que empiecen por = + - @ se prefijan con comilla simple en el CSV).
- Cabeceras en vercel.json: X-Content-Type-Options nosniff, Referrer-Policy no-referrer, y una CSP restrictiva compatible con el service worker.

ACCESIBILIDAD Y RENDIMIENTO
Labels en todos los campos, foco visible, contraste AA, orden de tabulación lógico, anuncios con aria-live para guardados/errores. Metas Lighthouse móvil: LCP<2,5s, CLS<0,1, INP<200ms, JS inicial <170 KB gzip (gráficos y pantallas pesadas con lazy()).

ESTRUCTURA
src/{domain,db,features/{movimientos,categorias,dashboard,historial,respaldo,ajustes},components/{ui,layout,motion},lib,styles}, public/ (íconos), vercel.json.

FASES Y CRITERIOS DE ACEPTACIÓN
1. Base: proyecto, tokens, layout responsivo con navegación, PWA instalable. Aceptación: build y tsc sin errores; instalable; se ve bien en 390 y 1280.
2. Datos: Dexie, categorías iniciales, CRUD de movimientos y categorías, reset de dos niveles. Aceptación: los datos sobreviven a recargar y a modo avión; renombrar propaga; borrar categoría exige reasignar.
3. Dashboard e historial: funciones puras + pruebas vitest de los umbrales y de los cálculos; pantallas y gráficos. Aceptación: con los datos de ejemplo (ingreso 400; gastos 12 transporte, 25 alimentación, 5 telefonía, 41,50 antojos, 100 ahorro laptop) el estado del mes es "BIEN" (183,50/400 = 45,9%), Antojos aparece "Excedido" con presupuesto 40 y Ahorro Laptop "Cerca del límite" con presupuesto 100 (pct = 1,00, que es >=0,80 y no >1).
4. Respaldo: exportar/importar JSON y CSV con validación y banner de respaldo. Aceptación: un archivo manipulado se rechaza entero con mensaje claro; exportar e importar deja los datos idénticos.
5. Pulido y deploy: Motion Spec, créditos, accesibilidad, rendimiento, vercel.json con rewrite de SPA a /index.html. Aceptación: Lighthouse dentro de metas; sin errores de consola.

DEFINICIÓN DE TERMINADO
npm run build, tsc y vitest pasan; probado en 360/390/768/1280; instalable; funciona offline; créditos visibles con enlace al portafolio; ninguna dependencia fuera de la lista; README con cómo correrlo y cómo desplegarlo en Vercel.

EMPIEZA: confirma que entendiste, lista cualquier duda en una sola tanda de preguntas, y espera mi OK para iniciar la Fase 1.