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

  function track(metodo, eventName, customData, eventId) {
    try {
      var id = eventId || (window.MEDICION || {}).lastEventId;
      fbq(metodo, eventName, customData || {}, id ? { eventID: id } : undefined);
    } catch (_) {}
  }
  // 'track' = eventos estándar de Meta (PageView, Lead…) — son los que las
  // campañas pueden usar para optimizar. 'trackCustom' = eventos inventados
  // por nosotros, solo sirven para mirar y para armar públicos.
  var estandar = function (n, d, id) { track('track', n, d, id); };
  var propio = function (n, d, id) { track('trackCustom', n, d, id); };

  /* QUÉ ES UN LEAD (y por qué no es "tocar el botón") — aprendido en Suzuki.
     Lead = WhatsApp de verdad se abre (o se toca "Llamar" en el celular):
       - móvil: el toque abre la app ⇒ Lead.
       - computador: el toque solo abre el modal QR ⇒ NO es Lead (va como
         WhatsAppClick). Es Lead si toca "Prefiero WhatsApp Web" o si escanea
         el QR (eso lo cuenta el CRM por CAPI desde ir.html).
     El id del Lead lo pone track.js en MEDICION.leadEventId: es el MISMO evento
     que el CRM manda por CAPI como Lead, así Meta cuenta uno solo. */
  var esMovil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function lead(d, esBotonWa) {
    var T = window.MEDICION || {};
    var id = T.leadEventId;
    if (!T.send) {
      // track.js no mide (bloqueado o apagado): el pixel decide solo, sin id.
      if (esBotonWa && !esMovil && window.ASM_QR_ACTIVO) return false;
      id = null;
    } else if (!id) return false;
    estandar('Lead', d, id || undefined);
    return true;
  }

  // PageView: track.js ya mandó su page_view al cargar ⇒ lastEventId es el suyo.
  estandar('PageView');

  /* ViewContent en las fichas de modelo: le dice a Meta qué carro miró cada
     persona (públicos por modelo y anuncios de catálogo). Los content_ids son
     los ids del catálogo, que salen del CRM (catalog_items.id): si llegó desde
     un anuncio de catálogo trae ?vehiculo=<id>; si no, todas las versiones de
     la línea, pedidas al mismo portafolio en vivo que usa catalogo-vivo.js. */
  var LINEAS = {};
  (M.modelos || []).forEach(function (m) {
    if (m.pagina && m.linea) LINEAS[m.pagina.split('/').pop().replace(/\.html$/, '')] = m.linea;
  });
  var slugPag = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  var lineaPag = LINEAS[slugPag];
  if (lineaPag) {
    var h1 = document.querySelector('h1');
    var nombreVC = h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : lineaPag;
    var pvVC = (window.MEDICION || {}).lastEventId;
    var verVC = function (ids) {
      estandar('ViewContent', {
        content_type: 'product', content_name: nombreVC, content_category: 'carro', content_ids: ids
      }, pvVC ? 'vc-' + pvVC : undefined);
    };
    var vehiculo = null;
    try { vehiculo = new URLSearchParams(location.search).get('vehiculo'); } catch (_) {}
    if (vehiculo && /^[0-9a-f-]{36}$/i.test(vehiculo)) {
      verVC([vehiculo]);
    } else if (window.fetch && M.crm && M.businessId) {
      fetch(M.crm.replace(/\/+$/, '') + '/api/catalog/portfolio?business_id=' + encodeURIComponent(M.businessId) + '&sin_ficha=1')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var m = (data.modelos || []).filter(function (x) { return x.linea === lineaPag; })[0];
          var ids = ((m && m.versiones) || []).map(function (v) { return v.id; }).filter(Boolean);
          if (ids.length) verVC(ids);
        })
        .catch(function () {});
    }
  }

  function datos(ctx, tipo) {
    var d = { content_name: ctx || 'general', content_category: tipo, currency: 'COP' };
    var v = (window.MEDICION || {}).lastValue;
    if (typeof v === 'number' && v > 0) d.value = v; // mismo peso COP que le mandamos a Google
    return d;
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    // "Prefiero abrir WhatsApp Web" del modal QR: apertura real en computador.
    if (t.closest('#waqr-alt')) { lead(datos('waqr_web_fallback', 'whatsapp')); return; }

    // Mismo criterio que track.js: botones .wpp-cta y cualquier otro enlace a WhatsApp.
    var T0 = window.MEDICION || {};
    var wa = t.closest('.wpp-cta') || t.closest(T0.WA_EXTRA || '[data-wa], .wa-extra, a[href*="wa.me/"], a[href*="api.whatsapp.com"]');
    if (wa) {
      var ctx0 = wa.getAttribute('data-ctx') || (T0.ctxExtra ? T0.ctxExtra(wa) : 'enlace_whatsapp');
      var d = datos(ctx0, 'whatsapp');
      // Sin apertura (modal QR en computador): evento propio con el id del clic.
      if (!lead(d, true)) propio('WhatsAppClick', d);
      return;
    }

    var call = t.closest('.call-cta');
    if (call && esMovil) lead(datos(call.getAttribute('data-ctx'), 'llamada'));
  }, true);

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f && f.classList && f.classList.contains('boletin-form')) {
      estandar('Lead', datos('boletin', 'formulario'));
    }
  }, true);
})();
