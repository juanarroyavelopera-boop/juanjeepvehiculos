/* Las piezas que comparten todas las páginas de todas las marcas.
 *
 * Nada de esto sabe de Citroën ni de Suzuki: lo que cambia sale de la ficha
 * (marcas/<marca>.json) y del contenido (contenido/<marca>.json).
 *
 * POR QUÉ SE ARMA EN JAVASCRIPT Y NO CON UN MOTOR DE PLANTILLAS
 * Porque el HTML que sale tiene que ser plano y completo: los títulos, las
 * descripciones y los precios de respaldo van escritos en el archivo, no
 * pintados después, o Google no los ve. Un motor de plantillas haría lo mismo
 * y agregaría una dependencia; con literales de plantilla alcanza.
 */

"use strict";

/** Escapa lo que entra a un atributo o a texto del HTML. */
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Pesos colombianos con puntos de mil. */
const cop = (n) => "$" + Number(n || 0).toLocaleString("es-CO");

/** "$63.9M" — el precio corto de las tarjetas. */
const copCorto = (n) => "$" + (Math.floor(Number(n || 0) / 100000) / 10).toFixed(1) + "M";

/**
 * Una ruta interna, relativa.
 *
 * La ficha guarda las rutas con "/" adelante porque es como se ven en el
 * dominio. Para el href se quita: una ruta relativa funciona igual en la raíz
 * del dominio y dentro de una vista previa, y ahorra que el sitio solo se pueda
 * ver publicado. El canonical y el og:url sí llevan la URL absoluta, que es lo
 * que Google necesita.
 */
