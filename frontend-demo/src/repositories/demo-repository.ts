import { companies, evidence } from "@/mocks/fixtures/companies";
import { dashboardInsights } from "@/mocks/fixtures/dashboard";
import { analysisJobSchema, companyYearListSchema, dashboardInsightsSchema, evidenceItemSchema, reviewRecordSchema } from "@/contracts/analysis";
import type { AnalysisRepository, CompanyYearQuery, DemoScenario } from "@/repositories/analysis-repository";
import type { AnalysisJob, ReviewRecord } from "@/types";

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
      && (!query.riskBand || company.riskBand === query.riskBand),
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
