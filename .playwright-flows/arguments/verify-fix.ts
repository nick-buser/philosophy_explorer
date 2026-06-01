import { test, expect } from '@playwright/test';

// Verify the /arguments routing fix end-to-end in a real browser against the
// local stack (fixed source + local API with 99 seeded arguments).
test('arguments page works: list → detail, no crash', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(`[pageerror] ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`); });

  // ── List ──
  await page.goto('/arguments', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { level: 1, name: 'Arguments' })).toBeVisible();
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
  // The "N of 99" counter only renders once cards are present.
  await expect(page.getByText(/of 99/)).toBeVisible();
  const cards = page.locator('a[href^="/arguments/"]:not([href="/arguments/new"])');
  testInfo.annotations.push({ type: 'note', description: `argument cards on list: ${await cards.count()}` });
  await testInfo.attach('list-fixed', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });

  // ── Click the first real card → detail ──
  await cards.first().click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('← All arguments')).toBeVisible();
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
  await testInfo.attach('detail-fixed', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });

  // ── New-argument editor still resolves ──
  await page.goto('/arguments/new', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'New argument' })).toBeVisible();

  expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
});