const rel = (ruta) => String(ruta || "").replace(/^\//, "") || "index.html";

/**
 * La marca de UN modelo.
 *
 * Un sitio puede vender dos marcas del mismo concesionario (Jeep y RAM en
 * Juan Jeep Vehículos). El modelo que declara `marca` en la ficha la usa; los
 * demás, la del sitio. Así el mensaje dice "la RAM 700" y no "el Jeep RAM 700".
 */
const marcaDe = (marca, modelo) => (modelo && modelo.marca) || marca.marca;
const nombreCompleto = (marca, modelo) => `${marcaDe(marca, modelo)} ${modelo.nombre}`;

/** El enlace de WhatsApp con el mensaje ya escrito. La firma la pone wa-firma.js. */
function wa(marca, texto) {
  return `https://wa.me/${marca.whatsapp}?text=${encodeURIComponent(texto)}`;
}

/**
 * Un botón de WhatsApp.
 *
 * `ctx` NO es decoración: es lo que separa en el reporte un clic del botón de
 * arriba de uno del final de la página, y lo que le pone precio a cada clic.
 * Un botón sin ctx mide como "general" y se pierde entre los demás.
 */
/* La silueta genérica. No lleva iniciales a propósito: todavía no está
 * decidido quién atiende Citroën, y unas iniciales equivocadas son peor que
 * ninguna. */
const SILUETA =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
  '<path d="M12 12a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Zm0 1.9c-4 0-7.2 2.2-7.2 5v1.2h14.4v-1.2c0-2.8-3.2-5-7.2-5Z"/></svg>';

/**
 * La cara de quien contesta.
 *
 * Es un hueco con forma, no un adorno: mientras no haya retrato muestra una
 * silueta, y el día que llegue la foto es UNA línea en la ficha de marca
 * (`asesorFoto`) y entra en los tres sitios donde sale, sin tocar el HTML.
 *
 * `claro` es para fondos claros o oscuros planos; sin él se pinta para ir
 * encima del verde de WhatsApp.
 */
function avatar(marca, { claro = false } = {}) {
  const f = marca.asesorFoto;
  const clase = "avatar" + (claro ? " claro" : "");
  if (f && f.src) {
    return `<span class="${clase}"><img src="fotos/${esc(f.src)}" alt="${esc(f.alt || marca.asesor)}" loading="lazy" decoding="async"></span>`;
  }
  return `<span class="${clase}" aria-hidden="true">${SILUETA}</span>`;
}

function boton(marca, { texto, mensaje, ctx, clase = "", estado = false }) {
  const quien = estado
    ? `<span class="quien">${avatar(marca)}<span class="estado-asesor"></span></span>`
    : "";
  return `<a class="wpp-cta ${clase}" data-ctx="${esc(ctx)}" href="${esc(wa(marca, mensaje))}">${ICONO_WA}<span class="rotulo">${esc(texto)}</span>${quien}</a>`;
}

const ICONO_WA =
  '<svg class="ico-wa" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
  '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/></svg>';

/**
 * Los estilos. Salen de los colores de la ficha, así que cada marca tiene los
 * suyos sin que haya una hoja de estilos por marca.
 */
/* ── el origen de la marca ──
 *
 * Citroën es francesa, pero el C3, el Basalt y los Aircross se arman en Porto
 * Real (Brasil) y la Berlingo en España. Por eso la frase dice "diseño
 * francés" y NO "hecho en Francia": el cliente mira la placa de la puerta en
 * la sala, y una frase que se cae ahí cuesta la venta.
 *
 * La bandera va dibujada, no en emoji: 🇫🇷 en Windows se ve como las letras
 * "FR", que es justo lo contrario de lo que se busca.
 */
const BANDERAS = {
  fr: '<svg viewBox="0 0 9 6" aria-hidden="true" focusable="false"><rect width="3" height="6" fill="#002395"/><rect x="3" width="3" height="6" fill="#fff"/><rect x="6" width="3" height="6" fill="#ED2939"/></svg>',
  es: '<svg viewBox="0 0 9 6" aria-hidden="true" focusable="false"><rect width="9" height="6" fill="#AA151B"/><rect y="1.5" width="9" height="3" fill="#F1BF00"/></svg>',
  us: '<svg viewBox="0 0 9 6" aria-hidden="true" focusable="false"><rect width="9" height="6" fill="#fff"/><g fill="#B22234"><rect width="9" height=".86"/><rect y="1.71" width="9" height=".86"/><rect y="3.43" width="9" height=".86"/><rect y="5.14" width="9" height=".86"/></g><rect width="3.9" height="3.23" fill="#3C3B6E"/></svg>',
  cn: '<svg viewBox="0 0 9 6" aria-hidden="true" focusable="false"><rect width="9" height="6" fill="#EE1C25"/><path fill="#FFDE00" d="M1.5 .9 1.85 1.97 .94 1.31h1.12L1.15 1.97z"/><g fill="#FFDE00"><circle cx="3.1" cy=".62" r=".26"/><circle cx="3.7" cy="1.2" r=".26"/><circle cx="3.7" cy="2" r=".26"/><circle cx="3.1" cy="2.55" r=".26"/></g></svg>',
  jp: '<svg viewBox="0 0 9 6" aria-hidden="true" focusable="false"><rect width="9" height="6" fill="#fff"/><circle cx="4.5" cy="3" r="1.8" fill="#BC002D"/></svg>',
};

/**
 * El sello de origen: bandera + frase corta.
 *
 * Sale de la ficha de marca (`origen`), no del contenido, porque es un dato de
 * la marca y no una frase de venta que cambie con la campaña. Si la ficha no lo
 * trae, no se dibuja nada: Jeep y GWM deciden si lo quieren y con qué texto.
 */
function chipOrigen(marca, { claro = false } = {}) {
  const o = marca.origen;
  if (!o || !o.texto) return "";
  const bandera = BANDERAS[o.bandera] || "";
  return `<span class="origen${claro ? " claro" : ""}">${bandera}${esc(o.texto)}</span>`;
}

/* ── los dos temas ──
 *
 * Una página de carros en un solo tono se lee plana: el ojo no sabe dónde
 * termina un bloque y empieza el otro, y todo pesa igual. El ritmo lo dan
 * TRES fondos que se alternan —hondo, papel, fondo— más una raya que se ve.
 *
 * Los cinco colores que cambian de tema son los únicos que hay que tocar:
 * todo lo demás del CSS ya está escrito contra estas variables, así que la
 * página entera cambia de claro a oscuro sin tocar una sola regla más.
 *
 *   --hondo   el más oscuro: hero y cierre, los dos extremos de la página
 *   --papel   el fondo normal de las secciones
 *   --fondo   el escalón intermedio: franjas, tarjetas, pastillas
 *   --divisor la raya entre bloques (3px: a 1px no se veía)
 *   --pie     el pie, que cierra con el escalón intermedio
 */
const TEMAS = {
  claro: (c) => ({
    tinta: c.tinta || "#2B2E33",
    hondo: c.apoyo || "#1B1F24",
    papel: "#FFFFFF",
    fondo: "#F4F5F7",
    tarjeta: "#FFFFFF",
    pie: "#FFFFFF",
    raya: "#E2E5EA",
    divisor: "#DCE0E6",
    suave: "#6B7280",
    vidrio: "rgba(255,255,255,.96)",
  }),
  oscuro: () => ({
    tinta: "#ECEEF1",
    hondo: "#0C0E11",
    papel: "#15181C",
    fondo: "#1E2228",
    tarjeta: "#1E2228",
    pie: "#1E2228",
    raya: "#333941",
    divisor: "rgba(255,255,255,.13)",
    suave: "#A3AAB4",
    vidrio: "rgba(21,24,28,.96)",
  }),
};

/* Los iconos de las ventajas. Trazo, no relleno: sobre el hero oscuro un
 * icono macizo se ve como una mancha. El nombre lo elige el contenido. */
const ICONOS = {
  semaforo:
    '<svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="16" rx="4"/>' +
    '<circle cx="12" cy="7" r="1.4"/><circle cx="12" cy="14" r="1.4"/>' +
    '<path d="M12 18.5v3M8 21.5h8"/></svg>',
  cambio:
    '<svg viewBox="0 0 24 24"><path d="M3.5 8.5h13l-3.2-3.4M20.5 15.5h-13l3.2 3.4"/></svg>',
  billete:
    '<svg viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/>' +
    '<circle cx="12" cy="12" r="2.8"/><path d="M6 12h.01M18 12h.01"/></svg>',
  rayo:
    '<svg viewBox="0 0 24 24"><path d="M13.5 2.5 5 13.5h6l-.5 8 8.5-11h-6z"/></svg>',
  llave:
    '<svg viewBox="0 0 24 24"><circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3.5M15.5 12v2.5"/></svg>',
  persona:
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20.5c.9-3.6 3.9-5.8 7.5-5.8s6.6 2.2 7.5 5.8"/></svg>',
  reloj:
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></svg>',
  mapa:
    '<svg viewBox="0 0 24 24"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
  montana:
    '<svg viewBox="0 0 24 24"><path d="M2.5 19.5 9 8l4 6.5 2.5-3.5 6 8.5z"/></svg>',
  escudo:
    '<svg viewBox="0 0 24 24"><path d="M12 2.5 4.5 5.5v6c0 4.6 3.1 8.6 7.5 10 4.4-1.4 7.5-5.4 7.5-10v-6z"/>' +
    '<path d="m9 12 2.2 2.2L15.5 10"/></svg>',
};

/**
 * La tira de ventajas del hero.
 *
 * Va por contenido (`hero.ventajas`), no por código: lo que hace comprar
 * cambia de marca a marca, y el día que cambie una promesa no debería haber
 * que tocar una plantilla. Si la marca no las trae, se dibujan los números de
 * siempre (`hero.datos`), que es lo que ya tenía Suzuki.
 */
function tiraHero(h) {
  if (!Array.isArray(h.ventajas) || !h.ventajas.length) {
    return `<div class="hero-datos">
        ${(h.datos || []).map(([b, s]) => `<div><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join("\n        ")}
      </div>`;
  }
  return `<div class="hero-ventajas">
        ${h.ventajas
          .map(
            (v) => `<div class="ventaja">
          <span class="ico" aria-hidden="true">${ICONOS[v.icono] || ICONOS.escudo}</span>
          <div><b>${esc(v.titulo)}</b><span>${esc(v.apoyo)}</span></div>
        </div>`,
          )
          .join("\n        ")}
      </div>`;
}

/* ── las tipografías ──
 *
 * "impacto" es la de Suzuki y Citroën: Bebas Neue, condensada y gritona, buena
 * para vender precio. "elegante" nació en Invercrédito y se estrenó en Jeep:
 * titulares en serif (Source Serif 4), más aire y sombras suaves. Se lee como
 * una asesoría y no como un volante, que es lo que se busca cuando el
 * protagonista es el asesor y no la promoción.
 *
 * Se elige en la ficha (`tipografia`). Si no dice nada, queda la de siempre:
 * ningún sitio publicado cambia solo por actualizar la plantilla.
 */
const TIPOGRAFIAS = {
  impacto: {
    titulos: "'Bebas Neue','Arial Narrow',Impact,sans-serif",
    fuentes: "family=Bebas+Neue&family=Inter:wght@400;500;600;700;800",
    css: "",
  },
  elegante: {
    titulos: "'Source Serif 4',Georgia,'Times New Roman',serif",
    fuentes: "family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700",
    css: `
h1,h2,h3,.bebas{font-weight:600;letter-spacing:-.01em;line-height:1.12}
h1{font-size:clamp(32px,4.6vw,50px)}
h2{font-size:clamp(26px,3.8vw,38px)}
.tarjeta h3{font-size:23px}
.desde .valor,.precio .val,.ver-row .pr,.hero-datos b{font-weight:700;letter-spacing:-.01em}
.precio .val{font-size:27px}
.ver-row .pr{font-size:22px}
.tarjeta,.marco,.ver-row{border-radius:10px}
.tarjeta{box-shadow:0 4px 14px rgba(20,24,18,.06)}
.tarjeta:hover{box-shadow:0 18px 40px rgba(20,24,18,.13)}
.wpp-cta,.boton{border-radius:8px;letter-spacing:.01em}
.hero .cinta{border-radius:3px;background:transparent;border:1px solid var(--acento);color:var(--acento)}
.sec{border-top-width:1px}
.pasos b{font-family:Inter,system-ui,sans-serif;font-weight:700;font-size:12.5px;padding-top:0}`,
  },
};

function estilos(marca) {
  const c = marca.colores || {};
  const t = (TEMAS[marca.tema] || TEMAS.claro)(c);
  const f = TIPOGRAFIAS[marca.tipografia] || TIPOGRAFIAS.impacto;
  return `
:root{
  --tinta:${t.tinta};
  --marca:${c.marca || "#DA291C"};
  --acento:${c.acento || "#D4AF37"};
  --apoyo:${c.apoyo || "#1B1F24"};
  --wa:${c.whatsapp || "#1FBE57"};
  --hondo:${t.hondo};
  --papel:${t.papel};
  --fondo:${t.fondo};
  --tarjeta:${t.tarjeta};
  --pie:${t.pie};
  --raya:${t.raya};
  --divisor:${t.divisor};
  --suave:${t.suave};
  --vidrio:${t.vidrio};
  --titulos:${f.titulos};
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--papel);color:var(--tinta);
  font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:16px;line-height:1.6;
  overflow-x:hidden}
img{max-width:100%;height:auto;display:block}
a{color:inherit}
h1,h2,h3,.bebas{font-family:var(--titulos);font-weight:400;
  letter-spacing:.5px;line-height:1.05;margin:0;text-wrap:balance}
h1{font-size:clamp(34px,5vw,52px)}
h2{font-size:clamp(28px,4.6vw,44px)}
.env{max-width:1120px;margin:0 auto;padding-inline:20px}
.sec{padding-block:clamp(44px,7vw,80px);border-top:3px solid var(--divisor)}
.sec-title{text-align:center;margin-bottom:8px}
.sec-sub{text-align:center;color:var(--suave);max-width:60ch;margin:0 auto 34px}

/* ── cabecera ── */
header{position:sticky;top:0;z-index:50;background:var(--vidrio);
  backdrop-filter:blur(8px);border-bottom:1px solid var(--raya)}
.nav{display:flex;align-items:center;gap:16px;min-height:62px}
.logo{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:800;
  letter-spacing:-.3px;flex:none}
.logo .marca-punto{width:26px;height:26px;border-radius:5px;background:var(--marca);flex:none}
.nav-links{display:flex;gap:20px;margin-left:auto;font-size:14.5px;font-weight:500}
.nav-links a{text-decoration:none;color:var(--suave)}
.nav-links a:hover{color:var(--tinta)}
.nav .wpp-cta{flex:none}
/* El botón del menú en celular.
 *
 * Decía sólo "☰", y un cuadrito con tres rayas no le dice a nadie que detrás
 * hay seis carros para mirar. Ahora dice MODELOS, que es lo que la gente vino
 * a buscar.
 *
 * Y lleva color propio: un <button> no hereda el color del texto de la página
 * —el navegador le pone el suyo, negro— así que sobre fondo oscuro el ☰
 * quedaba negro sobre casi negro. Se veía apenas el borde. */
.nav-toggle{display:none;margin-left:auto;background:none;border:1px solid var(--raya);
  border-radius:999px;padding:8px 14px;cursor:pointer;color:var(--tinta);
  font:inherit;font-size:14.5px;font-weight:700;line-height:1;
  display:none;align-items:center;gap:9px}
.nav-toggle .chev::after{content:"☰";font-size:15px;color:var(--suave)}
.nav-toggle[aria-expanded="true"] .chev::after{content:"✕"}
.nav-toggle:hover{border-color:var(--suave)}
/* En celular angosto el nombre largo no dejaba entrar el botón: la cabecera se
   salía 41px de la pantalla a 360px de ancho y el "Modelos" quedaba cortado. */
@media (max-width:520px){
  .nav{gap:10px}
  .logo{flex:0 1 auto;min-width:0;font-size:14px;overflow:hidden;
    text-overflow:ellipsis;white-space:nowrap}
  .logo .marca-punto{width:22px;height:22px}
  .nav-toggle{padding:8px 12px;font-size:13.5px;gap:7px;flex:none}
}
@media (max-width:1040px){
  .nav-links{display:none;position:absolute;top:62px;left:0;right:0;background:var(--papel);
    border-bottom:1px solid var(--raya);flex-direction:column;gap:0;padding:8px 20px 14px}
  .nav-links.abierto{display:flex}
  .nav-links a{padding:11px 0;border-bottom:1px solid var(--raya)}
  .nav-toggle{display:inline-flex}
  .nav .wpp-cta{display:none}
}
/* Y por si algún día entran más modelos: que nunca se parta en dos líneas. */
.nav-links{flex-wrap:nowrap;white-space:nowrap}
@media (max-width:1040px){.nav-links{flex-wrap:wrap;white-space:normal}}

/* ── botones ── */
.wpp-cta,.boton{display:inline-flex;align-items:center;justify-content:center;gap:8px;
  padding:13px 22px;border-radius:999px;font-weight:700;font-size:15px;text-decoration:none;
  background:var(--wa);color:#fff;border:0;cursor:pointer;transition:transform .12s ease,filter .12s ease}
.wpp-cta:hover,.boton:hover{filter:brightness(1.06);transform:translateY(-1px)}
.wpp-cta.chico{padding:9px 16px;font-size:14px}
.wpp-cta.grande{padding:16px 30px;font-size:17px}
.boton.fantasma{background:transparent;color:var(--tinta);border:1.5px solid var(--raya)}
.ico-wa{flex:none}
.estado-asesor{font-size:12.5px;font-weight:500;opacity:.92;margin-left:2px}
/* El avatar del asesor. Va junto al "en línea ahora", que es donde la página
   dice quién contesta. */
.quien{display:inline-flex;align-items:center;gap:7px;margin-left:4px}
/* El rótulo no se parte: en celular "Cotizar ahora" salía en dos renglones
   dentro del botón, con el estado partido al lado. */
.wpp-cta{max-width:100%}
.wpp-cta .rotulo{white-space:nowrap}
/* Debajo de 360px hay rótulos que no caben de una pieza —"Cotizar el
   Citroën C3 Max Híbrida"— y el botón se salía de la pantalla. Ahí sí se
   parte: mejor dos renglones que una barra horizontal. */
@media (max-width:360px){.wpp-cta .rotulo{white-space:normal}}
.avatar{width:26px;height:26px;border-radius:50%;flex:none;display:grid;place-items:center;
  background:rgba(255,255,255,.22);overflow:hidden}
.avatar svg{width:17px;height:17px;fill:#fff;opacity:.92}
.avatar img{width:100%;height:100%;object-fit:cover}
/* Sobre fondos planos (el pie), donde el blanco translúcido no se ve. */
.avatar.claro{background:var(--fondo);border:1px solid var(--raya)}
.avatar.claro svg{fill:var(--suave);opacity:1}
.avatar.grande{width:38px;height:38px}
.avatar.grande svg{width:24px;height:24px}
@media (max-width:520px){.quien{gap:6px}.avatar{width:23px;height:23px}
  .avatar svg{width:15px;height:15px}}
/* En el botón grande del hero no caben el rótulo y el estado en la misma
   línea: a 390px el estado salía partido en tres renglones. Baja a su
   propio renglón, que además se lee como una firma. */
@media (max-width:560px){
  .wpp-cta.grande{flex-wrap:wrap;row-gap:4px;padding:14px 24px}
  .wpp-cta.grande .quien{flex-basis:100%;justify-content:center;margin-left:0}
}

/* ── hero ── */
.hero{background:var(--hondo);color:#fff;position:relative;overflow:hidden}
.hero .env{position:relative;z-index:2;padding-block:clamp(46px,8vw,86px)}
.hero-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:38px;align-items:center}
@media (max-width:1040px){.hero-grid{grid-template-columns:1fr;gap:26px}}
.hero .cinta{display:inline-block;background:var(--marca);color:#fff;font-size:12px;font-weight:700;
  letter-spacing:.12em;text-transform:uppercase;padding:5px 12px;border-radius:4px;margin-bottom:16px}
.origen{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600;
  color:#D6D9DE;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);
  padding:5px 12px 5px 8px;border-radius:999px;vertical-align:middle}
.origen svg{width:20px;height:14px;border-radius:2px;flex:none;display:block;
  box-shadow:0 0 0 1px rgba(0,0,0,.18)}
.origen.claro{color:var(--suave);background:transparent;border-color:var(--raya)}
/* El sello va SIEMPRE en su propio renglón, alineado con la cinta: juntos no
   caben ni en escritorio, y sangrado se ve como un error de maquetación. */
.hero .cinta+.origen{display:flex;width:fit-content;max-width:100%;margin:0 0 18px}
@media (max-width:520px){.origen{font-size:12px;padding:4px 11px 4px 7px}
  .origen svg{width:18px;height:12px}}
.hero p.bajada{color:#D6D9DE;font-size:17px;max-width:52ch;margin:16px 0 22px}
/* El precio de entrada, en grande.
 *
 * Es el argumento más fuerte de Citroën en la sala, y estaba enterrado en la
 * tercera tarjeta del portafolio, debajo del doblez. Aquí lo ve quien entra,
 * antes de decidir si sigue bajando.
 *
 * El número va en su propio elemento con id: catalogo-vivo.js lo reemplaza con
 * el precio del día del modelo más barato, igual que hace con las tarjetas. El
 * escrito en el HTML es el respaldo para Google y para cuando el CRM no
 * contesta. */
/* Dos precios, uno al lado del otro: el de entrada y el de la híbrida más
   barata. En celular se apilan, con una raya que los separa. */
.desdes{display:flex;flex-wrap:wrap;align-items:flex-end;gap:14px 30px;margin:0 0 26px}
.desde{margin:0}
.desde.hibrida .valor{font-size:clamp(32px,4.6vw,46px);color:#EDEFF2}
.desde.hibrida .rotulo{color:#9AA1AB}
@media (max-width:620px){
  .desdes{gap:12px}
  .desde.hibrida{width:100%;padding-top:12px;border-top:1px solid rgba(255,255,255,.14)}
}
.desde .rotulo{display:block;font-size:13px;font-weight:600;letter-spacing:.06em;
  text-transform:uppercase;color:#AFB5BE;margin-bottom:2px}
.desde .valor{display:block;font-family:var(--titulos);
  font-weight:400;letter-spacing:1px;line-height:1;color:var(--acento);
  font-size:clamp(40px,6.4vw,64px)}
.desde .nota{display:block;font-size:12.5px;color:#9AA1AB;margin-top:6px}
.hero-acciones{display:flex;flex-wrap:wrap;gap:12px}
.hero-datos{display:flex;flex-wrap:wrap;gap:22px;margin-top:30px;padding-top:22px;
  border-top:3px solid rgba(255,255,255,.22)}
.hero-datos div{min-width:96px}
.hero-datos b{display:block;font-family:var(--titulos);font-size:27px;color:var(--acento)}
.hero-datos span{font-size:12.5px;color:#AFB5BE}
/* Las ventajas del hero.
 *
 * Reemplazan a los números cuando la marca las declara. Un "6 modelos
 * disponibles" informa; un "recibimos tu carro" contesta la pregunta con la
 * que la gente llega. Cada una es una tarjeta para que se vea, no una línea
 * más de texto debajo del titular. */
.hero-ventajas{display:grid;grid-template-columns:repeat(auto-fit,minmax(178px,1fr));
  gap:12px;margin-top:30px;padding-top:24px;border-top:3px solid rgba(255,255,255,.22)}
.ventaja{display:flex;align-items:flex-start;gap:11px;padding:13px 14px;border-radius:12px;
  background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.11)}
.ventaja .ico{flex:none;width:32px;height:32px;border-radius:9px;display:grid;place-items:center;
  background:color-mix(in srgb,var(--acento) 20%,transparent)}
.ventaja .ico svg{width:19px;height:19px;fill:none;stroke:var(--acento);stroke-width:1.9;
  stroke-linecap:round;stroke-linejoin:round}
.ventaja b{display:block;font-size:14.5px;line-height:1.25;margin-bottom:3px}
.ventaja span{display:block;font-size:12.5px;line-height:1.35;color:#AFB5BE}
@media (max-width:520px){.hero-ventajas{gap:9px}.ventaja{padding:11px 12px;gap:10px}
  .ventaja .ico{width:28px;height:28px}.ventaja .ico svg{width:17px;height:17px}}

/* ── marco de foto ── */
/* La foto va ABSOLUTA dentro del marco, y no es un capricho: con la imagen en
   el flujo normal, el aspect-ratio del marco se ignora —queda una dependencia
   circular entre el alto del marco y el de la imagen— y la foto se dibuja con
   SU proporción, no con la del marco. Eso hacía que una foto vertical de
   carretera llenara la tarjeta con cielo y árboles, con el carro fuera de
   cuadro, y que el punto de enfoque no sirviera de nada. */
.marco{position:relative;border-radius:14px;overflow:hidden;background:#2A2E35;
  aspect-ratio:4/3;display:grid;place-items:center}
.marco.claro{background:var(--fondo);border:1px solid var(--raya)}
.marco.blanco{background:#fff}
.marco img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
/* Entra completa, sin recortar. El aire alrededor es solo para los recortes
   sobre blanco: en una foto de paisaje el margen deja una franja de fondo
   dentro del marco y se ve como un error de montaje. */
.marco.completa img{object-fit:contain}
.marco.completa.blanco img{padding:14px}
.marco .falta{text-align:center;color:#8B929C;font-size:12.5px;padding:18px;line-height:1.5}
.marco .falta b{display:block;font-family:var(--titulos);font-size:21px;
  letter-spacing:1px;color:#AEB5BF;margin-bottom:4px}

/* ── tarjetas de modelo ── */
.modelos{display:grid;grid-template-columns:repeat(auto-fit,minmax(272px,1fr));gap:20px}
.tarjeta{background:var(--tarjeta);border:1px solid var(--raya);border-radius:14px;overflow:hidden;
  display:flex;flex-direction:column;transition:box-shadow .15s ease,transform .15s ease}
.tarjeta:hover{box-shadow:0 10px 30px rgba(20,24,31,.09);transform:translateY(-2px)}
.tarjeta .marco{border-radius:0;aspect-ratio:16/11}
.tarjeta .cuerpo{padding:16px 18px 18px;display:flex;flex-direction:column;gap:9px;flex:1}
.tarjeta h3{font-size:25px}
.tarjeta .etiquetas{display:flex;flex-wrap:wrap;gap:6px}
.pill{font-size:11.5px;font-weight:600;padding:3px 9px;border-radius:999px;
  background:var(--fondo);color:var(--suave);border:1px solid var(--raya)}
.pill.destacada{background:color-mix(in srgb,var(--acento) 16%,var(--papel));
  border-color:color-mix(in srgb,var(--acento) 40%,var(--papel));
  color:color-mix(in srgb,var(--acento) 70%,var(--tinta))}
.precio{margin-top:auto}
.precio small{display:block;font-size:11.5px;color:var(--suave);text-transform:uppercase;letter-spacing:.09em}
.precio .val{font-family:var(--titulos);font-size:31px;letter-spacing:.5px}
.tarjeta .acciones{display:flex;gap:8px;flex-wrap:wrap}
.tarjeta .acciones .boton.fantasma{padding:10px 15px;font-size:14px;border-radius:999px;
  text-decoration:none;font-weight:600}

/* ── colores ── */
/* Baldosas blancas a propósito: las fotos de color vienen de estudio, sobre
   blanco, y una grilla de muestras se lee como catálogo de pintura, no como
   un hueco en la página (que es lo que pasaba con UNA baldosa blanca suelta
   entre fotos de paisaje). */
.colores{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:14px}
.color{display:flex;flex-direction:column;gap:8px;text-decoration:none;color:var(--tinta)}
.color-foto{display:block;background:#fff;border-radius:12px;overflow:hidden;
  aspect-ratio:3/2;border:1px solid var(--raya);transition:transform .15s ease,box-shadow .15s ease}
.color-foto img{width:100%;height:100%;object-fit:contain}
.color:hover .color-foto{transform:translateY(-2px);box-shadow:0 10px 26px rgba(0,0,0,.28)}
.color-nombre{font-size:14px;font-weight:600;text-align:center}
@media (max-width:520px){.colores{grid-template-columns:repeat(2,1fr);gap:10px}}

/* ── tablas de ficha ── */
.tabla{width:100%;border-collapse:collapse;font-size:14.5px}
.tabla td{border-bottom:1px solid var(--raya);padding:10px 4px;vertical-align:top}
.tabla td:first-child{color:var(--suave);width:44%}
.tabla td:last-child{font-weight:600;font-variant-numeric:tabular-nums}
.envuelve-tabla{overflow-x:auto}
.versiones{display:grid;gap:12px}
.ver-row{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;
  border:1px solid var(--raya);border-radius:12px;padding:14px 16px}
.ver-row .nom{font-weight:700}
.ver-row .det{font-size:13px;color:var(--suave)}
.ver-row .pr{font-family:var(--titulos);font-size:26px;white-space:nowrap}

/* ── franja, faq, boletín, pie ── */
.franja{background:var(--fondo)}
/* Texto a la izquierda, botones a la derecha... hasta que no caben. En celular
   la columna 'auto' de los botones se quedaba con el ancho y el título salía
   en palabras sueltas, una por renglón. */
.franja-par{display:grid;grid-template-columns:1fr auto;gap:26px;align-items:center}
.franja-par .acciones{display:flex;gap:10px;flex-wrap:wrap}
/* Los pasos del crédito. Tres, numerados y en una línea: lo que se quiere
   transmitir no es el detalle del trámite sino que son tres y ya. */
.pasos{display:flex;flex-wrap:wrap;gap:10px 22px;list-style:none;margin:16px 0 0;padding:0}
.pasos li{display:flex;align-items:center;gap:9px;font-size:14px;color:var(--tinta)}
.pasos b{flex:none;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;
  font-family:var(--titulos);font-size:15px;line-height:1;padding-top:2px;
  background:color-mix(in srgb,var(--acento) 22%,transparent);color:var(--acento)}
@media (max-width:620px){.pasos{gap:9px}.pasos li{width:100%}}
@media (max-width:760px){.franja-par{grid-template-columns:1fr;gap:18px}}

.faq details{border-bottom:1px solid var(--raya);padding:15px 0}
.faq summary{cursor:pointer;font-weight:650;list-style:none;display:flex;justify-content:space-between;gap:14px}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:"+";color:var(--marca);font-size:21px;line-height:1;flex:none}
.faq details[open] summary::after{content:"−"}
.faq p{color:var(--suave);margin:11px 0 0}
.cierre{background:var(--hondo);color:#fff;text-align:center}
.cierre p{color:#C9CDD4;max-width:56ch;margin:14px auto 26px}
.boletin form{display:flex;gap:9px;flex-wrap:wrap;justify-content:center;margin-top:18px}
.boletin input{padding:13px 16px;border-radius:999px;border:1px solid var(--raya);
  background:var(--papel);color:var(--tinta);
  font:inherit;font-size:15px;min-width:230px;flex:1;max-width:330px}
.boletin input::placeholder{color:var(--suave)}
.boletin .trampa{position:absolute;left:-9999px}
footer{padding-block:34px;border-top:3px solid var(--divisor);background:var(--pie);
  font-size:14px;color:var(--suave)}
.pie-grid{display:flex;flex-wrap:wrap;gap:18px 34px;justify-content:space-between;align-items:flex-start}
.pie-links{display:flex;flex-wrap:wrap;gap:8px 18px}
.pie-links a{text-decoration:none}
.pie-links a:hover{text-decoration:underline}

/* ── botón flotante en celular ── */
.flotante{display:none}
@media (max-width:1040px){
  .flotante{display:flex;position:fixed;left:14px;right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));
    z-index:60;justify-content:center;box-shadow:0 8px 26px rgba(20,24,31,.26)}
  body{padding-bottom:78px}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
${f.css || ""}
${cssAsesor()}
`;
}

/** El <head>: es lo que leen Google y WhatsApp al compartir el enlace. */
function cabeza(marca, { titulo, descripcion, ruta, jsonLd = [], noindex = false }) {
  const url = `https://${marca.dominio}${ruta}`;
  const med = marca.medicion || {};
  const gtag = [med.ga4, med.googleAds].filter(Boolean);
  return `<!DOCTYPE html>
<html lang="es-CO">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="${esc(url)}">
${noindex ? '<meta name="robots" content="noindex, follow">' : ""}
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="${esc(marca.nombrePublico)}">
<meta property="og:locale" content="es_CO">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?${(TIPOGRAFIAS[marca.tipografia] || TIPOGRAFIAS.impacto).fuentes}&display=swap" rel="stylesheet">
<style>${estilos(marca)}</style>

<!-- La ficha de la marca. Va de PRIMERA y sin defer: los scripts del núcleo la
     necesitan ya cargada cuando corren. -->
<script src="marca.js"></script>
${gtag.length ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(gtag[0])}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
${gtag.map((id) => `  gtag('config', '${esc(id)}');`).join("\n")}
</script>` : "<!-- Sin Analytics todavía: se activa al llenar `medicion` en la ficha. -->"}
<script defer src="nucleo/track.js"></script>
<script defer src="nucleo/meta-pixel.js"></script>
<script defer src="nucleo/wa-firma.js"></script>
<script defer src="nucleo/estado-asesor.js"></script>
<script defer src="nucleo/catalogo-vivo.js"></script>
${jsonLd.map((j) => `<script type="application/ld+json">\n${JSON.stringify(j, null, 2)}\n</script>`).join("\n")}
</head>
<body>`;
}

/** La cabecera, igual en todas las páginas. */
function encabezado(marca, modelos) {
  // Con dos marcas en el sitio, el menú dice "RAM 700" y no "700" a secas.
  const menu = modelos
    .slice(0, marca.menuMax || 6)
    .map((m) => `<a href="${esc(rel(m.pagina))}">${esc(m.marca ? `${m.marca} ${m.nombre}` : m.nombre)}</a>`)
    .join("\n      ");
  return `
<header>
  <nav class="env nav">
    <a class="logo" href="index.html"><span class="marca-punto"></span>${esc(marca.nombrePublico)}</a>
    <button class="nav-toggle" aria-label="Ver los modelos" aria-expanded="false">Modelos<span class="chev" aria-hidden="true"></span></button>
    <div class="nav-links">
      ${menu}
      ${marca.paginaCredito ? `<a href="${esc(rel(marca.paginaCredito))}">Crédito</a>` : ""}
    </div>
    ${boton(marca, {
      texto: "Escríbeme",
      mensaje: `Hola ${marca.asesor}, quiero información de un ${marca.marca} en Medellín.`,
      ctx: "header",
      clase: "chico",
    })}
  </nav>
</header>`;
}

/** El cierre: llamado final, boletín, pie y el botón flotante del celular. */
function pie(marca, { ctxFinal = "cierre_final", tituloFinal, textoFinal, mensajeFinal }) {
  // Las notas se cuelgan de la marca al construir, para no tener que pasarlas
  // por los cinco tipos de página.
  const avisos = (marca.legal && marca.legal.pie) || [];
  // El boletín se apaga por ficha de marca. No es solo quitar la sección: sin
  // formulario en la página no se recoge ningún dato, así que también se va el
  // aviso de tratamiento de datos que lo acompañaba y el script que lo enviaba
  // al CRM. Lo que no se dibuja, no hay que explicarlo.
  const hayBoletin = marca.boletin !== false;
  const rutaLegal = marca.paginaLegal ? rel(marca.paginaLegal) : "";
  return `
<section class="sec cierre">
  <div class="env">
    <h2>${esc(tituloFinal)}</h2>
    <p>${esc(textoFinal)}</p>
    ${boton(marca, { texto: `Hablar con ${marca.asesor}`, mensaje: mensajeFinal, ctx: ctxFinal, clase: "grande", estado: true })}
  </div>
</section>

${
  hayBoletin
    ? `<section class="sec franja boletin">
  <div class="env" style="text-align:center">
    <h2 class="sec-title">Entérate primero</h2>
    <p class="sec-sub">Te aviso cuando entre un bono nuevo o baje un precio. Sin spam: si no sirve, te sales.</p>
    <form class="boletin-form" novalidate>
      <input type="text" name="empresa" class="trampa" tabindex="-1" autocomplete="off" aria-hidden="true">
      <input type="text" name="name" placeholder="Tu nombre" autocomplete="name" aria-label="Tu nombre">
      <input type="tel" name="phone" placeholder="Tu WhatsApp" autocomplete="tel" aria-label="Tu WhatsApp">
      <button type="submit" class="boton">Avísame</button>
    </form>
    ${
      rutaLegal
        ? `<p style="font-size:12.5px;color:var(--suave);margin:12px auto 0;max-width:52ch">
      Al dejar tus datos autorizas que ${esc(marca.asesor)} te contacte sobre vehículos
      ${esc(marca.marca)}. Puedes pedir que los borre cuando quieras.
      <a href="${esc(rutaLegal)}">Cómo se tratan tus datos</a>.
    </p>`
        : ""
    }
    <p id="boletin-estado" style="font-size:13.5px;color:var(--suave);margin-top:12px" hidden></p>
  </div>
</section>`
    : ""
}

<footer>
  <div class="env pie-grid">
    <div>
      <div class="logo" style="margin-bottom:8px"><span class="marca-punto"></span>${esc(marca.nombrePublico)}</div>
      <div style="display:flex;align-items:center;gap:10px">
        ${avatar(marca, { claro: true })}
        <span>${esc(marca.asesor)} · asesor comercial ${esc(marca.marca)} en Medellín</span>
      </div>
      ${chipOrigen(marca, { claro: true }) ? `<div style="margin-top:10px">${chipOrigen(marca, { claro: true })}</div>` : ""}
      ${avisos.map((a) => `<div style="margin-top:6px;max-width:58ch">${esc(a)}</div>`).join("\n      ")}
    </div>
    <div class="pie-links">
      <a href="index.html">Inicio</a>
      ${marca.paginaCredito ? `<a href="${esc(rel(marca.paginaCredito))}">Crédito</a>` : ""}
      <a href="https://wa.me/${esc(marca.whatsapp)}">WhatsApp</a>
      ${rutaLegal ? `<a href="${esc(rutaLegal)}">Notas legales</a>` : ""}
    </div>
  </div>
</footer>

${boton(marca, {
  texto: "Cotizar por WhatsApp",
  mensaje: `Hola ${marca.asesor}, quiero cotizar un ${marca.marca}.`,
  ctx: "flotante_movil",
  clase: "flotante",
})}

<script>
/* El menú del celular. Es lo único de JavaScript propio que tiene la página:
   todo lo demás (medir, firmar, precios en vivo) lo hace el núcleo. */
(function () {
  var b = document.querySelector('.nav-toggle'), m = document.querySelector('.nav-links');
  if (!b || !m) return;
  b.addEventListener('click', function () {
    var abierto = m.classList.toggle('abierto');
    b.setAttribute('aria-expanded', String(abierto));
  });
})();

${
  hayBoletin
    ? `/* El boletín va al CRM, al mismo negocio que mide la página. */
(function () {
  var f = document.querySelector('.boletin-form'), av = document.getElementById('boletin-estado');
  if (!f || !window.MARCA || !window.MARCA.crm || !window.MARCA.businessId) return;
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(f);
    if (!String(d.get('phone') || '').trim()) {
      av.hidden = false; av.textContent = 'Déjame tu WhatsApp y te aviso.'; return;
    }
    av.hidden = false; av.textContent = 'Un momento…';
    fetch(window.MARCA.crm.replace(/\\/+$/, '') + '/api/subscribe', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: window.MARCA.businessId, source: 'boletin_' + location.pathname,
        name: d.get('name'), phone: d.get('phone'), empresa: d.get('empresa')
      })
    }).then(function (r) {
      av.textContent = r.ok ? 'Listo, quedaste anotado.' : 'No se pudo guardar. Escríbeme por WhatsApp y yo te anoto.';
      if (r.ok) f.reset();
    }).catch(function () {
      av.textContent = 'No se pudo guardar. Escríbeme por WhatsApp y yo te anoto.';
    });
  });
})();`
    : ""
}
</script>
</body>
</html>`;
}

/* ── el asesor al frente ──
 *
 * Nació en Jeep. En Suzuki y Citroën el protagonista era el carro y el precio;
 * aquí es la persona que contesta. La gente no le compra a una página, le
 * compra a alguien en quien confía, y esa confianza se gana mostrando la cara,
 * el nombre y lo que se promete, antes que el catálogo.
 *
 * Todo sale de `contenido.asesor`. Si una marca no lo trae, no se dibuja nada
 * y la página queda como siempre.
 */
function cssAsesor() {
  return `
.hero-asesor .marco{aspect-ratio:4/5;background:#0B0D0A}
.hero-asesor .marco img{object-position:center 18%}
.firma{position:absolute;left:14px;right:14px;bottom:14px;z-index:3;display:flex;align-items:center;gap:12px;
  padding:12px 14px;border-radius:10px;background:rgba(12,14,11,.72);backdrop-filter:blur(8px);
  border:1px solid rgba(255,255,255,.12);color:#fff}
.firma b{display:block;font-size:15.5px;line-height:1.2}
.firma span{display:block;font-size:12.5px;color:#C9CDC4}
.firma .estado-asesor{margin:0;font-size:12.5px}
.foto-asesor{position:relative}
/* En celular el retrato sube arriba del titular y se vuelve apaisado: la cara
   se ve de entrada sin empujar el botón de WhatsApp fuera de la pantalla. */
@media (max-width:1040px){
  .hero-asesor .foto-asesor{order:-1}
  .hero-asesor .marco{aspect-ratio:4/3}
  .hero-asesor .marco img{object-position:center 18%}
  .firma{left:10px;right:auto;bottom:10px;padding:8px 12px;gap:9px}
  .firma b{font-size:14px}
  .firma span{font-size:11.5px}
}
.asesor-grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:clamp(26px,5vw,56px);align-items:center}
@media (max-width:860px){.asesor-grid{grid-template-columns:1fr}}
.asesor-grid .marco{aspect-ratio:1/1;background:var(--fondo)}
.asesor-grid .marco img{object-position:center 20%}
.asesor-bio{font-size:17px;color:var(--suave);max-width:60ch}
.promesas{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:26px}
.promesa{display:flex;gap:12px;align-items:flex-start;padding:16px;border:1px solid var(--raya);border-radius:10px;background:var(--tarjeta)}
.promesa .ico{flex:none;width:34px;height:34px;border-radius:8px;display:grid;place-items:center;
  background:color-mix(in srgb,var(--marca) 12%,transparent)}
.promesa .ico svg{width:19px;height:19px;fill:none;stroke:var(--marca);stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.promesa b{display:block;font-size:15px;line-height:1.3;margin-bottom:3px}
.promesa span{display:block;font-size:13.5px;line-height:1.45;color:var(--suave)}
.asesor-mini{display:flex;align-items:center;gap:16px;max-width:720px;margin:0 auto;padding:18px 20px;
  border:1px solid var(--raya);border-radius:12px;background:var(--tarjeta)}
.asesor-mini img{width:64px;height:64px;border-radius:50%;object-fit:cover;flex:none}
.asesor-mini p{margin:0;font-size:14.5px;color:var(--suave)}
.asesor-mini b{color:var(--tinta)}
@media (max-width:560px){.asesor-mini{flex-direction:column;text-align:center}}`;
}

/** El retrato grande del asesor, con su firma encima. Para el hero. */
function fotoAsesor(marca, contenido, { primera = false } = {}) {
  const a = contenido.asesor || {};
  const f = a.foto || {};
  if (!f.src) return "";
  const carga = primera ? 'fetchpriority="high"' : 'loading="lazy"';
  const webp = f.webp ? `<source srcset="fotos/${esc(f.webp)}" type="image/webp">` : "";
  return `<div class="foto-asesor">
      <div class="marco"><picture>${webp}<img src="fotos/${esc(f.src)}" alt="${esc(f.alt || marca.asesor)}" ${carga} decoding="async"></picture></div>
      <div class="firma">
        ${avatar(marca)}
        <div><b>${esc(marca.asesor)}</b><span>${esc(a.cargo || `Asesor ${marca.marca} en Medellín`)}</span><span class="estado-asesor" data-prefijo=" "></span></div>
      </div>
    </div>`;
}

/** "¿Por qué comprarme a mí?": la sección del asesor en la portada. */
function seccionAsesor(marca, contenido) {
  const a = contenido.asesor;
  if (!a) return "";
  const f = a.foto || {};
  return `<section class="sec" id="asesor">
  <div class="env asesor-grid">
    <div class="marco">${f.src ? `<img src="fotos/${esc(f.src)}" alt="${esc(f.alt || marca.asesor)}" loading="lazy" decoding="async">` : ""}</div>
    <div>
      <h2>${esc(a.titulo || `¿Por qué comprarle a ${marca.asesor}?`)}</h2>
      <p class="asesor-bio">${esc(a.bio || "")}</p>
      <div class="promesas">
        ${(a.promesas || [])
          .map(
            (p) => `<div class="promesa">
          <span class="ico" aria-hidden="true">${ICONOS[p.icono] || ICONOS.escudo}</span>
          <div><b>${esc(p.titulo)}</b><span>${esc(p.apoyo)}</span></div>
        </div>`,
          )
          .join("\n        ")}
      </div>
      <div style="margin-top:26px">
        ${boton(marca, {
          texto: `Escribirle a ${marca.asesor}`,
          mensaje: `Hola ${marca.asesor}, vi tu página y quiero que me asesores.`,
          ctx: "asesor_seccion",
          estado: true,
        })}
      </div>
    </div>
  </div>
</section>`;
}

/** La firma corta del asesor, para las fichas de modelo. */
function asesorMini(marca, contenido, texto) {
  const a = contenido.asesor;
  if (!a) return "";
  const f = marca.asesorFoto || {};
  return `<div class="asesor-mini">
      ${f.src ? `<img src="fotos/${esc(f.src)}" alt="${esc(marca.asesor)}" loading="lazy" decoding="async">` : avatar(marca, { claro: true })}
      <p><b>${esc(marca.asesor)}</b> · ${esc(a.cargo || "")}<br>${esc(texto)}</p>
    </div>`;
}

module.exports = { fotoAsesor, seccionAsesor, asesorMini, marcaDe, nombreCompleto, TIPOGRAFIAS, esc, cop, copCorto, rel, wa, boton, estilos, cabeza, encabezado, pie, chipOrigen, avatar, tiraHero, ICONO_WA };
