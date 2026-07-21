import type { CompanyYearRecord, EvidenceItem, RiskComponent } from "@/types";

const labels: Array<[RiskComponent["code"], string]> = [
  ["VAGUE", "模糊声明"],
  ["UNVERIFIED_TARGET", "未验证目标"],
  ["QUANT_GAP", "量化缺失"],
  ["DECOUPLING", "行动脱钩"],
  ["SELECTIVE", "选择性披露"],
  ["EXTERNAL_FACT", "外部事实"],
];

function components(values: number[]): RiskComponent[] {
  return labels.map(([code, label], index) => ({
    code,
    label,
    value: values[index],
    weight: [0.12, 0.2, 0.18, 0.16, 0.14, 0.2][index],
    contribution: Math.round(values[index] * [0.12, 0.2, 0.18, 0.16, 0.14, 0.2][index]),
    industryMedian: [38, 34, 42, 31, 36, 29][index],
    evidenceIds: [`ev-${index + 1}`],
  }));
}

export const companies: CompanyYearRecord[] = [
  ["cy-materials", "澄岳新材", "688217", "新材料", 78, 88, 84, 64, "insufficient", "partial", 5, [62, 88, 81, 69, 58, 77]],
  ["linhai-energy", "林海能源", "600741", "综合能源", 72, 82, 79, 71, "pending", "pending", 6, [58, 77, 71, 62, 55, 80]],
  ["qiming-mobility", "启明交通", "301482", "交通设备", 61, 74, 72, 83, "verified", "reviewed", 3, [51, 58, 64, 53, 44, 66]],
  ["beichen-foods", "北辰食品", "002761", "消费品", 43, 64, 48, 42, "insufficient", "pending", 2, [46, 39, 71, 28, 42, 35]],
  ["yuanfang-tech", "远方科技", "688903", "电子制造", 29, 42, 37, 92, "verified", "reviewed", 1, [29, 24, 31, 22, 28, 34]],
  ["jiuhe-build", "九禾建设", "601593", "建筑", 55, 71, 67, 58, "disputed", "disputed", 4, [54, 62, 47, 51, 67, 58]],
].map(([id, name, code, industry, risk, claim, fact, coverage, evidence, review, events, values]) => ({
  id: `${id}-2025`,
  companyId: id as string,
  companyName: name as string,
  stockCode: code as string,
  industry: industry as string,
  reportYear: 2025,
  publishDate: "2026-03-28",
  riskScore: risk as number,
  riskBand: (risk as number) >= 70 ? "high" : (risk as number) >= 45 ? "medium" : "low",
  claimPercentile: claim as number,
  factPercentile: fact as number,
  evidenceCoverage: coverage as number,
  evidenceStatus: evidence as CompanyYearRecord["evidenceStatus"],
  reviewStatus: review as CompanyYearRecord["reviewStatus"],
  eventCount: events as number,
  components: components(values as number[]),
  versions: { data: "SYN-2026.07", model: "GL-RISK-1.3" },
}));

export const evidence: EvidenceItem[] = [
  {
    id: "ev-2",
    companyId: "cy-materials",
    reportYear: 2025,
    type: "claim",
    title: "2030 年低碳材料目标缺少验证基准",
    excerpt: "公司计划在 2030 年前显著提高低碳材料占比，并持续优化生产环节的环境表现。当前段落未披露基准年、阶段目标或第三方鉴证范围。",
    page: 42,
    sourceLabel: "2025 可持续发展报告（合成）",
    status: "insufficient",
  },
  {
    id: "ev-3",
    companyId: "cy-materials",
    reportYear: 2025,
    type: "metric",
    title: "范围三排放未提供可比数据",
    excerpt: "报告列出供应链减排方向，但没有披露范围三排放总量、核算边界或与上一年度可比的量化结果。",
    page: 47,
    sourceLabel: "2025 可持续发展报告（合成）",
    status: "pending",
  },
  {
    id: "ev-ext-1",
    companyId: "cy-materials",
    reportYear: 2025,
    type: "external",
    title: "园区排放许可记录发生口径变更",
    excerpt: "合成事件记录显示，报告发布前一个季度排放许可核算边界发生调整，需确认是否影响年度可比口径。",
    eventDate: "2025-11-18",
    sourceLabel: "区域环境观察站（虚构）",
    sourceUrl: "https://source.example.invalid/event/greenlens-001",
    status: "pending",
  },
];
