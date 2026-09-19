const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  await page.goto('http://localhost:3001');
  
  // upload file
  const reportPath = path.resolve(__dirname, '../reports/sample_report.json');
  const input = await page.$('input[type="file"]');
  await input.setInputFiles(reportPath);
  
  // click analyze
  await page.click('button:has-text("Analyse Report")');
  
  // wait for it to load
  await page.waitForSelector('text=ATTACK SIMULATION', { timeout: 30000 });
  
  // click expand
  await page.click('text=ATTACK SIMULATION');
  
  // start simulation
  await page.click('button:has-text("START ATTACK SIMULATION")');
  
  // wait for completion
  console.log('Simulation started, waiting for completion...');
  await page.waitForTimeout(15000);
  
  await browser.close();
})();
