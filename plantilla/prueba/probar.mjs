/* Prueba del núcleo en un navegador de verdad.
 *
 *   npx playwright@1.56.1 --version   (una vez, para tener el navegador)
 *   node prueba/probar.mjs
 *
 * Levanta una marca INVENTADA (Citroën, con datos de mentira) y comprueba las
 * dos cosas de las que depende que un lead se cuente bien:
 *
 *   1. que el mensaje de WhatsApp salga firmado con el dominio de ESA marca
 *      — de esa firma depende que el CRM lo marque como lead propio y no
 *        como 'directo', que es como entraba antes de la migración 100;
 *   2. que el núcleo no traiga nada de Suzuki pegado.
 *
 * Los scripts solo actúan en el dominio de su ficha, así que la prueba sirve
 * la página COMO SI fuera ese dominio. Correrla desde file:// no prueba nada:
 * el núcleo se apaga solo fuera de producción, a propósito.
 */
// Playwright puede estar instalado en el proyecto o global (que es como viene
// en varias maquinas). Se busca en los dos lados para que la prueba no dependa
// de como se instalo.
async function traerChromium() {
  for (const donde of ['playwright', '/opt/node22/lib/node_modules/playwright/index.mjs']) {
    try { return (await import(donde)).chromium; } catch (_) {}
  }
  console.error('Falta Playwright. Instalalo con:  npm i -D playwright');
  process.exit(2);
}
const chromium = await traerChromium();

const navegador = await chromium.launch();
const ctx = await navegador.newContext();
const pag = await ctx.newPage();

// Se sirve como si fuera el dominio real, porque los scripts solo actúan ahí.
await pag.route('https://asesorcitroenmedellin.com/**', async (ruta) => {
  const fs = await import('fs');
  const path = await import('path');
  const aqui = path.dirname(new URL(import.meta.url).pathname);
  const pedido = new URL(ruta.request().url()).pathname.replace(/^\//, '') || 'pagina.html';
  // marca.js y pagina.html son de la prueba; los .js del núcleo, los de verdad.
  const archivo = fs.existsSync(path.join(aqui, pedido))
    ? path.join(aqui, pedido)
    : path.join(aqui, '..', 'nucleo', pedido);
  const tipo = archivo.endsWith('.js') ? 'application/javascript' : 'text/html';
  await ruta.fulfill({ status: 200, contentType: tipo + '; charset=utf-8',
    body: fs.readFileSync(archivo, 'utf8') });
});

await pag.goto('https://asesorcitroenmedellin.com/pagina.html');
await pag.waitForFunction(() => document.querySelector('#fijo').getAttribute('href').includes('asesorcitroen'), null, { timeout: 5000 });

const r = await pag.evaluate(() => ({
  firmaLarga: decodeURIComponent(new URL(document.getElementById('fijo').href).searchParams.get('text')),
  firmaCorta: decodeURIComponent(new URL(document.getElementById('mencion').href).searchParams.get('text')),
  estado: document.querySelector('.estado-asesor').textContent,
  marca: window.MARCA.marca,
}));

console.log('Botón normal   →', JSON.stringify(r.firmaLarga));
console.log('Ya menciona    →', JSON.stringify(r.firmaCorta));
console.log('Estado asesor  →', JSON.stringify(r.estado));

const bien = [
  ['la firma larga lleva el dominio de Citroën', r.firmaLarga.includes('— Vi la página asesorcitroenmedellin.com')],
  ['la firma corta no repite "Vi la página"', r.firmaCorta.includes('— asesorcitroenmedellin.com') && !r.firmaCorta.includes('Vi la página asesor')],
  ['el estado nombra al asesor de la ficha', r.estado.includes('Juan Camilo ·')],
  ['no quedó nada de Suzuki', !JSON.stringify(r).toLowerCase().includes('suzuki')],
];
let falla = false;
for (const [que, ok] of bien) { console.log((ok ? '  OK   ' : '  FALLA') + ' ' + que); if (!ok) falla = true; }
await navegador.close();
process.exit(falla ? 1 : 0);
