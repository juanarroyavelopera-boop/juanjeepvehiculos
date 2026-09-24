/* El simulador de crédito.
 *
 * La tasa sale de la ficha de la marca, no está escrita acá: Suzuki va al
 * 1,65 % y las marcas nuevas al 1,8 %.
 *
 * La cuota que muestra es ILUSTRATIVA y lo dice en pantalla. La aprobación real
 * depende del banco y del perfil de cada quien, y prometer una cuota exacta en
 * una página es la forma más rápida de quemar la confianza en la primera cita.
 */

"use strict";
const { esc, cop, rel, boton, cabeza, encabezado, pie } = require("./comun");
const { bloqueFaq, hayFaq } = require("./piezas");

module.exports = function credito(marca, contenido, precios) {
  const cr = marca.credito || {};
  const tasa = typeof cr.tasaMensual === "number" ? cr.tasaMensual : 0.018;
  const plazoMax = cr.plazoMaximoMeses || 84;
  const inicialMax = cr.inicialMaximaPct || 50;

  const modelos = marca.modelos
    .map((m) => ({ nombre: m.nombre, precio: precios.porLinea[m.linea] }))
    .filter((m) => m.precio)
    .sort((a, b) => a.precio - b.precio);

  const titulo = `Crédito para tu ${marca.marca} en Medellín | Simula la cuota`;
  const descripcion = `Simula la cuota de tu ${marca.marca} en Medellín: mueve la inicial y los meses y mira el estimado. ${(contenido.credito && contenido.credito.promesaCorta) || "Desde 0% de inicial y"} hasta ${plazoMax} meses.`;

  return `${cabeza(marca, { titulo, descripcion, ruta: marca.paginaCredito })}
${encabezado(marca, marca.modelos)}

<section class="hero">
  <div class="env" style="padding-block:clamp(40px,6vw,70px)">
    <span class="cinta">Financiación</span>
    <h1>¿Cuánto te queda la cuota?</h1>
    <p class="bajada">Mueve la inicial y los meses y mira el estimado. Después me escribes y lo miramos con tus números de verdad.</p>
  </div>
</section>

<section class="sec">
  <div class="env" style="max-width:720px">
    <div style="border:1px solid var(--raya);border-radius:16px;padding:clamp(20px,4vw,32px)">
      <label style="display:block;font-weight:650;margin-bottom:7px" for="simModel">El carro</label>
      <select id="simModel" style="width:100%;padding:13px 14px;border-radius:10px;border:1px solid var(--raya);font:inherit;font-size:15.5px;background:#fff">
        ${modelos.map((m, i) => `<option value="${i}">${esc(m.nombre)} — ${cop(m.precio)}</option>`).join("\n        ")}
      </select>

      <label style="display:block;font-weight:650;margin:22px 0 7px" for="simDown">Cuota inicial · <span id="dpLabel"></span></label>
      <input id="simDown" type="range" min="0" max="${inicialMax}" step="5" value="20" style="width:100%">

      <label style="display:block;font-weight:650;margin:22px 0 7px" for="simTerm">Plazo · <span id="termLabel"></span> meses</label>
      <input id="simTerm" type="range" min="12" max="${plazoMax}" step="12" value="60" style="width:100%">

      <div style="margin-top:28px;padding-top:22px;border-top:1px solid var(--raya);text-align:center">
        <div style="font-size:12.5px;color:var(--suave);text-transform:uppercase;letter-spacing:.09em">Cuota mensual estimada</div>
        <div id="simCuota" class="bebas" style="font-size:clamp(40px,8vw,58px);color:var(--marca)">—</div>
        <div id="simDetail" style="font-size:13.5px;color:var(--suave)"></div>
        <p style="font-size:12.5px;color:var(--suave);margin-top:14px;max-width:46ch;margin-inline:auto">
          Cálculo ilustrativo a una tasa de ${(tasa * 100).toLocaleString("es-CO", { maximumFractionDigits: 2 })}% mensual.
          No es una aprobación: la tasa real depende del banco y de tu perfil.
        </p>
        <div style="margin-top:18px">
          ${boton(marca, {
            texto: "Pedir el crédito de verdad",
            mensaje: `Hola ${marca.asesor}, quiero solicitar crédito para un ${marca.marca}. Te cuento mi situación.`,
            ctx: "credito_hero",
            clase: "grande",
            estado: true,
          })}
        </div>
      </div>
    </div>
  </div>
</section>

${
  hayFaq(contenido)
    ? `<section class="sec franja faq">
  <div class="env" style="max-width:780px">
    <h2 class="sec-title">Preguntas</h2>
    ${bloqueFaq(contenido)}
  </div>
</section>`
    : ""
}

<script>
/* El simulador. Los precios de la lista se rellenan al construir, y el CRM los
   actualiza en vivo si cambia alguno. */
(function () {
  var MODELOS = ${JSON.stringify(modelos.map((m) => [m.nombre, m.precio]))};
  var TASA = ${tasa};
  if (!MODELOS.length) return;
  var fmt = function (n) { return '$' + Math.round(n).toLocaleString('es-CO'); };
  var sel = document.getElementById('simModel');
  var dEl = document.getElementById('simDown'), tEl = document.getElementById('simTerm');
  function calc() {
    var precio = MODELOS[+sel.value][1];
    var dp = +dEl.value, meses = +tEl.value;
    var financiado = precio * (1 - dp / 100);
    // Cuota fija: la fórmula de amortización de siempre.
    var cuota = financiado * TASA / (1 - Math.pow(1 + TASA, -meses));
    document.getElementById('dpLabel').textContent = dp + '% (' + fmt(precio * dp / 100) + ')';
    document.getElementById('termLabel').textContent = meses;
    document.getElementById('simCuota').textContent = fmt(cuota);
    document.getElementById('simDetail').textContent =
      'Financiando ' + fmt(financiado) + ' a ' + meses + ' meses';
  }
  sel.addEventListener('change', calc);
  dEl.addEventListener('input', calc);
  tEl.addEventListener('input', calc);
  calc();
})();
</script>

${pie(marca, {
  tituloFinal: "Miremos tu caso con números reales",
  textoFinal: "El simulador da una idea. Con tu situación te digo qué banco te sirve y cuánto te aprueban.",
  mensajeFinal: `Hola ${marca.asesor}, quiero solicitar mi crédito para un ${marca.marca}.`,
  ctxFinal: "credito_final",
})}`;
};
