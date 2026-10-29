/* Una comparativa: dos o tres versiones lado a lado.
 *
 * Nació en Suzuki (oct-2026): "swift o dzire", "jimny 3 o 5 puertas" son las
 * preguntas con las que la gente llega, y una página que las contesta con la
 * tabla de la ficha y una recomendación honesta posiciona y convierte.
 *
 * Todo sale de contenido.comparativas: los datos son los de las fichas
 * oficiales, nunca inventados. */

"use strict";
const { esc, rel, boton, cabeza, encabezado, pie } = require("./comun");
const { marcoFoto } = require("./piezas");

module.exports = function paginaComparativa(marca, contenido, comp) {
  const n = comp.columnas.length;
  const titulo = comp.titulo;
  const faq = comp.preguntas || [];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: comp.h1,
      description: comp.descripcion,
      author: { "@type": "Organization", name: marca.nombrePublico },
    },
  ];
  if (faq.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map(([p, r]) => ({ "@type": "Question", name: p, acceptedAnswer: { "@type": "Answer", text: r } })),
    });
  }
  const modelos = (comp.modelos || []).map((l) => marca.modelos.find((m) => m.linea === l)).filter(Boolean);

  return `${cabeza(marca, { titulo, descripcion: comp.descripcion, ruta: comp.ruta, jsonLd })}
${encabezado(marca, marca.modelos)}

<section class="hero">
  <div class="env hero-grid">
    <div>
      <span class="cinta">Comparativa</span>
      <h1>${esc(comp.h1)}</h1>
      <p class="bajada">${esc(comp.bajada)}</p>
      <div class="hero-acciones">
        ${boton(marca, {
          texto: "¿Cuál me conviene?",
          mensaje: `${marca.hola} estoy entre ${comp.columnas.join(" y ")}. ¿Cuál me conviene?`,
          ctx: `comparativa_${comp.id}_hero`,
          clase: "grande",
          estado: true,
        })}
      </div>
    </div>
    ${comp.foto ? marcoFoto({ src: `fotos/${comp.foto.src}`, alt: comp.foto.alt, fondo: comp.foto.fondo || "", ajuste: comp.foto.ajuste || "", proporcion: "4/3", primera: true }) : ""}
  </div>
</section>

<section class="sec">
  <div class="env" style="max-width:920px">
    <h2 class="sec-title">Lado a lado</h2>
    <p class="sec-sub">Datos de las fichas técnicas oficiales. Precios sugeridos de lista con impuestos.</p>
    <div class="envuelve-tabla">
      <table class="tabla comparar">
        <thead><tr><th scope="col"></th>${comp.columnas.map((c) => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead>
        <tbody>
        ${comp.filas
          .map(([k, ...vals]) => `<tr><td>${esc(k)}</td>${vals.slice(0, n).map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`)
          .join("\n        ")}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="sec franja">
  <div class="env" style="max-width:860px">
    <h2 class="sec-title">Mi recomendación</h2>
    <div class="promesas" style="margin-top:18px">
      ${comp.veredicto
        .map(
          ([quien, texto]) => `<div class="promesa"><div><b>${esc(quien)}</b><span>${esc(texto)}</span></div></div>`,
        )
        .join("\n      ")}
    </div>
    ${modelos.length ? `<p style="text-align:center;margin-top:22px">${modelos
      .map((m) => `<a class="boton fantasma" href="${esc(rel(m.pagina))}" style="text-decoration:none;margin:4px">Ver ficha ${esc(m.marca ? `${m.marca} ${m.nombre}` : m.nombre)}</a>`)
      .join("")}</p>` : ""}
  </div>
</section>

${
  faq.length
    ? `<section class="sec faq">
  <div class="env" style="max-width:780px">
    <h2 class="sec-title">Preguntas frecuentes</h2>
    ${faq.map(([p, r]) => `<details><summary>${esc(p)}</summary><p>${esc(r)}</p></details>`).join("\n    ")}
  </div>
</section>`
    : ""
}

${pie(marca, {
  tituloFinal: "¿Todavía en duda?",
  textoFinal: "Cuéntame cómo vas a usar el carro y te digo cuál te sirve, sin venderte lo que no necesitas.",
  mensajeFinal: `${marca.hola} vi la comparativa ${comp.columnas.join(" vs ")} y tengo dudas.`,
  ctxFinal: `comparativa_${comp.id}_cierre`,
})}`;
};
