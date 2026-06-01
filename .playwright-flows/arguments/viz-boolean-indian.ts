import { test, expect } from '@playwright/test';

// Verify the Phase-2a self-contained renderers: boolean (Karnaugh map + status)
// and indian (five-membered inference), each with a copyable DSL block.
test('boolean + indian arguments render their visualization + DSL', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(`[pageerror] ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`); });

  await page.goto('/', { waitUntil: 'networkidle' });
  const ids = await page.evaluate(async () => {
    const r = await fetch('http://localhost:3001/api/arguments');
    const d = (await r.json()) as Array<{ id: string; primaryFormalism: string }>;
    const pick = (f: string) => d.find(a => a.primaryFormalism === f)?.id;
    return { boolean: pick('boolean'), indian: pick('indian') };
  });
  testInfo.annotations.push({ type: 'note', description: `ids: ${JSON.stringify(ids)}` });

  // ── boolean: Karnaugh map + DSL, no raw-AST JSON dump ──
  await page.goto('/arguments/' + ids.boolean, { waitUntil: 'networkidle' });
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
  await expect(page.getByText('Visualization · Karnaugh map')).toBeVisible();
  await expect(page.locator('svg, table').first()).toBeVisible();
  await expect(page.getByText(/^DSL ·/)).toBeVisible();
  // the old generic "· AST" raw-JSON view must be gone for boolean
  await expect(page.getByText(/· AST$/)).toHaveCount(0);
  await testInfo.attach('boolean', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });

  // lab prefill round-trips (boolean lab parses the DSL we passed)
  await page.getByRole('link', { name: /Open in Logic Lab/ }).first().click();
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/\/logic\/boolean\?dsl=/);

  // ── indian: five-step inference + DSL ──
  await page.goto('/arguments/' + ids.indian, { waitUntil: 'networkidle' });
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
  await expect(page.getByText('Visualization · five-membered inference')).toBeVisible();
  await expect(page.getByText(/^DSL ·/)).toBeVisible();
  await testInfo.attach('indian', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });

  expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
});
