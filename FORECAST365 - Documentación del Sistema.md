# FORECAST365 — Documentación del Sistema
### Plataforma de Planificación de Demanda para PyMEs Latinoamericanas

**URL de producción:** https://forecast365.netlify.app  
**Versión:** 1.0.0 · Mayo 2026  
**Desarrollado para:** Feria de Emprendimiento

---

## ¿Qué es Forecast365?

Forecast365 es una plataforma SaaS (Software como Servicio) de inteligencia comercial diseñada para pequeñas y medianas empresas (PyMEs) de América Latina. Permite a los negocios importadores y distribuidores tomar decisiones basadas en datos reales: cuánto va a vender, cuándo reponer stock, cómo ajustar precios ante variaciones del tipo de cambio, y cómo optimizar su cadena logística.

El nombre "365" refleja el concepto de planificación anual continua — 365 días de visibilidad sobre el negocio.

---

## Estructura general de la aplicación

La aplicación tiene dos zonas principales:

1. **Zona pública** — Landing page, Login y Registro (sin autenticación requerida)
2. **Zona privada (App)** — Todos los módulos del sistema (requiere estar autenticado)

La navegación dentro del sistema se realiza a través de un **sidebar (menú lateral)** con dos secciones:
- **Módulos:** las herramientas principales de análisis
- **Operación:** páginas de soporte y configuración

---

## ZONA PÚBLICA

### 1. Landing Page (`/`)

La página principal de presentación del producto. Es lo primero que ve un visitante.

**Qué contiene:**
- **Hero principal:** Título, subtítulo y dos botones de acción — "Comenzar gratis" (va al registro) y "Ver demo" (va al login)
- **Sección de métricas:** 3 indicadores de impacto del producto (ej. "+47% precisión de pronóstico")
- **Sección "Por qué Forecast365":** 3 tarjetas explicando los beneficios clave: pronóstico con IA, gestión de inventario y análisis de tipo de cambio
- **Sección de características:** 6 tarjetas de funcionalidades del sistema con íconos
- **Testimonios:** Carrusel animado con opiniones de clientes ficticios que se desplazan automáticamente
- **CTA final:** Sección de llamada a la acción con botones para registrarse o iniciar sesión

**Comportamiento:** Todas las secciones tienen animaciones de entrada activadas por scroll (se revelan suavemente al bajar en la página). El menú de navegación en mobile es un drawer que se abre desde la derecha.

---

### 2. Login (`/login`)

Pantalla de inicio de sesión.

**Campos:** Email y Contraseña  
**Funcionalidad:** Cualquier combinación de email/contraseña válida permite ingresar (es una demo — no hay validación real de credenciales en servidor). Los datos del usuario se guardan en el localStorage del navegador.  
**Redirección:** Al hacer login exitoso, va directo al módulo Resumen (`/app/executive`)

---

### 3. Registro (`/register`)

Pantalla de creación de cuenta nueva.

**Campos:** Nombre completo, Empresa, Email, Contraseña  
**Funcionalidad:** Igual que el login — registra localmente y redirige al sistema  
**Plan asignado:** Por defecto asigna el plan "Professional"

---

## ZONA PRIVADA — MÓDULOS

### 4. Resumen Ejecutivo (`/app/executive`)

**Icono:** ✦ Sparkles  
**Propósito:** Vista general del negocio. Es el "dashboard" principal donde el gerente o dueño puede ver el estado de todo en un solo lugar.

**Qué muestra:**
- **Alerta de tipo de cambio:** Barra amarilla en la parte superior que avisa sobre variaciones del USD/BOB y su impacto en costos
- **Selector de período:** Botones "Hoy / Semana / Mes / Trimestre" — cambian todos los números del dashboard según el período seleccionado
- **KPI cards principales (fila superior):**
  - **Ingresos proyectados:** Total de ventas estimadas en el período, con variación porcentual respecto al período anterior
  - **Tipo de cambio:** USD/BOB actual con tendencia (sube/baja)
  - **Precisión del pronóstico:** Porcentaje de exactitud del modelo de predicción
  - **Demanda proyectada:** Unidades estimadas a vender, con tendencia
