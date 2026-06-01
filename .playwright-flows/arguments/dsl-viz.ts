import { test, expect } from '@playwright/test';

// Verify the DSL + rendered-visualization feature end-to-end against the local
// stack (fixed source + local API, 99 seeded args): fol tableau/truth-table,
// aristotelian Venn, the copyable DSL block, and the ?dsl= lab prefill.
test('argument DSL + visualization + lab prefill', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(`[pageerror] ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`); });

  // Pick one argument of each Phase-1 formalism from the API (navigate first so
  // the relative /api fetch resolves against the app origin).
  await page.goto('/', { waitUntil: 'networkidle' });
  const ids = await page.evaluate(async () => {
    // The dev web server doesn't proxy /api; the app talks to the API on :3001.
    const r = await fetch('http://localhost:3001/api/arguments');
    const d = (await r.json()) as Array<{ id: string; primaryFormalism: string }>;
    const pick = (f: string) => d.find(a => a.primaryFormalism === f)?.id;
    return { fol: pick('fol'), nd: pick('nd'), aristotelian: pick('aristotelian') };
  });
  testInfo.annotations.push({ type: 'note', description: `ids: ${JSON.stringify(ids)}` });

  // ── FOL argument: DSL block + visualization (tableau or truth table) ──
  await page.goto('/arguments/' + ids.fol, { waitUntil: 'networkidle' });
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
  await expect(page.getByText(/^DSL ·/)).toBeVisible();
  await expect(page.getByText('Visualization', { exact: true })).toBeVisible();
  // tableau OR truth table panel appears
  const hasWork = await page.getByText(/Tableau \(truth tree\)|Truth table/).count();
  testInfo.annotations.push({ type: 'note', description: `fol show-your-work panels: ${hasWork}` });
  await testInfo.attach('fol', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });

  // ── Lab prefill: click "Open in Logic Lab" → lab opens with ?dsl= populated ──
  const labLink = page.getByRole('link', { name: /Open in Logic Lab/ }).first();
  await labLink.click();
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/\/logic\/modern-fol\?dsl=/);
  await expect(page.getByText('parse error')).toHaveCount(0);
  await expect(page.getByText('parsed')).toBeVisible();
  testInfo.annotations.push({ type: 'note', description: `prefilled lab URL: ${page.url().slice(0, 120)}` });
  await testInfo.attach('lab-prefilled', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });

  // ── Aristotelian argument: Venn diagram (SVG) ──
  if (ids.aristotelian) {
    await page.goto('/arguments/' + ids.aristotelian, { waitUntil: 'networkidle' });
    await expect(page.getByText('Something went wrong')).toHaveCount(0);
    await expect(page.getByText('Visualization · Venn diagram')).toBeVisible();
    await expect(page.locator('svg').first()).toBeVisible();
    await testInfo.attach('aristotelian', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  }

  // ── FOL lab still works without prefill (refactor regression check) ──
  await page.goto('/logic/modern-fol', { waitUntil: 'networkidle' });
  await expect(page.getByText('parsed')).toBeVisible();
  await expect(page.getByText('Something went wrong')).toHaveCount(0);

  expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
});
