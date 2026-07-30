import type {
  AnalysisJob,
  CompanyMetricHistoryPoint,
  CompanyYearRecord,
  DashboardCommandCenterData,
  DashboardInsights,
  EnvironmentalAspectScore,
  EvidenceItem,
  FinancialYearRecord,
  MetricCode,
  PanelYearSummary,
  ReviewRecord,
  SampleGroup,
  ViolationEvent,
} from "@/types";

export type DemoScenario = "success" | "empty" | "error" | "slow";

export interface CompanyYearQuery {
  year?: number;
  industry?: string;
  riskBand?: string;
  sampleGroup?: SampleGroup;
  page?: number;
  pageSize?: number;
}

export interface AnalysisRepository {
  listCompanies(scenario?: DemoScenario, query?: CompanyYearQuery): Promise<CompanyYearRecord[]>;
  getCompany(id: string, scenario?: DemoScenario, reportYear?: number): Promise<CompanyYearRecord | null>;
  listEvidence(companyId: string, scenario?: DemoScenario, reportYear?: number): Promise<EvidenceItem[]>;
  listEnvironmentalAspects(companyId: string, reportYear: number): Promise<EnvironmentalAspectScore[]>;
  getCompanyHistory(companyId: string, options?: { fromYear?: number; toYear?: number; metrics?: MetricCode[] }): Promise<CompanyMetricHistoryPoint[]>;
  getFinancialYear(companyId: string, reportYear: number): Promise<FinancialYearRecord | null>;
  listViolationEvents(companyId: string, options?: { reportYear?: number; fromYear?: number; toYear?: number }): Promise<ViolationEvent[]>;
  listPanelYearSummaries(options?: { fromYear?: number; toYear?: number }): Promise<PanelYearSummary[]>;
  getDashboardCommandCenter(scenario?: DemoScenario, query?: CompanyYearQuery): Promise<DashboardCommandCenterData>;
  getDashboardInsights(scenario?: DemoScenario): Promise<DashboardInsights>;
  createAnalysisJob(input: { companyId: string; reportYear: number; fileName: string; fileSize: number }): Promise<AnalysisJob>;
  getAnalysisJob(jobId: string): Promise<AnalysisJob>;
  saveReview(review: ReviewRecord): Promise<ReviewRecord>;
}
