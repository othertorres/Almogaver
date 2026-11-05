const base = require('../playwright.config');
module.exports = {
  ...base,
  testDir: __dirname,
  testMatch: 'save-race.spec.js',
  projects: [base.projects.find(p => p.name === 'chromium')],
  outputDir: '../.local/chromium-investigation/results',
  reporter: [['list'], ['html', { outputFolder: '.local/chromium-investigation/report', open: 'never' }],
    ['json', { outputFile: '.local/chromium-investigation/results.json' }]],
};
