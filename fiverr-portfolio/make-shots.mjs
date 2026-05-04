import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
await page.goto('file:///Users/rylandsmacmini/.openclaw/workspace/fiverr-portfolio/index.html');
await page.screenshot({ path: 'portfolio-full.png', fullPage: true });
await page.screenshot({ path: 'portfolio-hero.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });
await page.screenshot({ path: 'portfolio-projects.png', clip: { x: 0, y: 760, width: 1440, height: 980 } });
await browser.close();
