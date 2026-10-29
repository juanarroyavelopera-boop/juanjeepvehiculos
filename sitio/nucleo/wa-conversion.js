/* NÚCLEO DE LA PLANTILLA (viene de Suzuki, oct-2026).
   La conversion de WhatsApp se cuenta cuando WhatsApp DE VERDAD se abre,
   no cuando se toca el boton.

   POR QUE EXISTE ESTE ARCHIVO
   En computador el boton de WhatsApp no abre ningun chat: wa-qr.js cancela la
   navegacion y muestra un modal con un codigo QR para escanear con el telefono.
   La conversion, en cambio, se disparaba en el clic. Resultado medido en la
   tabla site_events entre el 24-ago y el 7-sep-2026:

       movil:       32 clics al boton  ->  32 aperturas de WhatsApp  (100%)
       escritorio:   8 clics al boton  ->   0 aperturas de WhatsApp  (0%)

   Esas 8 de escritorio (7 de ellas pagadas con Google Ads) se reportaban como
   conversiones sin ser leads. Dos danos: inflaban el CPA haciendolo ver mejor
   de lo que era, y sobre todo envenenaban la puja automatica de
   "Suzuki | Hibridos de Entrada", que corre en Maximizar conversiones y estaba
   aprendiendo a comprar mas trafico de escritorio justo porque creia que
   convertia.

   COMO LO ARREGLA
   En movil no cambia nada: el clic abre la app, la conversion se manda al toque.
   En escritorio la conversion queda GUARDADA y solo se manda si la persona toca
   "Prefiero abrir WhatsApp Web" en el modal, que es la unica via real de chat
   desde un computador. Si el QR no llega a interceptar (por ejemplo si qr-lib.js
   no cargo), el enlace navega normal a wa.me y ahi si se cuenta de una.

   La condicion de abajo es la MISMA que usa wa-qr.js para decidir si muestra el
   QR. Si algun dia se cambia alla, hay que cambiarla aca tambien o vuelven los
   fantasmas. */
(function () {
  var M = window.MARCA || {};
  var med = M.medicion || {};
  // La etiqueta de conversión sale de la ficha: googleAds (AW-…) + conversionLabel.
  var LABEL = med.googleAds && med.conversionLabel ? med.googleAds + '/' + med.conversionLabel : '';

  var esMovil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    !window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Se evalua en el momento del clic, no al cargar, porque qr-lib.js entra con defer.
  function elQRvaAinterceptar() {
    return !esMovil && typeof window.qrcode === 'function' && window.ASM_QR_ACTIVO;
  }

  var guardada = null;

  function mandar(payload) {
    if (typeof gtag !== 'function' || !payload || !LABEL) return;
    gtag('event', 'conversion', payload);
  }

  window.ASM_WA = {
    esMovil: esMovil,
    /* Devuelve true si la conversion se mando ya, false si quedo en espera. */
    conv: function (payload) {
      if (!elQRvaAinterceptar()) { mandar(payload); return true; }
      guardada = payload;
      return false;
    }
  };

  // Unica via real de chat desde computador: "Prefiero abrir WhatsApp Web" del modal.
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('#waqr-alt') && guardada) {
      mandar(guardada);
      guardada = null;
    }
  }, true);

  // Todo enlace a WhatsApp cuenta: botones .wpp-cta, muestras de color, filas
  // de versiones y de la página de precios. Fase burbuja: track.js (captura)
  // ya dejó en lastEventId el id del clic, que va como transaction_id.
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest || t.closest('#waqr-alt')) return;
    var a = t.closest('.wpp-cta, [data-wa], .wa-extra, a[href*="wa.me/"], a[href*="api.whatsapp.com"]');
    if (!a) return;
    var T = window.ASM_TRACK || {};
    var ctx = a.getAttribute('data-ctx') || (T.ctxExtra ? T.ctxExtra(a) : 'enlace_whatsapp');
    window.ASM_WA.conv({
      transaction_id: T.lastEventId || undefined,
      send_to: LABEL,
      value: typeof T.lastValue === 'number' ? T.lastValue : 30000,
      currency: 'COP', event_category: 'WhatsApp', event_label: ctx
    });
  }, false);
})();