- **Gráfica de Revenue Projection:** Líneas que muestran ingresos reales vs. proyectados vs. proyección con IA a lo largo de los meses
- **Alertas activas:** Tabla con los productos que tienen problemas (stock crítico, exceso de inventario, ajustes de precio pendientes)
- **Feed de actividad reciente:** Lista cronológica de eventos del sistema (pedidos, cambios de precio, alertas)
- **Botón Exportar:** Genera un archivo Excel con 5 hojas: KPIs, Revenue Projection, Alertas, Actividad, Datos de tipo de cambio

**Nota:** Cuando se cargan datos reales desde Data Structuring, los gráficos y KPIs se actualizan automáticamente con esa información.

---

### 5. Simulador (`/app/simulator`)

**Icono:** 🧮 Calculator  
**Propósito:** Herramienta "what-if" (¿qué pasaría si...?) para que el usuario pueda probar escenarios antes de tomar decisiones reales.

**Qué permite simular:**
- Cambios en el tipo de cambio USD/BOB
- Variaciones en el volumen de ventas
- Cambios en costos de importación
- Ajustes de precios de venta

**Resultado:** Muestra en tiempo real cómo esos cambios afectarían el margen de ganancia, el punto de equilibrio y los ingresos proyectados.

---

### 6. Demanda (`/app/demand-planning`)

**Icono:** 📈 LineChart  
**Propósito:** Módulo central de pronóstico. Muestra cuánto se va a vender en los próximos meses usando el algoritmo de regresión lineal aplicado al historial de ventas.

**Qué muestra:**
- **KPI cards:** Demanda total proyectada, precisión del modelo, mes pico de ventas, productos con alerta
- **Gráfica de Demanda Total:** AreaChart con 3 líneas — ventas reales (historial), proyección estándar (+3%) y proyección óptima (−3%). Los meses futuros se muestran con fondo celeste para distinguirlos del historial
- **Gráfica de Estacionalidad:** Compara ventas del mismo mes en años distintos (ej. Enero 2023 vs Enero 2024) para detectar patrones de temporada alta/baja
- **Tabla "Por Producto":** Lista todos los productos con stock actual, stock óptimo y estado. Al hacer clic en una fila, abre el **Drawer de producto**

**Drawer de Producto (panel lateral):**
Al tocar/hacer clic en un producto, se abre un panel deslizante desde la derecha con:
- Métricas individuales: stock actual, stock óptimo, demanda promedio mensual, precio y costo
- Barra de progreso de stock (visual de cuánto stock queda vs. el óptimo)
- Gráfica individual del producto: 12 meses de historial + 6 meses de pronóstico, con banda de confianza (área azul claro alrededor de la línea)
- Recomendación de reorden: cuándo y cuánto pedir

---

### 7. Precios (`/app/price-committee`)

**Icono:** 💲 DollarSign  
**Propósito:** "Comité de precios" digital. Centraliza las decisiones de ajuste de precios considerando el tipo de cambio, costos de importación e inflación.

**KPI cards (siempre 3 columnas):**
- **Tipo de cambio actual:** USD/BOB con variación porcentual
- **Ajustes pendientes:** Cuántos productos tienen precio desactualizado (este número aparece también como badge rojo en el menú)
- **Impacto promedio:** Variación porcentual promedio de los ajustes recomendados

**Análisis predictivo de IA:**
- Predicción del tipo de cambio a 30 días con nivel de confianza
- Sugerencia de precio óptimo por producto con análisis de elasticidad

**Pestañas:**
- **Ajustes:** Lista de productos que necesitan actualización de precio. Cada uno muestra precio actual, precio recomendado, incremento % y costo en USD. Botones "Aplicar ahora" (aplica inmediatamente) y "Programar mañana"
- **USD/BOB:** Gráfica del historial del tipo de cambio de la última semana + estadísticas de mínimo, máximo y variación
- **Historial:** Registro de los últimos cambios de precio realizados (fecha, precio anterior → nuevo precio, motivo del cambio)

**Switch "Auto-aplicar":** Activa la aplicación automática de precios cuando se detectan cambios significativos.

---

### 8. Logística (`/app/logistics`)

**Icono:** 🚢 Ship  
**Propósito:** Seguimiento de envíos y gestión de la cadena de suministro, desde el proveedor hasta el almacén.

**KPI cards con sparklines:**
- Envíos activos
- En tránsito
- En aduana
- Tiempo promedio de entrega

