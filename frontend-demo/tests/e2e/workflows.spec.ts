import { expect, test, type Page } from "@playwright/test";

function monitorConsole(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  return errors;
}

async function expectCanvasPainted(canvas: ReturnType<Page["locator"]>) {
  await expect(canvas).toBeVisible();
  const paintedPixels = await canvas.evaluate((node) => {
    const element = node as HTMLCanvasElement;
    const context = element.getContext("2d");
    if (!context) return 0;
    const pixels = context.getImageData(0, 0, element.width, element.height).data;
    let count = 0;
    for (let index = 3; index < pixels.length; index += 4) if (pixels[index] > 0) count += 1;
    return count;
  });
  expect(paintedPixels).toBeGreaterThan(20);
}

test("workflow A: dashboard to cited evidence and review", async ({ page }) => {
  const errors = monitorConsole(page);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "风险总览", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "样本遥测" })).toBeVisible();
  await page.getByRole("button", { name: /高风险/ }).click();
  await expect(page.locator(".context-bar select").nth(2)).toHaveValue("高风险");
  await page.getByRole("button", { name: "清除筛选" }).click();
  await page.locator(".chart-canvas").focus();
  await page.keyboard.press("ArrowRight");
  await page.locator(".selected-summary").click();
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

test("dashboard risk insights drive the Top 5 review flow", async ({ page }) => {
  const errors = monitorConsole(page);
  await page.goto("/dashboard");
  await page.getByRole("heading", { name: "指标聚集与行业差异" }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: "指标命中频次" })).toBeVisible();
  const planningTab = page.getByRole("tab", { name: "计划要素" });
  await planningTab.click();
  await expect(planningTab).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".diagnostic-chart canvas")).toBeVisible();
  await page.getByRole("button", { name: "筛选UPR" }).click();
  await expect(page.getByText("已聚焦：未验证计划比例")).toBeVisible();
  await page.getByRole("heading", { name: "优先复核与队列吞吐" }).scrollIntoViewIfNeeded();
  await page.locator(".priority-task-summary").first().click();
  await expect(page.getByRole("button", { name: "开始复核" })).toBeVisible();
  await page.getByRole("button", { name: "开始复核" }).click();
  await expect(page.getByRole("dialog", { name: "发起复核" })).toBeVisible();
  await page.getByRole("button", { name: "取消" }).click();
  await page.getByRole("heading", { name: "复核一致性与来源新鲜度" }).scrollIntoViewIfNeeded();
  const canvases = page.locator("canvas");
  await expect.poll(() => canvases.count()).toBeGreaterThanOrEqual(8);
  for (const canvas of await canvases.all()) {
    await expectCanvasPainted(canvas);
  }
  await page.getByRole("button", { name: /查看全部任务/ }).click();
  await expect(page).toHaveURL(/\/review\?factor=UPR/);
  await expect(page.getByRole("button", { name: /^全部/ })).toHaveClass(/active/);
  await expect(page.locator(".review-queue .status-chip")).toHaveText(["UPR", "UPR"]);
  expect(errors).toEqual([]);
});

test("workflow B: report scan completes and opens analysis", async ({ page }) => {
  await page.goto("/reports");
  await page.getByLabel("虚构公司").selectOption("linhai-energy");
  await page.locator('input[type="file"]').setInputFiles({ name: "greenlens-demo.pdf", mimeType: "application/pdf", buffer: Buffer.from("synthetic") });
  await page.getByRole("button", { name: "开始检测" }).click();
  await expect(page.getByRole("heading", { name: "合成分析已生成" })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("34% / 67%", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /打开完整分析/ }).click();
  await expect(page.getByRole("heading", { name: "林海能源" })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "报告检测未完成" })).toBeVisible();
  await page.getByRole("button", { name: "重新提交演示任务" }).click();
  await expect(page.getByRole("heading", { name: "合成分析已生成" })).toBeVisible({ timeout: 10_000 });
});

test("compare view and review undo remain interactive", async ({ page }) => {
  await page.goto("/compare");
  await expect(page.getByText("核心指标 Dumbbell 对比")).toBeVisible();
  await page.getByRole("tab", { name: "行动构成" }).click();
  await expect(page.getByText("环境行动分类构成")).toBeVisible();
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

test("report-year filters query the repository and recover from empty results", async ({ page }) => {
  await page.goto("/dashboard");
  const reportYear = page.getByLabel("报告年");
  await expect(reportYear).toBeEnabled();
  await expect(reportYear).toHaveValue("2025");
  await reportYear.selectOption("2024");
  await expect(page.getByRole("heading", { name: "当前筛选下没有样本" })).toBeVisible();
  await page.getByRole("button", { name: "恢复默认视图" }).click();
  await expect(page.getByRole("heading", { name: "样本遥测" })).toBeVisible();

  await page.goto("/companies");
  await page.getByLabel("报告年").selectOption("2024");
  await expect(page.getByRole("heading", { name: "当前筛选下没有公司记录" })).toBeVisible();
  await page.getByRole("button", { name: "恢复默认视图" }).click();
  await expect(page.getByText("共 30 家 · 每页 10 条")).toBeVisible();
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
    await expect(page.getByRole("heading", { name: "样本遥测" })).toBeVisible();
    for (const band of await page.locator(".dashboard-band").all()) {
      await band.scrollIntoViewIfNeeded();
      await page.waitForTimeout(120);
    }
    const canvases = page.locator("canvas:visible");
    await expect.poll(() => canvases.count()).toBeGreaterThanOrEqual(viewport.width < 768 ? 6 : 8);
    for (const canvas of await canvases.all()) {
      await expectCanvasPainted(canvas);
    }
    await page.evaluate(() => document.documentElement.classList.add("e2e-full-render"));
    await page.evaluate(() => window.scrollTo(0, 0));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `screenshots/${viewport.name}.png`, fullPage: true });
  });
}
