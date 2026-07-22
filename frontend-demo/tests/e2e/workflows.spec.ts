import { expect, test, type Page } from "@playwright/test";

function monitorConsole(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  return errors;
}

test("workflow A: dashboard to cited evidence and review", async ({ page }) => {
  const errors = monitorConsole(page);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "风险总览", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "样本遥测" })).toBeVisible();
  const canvases = page.locator("canvas");
  await expect(canvases).toHaveCount(3);
  for (const canvas of await canvases.all()) {
    await expect(canvas).toBeVisible();
    expect(await canvas.evaluate((node) => (node as HTMLCanvasElement).toDataURL().length)).toBeGreaterThan(1000);
  }
  await page.getByRole("button", { name: /高风险/ }).click();
  await expect(page.locator(".context-bar select").nth(2)).toHaveValue("高风险");
  await page.getByRole("button", { name: "清除筛选" }).click();
  await page.getByRole("button", { name: /打开分析/ }).first().click();
  await expect(page.getByRole("heading", { name: "澄岳新材" })).toBeVisible();
  await page.getByRole("button", { name: /主要原因/ }).click();
  await expect(page.getByText("低碳材料与供应链协同")).toBeVisible();
  await page.getByRole("button", { name: /询问 AI/ }).click();
  await expect(page.getByRole("dialog", { name: "AI 证据助手" })).toBeVisible();
  await page.getByRole("button", { name: "发起复核" }).last().click();
  await page.getByRole("radio", { name: /证据不足/ }).check();
  await page.getByRole("button", { name: "保存复核" }).click();
  await expect(page.getByText("已保存复核结果", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("workflow B: report scan completes and opens analysis", async ({ page }) => {
  await page.goto("/reports");
  await page.locator('input[type="file"]').setInputFiles({ name: "greenlens-demo.pdf", mimeType: "application/pdf", buffer: Buffer.from("synthetic") });
  await page.getByRole("button", { name: "开始检测" }).click();
  await expect(page.getByRole("heading", { name: "合成分析已生成" })).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: /打开完整分析/ }).click();
  await expect(page.getByRole("heading", { name: "澄岳新材" })).toBeVisible();
});

test("report scan supports OCR recovery and explicit extraction failure", async ({ page }) => {
  await page.goto("/reports");
  const input = page.locator('input[type="file"]');
  await input.setInputFiles({ name: "scan-demo.pdf", mimeType: "application/pdf", buffer: Buffer.from("synthetic scan") });
  await page.getByRole("button", { name: "开始检测" }).click();
  await expect(page.getByRole("heading", { name: "建议启用 OCR" })).toBeVisible();
  await page.getByRole("button", { name: "启用演示 OCR" }).click();
  await expect(page.getByRole("heading", { name: "合成分析已生成" })).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: /新建检测/ }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "broken-demo.pdf", mimeType: "application/pdf", buffer: Buffer.from("broken synthetic") });
  await page.getByRole("button", { name: "开始检测" }).click();
  await expect(page.getByRole("heading", { name: "未检测到可解析文本层" })).toBeVisible();
  await page.getByRole("button", { name: "启用演示 OCR" }).click();
  await expect(page.getByRole("heading", { name: "合成分析已生成" })).toBeVisible({ timeout: 10_000 });
});

test("compare view and review undo remain interactive", async ({ page }) => {
  await page.goto("/compare");
  await expect(page.getByText("风险维度热力表")).toBeVisible();
  await page.getByRole("tab", { name: "评级分歧" }).click();
  await expect(page.getByText("多源评级分歧")).toBeVisible();
  await page.goto("/review");
  await page.getByRole("button", { name: /保存并下一条/ }).click();
  await expect(page.getByText("已保存最近一条复核结果")).toBeVisible();
  await page.getByRole("button", { name: "撤销" }).last().click();
  await expect(page.getByText("已撤销复核结果", { exact: true })).toBeVisible();
});

test("company library paginates 30 records and applies column settings", async ({ page }) => {
  await page.goto("/companies");
  await expect(page.getByText("共 30 家 · 每页 10 条")).toBeVisible();
  await expect(page.getByText("第 1 / 3 页")).toBeVisible();
  await page.getByRole("button", { name: "下一页" }).click();
  await expect(page.getByText("第 2 / 3 页")).toBeVisible();
  await page.getByRole("button", { name: "列设置" }).click();
  await page.getByRole("checkbox", { name: "行业" }).uncheck();
  await expect(page.getByRole("columnheader", { name: "行业" })).toHaveCount(0);
});

for (const viewport of [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1280", width: 1280, height: 800 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "mobile-390", width: 390, height: 844 },
]) {
  test(`visual smoke: ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "风险总览", level: 2 })).toBeVisible();
    await expect(page.locator("canvas").first()).toBeVisible();
    await page.waitForFunction(() => {
      const canvas = document.querySelector("canvas");
      return canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.toDataURL().length > 1000;
    });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `screenshots/${viewport.name}.png`, fullPage: true });
  });
}
