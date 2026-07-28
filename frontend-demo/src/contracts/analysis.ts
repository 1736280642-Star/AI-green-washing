import { z } from "zod";

const metricCodeSchema = z.enum(["EASS", "IR", "UPR", "ESGSI", "EAA_ESGSI", "IMBALANCE"]);
const riskBandSchema = z.enum(["high", "medium", "low", "unavailable"]);
const evidenceStatusSchema = z.enum(["verified", "pending", "insufficient", "disputed"]);
const reviewStatusSchema = z.enum(["pending", "partial", "reviewed", "disputed"]);

export const analysisMetricSchema = z.object({
  code: metricCodeSchema,
  label: z.string(),
  rawValue: z.number().min(0).max(1).nullable(),
  riskValue: z.number().min(0).max(1).nullable(),
  numerator: z.number().nonnegative().optional(),
  denominator: z.number().nonnegative().optional(),
  weight: z.number().min(0).max(1).optional(),
  contribution: z.number().min(0).max(1).optional(),
  threshold: z.number().min(0).max(1).optional(),
  riskDirection: z.enum(["higher_is_risk", "lower_is_risk", "contextual"]),
  formulaVersion: z.string().min(1),
  calculationStatus: z.enum(["calculated", "mock", "unavailable"]),
  unavailableReason: z.string().optional(),
  evidenceIds: z.array(z.string()),
}).superRefine((metric, context) => {
  if (metric.denominator === 0 && (metric.rawValue !== null || metric.riskValue !== null || !metric.unavailableReason)) {
    context.addIssue({ code: "custom", message: "零分母指标必须返回 null 值和 unavailableReason" });
  }
  if (metric.calculationStatus === "unavailable" && (metric.rawValue !== null || metric.riskValue !== null || !metric.unavailableReason)) {
    context.addIssue({ code: "custom", message: "不可计算指标必须返回 null 值和 unavailableReason" });
  }
  if (metric.calculationStatus !== "unavailable" && (metric.rawValue === null || metric.riskValue === null)) {
    context.addIssue({ code: "custom", message: "已计算指标必须同时返回 rawValue 和 riskValue" });
  }
});

export const companyYearRecordSchema = z.object({
  id: z.string(), companyId: z.string(), companyName: z.string(), stockCode: z.string(), industry: z.string(),
  reportYear: z.number().int(), publishDate: z.string(), finalIndex: z.number().min(0).max(1).nullable(), riskBand: riskBandSchema,
  evidenceCoverage: z.number().min(0).max(100), evidenceStatus: evidenceStatusSchema, reviewStatus: reviewStatusSchema,
  eventCount: z.number().int().nonnegative(),
  textProcessing: z.object({ totalWords: z.number().int().nonnegative(), sentenceCount: z.number().int().nonnegative(), tokenCount: z.number().int().nonnegative() }),
  esgTopics: z.object({
    eCount: z.number().int().nonnegative(), sCount: z.number().int().nonnegative(), gCount: z.number().int().nonnegative(),
    eFocus: z.number().min(0).max(1), sFocus: z.number().min(0).max(1), gFocus: z.number().min(0).max(1), imbalanceScore: z.number().min(0).max(1),
  }),
  environmentalActions: z.object({
    totalStatements: z.number().int().nonnegative(), implemented: z.number().int().nonnegative(), planning: z.number().int().nonnegative(),
    indeterminate: z.number().int().nonnegative(), planningAlpha: z.number().min(0).max(1),
  }),
  metrics: z.array(analysisMetricSchema),
  indexBreakdown: z.object({ baseEsgsi: z.number().min(0).max(1).nullable(), actionPenalty: z.number().nonnegative().nullable(), indeterminatePenalty: z.number().nonnegative().nullable(), planningPenalty: z.number().nonnegative().nullable(), finalIndex: z.number().min(0).max(1).nullable() }),
  versions: z.object({ schema: z.string().min(1), data: z.string().min(1), feature: z.string().min(1), model: z.string().min(1), score: z.string().min(1), threshold: z.string().min(1) }),
  computedAt: z.string().datetime({ offset: true }),
}).superRefine((record, context) => {
  const actions = record.environmentalActions;
  if (actions.implemented + actions.planning + actions.indeterminate !== actions.totalStatements) {
    context.addIssue({ code: "custom", path: ["environmentalActions", "totalStatements"], message: "行动分类数量必须与总声明数一致" });
  }
  const metricCodes = new Set(record.metrics.map((metric) => metric.code));
  if (record.metrics.length !== 6 || metricCodes.size !== 6 || !metricCodeSchema.options.every((code) => metricCodes.has(code))) {
    context.addIssue({ code: "custom", path: ["metrics"], message: "公司年度记录必须包含且仅包含六项核心指标" });
  }
  const finalMetric = record.metrics.find((metric) => metric.code === "EAA_ESGSI");
  const breakdownValues = [record.indexBreakdown.baseEsgsi, record.indexBreakdown.actionPenalty, record.indexBreakdown.indeterminatePenalty, record.indexBreakdown.planningPenalty, record.indexBreakdown.finalIndex];
  if (record.finalIndex != null && (finalMetric?.rawValue == null || breakdownValues.some((value) => value == null) || Math.abs(finalMetric.rawValue - record.finalIndex) > 0.0001 || Math.abs(record.indexBreakdown.finalIndex! - record.finalIndex) > 0.0001)) {
    context.addIssue({ code: "custom", path: ["finalIndex"], message: "最终指数、E-AA-ESGSI 与公式拆解结果必须一致" });
  }
  if (record.finalIndex == null && (finalMetric?.rawValue !== null || record.indexBreakdown.finalIndex !== null)) {
    context.addIssue({ code: "custom", path: ["finalIndex"], message: "暂不可评分时最终指数与公式拆解结果必须为 null" });
  }
  const expectedBand = record.finalIndex == null ? "unavailable" : record.finalIndex <= 0.33 ? "low" : record.finalIndex <= 0.66 ? "medium" : "high";
  if (record.riskBand !== expectedBand) {
    context.addIssue({ code: "custom", path: ["riskBand"], message: "风险分级与 risk-band-v1 边界不一致" });
  }
});

