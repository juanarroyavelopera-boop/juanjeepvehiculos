/* Archivos que no son páginas de venta pero que el sitio necesita:
 *   ir.html   el puente del QR (mide el escaneo y salta a WhatsApp)
 *   llms.txt  el resumen del sitio para los asistentes de IA
 * Los dos vienen de Suzuki (oct-2026) y aquí salen de la ficha. */

"use strict";
const { esc, cop, nombreCompleto } = require("./comun");

/**
 * El puente del código QR.
 *
 * En computador el botón de WhatsApp muestra un QR (wa-qr.js). Si ese QR
 * apuntara directo a wa.me, el escaneo pasaría en otro aparato y el sitio
 * nunca se enteraría. Apunta aquí: esta página registra el escaneo
 * (whatsapp_qr_escaneado, con el mismo qid que el computador registró al
 * mostrarlo) y redirige enseguida a WhatsApp.
 *
 * El número va fijo, sacado de la ficha: la página nunca redirige a un
 * destino que venga por parámetro.
 */
function irHtml(marca) {
  const numero = marca.whatsapp || "";
  return `<!DOCTYPE html>
<html lang="es-CO">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Abriendo WhatsApp… | ${esc(marca.nombrePublico)}</title>
<style>
  :root{color-scheme:dark}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#111312;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;padding:24px;text-align:center}
  .caja{max-width:340px}
  .punto{width:46px;height:46px;margin:0 auto 20px;border:3px solid rgba(255,255,255,.15);
    border-top-color:#59c96f;border-radius:50%;animation:giro .8s linear infinite}
  @keyframes giro{to{transform:rotate(360deg)}}
  @media (prefers-reduced-motion:reduce){.punto{animation:none}}
  h1{font-size:19px;margin:0 0 8px;font-weight:600}
  p{font-size:14px;line-height:1.55;color:#aab3bd;margin:0 0 18px}
  a.manual{display:inline-block;background:#25d366;color:#06240f;text-decoration:none;font-weight:700;
    font-size:15px;padding:13px 22px;border-radius:12px}
</style>
<script src="marca.js"></script>
<script src="nucleo/track.js" defer></script>
</head>
<body>
  <div class="caja">
    <div class="punto"></div>
    <h1>Abriendo WhatsApp…</h1>
    <p>Si no abre solo en un par de segundos, tócale aquí:</p>
    <a class="manual" id="manual" href="https://wa.me/${esc(numero)}">Escribirle a ${esc(marca.asesorTexto)}</a>
  </div>
<script>
(function () {
  var NUMERO = ${JSON.stringify(numero)};   // fijo: nunca viene por parámetro
  var ESPERA_MAX = 900;
  var p = new URLSearchParams(location.search);
  var texto = p.get('t') || ${JSON.stringify(`${marca.hola} quiero información de un ${marca.marca} en Medellín.`)};
  var qid = p.get('q') || null;
  var ctx = p.get('c') || 'qr';

  /* Firma propia del QR: el chat que de verdad llega se reconoce de un
     vistazo y se cierra el círculo mostrado → escaneado → escribió. */
  var DOMINIO = ${JSON.stringify(marca.dominio)};
  var FIRMA_QR = '\\n— Escaneé el código QR en ' + DOMINIO;
  texto = texto
    .replace('\\n— Vi la página ' + DOMINIO, FIRMA_QR)
    .replace('\\n— ' + DOMINIO, FIRMA_QR);
  if (texto.indexOf('QR') === -1) texto += FIRMA_QR;

  var destino = 'https://wa.me/' + NUMERO + '?text=' + encodeURIComponent(texto);
  document.getElementById('manual').setAttribute('href', destino);

  var yaFue = false;
  function irme() { if (yaFue) return; yaFue = true; location.replace(destino); }
  function registrarYSalir() {
    try {
      if (window.MEDICION && typeof window.MEDICION.send === 'function') {
        window.MEDICION.send('whatsapp_qr_escaneado', ctx, { qid: qid });
      }
    } catch (_) {}
    irme();
  }
  // Primero está la persona, no la métrica: si track.js tarda, se va igual.
  if (document.readyState === 'complete') setTimeout(registrarYSalir, 60);
  else window.addEventListener('load', function () { setTimeout(registrarYSalir, 60); });
  setTimeout(irme, ESPERA_MAX);
})();
</script>
</body>
</html>
`;
}

/** El resumen del sitio para asistentes de IA (llmstxt.org). */
function llmsTxt(marca, contenido, precios, extras) {
  const base = `https://${marca.dominio}`;
  const lineas = [
    `# ${marca.nombrePublico}`,
    "",
    `> ${marca.asesor ? `${marca.asesor}, asesor` : "Asesor"} comercial de vehículos ${marca.marcasTexto || marca.marca} nuevos en Medellín, Colombia. Atiende por WhatsApp. Vende ${marca.modelos.map((m) => nombreCompleto(marca, m)).join(", ")}. Ayuda con crédito y recibe carros usados como parte de pago.`,
    "",
  ];
  if (marca.whatsapp) lineas.push(`- WhatsApp: +${marca.whatsapp} (https://wa.me/${marca.whatsapp})`);
  lineas.push(
    `- Precios: precio sugerido de lista con impuestos incluidos, por versión. Cambian cada mes; la ficha de cada modelo y la página de precios son la fuente actualizada.`,
    "",
    "## Modelos",
    "",
  );
  for (const m of marca.modelos) {
    const c = (contenido.modelos || {})[m.linea] || {};
    const desde = precios.porLinea[m.linea];
    lineas.push(`- [${nombreCompleto(marca, m)}](${base}${m.pagina}): ${c.gancho || ""}${desde ? ` Desde ${cop(desde)}.` : ""}`);
  }
  if (extras.length) {
    lineas.push("", "## Guías", "");
    for (const [titulo, ruta, resumen] of extras) lineas.push(`- [${titulo}](${base}${ruta}): ${resumen}`);
  }
  return lineas.join("\n") + "\n";
}

module.exports = { irHtml, llmsTxt };
