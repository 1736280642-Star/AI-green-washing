import type { AnalysisJob, CompanyYearRecord, DashboardInsights, EvidenceItem, ReviewRecord } from "@/types";

export type DemoScenario = "success" | "empty" | "error" | "slow";

export interface CompanyYearQuery {
  year?: number;
  industry?: string;
  riskBand?: string;
  page?: number;
  pageSize?: number;
}

export interface AnalysisRepository {
  listCompanies(scenario?: DemoScenario, query?: CompanyYearQuery): Promise<CompanyYearRecord[]>;
  getCompany(id: string, scenario?: DemoScenario, reportYear?: number): Promise<CompanyYearRecord | null>;
  listEvidence(companyId: string, scenario?: DemoScenario, reportYear?: number): Promise<EvidenceItem[]>;
  getDashboardInsights(scenario?: DemoScenario): Promise<DashboardInsights>;
  createAnalysisJob(input: { companyId: string; reportYear: number; fileName: string; fileSize: number }): Promise<AnalysisJob>;
  getAnalysisJob(jobId: string): Promise<AnalysisJob>;
  saveReview(review: ReviewRecord): Promise<ReviewRecord>;
}
