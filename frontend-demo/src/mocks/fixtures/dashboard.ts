import type { DashboardInsights, DashboardReviewTask, RiskComponent } from "@/types";

const taskSeeds: Array<[
  string,
  string,
  RiskComponent["code"],
  string,
  number,
  number,
  number,
  DashboardReviewTask["evidenceStatus"],
  number,
  number,
  string,
]> = [
  ["rv-1048", "cy-materials", "UNVERIFIED_TARGET", "2030 目标缺少基准年与第三方鉴证边界", 94, 46, 88, "insufficient", 88, 84, "ev-2"],
  ["rv-1042", "linhai-energy", "EXTERNAL_FACT", "许可口径变更与报告边界尚未完成对齐", 91, 71, 82, "pending", 82, 79, "ev-ext-1"],
  ["rv-1039", "jiuhe-build", "SELECTIVE", "高影响业务范围疑似未纳入披露口径", 86, 118, 76, "disputed", 71, 67, "ev-5"],
  ["rv-1035", "demo-company-08", "DECOUPLING", "承诺强度与近两期行动记录存在偏离", 83, 63, 81, "pending", 52, 60, "ev-4"],
  ["rv-1028", "demo-company-13", "QUANT_GAP", "范围三排放缺少可比年度量化结果", 79, 92, 84, "insufficient", 46, 67, "ev-3"],
  ["rv-1021", "demo-company-19", "VAGUE", "环境改善声明未说明指标与适用范围", 72, 37, 74, "pending", 51, 78, "ev-1"],
  ["rv-1016", "qiming-mobility", "UNVERIFIED_TARGET", "阶段目标虽已披露但验证样本仍不足", 68, 29, 61, "verified", 74, 72, "ev-2"],
  ["rv-1009", "beichen-foods", "QUANT_GAP", "包装减量声明未提供绝对量与同比口径", 64, 146, 91, "insufficient", 64, 48, "ev-3"],
];

const reviewTasks: DashboardReviewTask[] = taskSeeds.map(([
  id, companyId, type, reason, impact, ageHours, uncertainty,
  evidenceStatus, claimPercentile, factPercentile, evidenceId,
]) => ({
  id,
  companyId,
  type,
  reason,
  impact,
  ageHours,
  uncertainty,
  evidenceStatus,
  claimPercentile,
  factPercentile,
  evidenceId,
}));

export const dashboardInsights: DashboardInsights = {
  reviewTasks,
  reviewTrend: [
    { date: "07-18", created: 14, completed: 11, pending: 24 },
    { date: "07-19", created: 12, completed: 13, pending: 23 },
    { date: "07-20", created: 18, completed: 12, pending: 29 },
    { date: "07-21", created: 15, completed: 17, pending: 27 },
    { date: "07-22", created: 17, completed: 14, pending: 30 },
    { date: "07-23", created: 13, completed: 16, pending: 27 },
    { date: "07-24", created: 21, completed: 15, pending: 33 },
    { date: "07-25", created: 16, completed: 18, pending: 31 },
    { date: "07-26", created: 12, completed: 15, pending: 28 },
    { date: "07-27", created: 17, completed: 17, pending: 28 },
  ],
  modelAgreement: [
    { type: "模糊声明", confirm: 62, partial: 17, reject: 13, insufficient: 8 },
    { type: "未验证目标", confirm: 54, partial: 21, reject: 10, insufficient: 15 },
    { type: "量化缺失", confirm: 71, partial: 12, reject: 8, insufficient: 9 },
    { type: "行动脱钩", confirm: 48, partial: 19, reject: 21, insufficient: 12 },
    { type: "选择性披露", confirm: 51, partial: 18, reject: 17, insufficient: 14 },
    { type: "外部事实", confirm: 57, partial: 11, reject: 9, insufficient: 23 },
  ],
  sourceFreshness: [
    { source: "企业报告", coverage: 96, daysOld: 7, status: "fresh" },
    { source: "监管许可", coverage: 84, daysOld: 18, status: "fresh" },
    { source: "外部事件", coverage: 78, daysOld: 31, status: "watch" },
    { source: "第三方评级", coverage: 69, daysOld: 47, status: "watch" },
    { source: "供应链记录", coverage: 54, daysOld: 83, status: "stale" },
  ],
  evidenceCoverage: [
    { label: "目标基准", coverage: 58 },
    { label: "量化指标", coverage: 66 },
    { label: "行动记录", coverage: 73 },
    { label: "外部事实", coverage: 61 },
    { label: "第三方鉴证", coverage: 49 },
  ],
};
