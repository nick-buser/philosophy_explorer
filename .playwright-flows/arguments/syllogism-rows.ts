import { test, expect } from '@playwright/test';

// Regression: an aristotelian syllogism must show three DISTINCT clause rows
// (major / minor / conclusion), not the conclusion repeated three times.
test('aristotelian syllogism rows are distinct', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.goto('/', { waitUntil: 'networkidle' });
  const id = await page.evaluate(async () => {
    const r = await fetch('http://localhost:3001/api/arguments');
    const d = (await r.json()) as Array<{ id: string; primaryFormalism: string }>;
    return d.find(a => a.primaryFormalism === 'aristotelian')?.id;
  });
  testInfo.annotations.push({ type: 'note', description: `aristotelian id: ${id}` });

  await page.goto('/arguments/' + id, { waitUntil: 'networkidle' });
  // The major and minor premises must now appear (pre-fix they were both the conclusion).
  await expect(page.getByText('All man are animal').first()).toBeVisible();
  await expect(page.getByText('All individual man are man').first()).toBeVisible();
  await expect(page.getByText('All individual man are animal').first()).toBeVisible();

  await testInfo.attach('syllogism-fixed', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  expect(errors).toEqual([]);
});
