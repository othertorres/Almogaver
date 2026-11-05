# ALMOGÀVER · QA automática

Infraestructura de pruebas aisladas con Playwright. No despliega versiones.

Base de desarrollo: commit 91b2c0d42053edb8cdd3caa76d5969ea6a7f792f del respaldo del propietario. La incorporación QA corresponde a 8b0884cc31755102f49ef03cb0053173e4d39a44. Esta copia no está certificada como idéntica a la versión actualmente publicada.

## Ejecutar

Requiere Node 24, Python 3 y sandbox de navegador funcional.

```sh
npm ci --ignore-scripts
npx playwright install --with-deps chromium firefox webkit
npm run test:model
npm run test:staging
npm run test:gate
npm test
node scripts/qa-verdict.js
```

Actions ejecuta la matriz Chromium, Firefox, WebKit y dos tamaños móviles con cada push/PR; también permite ejecución manual y semanal. Conserva informes, logs y trazas durante 14 días. No contiene pasos de despliegue ni credenciales Netlify.

Solo datos sintéticos y perfiles temporales nuevos. Nunca importar backups personales. El servidor escucha en 127.0.0.1:4173 y sirve una copia bajo .local/staging; no sirve Git ni documentos internos. No publicar la raíz del repositorio o .local.

80 instancias definidas (16 recorridos por 5 configuraciones). Los cinco modelos, cinco comprobaciones del gate y el snapshot estático pasaron localmente. La ejecución E2E local quedó bloqueada por el sandbox/ausencia de navegadores: estos resultados no son una aprobación funcional. Los resultados de Actions deben revisarse por ejecución y commit. WebKit y emulación móvil no acreditan Safari/iPhone real.

Pendiente ampliar sesiones completas, WOD semanal, OCR/DOCX, cuota/concurrencia y transición PWA entre releases. No se incluyen el historial Git anterior, documentos privados o perfiles de navegador.
