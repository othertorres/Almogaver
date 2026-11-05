const { chromium, firefox, webkit } = require('@playwright/test');
const { test, expect, ready, backup, addWod } = require('./helpers');

test('P0 legacy v1 backup retains absent modules', async ({ page }) => {
  await ready(page); await addWod(page);
  const before = (await backup(page)).wods;
  await page.evaluate(async () => {
    const prepared = AlmogaverStorage.prepare({ app: 'ALMOGAVAR', schemaVersion: 1, skills: [{ id: 'qa-legacy', name: 'Legacy synthetic', level: 2, notes: '' }] });
    await AlmogaverStorage.restore(prepared);
  });
  const after = await backup(page);
  expect(after.wods).toEqual(before);
  expect(after.skills).toEqual([{ id: 'qa-legacy', name: 'Legacy synthetic', level: 2, notes: '' }]);
});

test('P0 real browser close and reopen preserves IndexedDB', async ({ browserName }, info) => {
  const engine = { chromium, firefox, webkit }[browserName];
  const profile = info.outputPath('synthetic-profile');
  const options = {
    headless: true, chromiumSandbox: true, serviceWorkers: 'block',
    ...(browserName === 'chromium' && process.env.QA_SYSTEM_CHROMIUM ? { executablePath: process.env.QA_SYSTEM_CHROMIUM } : {}),
  };
  let context;
  let before;
  try {
    context = await engine.launchPersistentContext(profile, options);
    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    const page = await context.newPage(); await ready(page); await addWod(page);
    before = (await backup(page)).wods;
  } finally {
    if (context) {
      const path = info.outputPath('before-close.zip');
      await context.tracing.stop({ path });
      await info.attach('before-close', { path, contentType: 'application/zip' });
      await context.close(); context = null;
    }
  }
  try {
    context = await engine.launchPersistentContext(profile, options);
    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    const page = await context.newPage(); await ready(page);
    expect((await backup(page)).wods).toEqual(before);
    await page.screenshot({ path: info.outputPath('reopened.png'), fullPage: true });
  } finally {
    if (context) {
      const path = info.outputPath('after-reopen.zip');
      await context.tracing.stop({ path });
      await info.attach('after-reopen', { path, contentType: 'application/zip' });
      await context.close();
    }
  }
});

test('P1 service worker controls app and offline reload preserves data', async ({ page, context }) => {
  await ready(page); await addWod(page);
  const before = (await backup(page)).wods;
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
  await context.setOffline(true);
  try {
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-persistence', 'ready');
    expect((await backup(page)).wods).toEqual(before);
  } finally { await context.setOffline(false); }
});

test('P0 legacy localStorage migrates to IndexedDB without deleting legacy data', async ({ page }) => {
  const legacy = JSON.stringify([{ id: 'qa-legacy', name: 'Migración sintética', level: 2, notes: 'áèç' }]);
  await page.addInitScript(value => {
    if (!localStorage.getItem('qa-seeded')) {
      localStorage.setItem('almogavar-skills', value);
      localStorage.setItem('qa-seeded', '1');
    }
  }, legacy);
  await ready(page);
  expect((await backup(page)).skills).toEqual(JSON.parse(legacy));
  expect(await page.evaluate(() => localStorage.getItem('almogavar-skills'))).toBe(legacy);
  await ready(page);
  expect((await backup(page)).skills).toEqual(JSON.parse(legacy));
});

test('P0 missing IndexedDB active control blocks startup without deleting records', async ({ page }) => {
  await ready(page); await addWod(page);
  const count = await page.evaluate(async () => {
    const repo = AlmogaverStorage;
    await repo.idle();
    const records = await new Promise((resolve, reject) => {
      const req = repo.db.transaction('records').objectStore('records').count();
      req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
    });
    await new Promise((resolve, reject) => {
      const tx = repo.db.transaction('control', 'readwrite');
      tx.objectStore('control').delete('active');
      tx.oncomplete = resolve; tx.onabort = () => reject(tx.error);
    });
    return records;
  });
  expect(count).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-persistence', 'blocked');
  await expect(page.locator('#persistence-status')).toContainText('Control activo ausente');
  const after = await page.evaluate(() => new Promise((resolve, reject) => {
    const open = indexedDB.open('almogaver-integrity-v2');
    open.onsuccess = () => {
      const db = open.result, tx = db.transaction('records'), req = tx.objectStore('records').count();
      req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    };
    open.onerror = () => reject(open.error);
  }));
  expect(after).toBe(count);
});
