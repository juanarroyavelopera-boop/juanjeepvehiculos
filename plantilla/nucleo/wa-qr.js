/* Modal QR para WhatsApp en escritorio. NÚCLEO DE LA PLANTILLA (viene de Suzuki, oct-2026).
   El puente /ir.html lo genera construir.js con el número de la ficha.
   En celular no interviene: el enlace abre la app directo.
   En computador intercepta el clic a wa.me y muestra un QR para escanear
   con el teléfono (el chat se abre con el mensaje ya escrito).
   El tracking de conversiones no se toca: los listeners de gtag corren igual
   porque solo se cancela la navegación, no la propagación del evento. */
(function () {
  var esMovil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (esMovil || typeof qrcode !== 'function') return;
  // track.js lo lee al momento del clic: si el QR va a interceptar, el clic NO
  // abre WhatsApp y no se cuenta como apertura (ni como Lead en Meta).
  window.ASM_QR_ACTIVO = true;

  var css = '' +
    '#waqr-overlay{position:fixed;inset:0;z-index:9999;background:rgba(6,8,11,.82);display:flex;align-items:center;justify-content:center;padding:20px;}' +
    '#waqr-card{background:#12161c;border:1px solid rgba(255,255,255,.12);border-radius:16px;max-width:400px;width:100%;padding:28px 26px 22px;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.6);position:relative;font-family:inherit;}' +
    '#waqr-close{position:absolute;top:10px;right:12px;background:none;border:none;color:#8b949e;font-size:26px;line-height:1;cursor:pointer;padding:6px;}' +
    '#waqr-close:hover{color:#fff;}' +
    '#waqr-card h3{margin:0 0 6px;color:#fff;font-size:19px;}' +
    '#waqr-card p{margin:0 0 16px;color:#aab3bd;font-size:13.5px;line-height:1.5;}' +
    '#waqr-box{background:#fff;border-radius:12px;padding:14px;display:inline-block;line-height:0;}' +
    '#waqr-box svg{width:208px;height:208px;display:block;}' +
    '#waqr-alt{display:block;margin-top:16px;color:#59c96f;font-size:13.5px;text-decoration:underline;cursor:pointer;}' +
    '#waqr-alt:hover{color:#7ddc90;}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var overlay = null;

  function cerrar() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
  }

  // Convierte una URL wa.me/<num>?text=... a web.whatsapp.com/send?phone=<num>&text=...
  // El link "Prefiero" debe apuntar directo a WhatsApp Web para abrir el chat
  // sin pasar por la pagina intermedia de wa.me.
  function toWebUrl(url) {
    try {
      var u = new URL(url, window.location.href);
      if (u.hostname === 'wa.me') {
        var phone = u.pathname.replace(/^\//, '');
        var text = u.searchParams.get('text') || '';
        return 'https://web.whatsapp.com/send?phone=' + encodeURIComponent(phone) +
               (text ? '&text=' + encodeURIComponent(text) : '');
      }
      if (u.hostname === 'api.whatsapp.com') {
        var phone2 = u.searchParams.get('phone') || '';
        var text2 = u.searchParams.get('text') || '';
        return 'https://web.whatsapp.com/send?phone=' + encodeURIComponent(phone2) +
               (text2 ? '&text=' + encodeURIComponent(text2) : '');
      }
      return url; // ya es web.whatsapp.com u otra
    } catch (_) { return url; }
  }

  /* El QR no apunta directo a wa.me sino a /ir.html, una pagina propia que
     registra el escaneo y redirige enseguida a WhatsApp. Sin ese salto el
     escaneo era invisible: pasa en otro aparato y el sitio nunca se entera,
     asi que no habia forma de saber si el QR servia.

     El qid es un codigo corto que se registra aca (whatsapp_qr_mostrado) y
     alla (whatsapp_qr_escaneado). Cruzando los dos por ese codigo se sabe,
     de cada QR mostrado, si alguien lo escaneo — y de que anuncio venia, ya
     que el gclid quedo guardado del lado del computador. */
  function puenteMedido(url, qid) {
    try {
      var u = new URL(url, location.href);
      if (u.hostname !== 'wa.me' && u.hostname !== 'api.whatsapp.com') return url;
      var texto = u.searchParams.get('text') || '';
      return location.origin + '/ir.html?q=' + encodeURIComponent(qid) +
             '&c=' + encodeURIComponent(ctxActual || 'qr') +
             (texto ? '&t=' + encodeURIComponent(texto) : '');
    } catch (_) { return url; }
  }

  var ctxActual = null;

  function nuevoQid() {
    return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  }

  function abrir(url) {
    cerrar();
    var qid = nuevoQid();
    // Se avisa que el QR se mostro; track.js le pega el gclid de esta sesion.
    try {
      if (window.ASM_TRACK && typeof window.ASM_TRACK.send === 'function') {
        window.ASM_TRACK.send('whatsapp_qr_mostrado', ctxActual || 'qr', { qid: qid });
      }
    } catch (_) {}
    var qr = qrcode(0, 'M');
    qr.addData(puenteMedido(url, qid));
    qr.make();
    overlay = document.createElement('div');
    overlay.id = 'waqr-overlay';
    overlay.innerHTML =
      '<div id="waqr-card" role="dialog" aria-modal="true" aria-label="Escribir por WhatsApp">' +
        '<button id="waqr-close" type="button" aria-label="Cerrar">&times;</button>' +
        '<h3>Escanea y escríbeme desde tu celular</h3>' +
        '<p>Apunta la c&aacute;mara de tu tel&eacute;fono al c&oacute;digo y el chat de WhatsApp se abre con tu mensaje listo.</p>' +
        '<div id="waqr-box">' + qr.createSvgTag({ scalable: true, margin: 0 }) + '</div>' +
        '<a id="waqr-alt" target="_blank" rel="noopener">Prefiero abrir WhatsApp Web en este computador</a>' +
      '</div>';
    overlay.querySelector('#waqr-alt').setAttribute('href', toWebUrl(url));
    overlay.querySelector('#waqr-alt').addEventListener('click', cerrar);
    overlay.querySelector('#waqr-close').addEventListener('click', cerrar);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) cerrar(); });
    document.body.appendChild(overlay);
  }

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });

  // Captura en fase burbuja sobre document: corre después de los listeners
  // de tracking ya registrados en cada botón. Excluye el link "Prefiero"
  // del propio modal para que su click sí navegue a WhatsApp Web.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="wa.me"], a[href*="api.whatsapp"], a[href*="web.whatsapp"]');
    if (!a) return;
    if (a.id === 'waqr-alt') return;
    var url = a.getAttribute('href');
    if (!url || url === '#') return;
    ctxActual = a.getAttribute('data-ctx') || 'qr';  // de que boton salio, para el reporte
    e.preventDefault();
    abrir(url);
  });
})();
