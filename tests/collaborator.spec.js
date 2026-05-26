const { chromium } = require('playwright');

const EMAIL = process.env.COLLABORATOR_EMAIL;
const PASSWORD = process.env.COLLABORATOR_PASSWORD;
const BASE = process.env.BASE_URL || 'https://YOUR_APP.vercel.app';

if (!EMAIL || !PASSWORD) {
  console.error('Set COLLABORATOR_EMAIL and COLLABORATOR_PASSWORD env vars.');
  process.exit(2);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });

    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/collaborator/dashboard', { timeout: 15000 });

    // Contacter la victime
    const contactBtn = page.locator('text=Contacter la victime').first();
    if (await contactBtn.count()) {
      await contactBtn.click();
      console.log('Contacter la victime: OK (clic effectué)');
    } else {
      console.log('Contacter la victime: non trouvé');
    }

    // Suivre dossier (toggle)
    const followBtn = page.locator('text=Suivre dossier').first();
    if (await followBtn.count()) {
      const [response] = await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/collaborator/follow') && (r.status() === 200 || r.status() === 201), { timeout: 8000 }).catch(() => null),
        followBtn.click()
      ]);
      console.log('Suivre dossier: clic effectué', response ? 'API OK' : 'Pas d\'appel API observé');
    } else {
      console.log('Suivre dossier: non trouvé');
    }

    // Export PDF
    const exportPdf = page.locator('text=Exporter PDF').first();
    if (await exportPdf.count()) {
      await exportPdf.click();
      console.log('Exporter PDF: clic effectué');
    } else {
      console.log('Exporter PDF: non trouvé');
    }

    // Export Excel
    const exportXlsx = page.locator('text=Exporter Excel').first();
    if (await exportXlsx.count()) {
      await exportXlsx.click();
      console.log('Exporter Excel: clic effectué');
    } else {
      console.log('Exporter Excel: non trouvé');
    }

    console.log('Vérifications basiques terminées.');
  } catch (err) {
    console.error('Erreur lors du test:', err.message || err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
