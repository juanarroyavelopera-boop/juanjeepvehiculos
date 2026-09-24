/* Firma de origen en todos los mensajes de WhatsApp de la pagina.
   NUCLEO DE LA PLANTILLA: igual para todas las marcas. El dominio lo trae
   window.MARCA (marca.js), que va antes que este script.
   Le pega al final del texto pre-escrito una linea que dice de donde salio
   el lead, para que en el CRM se distinga al instante un contacto que vino
   de esta pagina (inversion propia) de uno que llego por cualquier otro lado.

   Se hace aqui, en un solo punto, y no en los ~279 mensajes uno por uno:
   asi cualquier boton nuevo queda firmado sin que haya que acordarse.

   Cubre las tres formas en que la pagina arma el link:
     - href fijo en el HTML (landing Across)
     - href que arma un script inline al cargar (fichas, portada, credito)
     - href que arma un script async al pintar el catalogo (accesorios, tienda)
   El listener en fase de captura corre antes que cualquier otro (incluido
   wa-qr.js), asi que el href siempre sale firmado aunque se haya generado
   un instante antes del clic. */
(function () {
  var M = window.MARCA;
  // Sin ficha no se firma: una firma con el dominio equivocado manda el lead de
  // una marca al reporte de otra, y eso no se ve hasta que alguien lo cruza.
  if (!M || !M.dominio) return;
  var DOMINIO = M.dominio;
  var FIRMA = '\n— Vi la página ' + DOMINIO;
  // Si el mensaje ya menciona la pagina (ej. "vi la pagina de Citroen Medellin"),
  // basta el dominio para no repetir la frase.
  var FIRMA_CORTA = '\n— ' + DOMINIO;

  function firmar(texto) {
    if (!texto) return texto;
    if (texto.indexOf(DOMINIO) !== -1) return texto; // ya firmado
    return texto + (/vi la p[áa]gina/i.test(texto) ? FIRMA_CORTA : FIRMA);
  }

  function firmarEnlace(a) {
    var href = a.getAttribute('href');
    if (!href || href === '#' || href.indexOf(DOMINIO) !== -1) return;
    var u;
    try { u = new URL(href, window.location.href); } catch (_) { return; }
    var esWa = u.hostname === 'wa.me' ||
               u.hostname === 'api.whatsapp.com' ||
               u.hostname === 'web.whatsapp.com';
    if (!esWa) return;
    var texto = u.searchParams.get('text');
    if (!texto) return;
    var firmado = firmar(texto);
    if (firmado === texto) return;
    // Se reconstruye a mano en vez de usar searchParams.set porque este
    // codifica los espacios como "+" y el link de hoy los lleva como %20.
    var base = u.origin + u.pathname;
    var otros = [];
    u.searchParams.forEach(function (v, k) {
      if (k !== 'text') otros.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
    });
    otros.push('text=' + encodeURIComponent(firmado));
    a.setAttribute('href', base + '?' + otros.join('&'));
  }

  var SELECTOR = 'a[href*="wa.me"], a[href*="api.whatsapp"], a[href*="web.whatsapp"]';

  function firmarTodos() {
    document.querySelectorAll(SELECTOR).forEach(firmarEnlace);
  }

  // Antes de que el clic navegue. Fase de captura = corre de primero.
  function alClic(e) {
    var a = e.target.closest && e.target.closest(SELECTOR);
    if (a && a.id !== 'waqr-alt') firmarEnlace(a);
  }
  document.addEventListener('click', alClic, true);
  document.addEventListener('auxclick', alClic, true); // abrir en pestaña nueva

  // Pases sobre el DOM para que el href ya este firmado si alguien copia el
  // enlace con clic derecho, y para el catalogo que se pinta despues de cargar.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', firmarTodos);
  } else {
    firmarTodos();
  }
  window.addEventListener('load', firmarTodos);
  // Se observa solo childList (no atributos), asi el propio setAttribute del
  // href no se re-dispara. El debounce evita recorrer el DOM en cada animacion.
  var pendiente = null;
  new MutationObserver(function () {
    if (pendiente) return;
    pendiente = setTimeout(function () { pendiente = null; firmarTodos(); }, 120);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
