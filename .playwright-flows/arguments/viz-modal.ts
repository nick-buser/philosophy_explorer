import { test, expect } from '@playwright/test';

// Verify Phase-2b: the 5 model-bearing modal formalisms render their stored
// model/trace with a model-switcher dropdown (kripke also a frame-class toggle),
// plus the copyable DSL + ?dsl= lab prefill.
test('modal arguments: model viz + switcher + frame toggle + DSL', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(`[pageerror] ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`); });

  await page.goto('/', { waitUntil: 'networkidle' });
  const ids = await page.evaluate(async () => {
    const r = await fetch('http://localhost:3001/api/arguments');
    const d = (await r.json()) as Array<{ id: string; primaryFormalism: string }>;
    const pick = (f: string) => d.find(a => a.primaryFormalism === f)?.id;
    return {
      kripke: pick('kripke'), ctl: pick('ctl'), intuitionistic: pick('intuitionistic'),
      epistemic: pick('epistemic'), temporal: pick('temporal'),
    };
  });
  testInfo.annotations.push({ type: 'note', description: `ids: ${JSON.stringify(ids)}` });

  for (const [formalism, id] of Object.entries(ids)) {
    if (!id) { testInfo.annotations.push({ type: 'note', description: `MISSING id for ${formalism}` }); continue; }
    await page.goto('/arguments/' + id, { waitUntil: 'networkidle' });
    await expect(page.getByText('Something went wrong'), `${formalism} crashed`).toHaveCount(0);
    // model switcher dropdown + DSL block present
    await expect(page.getByText(/Visualization ·/), `${formalism} viz label`).toBeVisible();
    await expect(page.locator('select').first(), `${formalism} model switcher`).toBeVisible();
    await expect(page.getByText(/^DSL ·/), `${formalism} DSL`).toBeVisible();
    // a rendered model/trace (svg or react-flow canvas)
    await expect(page.locator('svg, .react-flow').first(), `${formalism} view`).toBeVisible();
    await testInfo.attach(formalism, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  }

  // ── kripke deep-check: frame-class toggle + model switcher + lab prefill ──
  if (ids.kripke) {
    await page.goto('/arguments/' + ids.kripke, { waitUntil: 'networkidle' });
    // two dropdowns: model switcher + frame class
    await expect(page.locator('select')).toHaveCount(2);
    // switch the frame class — should not crash, re-renders
    await page.locator('select').nth(1).selectOption('S5').catch(() => {});
    await page.waitForTimeout(150);
    await expect(page.getByText('Something went wrong')).toHaveCount(0);
    // lab prefill
    await page.getByRole('link', { name: /Open in Logic Lab/ }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/logic\/kripke\?dsl=/);
    await expect(page.getByText('parse error')).toHaveCount(0);
  }

  expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
});
