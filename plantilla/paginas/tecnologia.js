/* La página de tecnología: la que explica lo que la marca tiene y la
 * competencia no. En Suzuki son los híbridos SHVS; en Citroën, los de 48
 * voltios; en Jeep sería el 4x4; en GWM, los Hi4.
 *
 * No es una página de relleno: es la que contesta "¿y eso para qué me sirve a
 * mí?" y la que se puede pautar por búsquedas de "híbrido medellín", que son
 * más baratas que las de marca.
 */

"use strict";
const { esc, cop, rel, boton, cabeza, encabezado, pie } = require("./comun");
const { bloqueFaq, hayFaq } = require("./piezas");

module.exports = function tecnologia(marca, contenido, precios) {
  const t = contenido.tecnologia;
  if (!t || !marca.paginaTecnologia) return null;

  // Los modelos que llevan esta tecnología: los que la ficha marcó híbridos.
  const conTecnologia = marca.modelos.filter((m) => m.propulsion === "hibrido");

  const titulo = `${esc(t.titulo)} | ${marca.nombrePublico}`;
  const descripcion =
    `${t.bajada} Qué es un híbrido de 48 voltios, cuándo conviene y qué modelos ` +
    `${marca.marca} lo llevan en Medellín.`;

  return `${cabeza(marca, { titulo, descripcion, ruta: marca.paginaTecnologia })}
${encabezado(marca, marca.modelos)}

<section class="hero">
  <div class="env" style="padding-block:clamp(40px,6vw,74px)">
    <span class="cinta">Tecnología</span>
    <h1>${esc(t.titulo)}</h1>
    <p class="bajada">${esc(t.bajada)}</p>
    <div class="hero-acciones">
      ${boton(marca, {
        texto: "¿Me conviene a mí?",
        mensaje: `Hola ${marca.asesor}, quiero saber si un ${marca.marca} híbrido me conviene.`,
        ctx: "tecnologia_hero",
        clase: "grande",
        estado: true,
      })}
    </div>
  </div>
</section>

<section class="sec">
  <div class="env" style="max-width:860px">
    <div style="display:grid;gap:18px">
      ${(t.bloques || [])
        .map(
          ([tit, txt]) => `<div style="border:1px solid var(--raya);border-radius:14px;padding:22px 24px">
        <h3 style="font-size:24px;margin-bottom:8px">${esc(tit)}</h3>
        <p style="color:var(--suave);margin:0">${esc(txt)}</p>
      </div>`,
        )
        .join("\n      ")}
    </div>
  </div>
</section>

${
  conTecnologia.length
    ? `<section class="sec franja" id="modelGrid">
  <div class="env">
    <h2 class="sec-title">Los que la llevan</h2>
    <p class="sec-sub">Precios con el bono de fábrica ya incluido.</p>
    <div class="modelos">
      ${conTecnologia
        .map((m) => {
          const c = contenido.modelos[m.linea] || {};
          const p = precios.porLinea[m.linea];
          return `<a class="tarjeta model" href="${esc(rel(m.pagina))}" style="text-decoration:none">
        <div class="cuerpo">
          <h3>${esc(m.nombre)}</h3>
          <p style="font-size:14.5px;color:var(--suave);margin:0">${esc(c.gancho || "")}</p>
          <div class="precio"><small>Desde</small><div class="val price"><b>${p ? cop(p) : "Pregúntame"}</b></div></div>
        </div>
      </a>`;
        })
        .join("\n      ")}
    </div>
  </div>
</section>`
    : ""
}

${
  hayFaq(contenido)
    ? `<section class="sec faq">
  <div class="env" style="max-width:780px">
    <h2 class="sec-title">Preguntas</h2>
    ${bloqueFaq(contenido)}
  </div>
</section>`
    : ""
}

${pie(marca, {
  tituloFinal: "¿Te sirve un híbrido o te conviene más uno de gasolina?",
  textoFinal: "Depende de cuántos kilómetros hagas y de por dónde. Cuéntame tu día y te digo cuál te sale mejor, aunque sea el más barato.",
  mensajeFinal: `Hola ${marca.asesor}, quiero saber si me conviene un ${marca.marca} híbrido.`,
  ctxFinal: "tecnologia_final",
})}`;
};
