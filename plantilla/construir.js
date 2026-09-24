#!/usr/bin/env node
/* Arma el sitio de una marca a partir de su ficha.
 *
 *   node construir.js citroen ../../asesor-citroen-medellin
 *   node construir.js citroen --comprobar     (solo revisa la ficha)
 *
 * QUÉ HACE
 * Lee la ficha de la marca y escribe, en la carpeta de salida:
 *   marca.js       la ficha convertida en window.MARCA, que leen los scripts
 *   nucleo/*.js    los scripts compartidos, copiados tal cual
 *   index.html     la portada
 *   <modelo>.html  una ficha por modelo
 *   crédito y tecnología, si la marca las declara
 *   sitemap.xml, robots.txt, vercel.json
 *
 * TRES ARCHIVOS POR MARCA, cada uno con su trabajo:
 *   marcas/<m>.json     quién es: dominio, número, medición, modelos
 *   contenido/<m>.json  qué dice: textos, especificaciones, preguntas
 *   precios/<m>.json    cuánto vale, de RESPALDO — el CRM manda en vivo
 *
 * POR QUÉ UN GENERADOR Y NO UN JSON QUE SE LEE AL VUELO
 * Leer la ficha con fetch al cargar la página deja los scripts esperando una
 * respuesta antes de poder medir el primer clic, y ese clic es justo el que se
 * pierde cuando alguien salta a WhatsApp. marca.js se sirve con la página, no
 * hay carrera.
 *
 * SIN DEPENDENCIAS. Node y nada más: una plantilla de sitios estáticos que
 * necesita npm install deja de ser estática el día que un paquete se rompe.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const portada = require("./paginas/portada");
const paginaModelo = require("./paginas/modelo");
const paginaCredito = require("./paginas/credito");
const paginaTecnologia = require("./paginas/tecnologia");
const paginaLegal = require("./paginas/legal");

const AQUI = __dirname;

/** Lee un JSON opcional; {} si no existe. */
function leerOpcional(carpeta, nombre) {
  const ruta = path.join(AQUI, carpeta, `${nombre}.json`);
  return fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, "utf8")) : {};
}

/**
 * Los precios de respaldo, en la forma que esperan las páginas.
 *
 * Van ESCRITOS en el HTML aunque el CRM los mande en vivo: es lo que ve Google
 * y lo que sigue viéndose si el CRM no contesta. catalogo-vivo.js los pisa con
 * los del día al cargar la página.
 */
function armarPrecios(precios) {
  const lineas = precios.lineas || {};
  const porLinea = {};
  const versiones = {};
  for (const [L, d] of Object.entries(lineas)) {
    porLinea[L] = d.desde || null;
    versiones[L] = (d.versiones || []).map(([nombre, precio, detalle]) => ({ nombre, precio, detalle }));
  }
  const valores = Object.values(porLinea).filter(Boolean);
  return { porLinea, versiones, masBarato: valores.length ? Math.min(...valores) : null };
}

// Lo que no puede faltar para que el sitio mida y reciba el catálogo. Cada uno
// con el motivo, porque un error que solo dice "falta businessId" obliga a
// venir a leer este archivo.
const OBLIGATORIOS = [
  ["sigla", "nombra la llave de la API de conversiones: META_CAPI_TOKEN_<SIGLA>"],
  ["marca", "sale en los textos de WhatsApp y en el feed de Meta"],
  ["dominio", "sin él no se mide: el CRM permite medir por dominio"],
  ["nombrePublico", "el nombre del vendedor en el catálogo de Meta"],
  ["asesor", "quién contesta; sale en los botones de WhatsApp"],
  ["whatsapp", "el número al que van todos los botones"],
  ["businessId", "de qué negocio del CRM es este sitio"],
  ["crm", "a dónde se mandan los eventos y de dónde sale el catálogo"],
];

function leerFicha(nombre) {
  const ruta = path.join(AQUI, "marcas", `${nombre}.json`);
  if (!fs.existsSync(ruta)) {
    const hay = fs
      .readdirSync(path.join(AQUI, "marcas"))
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""));
    throw new Error(`No existe la ficha "${nombre}". Las que hay: ${hay.join(", ")}`);
  }
  return JSON.parse(fs.readFileSync(ruta, "utf8"));
}

