/* La ficha de un modelo: la página que recibe el clic del anuncio.
 *
 * Los ids #versiones y .ver-row son el contrato con catalogo-vivo.js, que
 * rearma la tabla de versiones con lo que tenga el CRM. Renombrarlos deja la
 * página con los precios escritos y sin aviso.
 */

"use strict";
const { wa, esc, cop, rel, boton, cabeza, encabezado, pie, marcaDe, nombreCompleto, asesorMini } = require("./comun");
const { marcoFoto, bloqueFaq, hayFaq, jsonLdModelo } = require("./piezas");

module.exports = function paginaModelo(marca, contenido, modelo, datos) {
  const c = contenido.modelos[modelo.linea] || {};
  const precio = datos.precio;
  const versiones = datos.versiones || [];
  const otros = marca.modelos.filter((m) => m.linea !== modelo.linea).slice(0, 6);
  // "el Wrangler", "la RAM 700": el artículo lo dice el contenido.
  const art = c.articulo || "el";
  const del = art === "la" ? "de la" : "del";
  const NC = nombreCompleto(marca, modelo);

  const titulo = `${NC} en Medellín${precio ? ` desde ${cop(precio)}` : ""} | Asesor directo`;
  const descripcion = `${c.gancho || `${NC} en Medellín.`} Precio, versiones y ficha técnica. Cotiza por WhatsApp con un asesor real.`;
  const ctx = modelo.linea.toLowerCase();

  return `${cabeza(marca, {
    titulo,
    descripcion,
    ruta: modelo.pagina,
    jsonLd: [jsonLdModelo(marca, contenido, modelo, precio)],
  })}
${encabezado(marca, marca.modelos)}

<section class="hero">
  <div class="env hero-grid">
    <div>
      <span class="cinta">${esc(marcaDe(marca, modelo))}</span>
      <h1>${esc(c.titular || modelo.nombre)}</h1>
      <p class="bajada">${esc(c.gancho || "")}</p>
      <div class="precio" style="margin:22px 0 24px">
        <small style="color:#AFB5BE">Desde</small>
        <div class="val" style="font-size:44px;color:#fff">${precio ? cop(precio) : "Pregúntame el precio"}</div>
        ${precio ? `<div style="font-size:13px;color:#AFB5BE">${esc(contenido.notaPrecio || "Con el bono de fábrica ya incluido")}</div>` : ""}
      </div>
      <div class="hero-acciones">
        ${boton(marca, {
          texto: `Cotizar ${art} ${modelo.nombre}`,
          mensaje: `Hola ${marca.asesor}, quiero cotizar ${art} ${NC}.`,
          ctx: `${ctx}_hero`,
          clase: "grande",
          estado: true,
        })}
        <a class="boton fantasma" href="#versiones" style="color:#fff;border-color:rgba(255,255,255,.3)">Ver versiones</a>
      </div>
    </div>
    ${marcoFoto({
      src: (c.fotos || {}).hero ? `fotos/${c.fotos.hero.src}` : "",
      alt: (c.fotos || {}).hero ? c.fotos.hero.alt : "",
      foco: (c.fotos || {}).hero ? c.fotos.hero.foco || "" : "",
      ajuste: (c.fotos || {}).hero ? c.fotos.hero.ajuste || "" : "",
      fondo: (c.fotos || {}).hero ? c.fotos.hero.fondo || "" : "",
      // Un recorte apaisado metido en el marco vertical de la ficha deja dos
      // bandas blancas enormes arriba y abajo. Si la foto sabe su forma, manda.
      proporcion: (c.fotos || {}).hero ? c.fotos.hero.proporcion || "" : "",
      primera: true,
      alto: true,
      que: `Foto principal del ${modelo.nombre}`,
      medida: "1200 × 1600",
    })}
  </div>
</section>

${seccionColores(marca, modelo, c)}

<section class="sec" id="galeria">
  <div class="env">
    <h2 class="sec-title">Míralo por dentro y por fuera</h2>
    <p class="sec-sub">${esc(contenido.galeriaNota || "")}</p>
    <div class="modelos">
      ${(() => {
        const g = (c.fotos || {}).galeria || [];
        // Siempre tres huecos: los que no tienen foto quedan diciendo cuál
        // falta, en vez de dejar la sección a medias sin que se note.
        const faltantes = ["Frente", "Interior", "Baúl"];
        return faltantes
          .map((q, i) =>
            g[i]
              ? marcoFoto({
                  claro: true,
                  src: `fotos/${g[i].src}`,
                  alt: g[i].alt,
                  foco: g[i].foco || "",
                  ajuste: g[i].ajuste || "",
                  fondo: g[i].fondo || "",
                })
              : marcoFoto({ claro: true, que: `${q} del ${modelo.nombre}`, medida: "1200 × 825" }),
          )
          .join("\n      ");
      })()}
    </div>
  </div>
</section>

<section class="sec franja" id="versiones">
  <div class="env" style="max-width:840px">
    <h2 class="sec-title">Versiones y precios</h2>
    <p class="sec-sub">${esc(contenido.notaVersiones || "Los precios los trae el CRM en vivo, así que son los de hoy. El bono de financiación no está incluido: te lo cuento por WhatsApp.")}</p>
    <div class="versiones">
      ${
        versiones.length
          ? versiones
              .map(
                (v) => `<div class="ver-row">
        <div>
          <div class="nom">${esc(v.nombre)}</div>
          <div class="det">${esc(v.detalle || "")}</div>
        </div>
        <div class="pr">${cop(v.precio)}</div>
      </div>`,
              )
              .join("\n      ")
          : `<p style="color:var(--suave);text-align:center">Escríbeme y te paso las versiones con el precio del día.</p>`
      }
    </div>
    <div style="text-align:center;margin-top:24px">
      ${boton(marca, {
        texto: "Preguntar por una versión",
        mensaje: `Hola ${marca.asesor}, quiero saber más de las versiones d${art} ${NC}.`,
        ctx: `${ctx}_versiones`,
      })}
    </div>
  </div>
</section>

${
  contenido.asesor
    ? `<section class="sec" style="padding-block:34px">
  <div class="env">${asesorMini(marca, contenido, `Te paso el precio del día, los colores que hay y cómo te queda la cuota ${del} ${modelo.nombre}. Te contesto yo, no un robot.`)}</div>
</section>`
    : ""
}

<section class="sec" id="specs">
  <div class="env" style="max-width:840px">
    <h2 class="sec-title">Lo esencial ${del} ${esc(modelo.nombre)}</h2>
    <p class="sec-sub">Sacado de la ficha técnica de ${esc(marcaDe(marca, modelo))}, sin adornos.</p>
    <div class="envuelve-tabla">
      <table class="tabla">
        ${(c.specs || []).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("\n        ")}
      </table>
    </div>
    ${
      (c.fichas || []).length
        ? `<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:22px">
      ${c.fichas.map(([texto, archivo]) => `<a class="boton fantasma" href="fichas/${esc(archivo)}" download>${esc(texto)} · PDF</a>`).join("\n      ")}
    </div>`
        : (c.specs || []).length
          ? ""
          : `<p style="text-align:center;color:var(--suave)">La ficha técnica completa te la mando por WhatsApp.</p>`
    }
  </div>
</section>

<section class="sec franja" id="sobre">
  <div class="env" style="max-width:720px;text-align:center">
    <h2 class="sec-title">¿Para quién es ${art} ${esc(modelo.nombre)}?</h2>
    <p style="color:var(--suave);font-size:17px">${esc(c.paraQuien || "")}</p>
    <div style="margin-top:24px">
      ${boton(marca, {
        texto: "Agendar una prueba de ruta",
        mensaje: `Hola ${marca.asesor}, quiero hacer una prueba de ruta d${art} ${NC}.`,
        ctx: `${ctx}_prueba_ruta`,
      })}
    </div>
  </div>
</section>

${
  hayFaq(contenido)
    ? `<section class="sec faq">
  <div class="env" style="max-width:780px">
    <h2 class="sec-title">Antes de decidirte</h2>
    ${bloqueFaq(contenido)}
  </div>
</section>`
    : ""
}

<section class="sec">
  <div class="env">
    <h2 class="sec-title" style="font-size:clamp(24px,3.6vw,34px)">${esc(contenido.otrosTitulo || `Otros ${marca.marca} en Medellín`)}</h2>
    <div class="modelos" style="margin-top:22px">
      ${otros
        .map(
          (m) => `<a class="tarjeta" href="${esc(rel(m.pagina))}" style="text-decoration:none">
        <div class="cuerpo">
          <h3>${esc(m.marca ? `${m.marca} ${m.nombre}` : m.nombre)}</h3>
          <p style="font-size:14px;color:var(--suave);margin:0">${esc((contenido.modelos[m.linea] || {}).gancho || "")}</p>
        </div>
      </a>`,
        )
        .join("\n      ")}
    </div>
  </div>
</section>

${pie(marca, {
  tituloFinal: `¿Listo para estrenar tu ${modelo.nombre}?`,
  textoFinal: `Te digo el precio del día, qué bono hay vigente y cómo te queda la cuota. Sin compromiso.`,
  mensajeFinal: `Hola ${marca.asesor}, quiero estrenar ${art} ${NC}.`,
  ctxFinal: `${ctx}_cierre_final`,
})}`;
};

