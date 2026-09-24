/* Catálogo EN VIVO desde el CRM — la página deja de tener precios "quemados".
 *
 * NÚCLEO DE LA PLANTILLA: igual para todas las marcas. Qué modelo va en qué
 * página, y cuál es la portada, lo trae window.MARCA (marca.js).
 *
 * Lee el endpoint público del portafolio y sincroniza, en cada página de modelo:
 *   1. Colores disponibles (sección nueva bajo #versiones; agotado en el CRM = desaparece)
 *   2. Precio "Desde" del hero (.price-tag .val)
 *   3. Precio corto del strip ($66.9M)
 *   4. Tabla de versiones y precios (#versiones .ver-row) — se rearma completa,
 *      así una versión nueva en el catálogo (ej. Rino Edition) aparece sola
 *   5. Píldora del bono (.bono-pill)
 *   6. Links cruzados "otros modelos" (Desde $…)
 *
 * Cada bloque va en su propio try: si uno falla, los demás siguen. Si el CRM
 * no responde, la página queda EXACTAMENTE igual con sus precios estáticos.
 * Los meta tags y el JSON-LD no se tocan (eso lo leen los buscadores del HTML).
 */
(function () {
  var M = window.MARCA;
  if (!M || !M.crm || !M.businessId) return;

  // El business_id va explícito: el CRM sirve el catálogo de varias marcas y
  // sin decirle cuál responde el que tenga por defecto.
  var API = M.crm.replace(/\/+$/, '') + '/api/catalog/portfolio?business_id=' +
            encodeURIComponent(M.businessId);

  // Qué línea del catálogo le toca a cada página, sacado de la ficha: cada
  // modelo declara su `pagina`, así que la lista se arma sola.
  var LINEAS = {};
  (M.modelos || []).forEach(function (m) {
    if (!m.pagina || !m.linea) return;
    var s = m.pagina.split('/').pop().replace(/\.html$/, '');
    LINEAS[s] = m.linea;
    (m.paginasExtra || []).forEach(function (p) {
      LINEAS[p.split('/').pop().replace(/\.html$/, '')] = m.linea;
    });
  });

  var fmt = function (n) { return '$' + Number(n).toLocaleString('es-CO'); };
  var fmtCorto = function (n) { return '$' + (Math.floor(n / 100000) / 10).toFixed(1); };

  // "DZIRE HB GL MT (2027)" → "Dzire HB GL MT" (siglas en mayúscula, resto capitalizado)
  var SIGLAS = { HB: 1, GL: 1, 'GL+': 1, GLX: 1, MT: 1, AT: 1, JP: 1, ADAS: 1, CVT: 1, '4X2': 1, '4X4': 1, '(JP)': 1, '3P': 1, '5P': 1 };
  function bonito(version) {
    return version.replace(/\s*\(\d{4}\)\s*$/, '').split(/\s+/).map(function (w) {
      var W = w.toUpperCase();
      if (SIGLAS[W]) return (W === '4X2' || W === '4X4') ? W.replace('X', 'x') : W;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
  }

  // Lo que la versión no dice, lo dice la ficha del modelo: un Jimny es 4x4
  // aunque su nombre no lo diga, y un e-Vitara no tiene ni AT ni MT.
  var FICHA = {};
  (M.modelos || []).forEach(function (m) { if (m.linea) FICHA[m.linea] = m; });

  function transmisionDe(version, linea) {
    var f = FICHA[linea] || {};
    if (f.propulsion === 'electrico') return 'Eléctrica automática';
    var v = version.toUpperCase();
    var t = /\bAT\b|CVT/.test(v) ? 'Automática' : /\bMT\b/.test(v) ? 'Manual' : '—';
    if (f.traccion === '4x4') t += ' 4x4';
    return t;
  }

  var slug = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  var linea = LINEAS[slug];
  // Portada (index / home) y página de híbridos: sincronizan sus tarjetas
  // La portada y la página de tecnología (los híbridos en Suzuki, el 4x4 en
  // Jeep, los Hi4 en GWM) también sincronizan sus tarjetas.
  var otrasPortadas = (M.paginasPortada || []).map(function (p) {
    return p.split('/').pop().replace(/\.html$/, '');
  });
  var esPortada = slug === '' || slug === 'index' || otrasPortadas.indexOf(slug) >= 0;
  var slugTecnologia = (M.paginaTecnologia || '').split('/').pop().replace(/\.html$/, '');
  var esHibridos = Boolean(slugTecnologia) && slug === slugTecnologia;
  if (!linea && !esPortada && !esHibridos) return;

  // Los nombres de las tarjetas coinciden con el nombre del portafolio
  // (única diferencia: "Across Híbrida" en la página vs "Across" en el catálogo)
  /* Primero el nombre EXACTO; si no aparece, el prefijo MÁS LARGO.
     Aceptar prefijos hace falta ("Across Híbrida" en la página contra "Across"
     en el catálogo), pero quedarse con el primero que calce era un error: en
     Citroën "C3" es el comienzo de "C3 Aircross" y de "C3 Max Híbrida", y
     como el catálogo viene ordenado por precio el C3 llegaba primero y les
     regalaba su precio a los otros dos. Las tarjetas mostraban $63.990.000 en
     carros de $75 y $84 millones. Con el más largo gana el más específico. */
  function buscarPorNombre(modelos, nombre) {
    var n = (nombre || '').trim().toLowerCase();
    var mejor = null, largo = -1;
    for (var i = 0; i < modelos.length; i++) {
      var xn = (modelos[i].nombre || '').trim().toLowerCase();
      if (xn === n) return modelos[i];
      if ((n.indexOf(xn) === 0 || xn.indexOf(n) === 0) && xn.length > largo) {
        mejor = modelos[i]; largo = xn.length;
      }
    }
    return mejor;
  }

  /* Nombre exacto, sin prefijos.
     buscarPorNombre acepta prefijos —le sirve para "Across Híbrida" contra
     "Across"— pero eso hace que "C3" se coma a "C3 Max Híbrida", y el "desde"
     de la híbrida terminaba mostrando el precio del C3. Cuando hay un nombre
     completo y correcto hay que exigirlo. */
  function exacto(modelos, nombre) {
    var n = (nombre || '').trim().toLowerCase();
    return modelos.filter(function (x) { return x.nombre.trim().toLowerCase() === n; })[0] || null;
  }

  function sincronizarPortada(modelos) {
    /* 0) El "desde" del hero: el más barato de todo el portafolio. Es un dato
       calculado, no el de un modelo concreto, así que si mañana entra una
       versión más económica el hero la refleja sin que nadie edite nada. */
    function menorDe(lista) {
      return lista.reduce(function (m, x) {
        var p = Number(x && x.precio_desde_cop);
        return p > 0 && (m === null || p < m) ? p : m;
      }, null);
    }
    function pintarDesde(id, lista) {
      var el = document.getElementById(id);
      if (!el) return;
      var minimo = menorDe(lista);
      if (minimo !== null) el.textContent = fmt(minimo);
    }
    pintarDesde('precioDesde', modelos);
    /* El "desde" de la híbrida: quién es híbrido lo dice la ficha de la marca,
       no el catálogo, que no trae la propulsión. */
    pintarDesde('precioDesdeHibrido', (M.modelos || [])
      .filter(function (m) { return m.propulsion === 'hibrido'; })
      .map(function (m) { return exacto(modelos, m.nombre) || buscarPorNombre(modelos, m.nombre); }));
    // 1) Miniaturas (se pintan una sola vez)
    document.querySelectorAll('#showThumbs .thumb').forEach(function (t) {
      var nombre = t.querySelector('.thumb-name');
      var precio = t.querySelector('.thumb-price');
      var img = t.querySelector('.thumb-media img');
      var m = nombre && buscarPorNombre(modelos, nombre.textContent);
      if (!m) return;
      if (precio && m.precio_desde_texto) precio.textContent = m.precio_desde_texto;
      if (img && m.foto_principal) img.src = m.foto_principal;
    });
    // 2) Panel destacado: se redibuja al navegar, así que se re-aplica cada vez
    var showName = document.getElementById('showName');
    if (!showName) return;
    var aplicar = function () {
      var m = buscarPorNombre(modelos, showName.textContent);
      if (!m) return;
      var b = document.querySelector('#showPrice b');
      if (b && m.precio_desde_texto && b.textContent !== m.precio_desde_texto) b.textContent = m.precio_desde_texto;
      var mediaImg = document.querySelector('#showMedia img');
      if (mediaImg && m.foto_principal && mediaImg.src !== m.foto_principal) mediaImg.src = m.foto_principal;
      document.querySelectorAll('#showTags .tag').forEach(function (tag) {
        if (/^Bono /.test(tag.textContent)) {
          if (m.bono_texto) tag.textContent = m.bono_texto;
          else tag.remove();
        }
      });
    };
    aplicar();
    new MutationObserver(aplicar).observe(showName, { childList: true, characterData: true, subtree: true });
  }

  function sincronizarHibridos(modelos) {
    document.querySelectorAll('#modelGrid .model').forEach(function (card) {
      var h3 = card.querySelector('h3');
      var b = card.querySelector('.price b');
      var img = card.querySelector('.ph img');
      var m = h3 && buscarPorNombre(modelos, h3.textContent);
      if (!m) return;
      if (b && m.precio_desde_texto) b.textContent = m.precio_desde_texto;
      if (img && m.foto_principal) img.src = m.foto_principal;
    });
  }

  fetch(API)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var modelos = data.modelos || [];
      if (esPortada) { try { sincronizarPortada(modelos); } catch (e) {} }
      if (esHibridos) { try { sincronizarHibridos(modelos); } catch (e) {} }
      var m = modelos.filter(function (x) { return x.linea === linea; })[0];
      if (!m) return;

      // 1) Colores disponibles. Los que tienen foto del carro en ese color son
      //    clicables: la foto se abre en un visor debajo de los círculos.
      try {
        var anchor = document.getElementById('versiones');
        var colores = m.colores_disponibles || [];
        if (anchor && colores.length) {
          var sec = document.createElement('section');
          sec.id = 'colores';
          sec.style.paddingTop = '0';
          var chips = colores.map(function (c, i) {
            var conFoto = !!c.photo_url;
            return '<button type="button" class="chip-color" data-i="' + i + '" ' +
              'style="display:flex; align-items:center; gap:10px; padding:10px 16px; max-width:100%; border:1px solid var(--line); border-radius:999px; background:var(--panel); font:inherit; cursor:' + (conFoto ? 'pointer' : 'default') + ';">' +
              '<span style="width:22px; height:22px; border-radius:50%; background:' + c.hex + '; border:2px solid rgba(255,255,255,.25); flex:0 0 22px;"></span>' +
              '<span style="font-size:14px; color:var(--white); font-weight:600;">' + c.name + '</span>' +
              '</button>';
          }).join('');
          sec.innerHTML =
            '<div class="wrap" style="max-width:1120px; margin:0 auto; padding:0 20px;">' +
              '<h2 style="font-size:24px; margin:0 0 6px;">Colores disponibles</h2>' +
              '<p style="color:var(--silver); font-size:13px; margin:0 0 18px;">Disponibilidad en tiempo real · confírmame el tuyo por WhatsApp</p>' +
              '<div style="display:flex; flex-wrap:wrap; gap:10px;">' + chips + '</div>' +
              '<div id="colorVisor" style="display:none; margin-top:18px; border:1px solid var(--line); border-radius:16px; overflow:hidden; background:var(--panel);">' +
                '<img id="colorVisorImg" alt="" style="display:block; width:100%; max-height:520px; object-fit:contain; background:var(--panel);">' +
                '<p id="colorVisorNombre" style="margin:0; padding:12px 16px; font-size:13px; color:var(--silver);"></p>' +
              '</div>' +
            '</div>';
          anchor.parentNode.insertBefore(sec, anchor.nextSibling);

          var visor = sec.querySelector('#colorVisor');
          var visorImg = sec.querySelector('#colorVisorImg');
          var visorNombre = sec.querySelector('#colorVisorNombre');
          sec.querySelectorAll('.chip-color').forEach(function (b) {
            var c = colores[Number(b.getAttribute('data-i'))];
            if (!c || !c.photo_url) return;
            b.addEventListener('click', function () {
              visorImg.src = c.photo_url;
              visorImg.alt = m.nombre + ' color ' + c.name;
              visorNombre.textContent = m.nombre + ' · ' + c.name;
              visor.style.display = 'block';
              sec.querySelectorAll('.chip-color').forEach(function (x) { x.style.boxShadow = ''; });
              b.style.boxShadow = '0 0 0 2px var(--gold, #D4AF37)';
            });
          });
        }
      } catch (e) {}

      // 2) Precio "Desde" del hero
      try {
        var val = document.querySelector('.price-tag .val');
        if (val && m.precio_desde_cop) val.textContent = fmt(m.precio_desde_cop);
      } catch (e) {}

      // 2b) Foto del hero = portada del catálogo (cambiarla en el CRM la cambia aquí)
      try {
        var heroImg = document.querySelector('.ficha-shot img');
        if (heroImg && m.foto_principal) heroImg.src = m.foto_principal;
      } catch (e) {}

      // 2c) Galería EN VIVO: las fotos reales del inventario reemplazan las estáticas.
      //     Se rearma el carrusel con el mismo diseño; sin fotos en el CRM, queda la estática.
      try {
        var fotos = m.fotos || [];
        var galMedia = document.getElementById('galMedia');
        if (galMedia && fotos.length) {
          // Clonar quita los listeners del carrusel estático
          ['galMedia', 'galPrev', 'galNext', 'galThumbs'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.replaceWith(el.cloneNode(false));
          });
          var media = document.getElementById('galMedia');
          var prev = document.getElementById('galPrev');
          var next = document.getElementById('galNext');
          var count = document.getElementById('galCount');
          var thumbs = document.getElementById('galThumbs');
          prev.textContent = '‹'; next.textContent = '›';
          var gi = 0;
          var render = function (i) {
            gi = (i + fotos.length) % fotos.length;
            var f = fotos[gi];
            media.classList.remove('fade'); void media.offsetWidth; media.classList.add('fade');
            media.innerHTML = '<img src="' + f.url + '" alt="' + m.nombre + ' ' + (f.label || '') + '" loading="lazy" decoding="async">';
            if (count) count.textContent = (gi + 1) + ' / ' + fotos.length;
            thumbs.querySelectorAll('.thumb').forEach(function (t, ti) { t.classList.toggle('active', ti === gi); });
          };
          thumbs.innerHTML = fotos.map(function (f, i) {
            return '<button class="thumb' + (i === 0 ? ' active' : '') + '" data-i="' + i + '">' +
              '<span class="thumb-media"><img src="' + f.url + '" alt="" loading="lazy" decoding="async"></span>' +
              '<span class="thumb-name">' + (f.label || 'Foto real') + '</span></button>';
          }).join('');
          thumbs.querySelectorAll('.thumb').forEach(function (t) {
            t.addEventListener('click', function () { render(Number(t.dataset.i)); });
          });
          prev.addEventListener('click', function () { render(gi - 1); });
          next.addEventListener('click', function () { render(gi + 1); });
          var tx0 = null, huboArrastre = false;
          media.addEventListener('touchstart', function (e) { tx0 = e.touches[0].clientX; huboArrastre = false; }, { passive: true });
          media.addEventListener('touchend', function (e) {
            if (tx0 === null) return;
            var dx = e.changedTouches[0].clientX - tx0; tx0 = null;
            if (Math.abs(dx) > 40) { huboArrastre = true; render(gi + (dx < 0 ? 1 : -1)); }
          }, { passive: true });
          // Tocar la foto tambien pasa a la siguiente. Antes no hacia nada y la
          // gente lo intentaba igual: de ahi salia buena parte del 11,3% de
          // sesiones con clics muertos que reportaba Clarity. Si el dedo
          // arrastro, el swipe ya avanzo y se ignora el click que llega detras.
          media.style.cursor = 'pointer';
          media.addEventListener('click', function () {
            if (huboArrastre) { huboArrastre = false; return; }
            if (fotos.length > 1) render(gi + 1);
          });
          render(0);
          if (fotos.length < 2) { prev.style.display = 'none'; next.style.display = 'none'; }
        }
      } catch (e) {}

      // 3) Precio corto del strip ($66.9M)
      try {
        var ns = document.querySelectorAll('.trust-item .n, .strip-item .n');
        for (var i = 0; i < ns.length; i++) {
          if (/^\$\d+\.\d/.test(ns[i].textContent) && ns[i].firstChild && ns[i].firstChild.nodeType === 3) {
            ns[i].firstChild.textContent = fmtCorto(m.precio_desde_cop);
            break;
          }
        }
      } catch (e) {}

      // 4) Tabla de versiones (solo si la página usa el formato .ver-row)
      try {
        var cont = document.getElementById('versiones');
        var head = cont && cont.querySelector('.ver-row.head');
        if (head && m.versiones && m.versiones.length) {
          var padre = head.parentNode;
          cont.querySelectorAll('.ver-row:not(.head)').forEach(function (r) { r.remove(); });
          m.versiones.forEach(function (v) {
            if (v.precio_final_cop == null) return;
            var row = document.createElement('div');
            row.className = 'ver-row';
            row.innerHTML =
              '<div class="vname">' + bonito(v.version) + '</div>' +
              '<div>' + (v.anio || '') + '</div>' +
              '<div>' + transmisionDe(v.version, linea) + '</div>' +
              '<div class="vprice">' + fmt(v.precio_final_cop) + '</div>';
            padre.appendChild(row);
          });
        }
      } catch (e) {}

      // 5) Píldora del bono
      try {
        var pill = document.querySelector('.bono-pill');
        if (pill && m.bono_cop) pill.textContent = 'Bono de ' + fmt(m.bono_cop) + ' ya incluido';
        else if (pill && !m.bono_cop) pill.style.display = 'none';
      } catch (e) {}

      // 6) Links cruzados "otros modelos": Desde $… de cada línea
      try {
        var porLinea = {};
        modelos.forEach(function (x) { porLinea[x.linea] = x; });
        document.querySelectorAll('a[href]').forEach(function (a) {
          var s = (a.getAttribute('href') || '').replace(/\.html$/, '');
          var L = LINEAS[s];
          if (!L || !porLinea[L]) return;
          a.querySelectorAll('span').forEach(function (sp) {
            if (/^Desde \$/.test(sp.textContent)) sp.textContent = 'Desde ' + fmt(porLinea[L].precio_desde_cop);
          });
        });
      } catch (e) {}
    })
    .catch(function () { /* sin CRM la página queda igual, con sus precios estáticos */ });
})();
