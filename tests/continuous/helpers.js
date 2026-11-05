const { test: base, expect } = require('@playwright/test');
const ORIGIN = 'http://127.0.0.1:4173';

const test = base.extend({
  page: async ({ page, context }, use, info) => {
    const logs = [], errors = [], external = [];
    // Service workers use the existing staging CSP; routes also guard page traffic.
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (['http:', 'https:'].includes(url.protocol) && url.origin !== ORIGIN) {
        external.push(url.origin); return route.abort('blockedbyclient');
      }
      return route.continue();
    });
    page.on('console', m => logs.push({ type: m.type(), text: m.text() }));
    page.on('pageerror', e => errors.push(e.message));
    page.on('requestfailed', r => logs.push({ type: 'requestfailed', url: r.url(), error: r.failure() }));
    try { await use(page); }
    finally {
      await info.attach('browser-log', { body: JSON.stringify({ logs, errors, external }, null, 2), contentType: 'application/json' });
      expect(external, 'No requests to external origins').toEqual([]);
      expect(errors, 'No unexpected page errors').toEqual([]);
    }
  },
});
async function ready(page) {
  // Fresh and persistent contexts created explicitly do not inherit baseURL.
  await page.goto(ORIGIN + '/');
  await expect(page.locator('html')).toHaveAttribute('data-persistence', 'ready');
  // A fresh profile must enter local mode through the actual welcome UI.
  const welcome = page.locator('#access-screen');
  if (await welcome.isVisible()) {
    await welcome.getByRole('button', { name: 'Continuar sin cuenta', exact: true }).click();
    await expect(welcome).toBeHidden();
    await idle(page);
  }
}
async function idle(page) { await page.evaluate(() => AlmogaverStorage.idle()); }
async function backup(page) { return page.evaluate(() => AlmogaverStorage.export()); }
async function settings(page) { await page.locator('.nav[data-screen="settings-screen"]').click(); }
async function addWod(page, title = 'QA sintético · fuerza') {
  await page.locator('.nav[data-screen="wods-screen"]').click();
  await page.locator('#wod-title').fill(title);
  await page.locator('#wod-workout').fill('Sentadilla 3 x 5 · 40 kg');
  await page.locator('#wod-result').fill('05:12');
  await page.locator('#save-wod').click();
  await expect(page.locator('#wod-list')).toContainText(title);
  await idle(page);
}
module.exports = { test, expect, ready, idle, backup, settings, addWod };
