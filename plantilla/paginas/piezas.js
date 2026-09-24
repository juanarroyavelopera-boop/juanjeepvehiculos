/* Piezas que se repiten entre páginas: el marco de foto, la tarjeta de modelo,
 * las preguntas y los datos estructurados que lee Google. */

"use strict";
const { esc, cop, copCorto, rel, boton, marcaDe, nombreCompleto } = require("./comun");

/**
 * El hueco donde va una foto.
 *
 * Mientras no haya foto real dibuja un marco que DICE qué foto falta y de qué
 * medida. Es a propósito: un cuadro gris anónimo se publica sin que nadie se
 * dé cuenta; uno que dice "falta la foto del Basalt, 1200×900" no.
 */
function marcoFoto({ src = "", alt = "", que = "", medida = "", claro = false, alto = false, foco = "", primera = false, ajuste = "", fondo = "", proporcion = "" }) {
  const clase =
    "marco" +
    (claro ? " claro" : "") +
    (fondo === "blanco" ? " blanco" : "") +
    (ajuste === "completa" ? " completa" : "");
  // El marco vertical del hero: 4/5, no 3/4. Con 3/4 el hero se comía casi una
  // pantalla entera y el primer modelo quedaba debajo del doblez.
  const razon = proporcion || (alto ? "4/5" : "");
  const estilo = razon ? ` style="aspect-ratio:${esc(razon)}"` : "";
  if (src) {
    // El punto de enfoque decide qué parte sobrevive al recorte. Sin él, una
    // foto vertical metida en una tarjeta ancha se centra en la mitad de la
    // imagen, que en una foto de carretera es cielo y árboles: el carro queda
    // fuera y la tarjeta no muestra nada.
    const posicion = foco ? ` style="object-position:${esc(foco)}"` : "";
    const carga = primera ? 'fetchpriority="high"' : 'loading="lazy"';
    return `<div class="${clase}"${estilo}><img src="${esc(src)}" alt="${esc(alt)}"${posicion} ${carga} decoding="async"></div>`;
  }
  return `<div class="${clase}"${estilo}><div class="falta"><b>Falta la foto</b>${esc(que)}${
    medida ? `<br>${esc(medida)} px` : ""
  }</div></div>`;
}

/**
 * Una tarjeta de modelo en la portada.
 *
 * Las clases y los ids (showThumbs, thumb, thumb-name, thumb-price) no son
 * decorativos: son el contrato con catalogo-vivo.js, que busca justo eso para
 * reemplazar el precio y la foto con los del CRM. Si se renombran, la página
 * se queda con los precios escritos y nadie se entera.
 */
function tarjetaModelo(marca, contenido, modelo, precio) {
  const c = contenido.modelos[modelo.linea] || {};
  const dest = (c.destacados || []).slice(0, 3);
  const portada = (c.fotos || {}).hero;
  return `<article class="tarjeta thumb">
        ${marcoFoto({
          src: portada ? `fotos/${portada.src}` : "",
          alt: portada ? portada.alt : "",
          foco: portada ? portada.focoTarjeta || portada.foco || "" : "",
          ajuste: portada ? portada.ajuste || "" : "",
          fondo: portada ? portada.fondo || "" : "",
          que: `Foto del ${modelo.nombre}`,
          medida: "1200 × 825",
        })}
        <div class="cuerpo">
          ${modelo.marca ? `<span style="font-size:11.5px;font-weight:700;letter-spacing:.12em;color:var(--suave);margin-bottom:-8px">${esc(modelo.marca.toUpperCase())}</span>` : ""}
          <h3 class="thumb-name">${esc(modelo.nombre)}</h3>
          <div class="etiquetas">
            ${dest.map((t, i) => `<span class="pill${i === 0 ? " destacada" : ""}">${esc(t)}</span>`).join("")}
          </div>
          <p style="font-size:14.5px;color:var(--suave);margin:0">${esc(c.gancho || "")}</p>
          <div class="precio">
            <small>Desde</small>
            <div class="val thumb-price">${precio ? cop(precio) : "Pregúntame"}</div>
          </div>
          <div class="acciones">
            ${boton(marca, {
              texto: "Cotizar",
              mensaje: `Hola ${marca.asesor}, quiero cotizar ${c.articulo || "el"} ${nombreCompleto(marca, modelo)}.`,
              ctx: `modelo_${modelo.linea.toLowerCase()}`,
              clase: "chico",
            })}
            <a class="boton fantasma" href="${esc(rel(modelo.pagina))}">Ver ficha</a>
          </div>
        </div>
      </article>`;
}

/**
 * ¿Esta marca publica preguntas?
 *
 * Es una decisión de contenido, no de plantilla: si el archivo no trae `faq`
 * —o la trae vacía— no se dibuja la sección en ninguna página ni se escriben
 * los datos de FAQPage. Basta con volver a llenarla para que reaparezca todo.
 */
function hayFaq(contenido) {
  return Array.isArray(contenido.faq) && contenido.faq.length > 0;
}

/** Las preguntas frecuentes, plegadas. */
function bloqueFaq(contenido) {
  if (!hayFaq(contenido)) return "";
  return contenido.faq
    .map(
      ([p, r]) => `<details>
      <summary>${esc(p)}</summary>
      <p>${esc(r)}</p>
    </details>`,
    )
    .join("\n    ");
}

/** El negocio, como lo entiende Google: un concesionario con su oferta. */
function jsonLdNegocio(marca, contenido, precios) {
  const ofertas = marca.modelos
    .filter((m) => precios.porLinea[m.linea])
    .map((m) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Car", name: nombreCompleto(marca, m), brand: marcaDe(marca, m) },
      price: String(precios.porLinea[m.linea]),
      priceCurrency: "COP",
    }));
  const valores = Object.values(precios.porLinea).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: marca.nombrePublico,
    // Medellín es la base y es lo que Google posiciona; el país va aparte
    // porque la página dice que atiende fuera, y las dos cosas tienen que
    // decir lo mismo.
    areaServed: [
      { "@type": "City", name: "Medellín" },
      { "@type": "Country", name: "Colombia" },
    ],
    telephone: marca.whatsapp ? `+${marca.whatsapp}` : undefined,
    url: `https://${marca.dominio}/`,
    priceRange: valores.length ? `${cop(Math.min(...valores))} - ${cop(Math.max(...valores))}` : undefined,
    makesOffer: ofertas.length ? ofertas : undefined,
  };
}

/** Un modelo, como lo entiende Google. */
function jsonLdModelo(marca, contenido, modelo, precio) {
  const c = contenido.modelos[modelo.linea] || {};
  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: nombreCompleto(marca, modelo),
    brand: { "@type": "Brand", name: marcaDe(marca, modelo) },
    model: modelo.nombre,
    description: c.gancho || undefined,
    fuelType:
      modelo.propulsion === "hibrido" ? "Hybrid"
      : modelo.propulsion === "electrico" ? "Electric"
      : modelo.propulsion === "diesel" ? "Diesel"
      : "Gasoline",
    offers: precio
      ? {
          "@type": "Offer",
          price: String(precio),
          priceCurrency: "COP",
          availability: "https://schema.org/InStock",
          url: `https://${marca.dominio}${modelo.pagina}`,
        }
      : undefined,
  };
}

module.exports = { marcoFoto, tarjetaModelo, bloqueFaq, hayFaq, jsonLdNegocio, jsonLdModelo };