/** Devuelve la lista de problemas. Vacía = la ficha sirve para publicar. */
function revisar(f) {
  const faltan = [];
  for (const [campo, porque] of OBLIGATORIOS) {
    const v = f[campo];
    if (typeof v !== "string" || !v.trim()) faltan.push(`${campo} — ${porque}`);
  }
  if (f.dominio && /^https?:\/\//.test(f.dominio)) {
    faltan.push("dominio — va sin https:// (solo asesorcitroenmedellin.com)");
  }
  if (f.whatsapp && !/^57\d{10}$/.test(f.whatsapp)) {
    faltan.push("whatsapp — va con el 57 adelante y sin espacios (573104767828)");
  }
  if (f.sigla && !/^[A-Z]{2,4}$/.test(f.sigla)) {
    faltan.push("sigla — de dos a cuatro letras en mayúscula (ACM)");
  }
  // Las notas legales viven en el contenido, pero quien las revisa es quien
  // construye, así que el aviso sale acá.
  const legal = (leerOpcional("contenido", f._nombreFicha || "") || {}).legal;
  if (legal) {
    if (!String(legal.responsable || "").trim()) {
      faltan.push("legal.responsable — a nombre de quién quedan los datos que recoge la página (Ley 1581)");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(legal.correo || ""))) {
      faltan.push("legal.correo — a dónde escribe alguien para que le borren sus datos");
    }
  }

  const lineas = new Set();
  for (const m of f.modelos || []) {
    if (!m.linea) faltan.push(`un modelo sin "linea" (${m.nombre || "sin nombre"})`);
    else if (lineas.has(m.linea)) faltan.push(`la línea ${m.linea} está repetida`);
    else lineas.add(m.linea);
  }
  return faltan;
}

/** Lo que de verdad necesita el navegador. Nada de notas internas ni precios. */
function paraElNavegador(f) {
  return {
    sigla: f.sigla,
    prefijoCookie: f.prefijoCookie || String(f.sigla || "").toLowerCase(),
    marca: f.marca,
    dominio: f.dominio,
    nombrePublico: f.nombrePublico,
    asesor: f.asesor,
    whatsapp: f.whatsapp,
    businessId: f.businessId,
    crm: f.crm,
    medicion: f.medicion || {},
    horario: f.horario || { desde: 8, hasta: 24 },
    credito: f.credito || {},
    colores: f.colores || {},
    pesos: f.pesos || {},
    paginasPortada: f.paginasPortada || [],
    paginaTecnologia: f.paginaTecnologia || "",
    paginaCredito: f.paginaCredito || "",
    paginaLegal: f.paginaLegal || "",
    // El precio NO viaja: lo manda el CRM en vivo. Aquí solo va lo que los
    // scripts necesitan para saber qué modelo es cuál.
    modelos: (f.modelos || []).map((m) => ({
      linea: m.linea,
      nombre: m.nombre,
      pagina: m.pagina || "",
      paginasExtra: m.paginasExtra || [],
      traccion: m.traccion || "",
      propulsion: m.propulsion || "",
    })),
  };
}

function escribirMarcaJs(f, salida, nombreFicha) {
  const datos = JSON.stringify(paraElNavegador(f), null, 2);
  const texto =
    `/* GENERADO por plantilla/construir.js — no editar a mano.\n` +
    `   Se edita plantilla/marcas/${nombreFicha}.json y se vuelve a construir.\n\n` +
    `   Esta es la ficha de la marca tal como la ven los scripts del sitio. Va en\n` +
    `   el <head> ANTES que cualquier script del núcleo, y sin defer: los demás\n` +
    `   la necesitan ya cargada cuando corren.\n` +
    `     <script src="marca.js"></script>\n` +
    `     <script defer src="nucleo/track.js"></script>\n` +
    `     <script defer src="nucleo/meta-pixel.js"></script>   (después de track)\n` +
    `     <script defer src="nucleo/wa-firma.js"></script>\n` +
    `     <script defer src="nucleo/estado-asesor.js"></script>\n` +
    `     <script defer src="nucleo/catalogo-vivo.js"></script> */\n` +
    `window.MARCA = ${datos};\n`;
  fs.writeFileSync(path.join(salida, "marca.js"), texto, "utf8");
}

/** Escribe un archivo y anota su ruta para el resumen del final. */
function escribir(salida, ruta, texto, hechos) {
  const destino = path.join(salida, ruta);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, texto, "utf8");
  hechos.push(ruta);
}

