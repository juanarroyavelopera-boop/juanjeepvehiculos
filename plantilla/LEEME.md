> **Esta copia vive en `juanjeepvehiculos`** y tiene mejoras que todavía no están en la
> plantilla compartida (`asesor-suzuki-medellin-/plantilla`): tipografía elegante, asesor
> al frente, dos marcas por sitio, fichas PDF y notas de precio por contenido. Todas son
> opcionales por ficha, así que se pueden devolver sin cambiar los sitios ya publicados.
> Ver `docs/APRENDIZAJES.md`.

# La plantilla de los sitios «Asesor \<Marca\> Medellín»

Sirve para que Citroën, Jeep y GWM tengan el mismo sitio que Suzuki sin volver a
escribirlo, y para que un arreglo hecho una vez llegue a todas las marcas.

El sitio de Suzuki **no se toca**: sigue publicado como está. Esta carpeta es de
donde salen los siguientes.

---

## Cómo se suma una marca

**1. Llenar su ficha.** Una marca es un archivo en `marcas/`. Ya están las de
Citroën, Jeep y GWM con lo que se sabe hasta hoy; les falta el número de
WhatsApp y el `businessId`, que no existen todavía.

**2. Crear el negocio en el CRM** y llenar Configuración → Página con los mismos
datos de la ficha. Eso es lo que hace que el CRM reconozca el sitio: le permite
medir desde su dominio, le entrega el catálogo, le arma el feed de Meta y audita
esa página en el informe de pauta.

El `businessId` de la ficha es el del negocio recién creado. Los dos lados tienen
que decir lo mismo o el sitio mide contra el negocio equivocado.

**3. Comprobar la ficha.** El generador dice qué falta y por qué:

```
node construir.js citroen --comprobar
```

**4. Construir.**

```
node construir.js citroen ../../asesor-citroen-medellin
```

Escribe `marca.js` (la ficha como la ven los scripts) y copia `nucleo/`.

**5. Publicar en Vercel** con la vista previa primero. El dominio se conecta
cuando el sitio ya esté revisado.

---

## Qué hay aquí

```
marcas/*.json    la ficha de cada marca — lo único que se edita por marca
nucleo/*.js      los scripts, iguales para todas
construir.js     arma marca.js y copia el núcleo
prueba/          comprueba el núcleo en un navegador de verdad
```

### El núcleo

| archivo | qué hace |
|---|---|
| `track.js` | manda cada evento al CRM: visitas, clics a WhatsApp, formularios |
| `wa-firma.js` | le pega al mensaje la línea «— Vi la página \<dominio\>» |
| `meta-pixel.js` | el pixel de Meta, con el mismo id de evento que el servidor |
| `estado-asesor.js` | el punto verde «en línea» según el horario de la marca |
| `catalogo-vivo.js` | trae precios, colores y versiones del CRM, en vivo |

Ninguno tiene una marca escrita. Todos leen `window.MARCA`, que define
`marca.js`, y **si esa ficha no está, no hacen nada**. Es a propósito: perder
unos eventos se nota y se arregla; medirlos contra la marca equivocada ensucia
el reporte de dos marcas y no se ve hasta que alguien lo cruza.

### La firma es lo que hace que el lead cuente

Cada botón de WhatsApp sale firmado con el dominio de su marca. El CRM reconoce
esa firma y marca el lead como propio en vez de «directo». Sin ella, la plata
que se gasta en pauta no se puede separar de la que llega sola.

La prueba de `prueba/` comprueba exactamente eso, con una marca inventada:

```
node prueba/probar.mjs
```

---

## Qué NO está todavía

Las páginas. Hoy la plantilla tiene el núcleo —lo que conecta cualquier sitio con
el CRM— pero las páginas de cada marca (portada, fichas de modelo, crédito) son
el paso siguiente, y salen de las fichas técnicas, las listas de precios y las
fotos de cada marca.

También queda pendiente, y depende de Juan:

- comprar los dominios y los números de WhatsApp, y darlos de alta en Meta;
- crear la propiedad de Analytics, la cuenta de Ads con su etiqueta de conversión
  y el pixel de cada marca;
- guardar la llave de la API de conversiones de Meta con el nombre
  `META_CAPI_TOKEN_<SIGLA>` — `META_CAPI_TOKEN_ACM` para Citroën.

---

## Detalles que valen la pena saber

**La ficha no lleva precios.** Los manda el CRM en vivo, igual que en Suzuki. Un
precio en dos lados es un precio que algún día va a estar mal en uno.

**`marca.js` se genera, no se edita.** Se edita el JSON y se vuelve a construir.

**Las cookies llevan el prefijo de la marca** (`acm_vid`, `acm_attr`). Cambiárselo
a un sitio ya publicado le borra la identidad a todos sus visitantes, así que se
fija una vez y no se toca.

**Los pesos en pesos colombianos por tipo de clic** salen de la escala del CRM,
pero se pueden ajustar por marca en `pesos` de la ficha. Un Wrangler no vale lo
que un C3.

**Sin dependencias.** El generador es Node y nada más. Una plantilla de sitios
estáticos que necesita `npm install` deja de ser estática el día que un paquete
se rompe. Lo único que pide instalación es la prueba, que necesita Playwright.
