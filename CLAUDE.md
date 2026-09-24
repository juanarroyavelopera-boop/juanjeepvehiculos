# Juan Jeep Vehículos — reglas del proyecto

- Sitio estático de ventas Jeep + RAM (sin Fiat). El foco es el asesor (Juan Camilo), no el crédito.
- Se edita `plantilla/` (JSON y páginas) y se regenera con `npm run construir`. Nunca se edita `sitio/` a mano.
- Precios: el respaldo sale de la lista oficial de FCA en `plantilla/precios/jeep.json`; el CRM los pisa en vivo. No inventar precios ni specs: si no hay ficha, el texto dice "pídeme la ficha".
- Antes de publicar un PDF o una foto que llegó por chat, revisarlo página por página (ya llegó uno con una cédula).
- Ciclo de mejora: leer `docs/APRENDIZAJES.md` al empezar; al terminar, anotar lo aprendido y a qué páginas se le devolvió.
- Textos en español de Colombia, en primera persona de Juan, sin promesas que la financiera no cumpla ("preaprobado", no "aprobado").
