# Aprendizajes — lo que cada página nos enseñó

## El ciclo (se repite con cada página nueva)
1. **Tomar**: leer este archivo y tomar lo mejor de todas las páginas anteriores.
2. **Mejorar**: la página nueva debe superar a las anteriores en al menos una cosa.
3. **Devolver**: cada mejora que sirva a todas se sube a la plantilla compartida y se regeneran las demás marcas (Suzuki, Citroën, Jeep...).
4. **Anotar**: se agrega aquí qué se aprendió y a qué páginas ya se le devolvió.

## De Asesor Suzuki Medellín (la primera)
- Una página por modelo con URL `marca-modelo-medellin.html`: es lo que la gente busca en Google.
- Títulos de las fichas calzados con lo que la gente escribe en Google.
- Fichas técnicas en PDF descargables; páginas de accesorios por modelo.
- Fotos en .webp además de .jpg (carga rápida en celular).

## De Asesor Citroën Medellín (la plantilla)
- Nada se escribe a mano: `marcas/`, `contenido/`, `precios/` (JSON) + `construir.js`.
- Precios en vivo desde el CRM (`catalogo-vivo.js`); los del HTML son solo respaldo.
- WhatsApp firmado con el dominio (`wa-firma.js`): así el CRM sabe que el lead vino de la página.
- Cookies con prefijo propio de la marca: se fija una vez y no se cambia.
- Textos prudentes: "preaprobado", no "aprobado"; no prometer pico y placa sin confirmar.

## De Invercrédito (el diseño que más gustó)
- DISEÑO: elegante y sobrio. Titulares en serif (Source Serif 4) + texto en Inter; paleta profunda + un acento; mucho aire, sombras suaves, bordes 6–10 px.
- OJO: allá el foco es el crédito. En las páginas de marca el foco es EL ASESOR (Juan): foto real, trato directo, respuesta rápida. El crédito es un apoyo, no el protagonista.
- Un solo archivo de configuración (`config.js`) con todo lo que cambia.
- Mensaje de WhatsApp distinto por botón (hero, simulador, FAQ, final): el asesor sabe desde dónde escribió el cliente.
- Simulador de cuota (en marca va como sección de apoyo, no en el hero).
- Formulario corto con honeypot anti-spam + consentimiento Ley 1581; captura UTMs y datos del simulador.
- Eventos al `dataLayer` (cta_click, simulador_usado, generate_lead, whatsapp_click).
- SEO completo: canonical, Open Graph 1200×630, JSON-LD (Service, BreadcrumbList, FAQPage), sitemap, robots.
- Notas legales colapsables antes del footer en cada página.
- Carpeta `docs/` con investigación de mercado y `PLAN-MAESTRO.md` por sprints con "Listo cuando".
- Solicitud digital con foto de la cédula y lectura automática (para crédito).

## De Juan Jeep Vehículos (esta página)
- Hero = Juan: foto real, nombre, cargo y "en línea ahora" encima del retrato. En celular el retrato sube arriba del titular.
- Sección "Te atiendo yo, de principio a fin" con 6 promesas, y firma corta del asesor en cada ficha de modelo.
- Tipografía "elegante" (serif en titulares) como opción de la plantilla: `tipografia` en la ficha.
- Dos marcas en un sitio (Jeep + RAM): cada modelo puede declarar su `marca`; los mensajes dicen "la RAM 700" y no "el Jeep 700" (`articulo` en el contenido).
- Fichas técnicas en PDF descargables por modelo (`fichas` en el contenido, carpeta `plantilla/fichas/<marca>`).
- Notas de precio por contenido (`notaPrecio`, `notaVersiones`): la lista de Jeep es "sugerida con impuestos", no "con bono incluido" como Citroën.
- Fotos sacadas de los PDF oficiales (pdfimages + máscara para los recortes sobre negro).
- OJO: los PDF que llegan por WhatsApp se revisan página por página antes de publicarlos: uno traía la cédula de una clienta.
- OJO: las fichas del Wrangler traen la página de colores del Fiat Fastback: no confiar en la ficha sin mirarla.

## Registro de retroalimentación
| Mejora | Nació en | Devuelta a |
|---|---|---|
| Diseño elegante (serif + sobrio) | Invercrédito | Jeep ✅ (pendiente: Citroën, Suzuki) |
| Asesor como protagonista | Jeep | pendiente: Citroën, Suzuki |
| Dos marcas en un sitio (`marca` por modelo) | Jeep | pendiente: plantilla compartida |
| Fichas PDF descargables por modelo | Suzuki (idea) → Jeep (plantilla) | pendiente: Citroën |
| Notas de precio por contenido | Jeep | pendiente: plantilla compartida |
| WhatsApp con mensaje por botón | Invercrédito | pendiente: todas |
