// A zero shell exit or a skipped test is never sufficient QA evidence.
const fs = require('node:fs');
const path = process.argv[2] || '.local/qa/results.json';
const report = JSON.parse(fs.readFileSync(path, 'utf8'));
const s = report.stats;
let approved = s.expected > 0 && s.unexpected === 0 && s.skipped === 0 && s.flaky === 0 && !report.errors.length;
const cases = [];
function walk(suite) {
  for (const spec of suite.specs || []) for (const t of spec.tests) {
    const errors = (t.results || []).flatMap(r => r.errors || []);
    const blocked = /browserType\.launch|Executable doesn't exist|SUID sandbox|Download failed/.test(errors.map(e => e.message || '').join('\n'));
    cases.push({ title: spec.title, project: t.projectName, classification: blocked ? 'BLOCKED_INFRASTRUCTURE' : t.status === 'expected' ? 'PASSED' : t.status === 'skipped' ? 'NOT_EXECUTED' : t.status === 'flaky' ? 'UNSTABLE' : 'FAILED_REQUIRES_TRIAGE', errors });
  }
  for (const child of suite.suites || []) walk(child);
}
for (const suite of report.suites) walk(suite);
approved = approved && cases.length > 0 && cases.every(c => c.classification === 'PASSED');
const verdict = { approved, stats: s, cases, errors: report.errors };
fs.writeFileSync(path.replace(/\.json$/, '.verdict.json'), JSON.stringify(verdict, null, 2));
console.log(JSON.stringify({ approved, stats: s, classifications: cases.map(c => c.classification) }, null, 2));
process.exitCode = approved ? 0 : 1;
