/* La portada: el escaparate de la marca.
 *
 * El precio va ESCRITO en el HTML aunque el CRM lo mande en vivo. No es
 * redundancia: es lo que ve Google, y lo que sigue viéndose si el CRM no
 * contesta. catalogo-vivo.js lo pisa con el precio del día cuando carga.
 */

"use strict";
const { esc, cop, copCorto, rel, boton, cabeza, encabezado, pie, chipOrigen, tiraHero, fotoAsesor, seccionAsesor } = require("./comun");
const { marcoFoto, tarjetaModelo, bloqueFaq, hayFaq, jsonLdNegocio } = require("./piezas");

module.exports = function portada(marca, contenido, precios) {
  const h = contenido.hero;
  const modelos = marca.modelos;
  const barato = precios.masBarato;
  // El "desde" del híbrido: el más barato de las líneas que la ficha marca
  // híbridas. Se calcula, no se escribe: si mañana entra una híbrida más
  // económica, el hero la sigue sin que nadie edite el contenido.
  const preciosHibridos = marca.modelos
    .filter((m) => m.propulsion === "hibrido")
    .map((m) => precios.porLinea[m.linea])
    .filter(Boolean);
  const baratoHibrido = preciosHibridos.length ? Math.min(...preciosHibridos) : null;
  // El bloque del crédito sale del contenido; si la marca no lo trae, el texto
  // de siempre. Lo que convence de financiar cambia con la financiera, y eso
  // no debería vivir en una plantilla.
  const cr = {
    titulo: "¿Cuánto te quedaría la cuota?",
    texto:
      "Hay simulador en la página: mueves la inicial y los meses y ves el estimado. " +
      "Se financia desde el 0% de inicial y hasta 84 meses.",
    pasos: [],
    ...(contenido.credito || {}),
  };
  cr.pasos = cr.pasos || [];

  const titulo = `${marca.marca} Medellín | Asesor por WhatsApp · ${modelos.length} modelos`;
  const descripcion =
    `Compra tu ${marca.marca} en Medellín por WhatsApp con un asesor real. ` +
    (barato ? `Desde ${cop(barato)}. ` : "") +
    `Precios, cuota y bono vigente al instante.`;

  return `${cabeza(marca, {
    titulo,
    descripcion,
    ruta: "/",
    jsonLd: [jsonLdNegocio(marca, contenido, precios), hayFaq(contenido) ? jsonLdFaq(contenido) : null].filter(Boolean),
  })}
${encabezado(marca, modelos)}

<section class="hero${contenido.asesor ? " hero-asesor" : ""}">
  <div class="env hero-grid">
    <div>
      <span class="cinta">${esc(h.cinta)}</span>${chipOrigen(marca)}
      <h1>${esc(h.titulo)}</h1>
      <p class="bajada">${esc(h.bajada)}</p>
      ${
        h.desde && barato
          ? `<div class="desdes">
      <p class="desde">
        <span class="rotulo">${esc(h.desde)}</span>
        <b class="valor" id="precioDesde">${cop(barato)}</b>
        ${h.desdeNota ? `<span class="nota">${esc(h.desdeNota)}</span>` : ""}
      </p>
      ${
        h.desdeHibrido && baratoHibrido
          ? `<p class="desde hibrida">
        <span class="rotulo">${esc(h.desdeHibrido)}</span>
        <b class="valor" id="precioDesdeHibrido">${cop(baratoHibrido)}</b>
        ${h.desdeHibridoNota ? `<span class="nota">${esc(h.desdeHibridoNota)}</span>` : ""}
      </p>`
          : ""
      }
    </div>`
          : ""
      }
      <div class="hero-acciones">
        ${boton(marca, {
          texto: h.boton || "Cotizar ahora",
          mensaje: h.mensaje || `Hola ${marca.asesor}, quiero cotizar un ${marca.marca} en Medellín.`,
          ctx: "hero_principal",
          clase: "grande",
          estado: true,
        })}
        <a class="boton fantasma" href="#modelos" style="color:#fff;border-color:rgba(255,255,255,.3)">Ver los ${modelos.length} modelos</a>
      </div>
      ${tiraHero(h)}
    </div>
    ${(() => {
      // Con asesor, la foto del hero es la suya: la página abre con una cara,
      // no con un carro.
      if (contenido.asesor) return fotoAsesor(marca, contenido, { primera: true });
      const f = contenido.heroFoto;
      if (!f) {
        return marcoFoto({ alto: true, que: `Foto de ${marca.asesor} entregando un ${marca.marca}`, medida: "1200 × 900" });
      }
      return marcoFoto({
        src: `fotos/${f.src}`,
        alt: f.alt,
        foco: f.foco || "",
        ajuste: f.ajuste || "",
        fondo: f.fondo || "",
        proporcion: f.proporcion || "4/3",
        primera: true,
      });
    })()}
  </div>
</section>

<section class="sec" id="modelos">
  <div class="env">
    <h2 class="sec-title">${esc(contenido.portafolio?.titulo || `El portafolio ${marca.marca} en Medellín`)}</h2>
    <p class="sec-sub">${esc(contenido.portafolio?.bajada || "Precios con el bono de fábrica ya incluido. El de financiación va aparte: te lo cuento por WhatsApp porque depende de que financies.")}</p>
    <div class="modelos" id="showThumbs">
      ${modelos.map((m) => tarjetaModelo(marca, contenido, m, precios.porLinea[m.linea])).join("\n      ")}
    </div>
  </div>
</section>

${seccionAsesor(marca, contenido)}

<section class="sec franja" id="credito">
  <div class="env franja-par">
    <div>
      <h2 style="margin-bottom:10px">${esc(cr.titulo)}</h2>
      <p style="color:var(--suave);margin:0;max-width:52ch">${esc(cr.texto)}</p>
      ${
        cr.pasos.length
          ? `<ol class="pasos">
        ${cr.pasos.map((t, i) => `<li><b>${i + 1}</b>${esc(t)}</li>`).join("\n        ")}
      </ol>`
          : ""
      }
    </div>
    <div class="acciones">
      <a class="boton fantasma" href="${esc(rel(marca.paginaCredito))}" style="text-decoration:none">Simular la cuota</a>
      ${boton(marca, {
        texto: "Preguntar por crédito",
        mensaje: `Hola ${marca.asesor}, quiero saber cómo me queda la cuota de un ${marca.marca}.`,
        ctx: "credito_teaser",
      })}
    </div>
  </div>
</section>

${
  hayFaq(contenido)
    ? `<section class="sec faq" id="faq">
  <div class="env" style="max-width:780px">
    <h2 class="sec-title">Lo que la gente pregunta antes de comprar</h2>
    <p class="sec-sub">Y si la tuya no está, me la mandas por WhatsApp.</p>
    ${bloqueFaq(contenido)}
  </div>
</section>`
    : ""
}

${pie(marca, {
  tituloFinal: `¿Listo para estrenar tu ${marca.marca}?`,
  textoFinal: `Escríbeme y te digo el precio del día, qué bono hay vigente y cómo te queda la cuota. Sin compromiso.`,
  mensajeFinal: `Hola ${marca.asesor}, quiero estrenar un ${marca.marca}. ¿Me ayudas?`,
  ctxFinal: "cierre_final",
})}`;
};

/** Las preguntas, en el formato que Google entiende y muestra en el buscador. */
function jsonLdFaq(contenido) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: contenido.faq.map(([p, r]) => ({
      "@type": "Question",
      name: p,
      acceptedAnswer: { "@type": "Answer", text: r },
    })),
  };
}