**Timeline de etapas:** Barra visual de progreso con 5 etapas conectadas — Orden Colocada → En Tránsito → En Aduana → Procesamiento → Entregado. Cada envío muestra en qué etapa está.

**Tarjetas de envíos:** Cada envío activo tiene su propia tarjeta con origen, destino, transportista, ETA, costo y progreso (barra porcentual).

**Insights de IA:** Recomendaciones automáticas sobre optimización de rutas y alertas de aduanas.

**Rutas:** Resumen de las rutas de importación activas con estadísticas de desempeño.

**Proveedores:** Sección colapsable con lista de proveedores y sus indicadores.

**Nueva Orden (drawer):** Botón flotante "+" que abre un formulario para registrar un nuevo pedido — campos: producto, proveedor, cantidad, fecha estimada, puerto de destino, notas.

---

## ZONA PRIVADA — OPERACIÓN

### 9. Onboarding (`/app/onboarding`)

**Icono:** 🚀 Rocket  
**Propósito:** Guía de implementación paso a paso para clientes nuevos. Muestra el progreso de configuración del sistema.

**Panel izquierdo — Progreso de implementación:**
6 pasos secuenciales con estado (completado / en progreso / pendiente):
1. Configuración inicial de la empresa
2. Carga de datos históricos de ventas
3. Configuración de productos y categorías
4. Calibración del modelo de pronóstico
5. Integración con tipo de cambio
6. Capacitación del equipo

Barra de progreso visual que muestra el porcentaje completado.

**Panel derecho — Actividad del proyecto:**
- **Tarjeta de reunión:** Próxima reunión con el equipo de implementación (fecha, hora, participantes, link)
- **Botón "Agendar revisión":** Abre un drawer con formulario — fecha, hora, participantes, notas. Al guardar, actualiza la tarjeta de reunión
- **Logros desbloqueados:** Badges/íconos de hitos completados (carga de datos, primera predicción generada, etc.)
- **Botón "Reporte semanal":** Descarga un Excel con 5 hojas de resumen del estado del onboarding

---

### 10. Alertas (`/app/alertas`)

**Icono:** 🔔 Bell  
**Propósito:** Centro de notificaciones del sistema. Concentra todas las alertas activas generadas automáticamente.

**Badge en el menú:** Número rojo que indica cuántas alertas críticas/de advertencia hay (calculado desde los productos reales).

**Tipos de alertas que genera:**
- **Stock crítico:** Productos con inventario por debajo del 50% del stock óptimo (prioridad alta — roja)
- **Exceso de inventario:** Productos con stock mayor al 130% del óptimo (prioridad media — naranja)
- **Ajuste de precio pendiente:** Productos cuyo precio actual difiere del recomendado (prioridad media — amarilla)
- **Variación de tipo de cambio:** Alertas cuando el USD/BOB supera ciertos umbrales (prioridad alta)
- **Envíos en aduana:** Notificaciones de pedidos detenidos en aduanas

Cada alerta muestra: tipo, producto afectado, descripción del problema, prioridad y timestamp.

---

### 11. Reportes (`/app/reportes`)

**Icono:** 📊 BarChart2  
**Propósito:** Generación de informes ejecutivos descargables en Excel.

**6 tipos de reporte disponibles:**
1. **Reporte Ejecutivo Mensual** — KPIs, revenue, alertas del mes
2. **Análisis de Demanda** — Histórico + pronóstico por producto
3. **Reporte de Inventario** — Estado actual de stocks vs. óptimos
4. **Análisis de Precios** — Historial de cambios y recomendaciones
5. **Reporte Logístico** — Estado de envíos y tiempos de entrega
6. **Reporte Financiero** — Costos, márgenes y proyecciones

Cada reporte se genera como archivo `.xlsx` con múltiples hojas y datos estructurados.

---

### 12. Data Structuring (`/app/data-structuring`)

**Icono:** 🗄️ Database  
**Propósito:** Punto de entrada de datos reales al sistema. Aquí el usuario carga su propio archivo de ventas históricas.

**Flujo de carga:**
1. Usuario arrastra o selecciona un archivo `.csv` o `.xlsx`
2. El sistema procesa el archivo automáticamente
3. Si los datos son válidos, actualiza TODO el sistema con información real
4. Los datos fluyen a: Resumen, Demanda, Precios, Alertas, Datos crudos, Sidebar

