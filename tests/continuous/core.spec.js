const fs = require('node:fs/promises');
const { test, expect, ready, idle, backup, settings, addWod } = require('./helpers');

test('P0 initial load and navigation; P1 mobile layout', async ({ page }) => {
  await ready(page);
  for (const screen of ['progress-screen', 'wods-screen', 'skills-screen', 'settings-screen', 'training-screen']) {
    await page.locator(`.nav[data-screen="${screen}"]`).click();
    await expect(page.locator(`#${screen}`)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});

test('P0 create WOD and preserve exact content on reload', async ({ page }) => {
  await ready(page); await addWod(page);
  const before = (await backup(page)).wods;
  expect(before).toHaveLength(1);
  expect(before[0]).toMatchObject({ title: 'QA sintético · fuerza', workout: 'Sentadilla 3 x 5 · 40 kg', result: '05:12' });
  await ready(page);
  expect((await backup(page)).wods).toEqual(before);
});

test('P0 edit a skill note and preserve it', async ({ page }) => {
  await ready(page);
  await page.locator('.nav[data-screen="skills-screen"]').click();
  await page.locator('#new-skill').fill('QA movilidad');
  await page.locator('#add-skill').click();
  const row = page.locator('.skill-card').filter({ hasText: 'QA movilidad' });
  await row.locator('input').fill('Primera nota'); await idle(page);
  await row.locator('input').fill('Nota editada · áèç'); await idle(page);
  await ready(page);
  expect((await backup(page)).skills.find(x => x.name === 'QA movilidad').notes).toBe('Nota editada · áèç');
});

test('P0 UI backup download and restore in an empty profile', async ({ page, browser }, info) => {
  await ready(page); await addWod(page); await settings(page);
  const pending = page.waitForEvent('download');
  await page.locator('#export-data').click();
  const download = await pending;
  const file = info.outputPath('synthetic-backup.json'); await download.saveAs(file);
  const payload = JSON.parse(await fs.readFile(file, 'utf8'));
  expect(payload.app).toBe('ALMOGAVAR'); expect(payload.schemaVersion).toBe(2);
  expect(payload.wods).toHaveLength(1); expect(payload.wods[0].result).toBe('05:12');
  await info.attach('synthetic-backup', { path: file, contentType: 'application/json' });
  const context = await browser.newContext({ serviceWorkers: 'block' });
  try {
    const target = await context.newPage(); await ready(target);
    expect((await backup(target)).wods || []).toHaveLength(0);
    await settings(target); target.on('dialog', d => d.accept());
    await target.locator('#import-data').setInputFiles(file);
    await expect(target.locator('#backup-status')).toHaveText('Backup restaurado');
    await expect.poll(async () => (await backup(target)).wods).toEqual(payload.wods);
  } finally { await context.close(); }
});

for (const [name, payload] of [
  ['truncated JSON', '{"app":'],
  ['future schema', JSON.stringify({ app: 'ALMOGAVAR', schemaVersion: 999 })],
  ['wrong application', JSON.stringify({ app: 'OTHER', schemaVersion: 1, wods: [] })],
  ['prototype property', '{"app":"ALMOGAVAR","schemaVersion":1,"wods":[],"__proto__":{}}'],
]) test(`P0 reject ${name} without changing data`, async ({ page }) => {
  await ready(page); await addWod(page);
  const before = await backup(page); const token = await page.evaluate(() => AlmogaverStorage.token());
  await settings(page);
  await page.locator('#import-data').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from(payload) });
  await expect(page.locator('#backup-status')).toContainText('Backup no válido / no restaurado');
  const after = await backup(page);
  delete before.exportedAt; delete after.exportedAt;
  expect(after).toEqual(before);
  expect(await page.evaluate(() => AlmogaverStorage.token())).toEqual(token);
});

test('P0 untrusted WOD text is rendered as inert text', async ({ page }) => {
  await ready(page);
  const marker = '<img src=x onerror="window.__qaXss=1">';
  await addWod(page, marker);
  expect(await page.evaluate(() => window.__qaXss)).toBeUndefined();
  await expect(page.locator('#wod-list img')).toHaveCount(0);
  await expect(page.locator('#wod-list')).toContainText(marker);
});
