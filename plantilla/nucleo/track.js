/* Medición propia (first-party) — núcleo de la plantilla.
   Manda cada evento del sitio al CRM (/api/track → tabla site_events) para
   auditar con datos propios lo que reportan Google Ads y Meta.

   ESTE ARCHIVO ES IGUAL PARA TODAS LAS MARCAS. Lo que cambia (dominio, negocio,
   prefijo de las cookies) lo trae window.MARCA, que define marca.js y que va
   ANTES que este script en el <head>. Sin esa ficha no se mide: es preferible
   perder eventos a medirlos contra el negocio equivocado, que ensucia el
   reporte de dos marcas a la vez y no se ve hasta que alguien lo cruza.

   - Captura gclid/gbraid/wbraid/fbclid/ttclid/msclkid + UTMs al primer toque
     y los persiste 90 días (cookie first-party + respaldo en localStorage).
     El first touch no se pisa; el último click ID pagado sí se actualiza.
   - Genera un event_id (UUID) ANTES de cualquier envío y lo expone en
     window.MEDICION.lastEventId para que los gtag de la página lo manden como
     transaction_id (deduplicación en Google) — corre en fase captura, o sea
     ANTES que los listeners de gtag de cada página.
   - Envía con sendBeacon (sobrevive al salto a WhatsApp); fetch de respaldo.
   No toca el tracking existente (gtag/Clarity): es una capa aparte. */
