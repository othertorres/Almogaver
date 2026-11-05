const fs = require('node:fs/promises');
const { test, expect, ready, idle, backup } = require('./helpers');

test('P0 import text routine, edit and export the saved plan', async ({ page }, info) => {
  await ready(page);
  await page.locator('#personal-home [data-home-action="import"]').click();
  await page.locator('#routine-text').fill('Día 1\nSentadilla 3 x 5\nDescanso: 90 s');
  await page.locator('[data-action="parse"]').click();
  await page.locator('[data-plan-name]').fill('QA rutina áèç'); await idle(page);
  await page.locator('#review-confirm').check();
  await page.locator('#save-plan').click();
  await expect.poll(async () => (await backup(page)).plansV7?.plans?.length).toBe(1);
  await page.locator('.nav[data-screen="training-screen"]').click();
  await page.locator('[data-action="edit"]').click();
  await page.locator('[data-plan-name]').fill('QA rutina editada'); await idle(page);
  await page.locator('#review-confirm').check(); await page.locator('#save-plan').click();
  await ready(page);
  const plans = (await backup(page)).plansV7.plans;
  expect(plans).toHaveLength(1);
  expect(plans[0].name).toBe('QA rutina editada');
  expect(plans[0].days[0].exercises[0]).toMatchObject({ name: 'Sentadilla', sets: 3, reps: '5' });
  await page.locator('.nav[data-screen="training-screen"]').click();
  const pending = page.waitForEvent('download');
  await page.locator('[data-action="export"]').click();
  const file = info.outputPath('synthetic-plan.json'); await (await pending).saveAs(file);
  const payload = JSON.parse(await fs.readFile(file, 'utf8'));
  expect(payload).toMatchObject({ app: 'ALMOGAVAR_PLAN', schemaVersion: 1 });
  expect(payload.plan).toEqual(plans[0]);
  await info.attach('exported-plan', { path: file, contentType: 'application/json' });
});

test('P1 recover from an invalid PDF without changing saved plans', async ({ page }) => {
  await ready(page);
  const before = (await backup(page)).plansV7?.plans || [];
  await page.locator('#personal-home [data-home-action="import"]').click();
  await page.locator('#routine-files').setInputFiles({ name: 'broken.pdf', mimeType: 'application/pdf', buffer: Buffer.from('this is not a PDF') });
  await page.locator('[data-action="read-files"]').click();
  await expect(page.locator('#plan-error')).toContainText(/dañado|no es un PDF|No se pudo/);
  expect((await backup(page)).plansV7?.plans || []).toEqual(before);
  await expect(page.locator('[data-action="read-files"]')).toBeEnabled();
});
