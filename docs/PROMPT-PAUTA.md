# Prompt para dejar juanjeepvehiculos lista para pautar

Copia el bloque en una sesión nueva. Lo que está entre [corchetes] aún falta.

```
Revisa y deja lista para pautar (Google y Facebook/Instagram) la página juanjeepvehiculos.vercel.app (dominio final juanjeepvehiculos.com, todavía sin comprar) (repo juanarroyavelopera-boop/juanjeepvehiculos), igual que hicimos con asesorsuzukimedellin.com (repo juanarroyavelopera-boop/asesor-suzuki-medellin-) en oct-2026. El CRM es juanarroyavelopera-boop/crm-plataforma (Supabase stmqemgzxsyvsicpppnr; el negocio de esta marca es business_id [BUSINESS_ID — todavía no existe: créalo conmigo en el CRM antes de la Fase 3]). Úsalo todo de modelo: copia y adapta, no reinventes.

LO PROPIO DE ESTA PÁGINA (léelo antes de la Fase 1)
- Vende Jeep y RAM (no Fiat). El foco es el asesor (Juan Camilo), no el crédito.
- El sitio sale de una plantilla: se edita plantilla/ (marcas/jeep.json, contenido/jeep.json, precios/jeep.json) y se regenera con `npm run construir`; nunca se edita sitio/ a mano. Vercel construye solo al hacer push a main.
- Todavía NO tiene: número de WhatsApp, business_id, dominio, GA4, Google Ads, pixel ni Clarity (ver docs/PENDIENTES.md). Pídemelos en pasos numerados.
- El núcleo (plantilla/nucleo) trae track.js, wa-firma.js, meta-pixel.js, estado-asesor.js y catalogo-vivo.js, pero NO wa-qr.js ni wa-conversion.js (esos están solo en Suzuki): cópialos y adáptalos a la plantilla, sin escribir la marca dentro (que lean window.MARCA).
- Lo que se mejore aquí y sirva a todas las marcas se anota en docs/APRENDIZAJES.md para devolverlo a Suzuki y Citroën.
- Hay un panel de cambios (artefacto "Panel Juan Jeep"): si cambias un dato que está en el panel, márcalo como aplicado allá también.

CÓMO TRABAJAR CONMIGO
- Respuestas cortas y en simple. Primero diagnostica y muéstrame lo que encontraste; NO cambies nada (ni commit ni push) hasta que yo diga qué arreglar.
- Antes de tocar el CRM: git fetch origin main && git merge origin/main. Si trae conflictos o migraciones con número repetido, avísame.
- La página publica en producción al hacer push a main (Vercel).
- Lo que necesites de mí (IDs, códigos, clics en Meta/Google), pídemelo en pasos numerados, con el link exacto y qué botón tocar. Si es un token, que lo guarde yo en Supabase (Edge Functions → Secrets) o en Vercel; que no lo pegue en el chat.

FASE 1 — DIAGNÓSTICO DE LA PÁGINA (solo mirar y contarme)
1. Medición: qué etiquetas tiene cada página (GA4, Google Ads AW-, Meta Pixel, Clarity, track.js del CRM con el business_id correcto). ¿Llegan eventos al CRM (site_events)? ¿Qué número de WhatsApp usa y está conectado al CRM (wa_numbers)?
2. Recorre TODAS las páginas como celular (Playwright, iPhone 13, 4G lento) y como PC (1366x768): errores JS, 404, texto que se sale, texto pegado al borde, huecos arriba, burbuja flotante tapando botones, botones de WhatsApp que no abren o con número/mensaje mal, imágenes pesadas, LCP.
   Falso positivo conocido: la captura "página completa" no pinta background-attachment:fixed.
3. Toca cada botón de WhatsApp y verifica la firma "— Vi la página juanjeepvehiculos.vercel.app". wa-firma.js necesita también el listener en fase burbuja (document.addEventListener('click', alClic, false)).
4. Conversiones: en PC el botón de WhatsApp abre un QR (wa-qr.js); la conversión de Google NO cuenta ahí (va por ASM_WA.conv de wa-conversion.js), ni "Llamar" en PC, ni doble el flotante. Cualquier enlace a WhatsApp (tablas de precios, landings) debe medirse aunque no tenga la clase del botón.
5. Contenido y SEO: precios iguales en todas partes (fichas, tablas, JSON-LD, FAQ, mensajes de WhatsApp y lo que pinta el CRM en vivo); bonos con mes que se vence; afirmaciones riesgosas para la ley o para Meta (promesas absolutas, "oficial", obsequios sin condiciones, crédito "aprobado"/"desde $0", "exento de pico y placa" sin aclarar que se verifica con Movilidad); aviso de "asesor comercial independiente"; política de privacidad (Ley 1581) enlazada en el pie; sitemap válido, canonical, un solo H1, JSON-LD que parsee, enlaces rotos, títulos >60 y descripciones >160.
6. Datos: si hay tráfico, saca de site_events la conversión por página × dispositivo × fuente, y cuánta gente que toca WhatsApp escribe de verdad (mensajes firmados en messages).
Entrégame un informe corto: CRÍTICO / IMPORTANTE / MEJORA, con archivo:línea y la prueba.

FASE 2 — ARREGLOS DE LA PÁGINA (cuando yo apruebe)
- Burbuja de WhatsApp compacta en celular; margen lateral; filas de versiones/precios que abran WhatsApp con la versión; ubicación de la sala arriba si la gente busca "concesionario Jeep / RAM".
- Medición: wa-firma en fase burbuja, conversiones solo cuando WhatsApp abre, Meta Lead solo en celular para "Llamar", ViewContent en las fichas, cualquier enlace a WhatsApp medido.
- Clarity en todas las páginas, sitemap, enlaces rotos, schema sin HTML pegado, política de privacidad, aviso de independiente.
- Verifica con Playwright después de cada arreglo antes de mostrarme.

FASE 3 — GOOGLE (como Suzuki)
- Llenar business_config.sitio del negocio (dominio, whatsapp, ga4_id, google_ads_id, conversion_label, meta_pixel_id, clarity_id, sigla) y google_ads_customer_id cuando te pase los datos.
- Búsquedas diarias (sync-google-busquedas) y Clarity diario (sync-clarity; token CLARITY_TOKEN_<clarity_id>).
- Chats reales a Google Ads (subir-chats-google + google_chats_subidos, Data Manager API): crear la acción "Chat real WhatsApp (CRM)" (UPLOAD_CLICKS, CONTACT, principal) y guardarla en business_config.google_chat_conversion_action. "Clic WhatsApp" pasa a secundaria SOLO cuando Google confirme SUCCESS.

FASE 4 — FACEBOOK / INSTAGRAM (lo que aprendimos con Suzuki; revisa cada punto antes de pedirme algo)
1. Todo debe quedar en UN portfolio comercial que yo controle (business.facebook.com). Revisa si el pixel actual de la página es de un negocio al que no tengo acceso: si es así, usamos un pixel propio del portfolio (no se pierde nada importante) y lo cambias en la página y en business_config.sitio.meta_pixel_id.
2. Pixel: API de conversiones → "Configurar integración directa" → Generar token (el portfolio necesita un correo en Información del negocio). Ese token va en Vercel como META_CAPI_TOKEN_<SIGLA>. Verifica en los logs del CRM "[meta-capi] OK".
3. Dominio: Configuración del negocio → Seguridad de la marca → Dominios → meta tag en el <head> del index.html.
4. Cuenta publicitaria: crearla DENTRO del portfolio (moneda COP, America/Bogota — no se puede cambiar), con tarjeta. Conectarle el pixel (Conjuntos de datos → Activos conectados) y el Instagram (Cuentas de Instagram → Conectar activos).
5. Instagram de la marca: que sea cuenta profesional y esté en el portfolio. Ojo: en el celular puede salir el Instagram de otra marca; no conectar el equivocado.
6. WhatsApp: conectar el pixel con la página de Facebook (Administrador de eventos → Conectar datos → Página de Facebook) para medir los chats; dejar APAGADO "identificar eventos automáticamente de las conversaciones" (el CRM ya lo hace).
7. Catálogo: los ids de producto deben ser iguales a los content_ids que manda el pixel (en Suzuki: el UUID de catalog_items, que entrega /api/catalog/portfolio). Conectar catálogo ↔ pixel y poner idioma Español / país Colombia. Revisar por qué WhatsApp muestra menos productos de los que tiene el catálogo.
8. Chats de anuncios en el CRM: la migración 181 (whatsapp_referidos, via='meta_ads') y el cron /api/cron/capi-chats-meta ya sirven para todas las marcas; verifica que wa_numbers tenga el waba_id de la línea de esta marca.
9. Manejo desde Claude: en el portfolio crear un usuario del sistema "CRM Anuncios" (Administrador) → crear una app propia del portfolio (developers.facebook.com, caso de uso "API de marketing", NO pedir revisión) → darle a "CRM Anuncios" rol Administrador en la app (por su ID si el nombre no aparece) → asignarle con control total la cuenta publicitaria, página, Instagram, pixel y catálogo → Generar token (Nunca vence; ads_management, ads_read, business_management, pages_read_engagement, pages_manage_ads, pages_show_list, catalog_management) → guardarlo como secreto. Usar la función Supabase meta-ads (agregarle el token de esta marca) y probar con {"diagnostico":true}. Regla: nada se prende sin que yo diga.

FASE 5 — LANZAR Y MEDIR
- Línea base antes de pautar: chats/día por canal (via/origen) últimos 14 días y costo por chat de Google.
- Primera campaña clic-a-WhatsApp PAUSADA para que yo la revise: 2–3 modelos gancho con precio y bono vigentes, Medellín y Valle de Aburrá, 25–60 años, presupuesto que yo diga. Si el anuncio promociona financiación, revisar si Meta exige la categoría especial "crédito".
- Anotar cada cambio en "Lo que hicimos" (seo_hitos) para comparar en 3 semanas.
```