export const companyYearListSchema = z.array(companyYearRecordSchema);

export const evidenceItemSchema = z.object({
  id: z.string(), companyId: z.string(), reportYear: z.number().int(),
  type: z.enum(["claim", "action", "metric", "verification", "external"]),
  actionClass: z.enum(["implemented", "planning", "indeterminate"]).optional(), metricCode: metricCodeSchema.optional(),
  title: z.string(), excerpt: z.string(), page: z.number().int().positive().optional(), eventDate: z.string().optional(),
  sourceLabel: z.string(), sourceUrl: z.string().optional(), status: evidenceStatusSchema,
});

export const dashboardInsightsSchema = z.object({
  reviewTasks: z.array(z.object({
    id: z.string(), companyId: z.string(), reviewType: z.enum(["action_classification", "EASS", "IR", "UPR", "risk_band"]),
    metricCode: metricCodeSchema, reason: z.string(), impact: z.number(), ageHours: z.number().nonnegative(), uncertainty: z.number(),
    evidenceStatus: evidenceStatusSchema, metricValue: z.number().min(0).max(1), threshold: z.number().min(0).max(1), evidenceId: z.string(),
  })),
  reviewTrend: z.array(z.object({ date: z.string(), created: z.number(), completed: z.number(), pending: z.number() })),
  modelAgreement: z.array(z.object({ type: z.string(), confirm: z.number(), partial: z.number(), reject: z.number(), insufficient: z.number() })),
  sourceFreshness: z.array(z.object({ source: z.string(), coverage: z.number(), daysOld: z.number(), status: z.enum(["fresh", "watch", "stale"]) })),
  evidenceCoverage: z.array(z.object({ label: z.string(), coverage: z.number() })),
});

export const reviewRecordSchema = z.object({
  id: z.string(), targetId: z.string(), companyId: z.string(),
  targetType: z.enum(["evidence", "event", "entity_match", "risk_label", "action_classification", "metric"]),
  originalDecision: z.string(), humanDecision: z.enum(["confirm", "reject", "partial", "insufficient"]).optional(),
  reasonCode: z.string().optional(), note: z.string().optional(), reviewedAt: z.string().datetime({ offset: true }).optional(),
});

export const analysisJobSchema = z.object({
  jobId: z.string(), reportId: z.string(), status: z.enum(["queued", "running", "completed", "failed"]),
  phase: z.enum(["collect", "preprocess", "extract", "classify", "calculate", "risk"]), progress: z.number().min(0).max(100),
  resultCompanyId: z.string().optional(),
  error: z.object({ cause: z.string(), impact: z.string(), nextAction: z.string() }).optional(),
});
