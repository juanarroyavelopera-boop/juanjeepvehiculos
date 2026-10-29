/* La página de precios: todo el portafolio en una tabla.
 *
 * Nació en Suzuki (oct-2026): "precios suzuki medellín" es de las búsquedas
 * que más traen gente, y la página que las contesta de una sola vez convierte
 * mejor que mandar a la persona a abrir nueve fichas.
 *
 * Cada fila es un enlace a WhatsApp con la versión escrita (a.vrow): el
 * núcleo la mide igual que un botón. */

"use strict";
const { esc, cop, rel, wa, boton, cabeza, encabezado, pie, nombreCompleto, marcaDe } = require("./comun");

module.exports = function paginaPrecios(marca, contenido, precios, preciosCrudos) {
  if (!marca.paginaPrecios) return null;
  const vigencia = preciosCrudos.vigencia || "";
  const titulo = `Precios ${marca.marcasTexto || marca.marca} en Medellín${vigencia ? `, ${vigencia}` : ""} | Todas las versiones`;
  const descripcion = `Lista de precios ${marca.marcasTexto || marca.marca} en Medellín${vigencia ? ` (${vigencia})` : ""}: todas las versiones con impuestos incluidos. Cotiza la tuya por WhatsApp.`;

  const filas = marca.modelos
    .map((m) => {
      const vs = precios.versiones[m.linea] || [];
      if (!vs.length) return "";
      const art = ((contenido.modelos || {})[m.linea] || {}).articulo || "el";
      return `<tbody>
        <tr class="modelo-fila"><th colspan="2" scope="rowgroup"><a href="${esc(rel(m.pagina))}">${esc(nombreCompleto(marca, m))}</a></th></tr>
        ${vs
          .map(
            (v) => `<tr><td colspan="2" style="padding:0">
          <a class="vrow" data-ctx="precios_${esc(m.linea.toLowerCase())}" href="${esc(
            wa(marca, `${marca.hola} vi la lista de precios. Me interesa ${art} ${nombreCompleto(marca, m)} versión ${v.nombre} (${cop(v.precio)}).`),
          )}"><span><b>${esc(v.nombre)}</b><small>${esc(v.detalle || "")}</small></span><span class="vp">${cop(v.precio)}<em>Cotizar ›</em></span></a>
        </td></tr>`,
          )
          .join("\n        ")}
      </tbody>`;
    })
    .join("\n      ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: titulo,
    itemListElement: marca.modelos.flatMap((m) =>
      (precios.versiones[m.linea] || []).map((v) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Car", name: v.nombre.startsWith(marcaDe(marca, m)) ? v.nombre : `${marcaDe(marca, m)} ${v.nombre}`, brand: marcaDe(marca, m) },
        price: String(v.precio),
        priceCurrency: "COP",
      })),
    ),
  };

  return `${cabeza(marca, { titulo, descripcion, ruta: marca.paginaPrecios, jsonLd: [jsonLd] })}
${encabezado(marca, marca.modelos)}

<section class="hero">
  <div class="env" style="padding-block:clamp(40px,6vw,70px)">
    <span class="cinta">Lista de precios${vigencia ? ` · ${esc(vigencia)}` : ""}</span>
    <h1>Precios ${esc(marca.marcasTexto || marca.marca)} en Medellín</h1>
    <p class="bajada">Todas las versiones con impuestos incluidos. Toca la que te interesa y te escribo con el precio del día, el bono del mes y la cuota.</p>
  </div>
</section>

<section class="sec">
  <div class="env" style="max-width:860px">
    <div class="envuelve-tabla">
      <table class="tabla-precios">
      ${filas}
      </table>
    </div>
    <p class="nota-precios">${esc(contenido.notaVersiones || "")} Los precios no incluyen matrícula, SOAT ni accesorios.</p>
    <div style="text-align:center;margin-top:22px">
      ${boton(marca, {
        texto: "Pedir la lista actualizada",
        mensaje: `${marca.hola} quiero la lista de precios actualizada de ${marca.marcasTexto || marca.marca}.`,
        ctx: "precios_lista",
        estado: true,
      })}
    </div>
  </div>
</section>

${pie(marca, {
  tituloFinal: "¿Ya sabes cuál quieres?",
  textoFinal: "Te confirmo el precio del día, qué bono hay vigente y cómo te queda la cuota.",
  mensajeFinal: `${marca.hola} vi la lista de precios y quiero cotizar.`,
  ctxFinal: "precios_cierre_final",
})}`;
};
