# Prompt para hacer la página de una marca nueva

Copia el bloque de abajo en una sesión nueva de Claude Code. Cambia lo que está entre [corchetes].

```
Hola. Vamos a hacer la página de ventas de [MARCA] (ej.: GWM), igual que
"juanjeepvehiculos", "asesor-suzuki-medellin-" y "asesor-citroen-medellin".
Se va a llamar [NOMBRE-DEL-REPO] y quiero que sea un repositorio aparte y
un proyecto organizado. Yo creo el repo vacío en GitHub y te aviso.

Reglas:
1. Antes de empezar, lee docs/APRENDIZAJES.md del repo juanarroyavelopera-boop/
   juanjeepvehiculos y toma lo mejor de todas las páginas anteriores
   (Suzuki, Citroën, Invercrédito, Jeep).
2. La nueva página tiene que superar a las anteriores en al menos una cosa.
3. Base: la plantilla de marcas que vive en juanjeepvehiculos/plantilla
   (construir.js + marcas/, contenido/, precios/, fotos/, fichas/).
   Se edita el JSON, nunca el HTML generado.
4. Diseño: el elegante de Invercrédito (titulares en serif, mucho aire),
   con los colores de la marca [MARCA]. Analiza sus catálogos para sacar
   la paleta. El verde de WhatsApp no se cambia.
5. El foco es EL ASESOR (yo, Juan Camilo), no el crédito: mi foto y mi
   nombre en la primera pantalla, sección "Te atiendo yo" y mi firma en
   cada ficha de modelo. El crédito va como sección de apoyo.
6. Precios y fichas técnicas: SOLO de lo que yo te mande (lista de precios
   y PDFs). No inventes nada. Si falta una ficha, el modelo sale con su
   precio y "Pídeme la ficha por WhatsApp". Revisa cada PDF página por
   página antes de publicarlo (puede traer datos personales).
7. Fotos: sácalas de los PDFs oficiales que te mande. Mis fotos están en
   asesor-suzuki-medellin-/fotos-juan.
8. Revisa todas las páginas en celular y computador antes de subir.
9. Al terminar:
   - Publícala en Vercel (equipo "plataforma marketin integral") y dame el link.
   - Hazme un panel (artefacto) para cambiar WhatsApp, textos, precios,
     colores y datos legales sin tocar código.
   - Anota en docs/APRENDIZAJES.md lo que aprendiste y qué mejoras hay
     que devolverle a las otras páginas.
10. Respuestas cortas y precisas.

Te voy a pasar: lista de precios, fichas técnicas, número de WhatsApp
para [MARCA] y el dominio que quiero.
```
