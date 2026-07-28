export type RiskBand = "high" | "medium" | "low" | "unavailable";
export type ReviewStatus = "pending" | "partial" | "reviewed" | "disputed";
export type EvidenceStatus = "verified" | "pending" | "insufficient" | "disputed";
export type CalculationStatus = "calculated" | "mock" | "unavailable";
export type MetricCode = "EASS" | "IR" | "UPR" | "ESGSI" | "EAA_ESGSI" | "IMBALANCE";
export type RiskDirection = "higher_is_risk" | "lower_is_risk" | "contextual";
export type EnvironmentalActionClass = "implemented" | "planning" | "indeterminate";

export interface AnalysisMetric {
  code: MetricCode;
  label: string;
  rawValue: number | null;
  riskValue: number | null;
  numerator?: number;
  denominator?: number;
  weight?: number;
  contribution?: number;
  threshold?: number;
  riskDirection: RiskDirection;
  formulaVersion: string;
  calculationStatus: CalculationStatus;
  unavailableReason?: string;
  evidenceIds: string[];
}

export interface TextProcessingMetrics {
  totalWords: number;
  sentenceCount: number;
  tokenCount: number;
}

export interface EsgTopicMetrics {
  eCount: number;
  sCount: number;
  gCount: number;
  eFocus: number;
  sFocus: number;
  gFocus: number;
  imbalanceScore: number;
}

export interface EnvironmentalActionSummary {
  totalStatements: number;
  implemented: number;
  planning: number;
  indeterminate: number;
  planningAlpha: number;
}

export interface IndexBreakdown {
  baseEsgsi: number | null;
  actionPenalty: number | null;
  indeterminatePenalty: number | null;
  planningPenalty: number | null;
  finalIndex: number | null;
}

export interface EvidenceItem {
  id: string;
  companyId: string;
  reportYear: number;
  type: "claim" | "action" | "metric" | "verification" | "external";
  actionClass?: EnvironmentalActionClass;
  metricCode?: MetricCode;
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
  finalIndex: number | null;
  riskBand: RiskBand;
  evidenceCoverage: number;
  evidenceStatus: EvidenceStatus;
  reviewStatus: ReviewStatus;
  eventCount: number;
  textProcessing: TextProcessingMetrics;
  esgTopics: EsgTopicMetrics;
  environmentalActions: EnvironmentalActionSummary;
  metrics: AnalysisMetric[];
  indexBreakdown: IndexBreakdown;
  versions: {
    schema: string;
    data: string;
    feature: string;
    model: string;
    score: string;
    threshold: string;
  };
  computedAt: string;
}

export interface ReviewRecord {
  id: string;
  targetId: string;
  companyId: string;
  targetType: "evidence" | "event" | "entity_match" | "risk_label" | "action_classification" | "metric";
  originalDecision: string;
  humanDecision?: "confirm" | "reject" | "partial" | "insufficient";
  reasonCode?: string;
  note?: string;
  reviewedAt?: string;
}

export interface DashboardReviewTask {
  id: string;
  companyId: string;
  reviewType: "action_classification" | "EASS" | "IR" | "UPR" | "risk_band";
  metricCode: MetricCode;
  reason: string;
  impact: number;
  ageHours: number;
  uncertainty: number;
  evidenceStatus: EvidenceStatus;
  metricValue: number;
  threshold: number;
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

export interface AnalysisJob {
  jobId: string;
  reportId: string;
  status: "queued" | "running" | "completed" | "failed";
  phase: "collect" | "preprocess" | "extract" | "classify" | "calculate" | "risk";
  progress: number;
  resultCompanyId?: string;
  error?: { cause: string; impact: string; nextAction: string };
}

export const metricCodes: MetricCode[] = ["EASS", "IR", "UPR", "ESGSI", "EAA_ESGSI", "IMBALANCE"];

export function getMetric(record: CompanyYearRecord, code: MetricCode) {
  return record.metrics.find((metric) => metric.code === code);
}

export function metricPercent(record: CompanyYearRecord, code: MetricCode, field: "rawValue" | "riskValue" = "rawValue") {
  const value = getMetric(record, code)?.[field];
  return value == null ? null : Math.round(value * 100);
}

export function formatPercent(value: number | null | undefined) {
  return value == null ? "--" : `${Math.round(value * 100)}%`;
}

export function formatMetricPercent(record: CompanyYearRecord, code: MetricCode, field: "rawValue" | "riskValue" = "rawValue") {
  const value = getMetric(record, code)?.[field];
  return formatPercent(value);
}

export function formatDecimal(value: number | null | undefined) {
  return value == null ? "--" : value.toFixed(2);
}
