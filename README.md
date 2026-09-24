# Juan Jeep Vehículos

Página de ventas de **Jeep y RAM en Medellín** de Juan Camilo. El protagonista es el asesor, no el catálogo.

Hermana de *Asesor Suzuki Medellín* y *Asesor Citroën Medellín*: sale de la misma plantilla de marcas, con las mejoras de esta página (ver `docs/APRENDIZAJES.md`).

## Cómo está organizado

```
plantilla/                 el generador (Node, sin dependencias)
  marcas/jeep.json         QUIÉN es: dominio, WhatsApp, CRM, modelos, colores
  contenido/jeep.json      QUÉ dice: textos, asesor, specs, FAQ, legales
  precios/jeep.json        CUÁNTO vale, de respaldo (lista FCA ago-2026). El CRM manda en vivo
  fotos/jeep/              fotos (Juan + modelos, sacadas de las fichas oficiales)
  fichas/jeep/             fichas técnicas PDF revisadas, para descargar
  paginas/                 cómo se arma cada página
  nucleo/                  scripts compartidos: medición, WhatsApp firmado, precios en vivo
  construir.js             arma el sitio
sitio/                     EL SITIO GENERADO — no se edita a mano
docs/APRENDIZAJES.md       lo que aprendimos de cada página y a quién se le devolvió
docs/PENDIENTES.md         lo que falta para publicar
```

## Trabajar

```bash
npm run construir     # regenera sitio/ desde plantilla/
npm run comprobar     # dice qué le falta a la ficha para publicar
npm run ver           # sirve sitio/ en http://localhost:8080
```

Regla: **se edita el JSON, no el HTML.** Después de cambiar algo en `plantilla/`, se corre `npm run construir` y se sube también `sitio/`.

## Publicar (Vercel)

`vercel.json` ya tiene el comando de construcción y la carpeta de salida (`sitio`). Al importar el repo en Vercel no hay que configurar nada más. Primero con la vista previa; el dominio se conecta cuando el sitio esté revisado.