**Formatos aceptados:** CSV (separado por coma o punto y coma) y Excel (.xlsx, .xls)

**Columnas que reconoce** (el sistema es flexible, acepta variantes):
| Columna | Alternativas aceptadas |
|---|---|
| Fecha | fecha, Date, Mes, Month |
| Producto | producto, Product, Nombre, SKU, Item |
| Categoría | categoria, Category, Tipo |
| Cantidad_Vendida | Cantidad, Sales, Ventas, Units, Qty |
| Precio_Unitario_BOB | Precio_BOB, Precio, Price |
| Costo_Unitario_USD | Costo_USD, Costo, Cost |
| Stock_Al_Cierre | Stock_Final, Stock, Inventario |
| Lead_Time_Dias | LeadTime, Lead_Time |

**Botón "Descargar ejemplo":** Genera y descarga un Excel de muestra con 96 filas, 4 productos y 2 años de historial (2023–2024) con datos realistas que producen los 4 estados de inventario distintos al ser cargados.

**Análisis post-carga:**
- Resumen de filas procesadas, errores encontrados, productos detectados, rango de años
- Preview de los datos procesados
- Botón para eliminar los datos y volver a demo

---

## CÓMO FLUYEN LOS DATOS

```
Archivo Excel/CSV
       ↓
  Data Structuring
  (parseFile + processRows)
       ↓
   AppContext (estado global)
       ↓
  ┌────────────────────────────────────────┐
  │ Resumen · Demanda · Precios · Logística │
  │ Alertas · Datos Crudos · Sidebar badges │
  └────────────────────────────────────────┘
```

El algoritmo de pronóstico (`calcForecast`) usa **regresión lineal** sobre el historial de ventas por mes para proyectar los próximos 7 períodos. Cada producto también tiene un análisis de estacionalidad basado en factores por mes del año.

---

## ESTADOS DE INVENTARIO

El sistema clasifica cada producto en uno de 4 estados:

| Estado | Condición | Color |
|---|---|---|
| **Crítico** | Stock < 50% del óptimo | Rojo |
| **Alerta** | Stock entre 50% y 85% del óptimo | Amarillo |
| **Óptimo** | Stock entre 85% y 130% del óptimo | Verde |
| **Exceso** | Stock > 130% del óptimo | Naranja |

El **stock óptimo** se calcula automáticamente como: `promedio mensual de ventas × 1.5`

---

## TIPO DE CAMBIO

El sistema incluye monitoreo del tipo de cambio USD/BOB porque es el principal factor de riesgo para importadores bolivianos. Impacta en:
- El costo de importación de cada producto
- El precio de venta recomendado
- Las alertas del sistema
- Las predicciones del módulo de precios

---

## DATOS DE DEMO vs. DATOS REALES

| | Demo | Datos reales |
|---|---|---|
| **Origen** | Hardcodeado en el código | Excel/CSV subido por el usuario |
| **Productos** | 4 (Filtros automotrices e industriales) | Los que tenga el archivo |
| **Historial** | 2 años simulados | El historial del archivo |
| **Pronóstico** | Calculado sobre datos demo | Calculado sobre datos reales |
| **Cómo activar** | Por defecto al entrar | Cargar archivo en Data Structuring |
| **Cómo restaurar** | — | Botón "Restaurar demo" en Datos crudos |

---

## TECNOLOGÍAS UTILIZADAS

| Tecnología | Para qué se usa |
|---|---|
| **React + Vite** | Framework de interfaz de usuario |
| **React Router** | Navegación entre páginas (HashRouter) |
| **Tailwind CSS** | Estilos y diseño responsive |
| **Framer Motion** | Animaciones y transiciones |
| **Recharts** | Gráficas interactivas |
| **SheetJS (xlsx)** | Lectura de Excel/CSV y exportación |
| **Netlify** | Hosting y despliegue |

---

## ACCESO Y USUARIOS

La aplicación actualmente funciona con autenticación local (sin base de datos real). Cualquier email y contraseña permite ingresar. En una versión productiva, esto se conectaría a un servicio de autenticación como Firebase Auth o Supabase.

**URL de la aplicación:** https://forecast365.netlify.app
