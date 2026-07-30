export type RiskBand = "high" | "medium" | "low" | "unavailable";
export type ReviewStatus = "pending" | "partial" | "reviewed" | "disputed";
export type EvidenceStatus = "verified" | "pending" | "insufficient" | "disputed";
export type CalculationStatus = "calculated" | "mock" | "unavailable";
export type MetricCode = "EASS" | "IR" | "UPR" | "ESGSI" | "EAA_ESGSI" | "IMBALANCE";
export type RiskDirection = "higher_is_risk" | "lower_is_risk" | "contextual";
export type EnvironmentalActionClass = "implemented" | "planning" | "indeterminate";
export type EnvironmentalAspectCategory =
  | "emissions_climate"
  | "energy_resources"
  | "waste_circularity"
  | "pollution_control"
  | "biodiversity_ecology";
export type NormalizationScope = "none" | "year" | "industry_year" | "global" | "synthetic_demo";
export type SampleGroup = "main_n_ge_20" | "robustness_n_10_19" | "low_n_lt_10";
export type BaseRisk = "relatively_high" | "relatively_medium" | "relatively_low" | "unavailable";
export type RedFlagCode = "HIGH_ESGSI" | "LOW_EASS" | "HIGH_IR" | "HIGH_UPR";

export interface AnalysisMetric {
  code: MetricCode;
  label: string;
  /** Formula output before normalization. ESGSI may be negative and E-AA-ESGSI may exceed 1. */
  rawValue: number | null;
  /** Comparable value after the declared normalization rule. */
  normalizedValue: number | null;
  /** Direction-aligned value used by risk-oriented charts. */
  riskValue: number | null;
  numerator?: number;
  denominator?: number;
  weight?: number;
  contribution?: number;
  threshold?: number;
  riskDirection: RiskDirection;
  formulaVersion: string;
  normalizationVersion: string;
  normalizationScope: NormalizationScope;
  calculationStatus: CalculationStatus;
  unavailableReason?: string;
  evidenceIds: string[];
}

