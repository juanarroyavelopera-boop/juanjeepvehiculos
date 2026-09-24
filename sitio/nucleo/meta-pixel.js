/* Meta Pixel — núcleo de la plantilla, igual para todas las marcas.
   El conjunto de datos (pixel) lo trae window.MARCA (marca.js): cada marca
   mide contra el suyo. Sin pixel en la ficha, este archivo no hace nada.
   Capa de navegador del par Pixel + CAPI (Conversions API / "API de conversiones",
   la copia servidor del mismo evento, que sale desde /api/track del CRM).

   CLAVE — deduplicación: cada evento se manda con el MISMO event_id que ya generó
   track.js (window.MEDICION.lastEventId) y que el servidor reenvía por CAPI.
   Meta ve los dos, reconoce el id repetido y cuenta UNO solo. Sin esto cada lead
   contaría doble y las campañas optimizarían con números inflados.

   ORDEN IMPORTA: este archivo va SIEMPRE después de track.js en el <head>.
   Ambos con defer ⇒ se ejecutan en orden de aparición, así que cuando este corre
   track.js ya puso lastEventId y lastValue. Igual para los clics: los dos
   escuchan en fase captura sobre document y disparan en orden de registro.

   No toca gtag ni Clarity: es una capa aparte que solo lee lo que track.js expone. */
(function () {
  var M = window.MARCA || {};
  var PIXEL_ID = (M.medicion && M.medicion.metaPixel) || '';
  if (!PIXEL_ID) return;

  /* Código base oficial de Meta (sin el fbq('track','PageView') del final:
     el PageView lo disparamos abajo con eventID para que deduplique). */
  /* eslint-disable */
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  fbq('init', PIXEL_ID);

  function track(metodo, eventName, customData) {
    try {
      var id = (window.MEDICION || {}).lastEventId;
      fbq(metodo, eventName, customData || {}, id ? { eventID: id } : undefined);
    } catch (_) {}
  }
  // 'track' = eventos estándar de Meta (PageView, Lead…) — son los que las
  // campañas pueden usar para optimizar. 'trackCustom' = eventos inventados
  // por nosotros, solo sirven para mirar y para armar públicos.
  var estandar = function (n, d) { track('track', n, d); };
  var propio = function (n, d) { track('trackCustom', n, d); };

  // PageView: track.js ya mandó su page_view al cargar ⇒ lastEventId es el suyo.
  estandar('PageView');

  function datos(ctx, tipo) {
    var d = { content_name: ctx || 'general', content_category: tipo, currency: 'COP' };
    var v = (window.MEDICION || {}).lastValue;
    if (typeof v === 'number' && v > 0) d.value = v; // mismo peso COP que le mandamos a Google
    return d;
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var wa = t.closest('.wpp-cta, [data-wa]'); // mismo criterio que track.js
    if (wa) { estandar('Lead', datos(wa.getAttribute('data-ctx'), 'whatsapp')); return; }

    var call = t.closest('.call-cta');
    if (call) { estandar('Lead', datos(call.getAttribute('data-ctx'), 'llamada')); return; }

    // "Prefiero abrir WhatsApp Web" del modal QR: apertura real en computador.
    // Va como evento propio para no inflar Lead — el clic al botón ya contó arriba.
    var alt = t.closest('#waqr-alt');
    // mismo nombre que usa el servidor para whatsapp_open_attempt ⇒ deduplica
    if (alt) propio('WhatsAppOpen', { content_name: 'waqr_web_fallback' });
  }, true);

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f && f.classList && f.classList.contains('boletin-form')) {
      estandar('Lead', datos('boletin', 'formulario'));
    }
  }, true);
})();
