/* La página de notas legales.
 *
 * No es relleno ni trámite: una página que vende carros y recoge nombre y
 * teléfono en Colombia tiene que decir de quién son esos datos, para qué se
 * usan y cómo se borran (Ley 1581 de 2012). Y una página que se llama
 * "Asesor <Marca>" tiene que dejar claro que NO es la marca, tanto para no
 * confundir a quien entra como para no meter en problemas a quien la publica.
 *
 * El texto vive en contenido/<marca>.json, no acá: cada marca tiene su
 * responsable y su correo.
 *
 * Va con noindex a propósito: es una página de respaldo, no de captación, y
 * compitiendo por búsquedas solo le quita fuerza a las que sí venden.
 */

"use strict";
const { esc, boton, cabeza, encabezado, pie } = require("./comun");

/** Rellena {responsable}, {correo} y {ciudad} en el texto. */
function llenar(texto, legal) {
  return String(texto)
    .replace(/\{responsable\}/g, legal.responsable || "—")
    .replace(/\{correo\}/g, legal.correo || "—")
    .replace(/\{ciudad\}/g, legal.ciudad || "Medellín, Colombia");
}

module.exports = function paginaLegal(marca, contenido) {
  const legal = contenido.legal;
  if (!legal || !marca.paginaLegal) return null;

  const titulo = `Notas legales | ${marca.nombrePublico}`;
  const descripcion =
    `Condiciones de los precios, del simulador de crédito y tratamiento de datos personales de ` +
    `${marca.nombrePublico}.`;

  const hoy = new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long" });

  return `${cabeza(marca, { titulo, descripcion, ruta: marca.paginaLegal, noindex: true })}
${encabezado(marca, marca.modelos)}

<section class="hero">
  <div class="env" style="padding-block:clamp(36px,5vw,60px)">
    <span class="cinta">Letra menuda, en cristiano</span>
    <h1>Notas legales</h1>
    <p class="bajada">Lo que hay que decir sobre los precios, el crédito y tus datos. Sin vueltas.</p>
  </div>
</section>

<section class="sec">
  <div class="env" style="max-width:720px">
    ${legal.secciones
      .map(
        ([titulo, texto]) => `<article style="margin-bottom:34px">
      <h2 style="font-size:clamp(22px,3vw,30px);margin-bottom:10px">${esc(titulo)}</h2>
      ${llenar(texto, legal)
        .split("\n\n")
        .map((p) => `<p style="color:var(--suave);margin:0 0 12px">${esc(p)}</p>`)
        .join("\n      ")}
    </article>`,
      )
      .join("\n    ")}

    <p style="font-size:13px;color:var(--suave);border-top:1px solid var(--raya);padding-top:18px">
      Última actualización: ${esc(hoy)}.
    </p>

    <div style="margin-top:26px;text-align:center">
      ${boton(marca, {
        texto: "Preguntarme algo de esto",
        mensaje: `Hola ${marca.asesor}, tengo una duda sobre las condiciones de la página.`,
        ctx: "legal_consulta",
      })}
    </div>
  </div>
</section>

${pie(marca, {
  tituloFinal: "¿Alguna duda con esto?",
  textoFinal: "Prefiero que preguntes ahora y no después de firmar. Escríbeme y te lo explico.",
  mensajeFinal: `Hola ${marca.asesor}, quiero preguntarte algo antes de decidirme.`,
  ctxFinal: "legal_final",
})}`;
};