/**
 * Los colores en que viene, cada uno con su foto y su nombre.
 *
 * El nombre va en HTML y no pegado en la imagen: en celular se lee, Google lo
 * indexa ("aircross max verde montana") y quien pregunta por un color lo
 * encuentra. Cada color es además un botón: el mensaje de WhatsApp sale con el
 * color escrito, así la conversación arranca en el carro que la persona quiere.
 *
 * Sale del contenido (`colores`); si la marca no los trae, no hay sección.
 */
function seccionColores(marca, modelo, c) {
  const colores = Array.isArray(c.colores) ? c.colores : [];
  if (!colores.length) return "";
  const ctx = modelo.linea.toLowerCase();
  const art = c.articulo || "el";
  const del = art === "la" ? "de la" : "del";
  const NC = nombreCompleto(marca, modelo);
  return `<section class="sec" id="colores">
  <div class="env">
    <h2 class="sec-title">Los colores ${del} ${esc(modelo.nombre)}</h2>
    <p class="sec-sub">${colores.length} colores. Pregúntame por el que te gusta y te digo si hay disponible o cuánto se demora.</p>
    <div class="colores">
      ${colores
        .map(
          (k) => `<a class="color" data-wa data-ctx="color_${esc(ctx)}" href="${esc(
            wa(marca, `Hola ${marca.asesor}, me interesa ${art} ${NC} en color ${k.nombre}. ¿Hay disponible?`),
          )}">
        <span class="color-foto"><img src="fotos/${esc(k.src)}" alt="${esc(`${NC} color ${k.nombre}`)}" loading="lazy" decoding="async"></span>
        <span class="color-nombre">${esc(k.nombre)}</span>
      </a>`,
        )
        .join("\n      ")}
    </div>
  </div>
</section>`;
}
