import { companies, companyHistory, environmentalAspects, evidence, financialRecords, panelYearSummaries, violationEvents } from "@/mocks/fixtures/companies";
import { dashboardInsights } from "@/mocks/fixtures/dashboard";
import {
  analysisJobSchema,
  companyMetricHistoryPointSchema,
  companyYearListSchema,
  dashboardCommandCenterSchema,
  dashboardInsightsSchema,
  environmentalAspectScoreSchema,
  evidenceItemSchema,
  financialYearRecordSchema,
  panelYearSummarySchema,
  reviewRecordSchema,
  violationEventSchema,
} from "@/contracts/analysis";
import { buildDashboardCommandCenter } from "@/repositories/dashboard-command-center";
import type { AnalysisRepository, CompanyYearQuery, DemoScenario } from "@/repositories/analysis-repository";
import type { AnalysisJob, MetricCode, ReviewRecord } from "@/types";

export type { DemoScenario } from "@/repositories/analysis-repository";

async function wait(scenario: DemoScenario) {
  await new Promise((resolve) => setTimeout(resolve, scenario === "slow" ? 900 : 180));
  if (scenario === "error") throw new Error("演示数据载入失败");
}

interface StoredAnalysisJob {
  job: AnalysisJob;
  createdAt: number;
  fileName: string;
}

const jobs = new Map<string, StoredAnalysisJob>();
const validatedCompanies = companyYearListSchema.parse(companies);
const validatedEvidence = evidenceItemSchema.array().parse(evidence);
const validatedAspects = environmentalAspectScoreSchema.array().parse(environmentalAspects);
const validatedHistory = companyMetricHistoryPointSchema.array().parse(companyHistory);
const validatedFinancials = financialYearRecordSchema.array().parse(financialRecords);
const validatedPanelYearSummaries = panelYearSummarySchema.array().parse(panelYearSummaries);
const validatedViolationEvents = violationEventSchema.array().parse(violationEvents);
const validatedDashboardInsights = dashboardInsightsSchema.parse(dashboardInsights);

function advanceJob(stored: StoredAnalysisJob): AnalysisJob {
  const elapsed = Date.now() - stored.createdAt;
  const lowerName = stored.fileName.toLowerCase();

  if (elapsed >= 1_400 && (lowerName.includes("broken") || lowerName.includes("scan"))) {
    return {
      ...stored.job,
      status: "failed",
      phase: "extract",
      progress: 42,
      error: lowerName.includes("scan")
        ? { cause: "报告没有可解析文本层，可能是扫描件。", impact: "声明与行动证据尚未抽取，不能计算风险指标。", nextAction: "启用 OCR 后重新提交任务。" }
        : { cause: "报告文本层损坏或编码不可解析。", impact: "声明与行动证据尚未抽取，不能计算风险指标。", nextAction: "更换文本版 PDF，或启用 OCR 后重新提交任务。" },
    };
  }

  if (elapsed < 500) return { ...stored.job, status: "queued", phase: "collect", progress: 4 };
  if (elapsed < 1_000) return { ...stored.job, status: "running", phase: "collect", progress: 12 };
  if (elapsed < 1_500) return { ...stored.job, status: "running", phase: "preprocess", progress: 28 };
  if (elapsed < 2_000) return { ...stored.job, status: "running", phase: "extract", progress: 45 };
  if (elapsed < 2_500) return { ...stored.job, status: "running", phase: "classify", progress: 63 };
  if (elapsed < 3_000) return { ...stored.job, status: "running", phase: "calculate", progress: 81 };
  if (elapsed < 3_500) return { ...stored.job, status: "running", phase: "risk", progress: 94 };
  return { ...stored.job, status: "completed", phase: "risk", progress: 100 };
}

