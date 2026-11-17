const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const url = 'http://localhost:4200/dashboard';
  const out = (name) => `C:/Users/HP/Desktop/Finance Aduit Pro/review-screens/${name}`;

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out('dash_1280_dark.png') });

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out('dash_1280_light.png') });

  await context.close();
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mpage = await mctx.newPage();
  await mpage.goto(url, { waitUntil: 'networkidle' });
  await mpage.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await mpage.waitForTimeout(1500);
  await mpage.screenshot({ path: out('dash_390_dark.png') });

  await mpage.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await mpage.waitForTimeout(1500);
  await mpage.screenshot({ path: out('dash_390_light.png') });

  await browser.close();
  console.log('done');
})();
