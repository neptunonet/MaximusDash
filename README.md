# Maximus.com.ar · Centro de Análisis de Datos

Dashboard interactivo de inteligencia de negocio para **maximus.com.ar**, tienda de hardware gaming.  
Dos módulos: análisis del catálogo de productos + comportamiento de tráfico web (Google Analytics 4).

🔗 **[Ver dashboard en vivo](https://neptunonet.github.io/MaximusDash/)**

---

## ¿Qué hace?

Un centro de análisis con dos dashboards interactivos que corren directo en el browser, sin servidor, sin base de datos expuesta. Todo estático en GitHub Pages.

### 📦 Dashboard de Catálogo
Análisis completo del catálogo público de maximus.com.ar.

### 📊 Dashboard de Analytics
Análisis de comportamiento de usuarios — últimos 90 días de datos reales de Google Analytics 4.

---

## De dónde salen los datos

### Catálogo — Web Scraping
Un script en Python para recorrer el sitio de forma sistemática:

- Recorre las 15 categorías activas página por página
- Entra al detalle de cada producto individualmente
- Extrae: nombre, precio, marca, código SKU, stock, garantía, URL, imagen
- Guarda en SQLite (`maximus.db`) + exporta a JSON y CSV

**Resultado:** 586 productos scrapeados, 0 errores, 0 categorías vacías.

### Tráfico — Google Analytics 4 API
Un script en Python conectado a la **GA4 Data API** via OAuth con la cuenta autorizada. Baja 90 días de datos reales:

- Sesiones por día
- Páginas más visitadas
- Fuentes de tráfico (orgánico, CPC, social, directo)
- Dispositivos, ciudades, horarios, días de la semana
- Sistema operativo y conversiones

---

## Qué se analizó

### Catálogo
- **586 productos** distribuidos en 15 categorías
- **Precio promedio** del catálogo: ~$354.000 ARS
- **Precio más alto:** RTX 5090 MSI — $8.926.200 ARS
- **Top marcas:** AMD (52), Kingston (51), Redragon (41), ASUS (38), Genesis (36)
- **Ticket promedio más alto por categoría:** Notebooks ($1.59M) y Computadoras ($1.07M)
- Distribución de precios, rankings por categoría y marca, tabla de top 25 productos

### Tráfico Web (últimos 90 días)
| Métrica | Valor |
|---|---|
| Sesiones totales | 1.103.550 |
| Usuarios activos | 803.521 |
| Usuarios nuevos | 409.213 |
| Páginas vistas | 7.437.225 |
| Duración promedio de sesión | 5m 17s |
| Tasa de rebote | 23.1% |

**Highlights:**
- **58% del tráfico es mobile** — Android domina con el 45% del total
- **Google Ads (CPC)** es la principal fuente: 41% del tráfico (450K sesiones)
- **Google Orgánico** representa el 17% — buen posicionamiento SEO
- **Hora pico:** 20hs con mayor concentración de sesiones
- **Ciudad #1:** Buenos Aires (244K sesiones), seguida por Córdoba (25K) y Tucumán (19K)
- **Tendencia positiva:** el tráfico creció de ~11K sesiones/día en diciembre a ~15K en marzo

---

## Próximos pasos

Todo esto se construyó **sin acceso al ERP** — solo con datos públicos del sitio y Analytics.  
Con acceso a los datos internos del sistema (ventas, clientes, movimientos de stock) el análisis sería sustancialmente más potente:

- Ventas reales por producto y categoría
- Rotación de inventario
- Ticket promedio de compra vs ticket promedio de catálogo
- Análisis de clientes recurrentes vs nuevos
- Cruce de tráfico web con conversiones reales

---

*Desarrollado como prueba de concepto de análisis de datos para Maximus Gaming Hardware.*