export const demoRepository: AnalysisRepository = {
  async listCompanies(scenario: DemoScenario = "success", query: CompanyYearQuery = {}) {
    await wait(scenario);
    if (scenario === "empty") return [];
    return structuredClone(validatedCompanies.filter((company) =>
      (!query.year || company.reportYear === query.year)
      && (!query.industry || query.industry === "全部行业" || company.industry === query.industry)
      && (!query.riskBand || company.riskBand === query.riskBand)
      && (!query.sampleGroup || company.panelMetadata.sampleGroup === query.sampleGroup),
    ));
  },
  async getCompany(id: string, scenario: DemoScenario = "success", reportYear?: number) {
    await wait(scenario);
    return structuredClone(validatedCompanies.find((company) => company.companyId === id && (!reportYear || company.reportYear === reportYear)) ?? null);
  },
  async listEvidence(companyId: string, scenario: DemoScenario = "success", reportYear?: number) {
    await wait(scenario);
    return scenario === "empty" ? [] : structuredClone(validatedEvidence.filter((item) => item.companyId === companyId && (!reportYear || item.reportYear === reportYear)));
  },
  async listEnvironmentalAspects(companyId: string, reportYear: number) {
    return structuredClone(validatedAspects.filter((item) => item.companyId === companyId && item.reportYear === reportYear));
  },
  async getCompanyHistory(companyId: string, options: { fromYear?: number; toYear?: number; metrics?: MetricCode[] } = {}) {
    return structuredClone(validatedHistory
      .filter((item) => item.companyId === companyId && (!options.fromYear || item.reportYear >= options.fromYear) && (!options.toYear || item.reportYear <= options.toYear))
      .map((item) => options.metrics?.length
        ? { ...item, metrics: Object.fromEntries(Object.entries(item.metrics).filter(([code]) => options.metrics!.includes(code as MetricCode))) }
        : item));
  },
  async getFinancialYear(companyId: string, reportYear: number) {
    return structuredClone(validatedFinancials.find((item) => item.companyId === companyId && item.reportYear === reportYear) ?? null);
  },
  async listViolationEvents(companyId: string, options: { reportYear?: number; fromYear?: number; toYear?: number } = {}) {
    return structuredClone(validatedViolationEvents.filter((item) => {
      if (item.companyId !== companyId) return false;
      if (options.reportYear != null && !item.violationYears.includes(options.reportYear)) return false;
      if (options.fromYear != null && item.violationYears.every((year) => year < options.fromYear!)) return false;
      if (options.toYear != null && item.violationYears.every((year) => year > options.toYear!)) return false;
      return true;
    }));
  },
  async listPanelYearSummaries(options: { fromYear?: number; toYear?: number } = {}) {
    return structuredClone(validatedPanelYearSummaries.filter((item) =>
      (!options.fromYear || item.year >= options.fromYear) && (!options.toYear || item.year <= options.toYear),
    ));
  },
  async getDashboardCommandCenter(scenario: DemoScenario = "success", query: CompanyYearQuery = {}) {
    await wait(scenario);
    const payload = buildDashboardCommandCenter(
      scenario === "empty" ? [] : validatedCompanies,
      scenario === "empty" ? [] : validatedHistory,
      scenario === "empty" ? [] : validatedPanelYearSummaries,
      query,
    );
    return structuredClone(dashboardCommandCenterSchema.parse(payload));
  },
  async getDashboardInsights(scenario: DemoScenario = "success") {
    await wait(scenario);
    return structuredClone(scenario === "empty" ? { reviewTasks: [], reviewTrend: [], modelAgreement: [], sourceFreshness: [], evidenceCoverage: [] } : validatedDashboardInsights);
  },
  async createAnalysisJob(input) {
    const job: AnalysisJob = { jobId: crypto.randomUUID(), reportId: `report-${Date.now()}`, status: "queued", phase: "collect", progress: 0, resultCompanyId: input.companyId };
    jobs.set(job.jobId, { job, createdAt: Date.now(), fileName: input.fileName });
    return structuredClone(analysisJobSchema.parse(job));
  },
  async getAnalysisJob(jobId) {
    const stored = jobs.get(jobId);
    if (!stored) throw new Error("未找到检测任务。请重新提交报告。");
    const job = advanceJob(stored);
    stored.job = job;
    return structuredClone(analysisJobSchema.parse(job));
  },
  async saveReview(review: ReviewRecord) { return structuredClone(reviewRecordSchema.parse(review)); },
};
