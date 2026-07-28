import { afterEach, describe, expect, it, vi } from "vitest";
import { demoRepository } from "./demo-repository";

describe("demoRepository", () => {
  afterEach(() => vi.useRealTimers());

  it("returns stable synthetic company data through the repository contract", async () => {
    const items = await demoRepository.listCompanies();
    expect(items).toHaveLength(30);
    expect(items[0]).toMatchObject({ companyId: "cy-materials", reportYear: 2025, finalIndex: 0.78, riskBand: "high" });
    expect(items[0].metrics.map((metric) => metric.code)).toEqual(["EASS", "IR", "UPR", "ESGSI", "EAA_ESGSI", "IMBALANCE"]);
  });

  it("supports empty and error acceptance scenarios", async () => {
    await expect(demoRepository.listCompanies("empty")).resolves.toEqual([]);
    await expect(demoRepository.listCompanies("error")).rejects.toThrow("演示数据载入失败");
  });

  it("keeps evidence scoped to the requested synthetic company", async () => {
    const items = await demoRepository.listEvidence("cy-materials");
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items.every((item) => item.companyId === "cy-materials")).toBe(true);
  });

  it("scopes company and evidence lookups to the requested report year", async () => {
    await expect(demoRepository.getCompany("cy-materials", "success", 2025)).resolves.toMatchObject({ reportYear: 2025 });
    await expect(demoRepository.getCompany("cy-materials", "success", 2024)).resolves.toBeNull();
    await expect(demoRepository.listEvidence("cy-materials", "success", 2024)).resolves.toEqual([]);
  });

  it("resolves every metric evidence reference for every synthetic company", async () => {
    const companies = await demoRepository.listCompanies();
    const evidenceByCompany = await Promise.all(companies.map((company) => demoRepository.listEvidence(company.companyId)));
    companies.forEach((company, index) => {
      const available = new Set(evidenceByCompany[index].map((item) => item.id));
      const referenced = company.metrics.flatMap((metric) => metric.evidenceIds);
      expect(referenced.length).toBeGreaterThan(0);
      expect(referenced.every((id) => available.has(id))).toBe(true);
    });
  });

  it("returns stable dashboard operations and governance insights", async () => {
    const insights = await demoRepository.getDashboardInsights();
    expect(insights.reviewTasks).toHaveLength(8);
    expect(insights.reviewTasks[0]).toMatchObject({ id: "rv-1048", companyId: "cy-materials" });
    expect(insights.reviewTrend.at(-1)).toMatchObject({ date: "07-27", pending: 28 });
    expect(insights.modelAgreement).toHaveLength(6);
    expect(insights.sourceFreshness.some((source) => source.status === "stale")).toBe(true);
    const evidenceIds = new Map((await Promise.all((await demoRepository.listCompanies()).map(async (company) => [company.companyId, new Set((await demoRepository.listEvidence(company.companyId)).map((item) => item.id))] as const))));
    expect(insights.reviewTasks.every((task) => evidenceIds.get(task.companyId)?.has(task.evidenceId))).toBe(true);
  });

  it("advances analysis jobs through the repository and returns recoverable extraction errors", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-28T08:00:00.000Z"));
    const normal = await demoRepository.createAnalysisJob({ companyId: "cy-materials", reportYear: 2025, fileName: "demo.pdf", fileSize: 1_024 });
    expect(await demoRepository.getAnalysisJob(normal.jobId)).toMatchObject({ status: "queued", phase: "collect" });
    vi.advanceTimersByTime(2_100);
    expect(await demoRepository.getAnalysisJob(normal.jobId)).toMatchObject({ status: "running", phase: "classify", progress: 63 });
    vi.advanceTimersByTime(1_500);
    expect(await demoRepository.getAnalysisJob(normal.jobId)).toMatchObject({ status: "completed", progress: 100 });

    const scan = await demoRepository.createAnalysisJob({ companyId: "cy-materials", reportYear: 2025, fileName: "scan-demo.pdf", fileSize: 1_024 });
    vi.advanceTimersByTime(1_500);
    expect(await demoRepository.getAnalysisJob(scan.jobId)).toMatchObject({ status: "failed", phase: "extract", error: { nextAction: "启用 OCR 后重新提交任务。" } });
  });
});