(function () {
  var M = window.MARCA;
  if (!M || !M.dominio || !M.businessId || !M.crm) {
    window.MEDICION = { lastEventId: null, off: true, motivo: 'falta marca.js (o le falta dominio / businessId / crm)' };
    return;
  }

  var ENDPOINT = M.crm.replace(/\/+$/, '') + '/api/track';
  var BUSINESS_ID = M.businessId;
  // Las cookies llevan el prefijo de la marca para que en el navegador se vea
  // de cuál son. Cambiarle el prefijo a un sitio ya publicado le borra la
  // identidad a todos sus visitantes, así que se fija una vez y no se toca.
  var P = (M.prefijoCookie || M.sigla || 'sitio').toLowerCase();

  // Solo se mide el sitio de verdad. Abrir una copia en local (localhost, un
  // 127.0.0.1, un file://) mandaba los clics de prueba al CRM y le inflaba el
  // dia al reporte de trafico, que es justo lo que ese reporte no puede hacer.
  var host = location.hostname;
  var dominioRe = new RegExp('(^|\\.)' + M.dominio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$');
  if (!dominioRe.test(host)) {
    window.MEDICION = { lastEventId: null, off: true, motivo: 'no es produccion: ' + (host || 'file://') };
    return;
  }

  // Tampoco se mide un navegador de PRUEBA sobre el sitio de verdad. El filtro
  // de arriba solo apaga las copias locales, pero una herramienta que abre la
  // pagina real desde una copia local sigue midiendo: el 5-sep-2026, en el
  // sitio de Suzuki, UNA sola sesion asi metio 210 de las 276 visitas del dia
  // (26 paginas en 47 min, 8,4 paginas por sesion cuando el resto de dias van
  // en 1,1-2,0). Con el dia inflado no se puede auditar a Google, que es para
  // lo que existe esta capa.
  //
  // Se reconoce por: navegador automatizado (webdriver), el propio navegador
  // integrado de Claude, Chrome sin ventana, o haber llegado desde localhost
  // — esta ultima fue la que delato la sesion del 5-sep (205 de 211 eventos).
  var ua = navigator.userAgent || '';
  var vieneDeLocal = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:|\/|$)/i.test(document.referrer || '');
  var esNavegadorDePrueba = navigator.webdriver === true ||
    /Claude\/|HeadlessChrome|Puppeteer|Playwright|Lighthouse|PTST|GTmetrix/i.test(ua);
  if (esNavegadorDePrueba || vieneDeLocal) {
    window.MEDICION = {
      lastEventId: null, off: true,
      motivo: 'navegador de prueba' + (vieneDeLocal ? ' (llego desde localhost)' : '')
    };
    return;
  }

  var uuid = function () {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  };

  function getCookie(name) {
    var m = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
    return m ? decodeURIComponent(m[1]) : null;
  }
  function setCookie(name, value, days) {
    document.cookie = name + '=' + encodeURIComponent(value) +
      '; Max-Age=' + (days * 86400) + '; Path=/; SameSite=Lax; Secure';
  }

  // ---- Identidad anónima: navegador (1 año) y visita (sesión) ----
  var visitorId = getCookie(P + '_vid');
  if (!visitorId) { visitorId = uuid(); }
  setCookie(P + '_vid', visitorId, 365); // renueva expiración en cada visita
  var sessionId = null;
  try {
    sessionId = sessionStorage.getItem(P + '_sid');
    if (!sessionId) { sessionId = uuid(); sessionStorage.setItem(P + '_sid', sessionId); }
  } catch (_) { sessionId = uuid(); }

  // ---- Atribución: click IDs + UTMs, first touch intacto ----
  var CLICK_KEYS = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid', 'msclkid'];
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

  function readAttr() {
    var raw = getCookie(P + '_attr');
    if (!raw) { try { raw = localStorage.getItem(P + '_attr'); } catch (_) {} }
    try { return raw ? JSON.parse(raw) : null; } catch (_) { return null; }
  }
  function saveAttr(attr) {
    var raw = JSON.stringify(attr);
    setCookie(P + '_attr', raw, 90);
    try { localStorage.setItem(P + '_attr', raw); } catch (_) {}
  }

  var attr = readAttr() || {};
  (function captureParams() {
    var params;
    try { params = new URLSearchParams(location.search); } catch (_) { return; }
    var found = {}, any = false;
    CLICK_KEYS.concat(UTM_KEYS).forEach(function (k) {
      var v = params.get(k);
      if (v && /^[\w.\-|%]{1,200}$/.test(v)) { found[k] = v; if (CLICK_KEYS.indexOf(k) >= 0) any = true; }
    });
    var nowIso = new Date().toISOString();
    if (!attr.first) {
      // primer toque: se guarda tal cual llegó (con o sin pauta)
      attr.first = { at: nowIso };
      CLICK_KEYS.concat(UTM_KEYS).forEach(function (k) { if (found[k]) attr.first[k] = found[k]; });
    }
    if (any) {
      // llegó un click ID pagado nuevo: actualiza el touch vigente, first queda intacto
      attr.current = { at: nowIso };
      CLICK_KEYS.concat(UTM_KEYS).forEach(function (k) { if (found[k]) attr.current[k] = found[k]; });
    } else if (!attr.current && Object.keys(found).length) {
      attr.current = { at: nowIso };
      UTM_KEYS.forEach(function (k) { if (found[k]) attr.current[k] = found[k]; });
    }
    saveAttr(attr);
  })();

  function attrField(k) {
    return (attr.current && attr.current[k]) || (attr.first && attr.first[k]) || null;
  }

  // ---- Peso comercial (COP) por tipo de acción ----
  // ESPEJO de valueFor() de las páginas y de lib/track-value.ts del CRM. Aquí no
  // se usa para decidir nada (el servidor reasigna el value al guardar): sirve
  // para que el pixel de Meta mande el mismo número que gtag manda a Google.
  //
  // Los pesos se pueden ajustar por marca desde la ficha (MARCA.pesos), porque
  // un Wrangler no vale lo que un C3. Lo que no se ajusta ahí usa la escala de
  // abajo, que es la del CRM.
  var PESOS = (window.MARCA && window.MARCA.pesos) || {};
  var CTX_VALUE_OVERRIDES = {
    header: 25000, sticky_mobile: 15000, flotante_movil: 15000, hero_principal: 40000,
    chip_prueba: 80000, chip_peritaje: 60000, chip_credito: 50000,
    credito_teaser: 45000, call_hero: 55000
  };
  function valueFor(ctx) {
    if (!ctx) return PESOS.general || 30000;
    if (PESOS[ctx] != null) return PESOS[ctx];
    if (CTX_VALUE_OVERRIDES[ctx] != null) return CTX_VALUE_OVERRIDES[ctx];
    if (/prueba|ruta/.test(ctx)) return 80000;
    if (/peritaje|retoma/.test(ctx)) return 60000;
    if (/^call_|_call_/.test(ctx)) return 55000;
    if (/credito|financia/.test(ctx)) return 50000;
    if (/simulador|cuota/.test(ctx)) return 45000;
    if (/^\w+_hero$/.test(ctx)) return 60000;
    if (/final|cta/.test(ctx)) return 60000;
    if (/hero|principal|asesor|whatsapp_directo/.test(ctx)) return 40000;
    if (/^modelo_/.test(ctx)) return 60000;
    if (/sticky|flotante/.test(ctx)) return 15000;
    if (/header/.test(ctx)) return 25000;
    return PESOS.general || 30000;
  }

  // ---- Envío ----
  function send(eventName, ctx, metadata) {
    var eventId = uuid();
    window.MEDICION = window.MEDICION || {};
    window.MEDICION.lastEventId = eventId; // los gtag de la página lo leen como transaction_id
    // page_view no lleva peso (no es una intención); el resto sí, y meta-pixel.js lo lee
    window.MEDICION.lastValue = eventName === 'page_view' ? null : valueFor(ctx);
    var payload = {
      event_id: eventId,
      business_id: BUSINESS_ID,
      event_name: eventName,
      occurred_at: new Date().toISOString(),
      session_id: sessionId,
      visitor_id: visitorId,
      page_path: location.pathname,
      referrer: document.referrer ? document.referrer.slice(0, 300) : null,
      ctx: ctx || null,
      gclid: attrField('gclid'), gbraid: attrField('gbraid'), wbraid: attrField('wbraid'),
      fbclid: attrField('fbclid'), ttclid: attrField('ttclid'), msclkid: attrField('msclkid'),
      utm_source: attrField('utm_source'), utm_medium: attrField('utm_medium'),
      utm_campaign: attrField('utm_campaign'),
      first_touch_at: attr.first ? attr.first.at : null,
      // cookies que planta el pixel de Meta: _fbp (id de navegador) y _fbc (del
      // clic en un anuncio). El servidor las reenvía por CAPI — son las señales
      // que más suben la "calidad de emparejamiento de eventos" (EMQ).
      fbp: getCookie('_fbp'),
      fbc: getCookie('_fbc'),
      metadata: metadata || {}
    };
    var body = JSON.stringify(payload);
    var ok = false;
    try { if (navigator.sendBeacon) ok = navigator.sendBeacon(ENDPOINT, body); } catch (_) {}
    if (!ok) {
      try { fetch(ENDPOINT, { method: 'POST', body: body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }); } catch (_) {}
    }
    return eventId;
  }
  window.MEDICION = window.MEDICION || {};
  window.MEDICION.send = send;
  // Las páginas de Suzuki leen window.ASM_TRACK en su gtag inline. El alias deja
  // que este núcleo entre a ese sitio sin reescribir las nueve fichas.
  window.ASM_TRACK = window.MEDICION;

  var esMovil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // ---- Listeners en fase CAPTURA: corren antes que los gtag de la página ----
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var alt = t.closest('#waqr-alt'); // "Prefiero WhatsApp Web" del modal QR (desktop)
    if (alt) { send('whatsapp_open_attempt', 'waqr_web_fallback', {}); return; }

    // .wpp-cta son los botones verdes; [data-wa] es cualquier otro enlace a
    // WhatsApp que también cuenta como conversión (las muestras de color de la
    // ficha). Sin esto un clic en "quiero el rojo" abría el chat y no se medía.
    var wa = t.closest('.wpp-cta, [data-wa]');
    if (wa) {
      var ctx = wa.getAttribute('data-ctx') || 'general';
      send('cta_whatsapp_click', ctx, {});
      // en móvil el clic navega directo a WhatsApp = intento de apertura real;
      // en desktop solo sale el modal QR (la apertura se mide en #waqr-alt)
      if (esMovil) send('whatsapp_open_attempt', ctx, {});
      return;
    }

    var call = t.closest('.call-cta');
    if (call) { send('phone_click', call.getAttribute('data-ctx') || 'general', {}); }
  }, true);

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f && f.classList && f.classList.contains('boletin-form')) {
      send('form_submit', 'boletin', {});
    }
  }, true);

  // ---- page_view al cargar ----
  send('page_view', null, {});
})();
