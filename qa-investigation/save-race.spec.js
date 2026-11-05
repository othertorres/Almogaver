// Synthetic, isolated experiments. These do not approve the production app.
const { test, expect, ready, idle, backup } = require('../tests/continuous/helpers');
const OLD = 'QA rutina original';
const EDITED = 'QA rutina editada';

async function prepare(page) {
  await ready(page);
  await page.locator('#personal-home [data-home-action="import"]').click();
  await page.locator('#routine-text').fill('Día 1\nSentadilla 3 x 5\nDescanso: 90 s');
  await page.locator('[data-action="parse"]').click();
  await page.locator('[data-plan-name]').fill(OLD); await idle(page);
  await page.locator('#review-confirm').check();
  await page.locator('#save-plan').click();
  await expect(page.locator('#save-plan')).toHaveCount(0);
  const initial = (await backup(page)).plansV7.plans;
  expect(initial).toHaveLength(1); expect(initial[0].name).toBe(OLD);
  await page.locator('.nav[data-screen="training-screen"]').click();
  await page.locator('[data-action="edit"]').click();
  await page.locator('[data-plan-name]').fill(EDITED); await idle(page);
  await page.locator('#review-confirm').check();
  return initial[0].id;
}

async function observe(page, pause = false) {
  const events = [];
  page.on('console', msg => {
    if (msg.text().startsWith('QA_SAVE_EVENT ')) events.push(JSON.parse(msg.text().slice(14)));
  });
  await page.evaluate(pause => {
    const repo = AlmogaverStorage, original = repo.commit.bind(repo);
    repo.commit = function(patch, reason, options) {
      if (reason !== 'save-plan') return original(patch, reason, options);
      const emit = stage => console.info('QA_SAVE_EVENT ' + JSON.stringify({ stage, at: performance.now(), token: repo.token() }));
      emit('handler-entered');
      const perform = () => original(patch, reason, options).then(result => { emit('transaction-complete'); return result; });
      if (pause) return new Promise((resolve, reject) => {
        window.__qaReleaseSave = () => perform().then(resolve, reject);
        emit('paused-before-write');
      });
      return perform();
    };
  }, pause);
  return events;
}

async function attach(info, data) {
  await info.attach('save-investigation', { body: JSON.stringify(data, null, 2), contentType: 'application/json' });
}

for (let sample = 1; sample <= 5; sample++) {
  test(`original immediate reload sample ${sample}`, async ({ page }, info) => {
    await prepare(page);
    const events = await observe(page);
    await page.locator('#save-plan').click();
    await ready(page);
    const plans = (await backup(page)).plansV7.plans;
    await attach(info, { kind: 'ORIGINAL_EXPECTATION', sample, events, restored: plans[0].name });
    expect(plans[0].name).toBe(EDITED);
  });

  test(`wait for confirmed save before reload sample ${sample}`, async ({ page }, info) => {
    const id = await prepare(page);
    const events = await observe(page);
    await page.locator('#save-plan').click();
    // This form is removed only after awaiting the native IDB commit.
    await expect(page.locator('#save-plan')).toHaveCount(0);
    const confirmed = (await backup(page)).plansV7.plans;
    expect(confirmed[0]).toMatchObject({ id, name: EDITED });
    await ready(page);
    const restored = (await backup(page)).plansV7.plans;
    await attach(info, { kind: 'CONFIRMED_COMMIT', sample, events, confirmed, restored });
    expect(restored).toEqual(confirmed);
    expect(restored).toHaveLength(1);
    expect(events.some(e => e.stage === 'transaction-complete')).toBe(true);
  });
}

test('control: reload while save is paused before any write', async ({ page }, info) => {
  const id = await prepare(page);
  const events = await observe(page, true);
  await page.locator('#save-plan').click();
  // This deliberate experiment leaves the promise pending: no write was issued.
  await expect.poll(() => events.some(e => e.stage === 'paused-before-write')).toBe(true);
  await ready(page);
  const restored = (await backup(page)).plansV7.plans;
  await attach(info, { kind: 'CONTROL_PENDING_NOT_A_REGRESSION_PASS', events, restored });
  expect(restored).toHaveLength(1);
  expect(restored[0]).toMatchObject({ id, name: OLD });
  expect(events.some(e => e.stage === 'transaction-complete')).toBe(false);
});

test('control: release paused save, confirm, then reload', async ({ page }, info) => {
  const id = await prepare(page);
  const events = await observe(page, true);
  await page.locator('#save-plan').click();
  await expect.poll(() => events.some(e => e.stage === 'paused-before-write')).toBe(true);
  await page.evaluate(() => window.__qaReleaseSave());
  await expect(page.locator('#save-plan')).toHaveCount(0);
  await ready(page);
  const restored = (await backup(page)).plansV7.plans;
  await attach(info, { kind: 'CONTROL_RELEASED_COMMIT', events, restored });
  expect(restored).toHaveLength(1);
  expect(restored[0]).toMatchObject({ id, name: EDITED });
  expect(events.some(e => e.stage === 'transaction-complete')).toBe(true);
});