/** Las páginas: portada, una por modelo, crédito y tecnología. */
function escribirPaginas(marca, contenido, precios, salida, hechos) {
  const datos = armarPrecios(precios);
  // El pie de todas las páginas muestra los avisos cortos.
  marca.legal = contenido.legal || null;

  escribir(salida, "index.html", portada(marca, contenido, datos), hechos);

  for (const m of marca.modelos || []) {
    if (!m.pagina) continue;
    escribir(
      salida,
      m.pagina.replace(/^\//, ""),
      paginaModelo(marca, contenido, m, {
        precio: datos.porLinea[m.linea],
        versiones: datos.versiones[m.linea],
      }),
      hechos,
    );
  }

  if (marca.paginaCredito) {
    escribir(salida, marca.paginaCredito.replace(/^\//, ""), paginaCredito(marca, contenido, datos), hechos);
  }

  const tec = paginaTecnologia(marca, contenido, datos);
  if (tec) escribir(salida, marca.paginaTecnologia.replace(/^\//, ""), tec, hechos);

  const leg = paginaLegal(marca, contenido);
  if (leg) escribir(salida, marca.paginaLegal.replace(/^\//, ""), leg, hechos);
}

/** Lo que necesitan Google y Vercel. */
function escribirSeo(marca, salida, hechos) {
  const rutas = ["/", ...(marca.modelos || []).map((m) => m.pagina), marca.paginaCredito];
  if (marca.paginaTecnologia) rutas.push(marca.paginaTecnologia);
  // La página legal queda fuera del sitemap a propósito: va con noindex.
  const hoy = new Date().toISOString().slice(0, 10);
  escribir(
    salida,
    "sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      rutas
        .filter(Boolean)
        .map((r) => `  <url><loc>https://${marca.dominio}${r}</loc><lastmod>${hoy}</lastmod></url>`)
        .join("\n") +
      `\n</urlset>\n`,
    hechos,
  );
  escribir(
    salida,
    "robots.txt",
    `User-agent: *\nAllow: /\n\nSitemap: https://${marca.dominio}/sitemap.xml\n`,
    hechos,
  );
  // /index.html redirige a / para no tener la portada en dos direcciones, que
  // es lo que Google castiga como contenido duplicado.
  escribir(
    salida,
    "vercel.json",
    JSON.stringify(
      {
        $schema: "https://openapi.vercel.sh/vercel.json",
        redirects: [{ source: "/index.html", destination: "/", permanent: true }],
      },
      null,
      2,
    ) + "\n",
    hechos,
  );
}

/** Las fotos de la marca, tal cual. Si no hay carpeta, no pasa nada. */
function copiarFotos(nombre, salida, hechos) {
  const desde = path.join(AQUI, "fotos", nombre);
  if (!fs.existsSync(desde)) return;
  const hasta = path.join(salida, "fotos");
  fs.mkdirSync(hasta, { recursive: true });
  let n = 0;
  for (const f of fs.readdirSync(desde)) {
    fs.copyFileSync(path.join(desde, f), path.join(hasta, f));
    n++;
  }
  if (n) hechos.push(`fotos/ (${n} imágenes)`);
  // Las fichas técnicas en PDF, para descargar desde cada modelo. Solo van las
  // que se revisaron: un PDF que llega por WhatsApp puede traer de todo (uno
  // trajo la cédula de una clienta en la primera página).
  const fichasDesde = path.join(AQUI, "fichas", nombre);
  if (fs.existsSync(fichasDesde)) {
    const fichasHasta = path.join(salida, "fichas");
    fs.mkdirSync(fichasHasta, { recursive: true });
    let k = 0;
    for (const f of fs.readdirSync(fichasDesde)) {
      if (!f.endsWith(".pdf")) continue;
      fs.copyFileSync(path.join(fichasDesde, f), path.join(fichasHasta, f));
      k++;
    }
    if (k) hechos.push(`fichas/ (${k} PDF)`);
  }
}

function copiarNucleo(salida) {
  const desde = path.join(AQUI, "nucleo");
  const hasta = path.join(salida, "nucleo");
  fs.mkdirSync(hasta, { recursive: true });
  const copiados = [];
  for (const f of fs.readdirSync(desde)) {
    if (!f.endsWith(".js")) continue;
    fs.copyFileSync(path.join(desde, f), path.join(hasta, f));
    copiados.push(f);
  }
  return copiados;
}

function main() {
  const [nombre, destino] = process.argv.slice(2);
  if (!nombre) {
    console.error("Uso: node construir.js <marca> [carpeta-de-salida | --comprobar]");
    process.exit(2);
  }

  let ficha;
  try {
    ficha = leerFicha(nombre);
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }

  // La revisión necesita saber de qué marca es, para leer su contenido.
  ficha._nombreFicha = nombre;
  const problemas = revisar(ficha);
  const soloComprobar = !destino || destino === "--comprobar";

  if (problemas.length) {
    console.log(`La ficha de ${nombre} todavía no sirve para publicar:`);
    for (const p of problemas) console.log(`  · falta ${p}`);
  } else {
    console.log(`La ficha de ${nombre} está completa.`);
  }

  if (soloComprobar) process.exit(problemas.length ? 1 : 0);

  // Se construye igual con la ficha incompleta: sirve para ver el sitio en una
  // vista previa antes de tener el dominio y el número. Lo que falte queda
  // apagado solo (los scripts no miden sin ficha completa) y el aviso queda
  // arriba para que no se publique así sin darse cuenta.
  const salida = path.resolve(destino);
  fs.mkdirSync(salida, { recursive: true });
  escribirMarcaJs(ficha, salida, nombre);
  const copiados = copiarNucleo(salida);

  const hechos = [];
  const contenido = leerOpcional("contenido", nombre);
  const precios = leerOpcional("precios", nombre);
  if (contenido.modelos) {
    escribirPaginas(ficha, contenido, precios, salida, hechos);
    copiarFotos(nombre, salida, hechos);
    escribirSeo(ficha, salida, hechos);
  } else {
    console.log(`\n(Sin contenido/${nombre}.json: se escriben solo la ficha y el núcleo.)`);
  }

  console.log(`\nEscrito en ${salida}:`);
  console.log(`  marca.js`);
  for (const f of copiados) console.log(`  nucleo/${f}`);
  for (const f of hechos) console.log(`  ${f}`);
  if (problemas.length) {
    console.log(`\nOJO: con lo que falta, el sitio NO mide todavía. Sirve para verlo, no para publicarlo.`);
  }
}

main();
