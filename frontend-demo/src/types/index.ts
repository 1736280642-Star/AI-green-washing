export type RiskBand = "high" | "medium" | "low" | "unavailable";
export type ReviewStatus = "pending" | "partial" | "reviewed" | "disputed";
export type EvidenceStatus = "verified" | "pending" | "insufficient" | "disputed";

export interface RiskComponent {
  code: "VAGUE" | "UNVERIFIED_TARGET" | "QUANT_GAP" | "DECOUPLING" | "SELECTIVE" | "EXTERNAL_FACT";
  label: string;
  value: number;
  weight: number;
  contribution: number;
  industryMedian: number;
  evidenceIds: string[];
}

export interface EvidenceItem {
  id: string;
  companyId: string;
  reportYear: number;
  type: "claim" | "action" | "metric" | "verification" | "external";
  title: string;
  excerpt: string;
  page?: number;
  eventDate?: string;
  sourceLabel: string;
  sourceUrl?: string;
  status: EvidenceStatus;
}

export interface CompanyYearRecord {
  id: string;
  companyId: string;
  companyName: string;
  stockCode: string;
  industry: string;
  reportYear: number;
  publishDate: string;
  riskScore: number | null;
  riskBand: RiskBand;
  claimPercentile: number | null;
  factPercentile: number | null;
  evidenceCoverage: number;
  evidenceStatus: EvidenceStatus;
  reviewStatus: ReviewStatus;
  eventCount: number;
  components: RiskComponent[];
  versions: { data: string; model: string };
}

export interface ReviewRecord {
  id: string;
  targetId: string;
  companyId: string;
  targetType: "evidence" | "event" | "entity_match" | "risk_label";
  originalDecision: string;
  humanDecision?: "confirm" | "reject" | "partial" | "insufficient";
  reasonCode?: string;
  note?: string;
  reviewedAt?: string;
}

export interface DashboardReviewTask {
  id: string;
  companyId: string;
  type: RiskComponent["code"];
  reason: string;
  impact: number;
  ageHours: number;
  uncertainty: number;
  evidenceStatus: EvidenceStatus;
  claimPercentile: number;
  factPercentile: number;
  evidenceId: string;
}

export interface ReviewTrendPoint {
  date: string;
  created: number;
  completed: number;
  pending: number;
}

export interface ModelAgreementRecord {
  type: string;
  confirm: number;
  partial: number;
  reject: number;
  insufficient: number;
}

export interface SourceFreshnessRecord {
  source: string;
  coverage: number;
  daysOld: number;
  status: "fresh" | "watch" | "stale";
}

export interface EvidenceCoverageDimension {
  label: string;
  coverage: number;
}

export interface DashboardInsights {
  reviewTasks: DashboardReviewTask[];
  reviewTrend: ReviewTrendPoint[];
  modelAgreement: ModelAgreementRecord[];
  sourceFreshness: SourceFreshnessRecord[];
  evidenceCoverage: EvidenceCoverageDimension[];
}