export interface TextProcessingMetrics {
  textLength: number;
  totalWords: number;
  sentenceCount: number;
  environmentalSentenceCount: number;
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

export interface PlanningVerificationSummary {
  totalPlanning: number;
  verifiedPlanning: number;
  unverifiedPlanning: number;
  requiredAttributes: Array<"deadline" | "quantified_target" | "implementation_path" | "responsible_entity">;
  ruleVersion: string;
}

export interface EnvironmentalAspectScore {
  id: string;
  companyId: string;
  reportYear: number;
  aspectText: string;
  category: EnvironmentalAspectCategory;
  frequency: number;
  salience: number;
  implemented: number;
  planning: number;
  indeterminate: number;
  planningAlpha: number;
  actionScore: number | null;
  evidenceIds: string[];
  calculationStatus: CalculationStatus;
  formulaVersion: string;
}

export interface ScoreInputValue {
  rawValue: number | null;
  normalizedValue: number | null;
  normalizationVersion: string;
  normalizationScope: NormalizationScope;
}

export interface ScoreInputs {
  sentiment: ScoreInputValue;
  sustainability: ScoreInputValue;
}

export interface ScoringParameters {
  planningAlpha: number;
  lambdaAction: number;
  lambdaIndeterminate: number;
  lambdaPlanning: number;
  parameterVersion: string;
}

export interface PenaltyTerm {
  inputValue: number | null;
  weight: number;
  contribution: number | null;
}

export interface IndexBreakdown {
  baseEsgsiNormalized: number | null;
  actionPenalty: PenaltyTerm;
  indeterminatePenalty: PenaltyTerm;
  planningPenalty: PenaltyTerm;
  finalRaw: number | null;
  finalNormalized: number | null;
  normalizationVersion: string;
  normalizationScope: NormalizationScope;
}

export interface RiskClassification {
  baseRisk: BaseRisk;
  redFlags: RedFlagCode[];
  redFlagCount: number;
  assignedBand: RiskBand;
  classificationVersion: string;
  reason: string;
}

export interface PanelMetadata {
  sampleGroup: SampleGroup;
  includeNGe10: boolean;
  includeNGe20: boolean;
  analysisScope: string;
  lowSentenceCountFlag: boolean;
  recommendedUse: string;
  yearsAvailable: number;
  firstYear: number;
  lastYear: number;
  duplicateCount: number;
  selectedForPanel: boolean;
  selectionNote?: string;
  qualityFlags: string[];
  reportYearTextCheck: string;
  codeSource: string;
  sourceFile: string;
  sourceSheet: string;
  sourceRow: number;
}

export interface PanelYearSummary {
  year: number;
  sourceFile: string;
  sourceRows: number;
  uniqueCompanyYears: number;
  duplicateGroups: number;
  extraDuplicateRows: number;
  selectedNLt10: number;
  selectedN10To19: number;
  selectedNGe20: number;
  titleTargetYearNotFound: number;
  qualityFlaggedRows: number;
  codeRecoveredFromCompany: number;
}

export interface EvidenceItem {
  id: string;
  companyId: string;
  reportYear: number;
  type: "claim" | "action" | "metric" | "verification" | "external";
  actionClass?: EnvironmentalActionClass;
  metricCode?: MetricCode;
  aspectId?: string;
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
  reportId: string;
  companyId: string;
  companyName: string;
  stockCode: string;
  industry: string;
  reportYear: number;
  publishDate: string;
  finalIndexRaw: number | null;
  finalIndex: number | null;
  riskBand: RiskBand;
  evidenceCoverage: number;
  evidenceStatus: EvidenceStatus;
  reviewStatus: ReviewStatus;
  eventCount: number;
  textProcessing: TextProcessingMetrics;
  esgTopics: EsgTopicMetrics;
  environmentalActions: EnvironmentalActionSummary;
  planningVerification: PlanningVerificationSummary;
  scoreInputs: ScoreInputs;
  scoringParameters: ScoringParameters;
  metrics: AnalysisMetric[];
  indexBreakdown: IndexBreakdown;
  riskClassification: RiskClassification;
  panelMetadata: PanelMetadata;
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

export interface MetricHistoryValue {
  rawValue: number | null;
  normalizedValue: number | null;
  riskValue: number | null;
  calculationStatus: CalculationStatus;
}

export interface CompanyMetricHistoryPoint {
  companyId: string;
  reportYear: number;
  finalIndexRaw: number | null;
  finalIndex: number | null;
  riskBand: RiskBand;
  metrics: Partial<Record<MetricCode, MetricHistoryValue>>;
  dataVersion: string;
}

export interface FinancialYearRecord {
  id: string;
  companyId: string;
  stockCode: string;
  companyName: string;
  fiscalPeriodEnd: string;
  reportYear: number;
  reportType: string;
  sourceType: string;
  assetLiabilityRatio: number | null;
  roaA: number | null;
  totalAssets: number | null;
  currency: string;
  sourceFields: {
    assetLiabilityRatio: "F011201A";
    roaA: "F050201B";
    totalAssets: "A001000000";
  };
  qualityFlags: string[];
}

export interface ViolationEvent {
  id: string;
  companyId: string;
  stockCode: string;
  companyName: string;
  violationYears: number[];
  announcementDate: string;
  occurrenceDate?: string;
  violationTypes: string[];
  title?: string;
  reason?: string;
  behavior: string;
  action: string;
  authority?: string;
  totalPenalty: number | null;
  companyPenalty: number | null;
  relation?: string;
  subjectName?: string;
  sourceLabel: string;
  sourceUrl?: string;
  reviewStatus: EvidenceStatus;
  qualityFlags: string[];
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

export type DashboardTriadCode = "RHETORIC_CONTENT" | "ACTION_SUBSTANCE" | "AMBIGUITY_VERIFICATION";

export interface DashboardMetricTriad {
  code: DashboardTriadCode;
  label: string;
  description: string;
  medianValue: number | null;
  attentionRate: number | null;
  history: Array<{ year: number; value: number | null }>;
}

export interface DashboardRiskHistoryPoint {
  year: number;
  finalIndex: number | null;
  riskBand: RiskBand;
}

export interface DashboardRiskNode {
  companyId: string;
  companyName: string;
  stockCode: string;
  industry: string;
  reportYear: number;
  eass: number | null;
  finalIndex: number | null;
  riskBand: RiskBand;
  environmentalSentenceCount: number;
  evidenceCoverage: number;
  redFlags: RedFlagCode[];
  metricRiskValues: Record<"ESGSI" | "EASS" | "IR" | "UPR" | "EAA_ESGSI", number | null>;
  persistentHighRiskYears: number;
  history: DashboardRiskHistoryPoint[];
}

export interface DashboardWatchItem extends DashboardRiskNode {
  evidenceStatus: EvidenceStatus;
  reviewStatus: ReviewStatus;
}

export interface DashboardAnnualTrendPoint {
  year: number;
  medianFinalIndex: number | null;
  highRiskRate: number | null;
  medianEass: number | null;
}

export interface DashboardIndustryRiskCell {
  industry: string;
  metricCode: "ESGSI" | "EASS" | "IR" | "UPR" | "EAA_ESGSI";
  sampleCount: number;
  medianRiskValue: number | null;
  q1: number | null;
  q3: number | null;
}

export interface DashboardCommandCenterData {
  scope: {
    reportYear: number;
    industry?: string;
    sampleGroup?: SampleGroup;
    dataVersion: string;
    computedAt: string;
  };
  kpis: {
    sampleCount: number;
    highRiskCount: number;
    persistentHighRiskCount: number;
    medianFinalIndex: number | null;
    insufficientEvidenceCount: number;
    qualityAlertCount: number;
  };
  metricTriad: DashboardMetricTriad[];
  riskNodes: DashboardRiskNode[];
  persistentRisks: DashboardWatchItem[];
  annualTrend: DashboardAnnualTrendPoint[];
  industryRisk: DashboardIndustryRiskCell[];
  redFlagDistribution: Array<{ code: RedFlagCode; count: number }>;
  quality: PanelYearSummary[];
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

export function metricPercent(
  record: CompanyYearRecord,
  code: MetricCode,
  field: "rawValue" | "normalizedValue" | "riskValue" = "normalizedValue",
) {
  const value = getMetric(record, code)?.[field];
  return value == null ? null : Math.round(value * 100);
}

export function formatPercent(value: number | null | undefined) {
  return value == null ? "--" : `${Math.round(value * 100)}%`;
}

export function formatMetricPercent(
  record: CompanyYearRecord,
  code: MetricCode,
  field: "normalizedValue" | "riskValue" = "normalizedValue",
) {
  const value = getMetric(record, code)?.[field];
  return formatPercent(value);
}

export function formatDecimal(value: number | null | undefined) {
  return value == null ? "--" : value.toFixed(2);
}
