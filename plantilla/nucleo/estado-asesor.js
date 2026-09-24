/* Estado del asesor en los botones de WhatsApp.
   NUCLEO DE LA PLANTILLA: igual para todas las marcas. El horario y el nombre
   de quien contesta los trae window.MARCA (marca.js).
   Muestra "En linea" SOLO cuando de verdad lo esta (8:00-22:00 hora de Colombia).
   Fuera de horario no se calla: invita igual, pero sin prometer respuesta inmediata.

   Se calcula sobre America/Bogota, NO sobre el reloj del visitante: si alguien
   entra desde otro huso, lo que importa es si el asesor esta disponible, no
   que hora es donde esta el visitante.

   Marcado esperado:  <span class="estado-asesor">…</span>
   El prefijo ("Juan Camilo · ") sale de MARCA.asesor; un data-prefijo en el
   HTML gana, para el caso en que una pagina quiera decir otra cosa.
   El texto que traiga el HTML es el respaldo: si este script no carga, la pagina
   sigue diciendo algo sensato en vez de quedar vacia. */
(function () {
  var M = window.MARCA || {};
  var H = M.horario || {};
  // Sin ficha, la ventana de siempre: 8:00 a medianoche.
  var DESDE = typeof H.desde === 'number' ? H.desde : 8;
  var HASTA = typeof H.hasta === 'number' ? H.hasta : 24;
  var PREFIJO = M.asesor ? M.asesor + ' \u00b7 ' : '';

  function horaBogota() {
    try {
      return parseInt(new Date().toLocaleString('en-US', {
        timeZone: 'America/Bogota', hour: '2-digit', hour12: false
      }), 10);
    } catch (e) {
      return null; // navegador sin soporte de husos: mejor no afirmar nada
    }
  }

  /* Aro blanco a proposito: el punto va tanto sobre botones VERDES de WhatsApp
     como sobre fondos oscuros. Verde sobre verde no se distingue; el aro le da
     contraste en los dos casos sin perder el codigo de color de "en linea". */
  var css = '' +
    '.estado-punto{display:inline-block;width:7px;height:7px;border-radius:50%;' +
    'background:#25D366;border:1.5px solid rgba(255,255,255,.95);box-sizing:content-box;' +
    'margin-right:6px;vertical-align:middle;' +
    'box-shadow:0 0 0 0 rgba(255,255,255,.65);animation:estadoLatido 2s infinite;}' +
    '@keyframes estadoLatido{0%{box-shadow:0 0 0 0 rgba(255,255,255,.65)}' +
    '70%{box-shadow:0 0 0 6px rgba(255,255,255,0)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0)}}' +
    '@media (prefers-reduced-motion: reduce){.estado-punto{animation:none;}}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  function pintar() {
    var h = horaBogota();
    if (h === null) return;                 // sin dato fiable, se deja el texto del HTML
    var enLinea = h >= DESDE && h < HASTA;

    document.querySelectorAll('.estado-asesor').forEach(function (el) {
      var prefijo = el.getAttribute('data-prefijo') || PREFIJO;
      el.textContent = '';
      if (enLinea) {
        var punto = document.createElement('span');
        punto.className = 'estado-punto';
        el.appendChild(punto);
      }
      el.appendChild(document.createTextNode(
        prefijo + (enLinea ? 'en línea ahora' : 'te respondo apenas te vea')
      ));
    });
  }

  pintar();
  // Repinta cada 5 min: quien deja la pestana abierta cruzando las 10 pm
  // no puede seguir viendo "en linea".
  setInterval(pintar, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) pintar();
  });
})();
