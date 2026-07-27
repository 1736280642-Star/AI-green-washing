import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const route of ["/dashboard", "/companies/cy-materials?tab=evidence", "/reports", "/review"]) {
  test(`no serious accessibility violations: ${route}`, async ({ page }) => {
    if (route === "/dashboard") test.slow();
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}
