import {
  analysisJobSchema,
  companyMetricHistoryPointSchema,
  companyYearListSchema,
  companyYearRecordSchema,
  dashboardCommandCenterSchema,
  dashboardInsightsSchema,
  environmentalAspectScoreSchema,
  evidenceItemSchema,
  financialYearRecordSchema,
  panelYearSummarySchema,
  reviewRecordSchema,
  violationEventSchema,
} from "@/contracts/analysis";
import type { AnalysisRepository, CompanyYearQuery, DemoScenario } from "@/repositories/analysis-repository";
import type { MetricCode, ReviewRecord } from "@/types";

export class HttpAnalysisRepository implements AnalysisRepository {
  constructor(private readonly baseUrl = "/api/v1", private readonly request: typeof fetch = fetch) {}

  private async json(path: string, init?: RequestInit) {
    const response = await this.request(`${this.baseUrl}${path}`, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
    if (!response.ok) throw new Error(`后端请求失败（${response.status}）。请检查接口状态后重试。`);
    return response.json();
  }

  async listCompanies(scenario: DemoScenario = "success", query: CompanyYearQuery = {}) {
    void scenario;
    const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value != null).map(([key, value]) => [key, String(value)]));
    return companyYearListSchema.parse(await this.json(`/company-years?${params}`));
  }

  async getCompany(id: string, scenario: DemoScenario = "success", reportYear?: number) {
    void scenario;
    const params = reportYear == null ? "" : `?reportYear=${encodeURIComponent(String(reportYear))}`;
    const payload = await this.json(`/company-years/${encodeURIComponent(id)}${params}`);
    return payload == null ? null : companyYearRecordSchema.parse(payload);
  }

  async listEvidence(companyId: string, scenario: DemoScenario = "success", reportYear?: number) { void scenario; const params = reportYear == null ? "" : `?reportYear=${encodeURIComponent(String(reportYear))}`; return evidenceItemSchema.array().parse(await this.json(`/company-years/${encodeURIComponent(companyId)}/evidence${params}`)); }
  async listEnvironmentalAspects(companyId: string, reportYear: number) {
    return environmentalAspectScoreSchema.array().parse(await this.json(`/company-years/${encodeURIComponent(companyId)}/environmental-aspects?reportYear=${encodeURIComponent(String(reportYear))}`));
  }

  async getCompanyHistory(companyId: string, options: { fromYear?: number; toYear?: number; metrics?: MetricCode[] } = {}) {
    const params = new URLSearchParams();
    if (options.fromYear != null) params.set("fromYear", String(options.fromYear));
    if (options.toYear != null) params.set("toYear", String(options.toYear));
    if (options.metrics?.length) params.set("metrics", options.metrics.join(","));
    return companyMetricHistoryPointSchema.array().parse(await this.json(`/companies/${encodeURIComponent(companyId)}/history?${params}`));
  }

  async getFinancialYear(companyId: string, reportYear: number) {
    const payload = await this.json(`/companies/${encodeURIComponent(companyId)}/financials/${encodeURIComponent(String(reportYear))}`);
    return payload == null ? null : financialYearRecordSchema.parse(payload);
  }

  async listViolationEvents(companyId: string, options: { reportYear?: number; fromYear?: number; toYear?: number } = {}) {
    const params = new URLSearchParams(Object.entries(options).filter(([, value]) => value != null).map(([key, value]) => [key, String(value)]));
    return violationEventSchema.array().parse(await this.json(`/companies/${encodeURIComponent(companyId)}/violation-events?${params}`));
  }

  async listPanelYearSummaries(options: { fromYear?: number; toYear?: number } = {}) {
    const params = new URLSearchParams(Object.entries(options).filter(([, value]) => value != null).map(([key, value]) => [key, String(value)]));
    return panelYearSummarySchema.array().parse(await this.json(`/panel/year-summaries?${params}`));
  }

  async getDashboardCommandCenter(scenario: DemoScenario = "success", query: CompanyYearQuery = {}) {
    void scenario;
    const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value != null).map(([key, value]) => [key, String(value)]));
    return dashboardCommandCenterSchema.parse(await this.json(`/dashboard/command-center?${params}`));
  }

  async getDashboardInsights() { return dashboardInsightsSchema.parse(await this.json("/dashboard/insights")); }

  async createAnalysisJob(input: { companyId: string; reportYear: number; fileName: string; fileSize: number }) {
    return analysisJobSchema.parse(await this.json("/analysis-jobs", { method: "POST", body: JSON.stringify(input) }));
  }

  async getAnalysisJob(jobId: string) {
    return analysisJobSchema.parse(await this.json(`/analysis-jobs/${encodeURIComponent(jobId)}`));
  }

  async saveReview(review: ReviewRecord) {
    return reviewRecordSchema.parse(await this.json("/reviews", { method: "POST", body: JSON.stringify(review) }));
  }
}
