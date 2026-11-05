const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const context = vm.createContext({ crypto: require('node:crypto').webcrypto });
vm.runInContext(fs.readFileSync('src/persistence.js', 'utf8'), context);
const P = context.AlmogaverPersistence;
const A = require('../../importer-core.js');
const v1 = { app: 'ALMOGAVAR', schemaVersion: 1, skills: [{ id: 'synthetic', name: 'Movilidad áèç', level: 2, notes: 'QA' }] };
test('v1 only replaces modules explicitly included', () => {
  const original = JSON.stringify([{ id: 'wod', title: 'Existing', date: '2026-11-05', type: 'AMRAP', workout: 'Air squats', result: '10', rpe: '', notes: '', scaling: '' }]);
  const decoded = P.decode(v1, { [P.K.wods]: original });
  assert.equal(decoded.patch[P.K.wods], undefined);
  assert.ok(decoded.retain.includes(P.K.wods));
  assert.deepEqual(JSON.parse(decoded.patch[P.K.skills]), v1.skills);
});
test('v2 distinguishes absent and empty modules and preserves source text', () => {
  const map = { [P.K.skills]: JSON.stringify(v1.skills), [P.K.wods]: '[]', [P.K.text]: JSON.stringify('Día 1\nSentadilla 3 x 5') };
  const payload = P.encode(map);
  assert.equal(payload.presence[P.K.wods], true);
  assert.equal(payload.presence[P.K.history], false);
  const decoded = P.decode(payload, {});
  for (const [key, raw] of Object.entries(map)) assert.equal(decoded.patch[key], raw);
  assert.equal(decoded.patch[P.K.history], null);
});
test('corrupt presence, future schema, wrong app and dangerous keys rejected', () => {
  const broken = JSON.parse(JSON.stringify(P.encode({ [P.K.skills]: JSON.stringify(v1.skills) })));
  broken.presence[P.K.skills] = false;
  for (const payload of [broken, { ...v1, schemaVersion: 999 }, { ...v1, app: 'OTHER' }, JSON.parse('{"app":"ALMOGAVAR","schemaVersion":1,"skills":[],"__proto__":{}}')]) assert.throws(() => P.decode(payload, {}));
});
test('invalid skill range rejected without mutating input', () => {
  const input = { ...v1, skills: [{ ...v1.skills[0], level: 99 }] };
  const snapshot = JSON.stringify(input);
  assert.throws(() => P.decode(input, {}));
  assert.equal(JSON.stringify(input), snapshot);
});
test('routine parser preserves days, sets and repetition sequence', () => {
  const plan = A.parse('Día 1\nSentadilla 3 x 12-10-8\nDía 2\nRemo 4 x 10');
  assert.equal(plan.days.length, 2);
  assert.equal(plan.days[0].exercises[0].name, 'Sentadilla');
  assert.equal(plan.days[0].exercises[0].sets, 3);
  assert.equal(plan.days[0].exercises[0].reps, '12-10-8');
  assert.deepEqual([0, 1, 2].map(i => A.targetForSet(plan.days[0].exercises[0], i)), ['12', '10', '8']);
});
