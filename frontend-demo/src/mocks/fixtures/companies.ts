import type { AnalysisMetric, CompanyYearRecord, EnvironmentalActionSummary, EvidenceItem } from "@/types";

const versions = {
  schema: "metric-contract-v1",
  data: "SYN-2026.07",
  feature: "ESG-TEXT-1.0",
  model: "EAA-ESGSI-DEMO-1.0",
  score: "eaa-esgsi-mock-v1",
  threshold: "risk-band-v1",
};

export function evidenceIdsFor(companyId: string): Record<AnalysisMetric["code"], string[]> {
  const ids = companyId === "cy-materials"
    ? { action: "ev-action-1", ir: "ev-ir-1", upr: "ev-2", metric: "ev-3", index: "ev-index-1" }
    : { action: `${companyId}-action`, ir: `${companyId}-ir`, upr: `${companyId}-upr`, metric: `${companyId}-metric`, index: `${companyId}-index` };
  return {
    EASS: [ids.action], IR: [ids.ir], UPR: [ids.upr], ESGSI: [ids.metric], EAA_ESGSI: [ids.index], IMBALANCE: [ids.metric],
  };
}

function metric(code: AnalysisMetric["code"], label: string, rawValue: number, riskValue: number, evidenceIds: string[], options: Partial<AnalysisMetric> = {}): AnalysisMetric {
  return {
    code, label, rawValue, riskValue, riskDirection: code === "EASS" ? "lower_is_risk" : code === "IMBALANCE" ? "contextual" : "higher_is_risk",
    formulaVersion: `${code.toLowerCase()}-draft-v1`, calculationStatus: "mock", evidenceIds, ...options,
  };
}

interface CompanySeed {
  id: string; name: string; code: string; industry: string; finalIndex: number; esgsi: number; upr: number; imbalance: number;
  coverage: number; evidenceStatus: CompanyYearRecord["evidenceStatus"]; reviewStatus: CompanyYearRecord["reviewStatus"]; events: number;
  actions: [number, number, number]; topicCounts: [number, number, number];
}

function createCompany(seed: CompanySeed, index: number): CompanyYearRecord {
  const [implemented, planning, indeterminate] = seed.actions;
  const totalStatements = implemented + planning + indeterminate;
  const environmentalActions: EnvironmentalActionSummary = { totalStatements, implemented, planning, indeterminate, planningAlpha: 0.5 };
  const eass = totalStatements ? (implemented + planning * environmentalActions.planningAlpha) / totalStatements : 0;
  const ir = totalStatements ? indeterminate / totalStatements : 0;
  const totalWords = 28400 + index * 713;
  const [eCount, sCount, gCount] = seed.topicCounts;
  const gap = Math.max(0, seed.finalIndex - seed.esgsi);
  const actionPenalty = Number((gap * 0.45).toFixed(3));
  const indeterminatePenalty = Number((gap * 0.25).toFixed(3));
  const planningPenalty = Number((seed.finalIndex - seed.esgsi - actionPenalty - indeterminatePenalty).toFixed(3));
  const band = seed.finalIndex > 0.66 ? "high" : seed.finalIndex > 0.33 ? "medium" : "low";
  const evidenceIds = evidenceIdsFor(seed.id);
  const metrics = [
    metric("EASS", "环境行动实质性", eass, 1 - eass, evidenceIds.EASS, { numerator: implemented + planning * 0.5, denominator: totalStatements, threshold: 0.5, contribution: actionPenalty }),
    metric("IR", "模糊声明比例", ir, ir, evidenceIds.IR, { numerator: indeterminate, denominator: totalStatements, threshold: 0.33, contribution: indeterminatePenalty }),
    metric("UPR", "未验证计划比例", seed.upr, seed.upr, evidenceIds.UPR, { numerator: Math.round(planning * seed.upr), denominator: planning, threshold: 0.6, contribution: planningPenalty }),
    metric("ESGSI", "漂绿严重度", seed.esgsi, seed.esgsi, evidenceIds.ESGSI, { threshold: 0.5, contribution: seed.esgsi }),
    metric("EAA_ESGSI", "行动调整后漂绿指数", seed.finalIndex, seed.finalIndex, evidenceIds.EAA_ESGSI, { threshold: 0.66 }),
    metric("IMBALANCE", "ESG 失衡程度", seed.imbalance, seed.imbalance, evidenceIds.IMBALANCE, { threshold: 0.45 }),
  ];
  return {
    id: `${seed.id}-2025`, companyId: seed.id, companyName: seed.name, stockCode: seed.code, industry: seed.industry,
    reportYear: 2025, publishDate: `2026-0${(index % 3) + 2}-${String(8 + index % 20).padStart(2, "0")}`,
    finalIndex: seed.finalIndex, riskBand: band, evidenceCoverage: seed.coverage, evidenceStatus: seed.evidenceStatus,
    reviewStatus: seed.reviewStatus, eventCount: seed.events,
    textProcessing: { totalWords, sentenceCount: 930 + index * 17, tokenCount: Math.round(totalWords * 1.18) },
    esgTopics: {
      eCount, sCount, gCount, eFocus: eCount / totalWords, sFocus: sCount / totalWords, gFocus: gCount / totalWords, imbalanceScore: seed.imbalance,
    },
    environmentalActions, metrics,
    indexBreakdown: { baseEsgsi: seed.esgsi, actionPenalty, indeterminatePenalty, planningPenalty, finalIndex: seed.finalIndex },
    versions, computedAt: "2026-07-28T09:00:00+09:00",
  };
}

const baseSeeds: CompanySeed[] = [
  { id: "cy-materials", name: "澄岳新材", code: "688217", industry: "新材料", finalIndex: .78, esgsi: .55, upr: .72, imbalance: .48, coverage: 64, evidenceStatus: "insufficient", reviewStatus: "partial", events: 5, actions: [12,18,20], topicCounts: [648,221,184] },
  { id: "linhai-energy", name: "林海能源", code: "600741", industry: "综合能源", finalIndex: .72, esgsi: .51, upr: .67, imbalance: .42, coverage: 71, evidenceStatus: "pending", reviewStatus: "pending", events: 6, actions: [14,17,16], topicCounts: [701,198,166] },
  { id: "qiming-mobility", name: "启明交通", code: "301482", industry: "交通设备", finalIndex: .61, esgsi: .43, upr: .54, imbalance: .34, coverage: 83, evidenceStatus: "verified", reviewStatus: "reviewed", events: 3, actions: [19,15,11], topicCounts: [574,247,213] },
  { id: "beichen-foods", name: "北辰食品", code: "002761", industry: "消费品", finalIndex: .43, esgsi: .31, upr: .48, imbalance: .29, coverage: 42, evidenceStatus: "insufficient", reviewStatus: "pending", events: 2, actions: [20,12,8], topicCounts: [402,318,236] },
  { id: "yuanfang-tech", name: "远方科技", code: "688903", industry: "电子制造", finalIndex: .29, esgsi: .22, upr: .27, imbalance: .19, coverage: 92, evidenceStatus: "verified", reviewStatus: "reviewed", events: 1, actions: [27,9,4], topicCounts: [455,339,302] },
  { id: "jiuhe-build", name: "九禾建设", code: "601593", industry: "建筑", finalIndex: .55, esgsi: .38, upr: .61, imbalance: .51, coverage: 58, evidenceStatus: "disputed", reviewStatus: "disputed", events: 4, actions: [16,14,15], topicCounts: [619,171,143] },
];

const syntheticNames = [
  "云岚复材", "星泊化工", "青屿装备", "沐川纺织", "禾望包装", "清原电气", "岚桥物流", "泽衡科技",
  "森屿建材", "澜序制造", "景辰玻璃", "汇青机械", "川岳纸业", "启川电机", "新澈涂料", "岭南器材",
  "远泽包装", "松原设备", "潮汐材料", "衡川精工", "青砾科技", "云港运输", "明川制品", "清域工程",
];
const industries = ["新材料", "综合能源", "交通设备", "消费品", "电子制造", "建筑"];

const generatedSeeds: CompanySeed[] = syntheticNames.map((name, index) => {
  const finalIndex = Number((.25 + ((index * 17) % 58) / 100).toFixed(2));
  return {
    id: `demo-company-${String(index + 1).padStart(2, "0")}`, name, code: `D${String(index + 101).padStart(5, "0")}`,
    industry: industries[index % industries.length], finalIndex, esgsi: Number(Math.max(.12, finalIndex - .12 - (index % 4) * .02).toFixed(2)),
    upr: Number((.24 + ((index * 13) % 58) / 100).toFixed(2)), imbalance: Number((.17 + ((index * 7) % 43) / 100).toFixed(2)),
    coverage: 48 + (index * 9) % 49, evidenceStatus: ["pending", "insufficient", "verified", "disputed"][index % 4] as CompanyYearRecord["evidenceStatus"],
    reviewStatus: ["pending", "pending", "reviewed", "disputed"][index % 4] as CompanyYearRecord["reviewStatus"], events: 1 + index % 7,
    actions: [12 + index % 17, 8 + (index * 3) % 15, 5 + (index * 5) % 14],
    topicCounts: [380 + (index * 31) % 360, 170 + (index * 17) % 240, 140 + (index * 13) % 210],
  };
});

export const companies: CompanyYearRecord[] = [...baseSeeds, ...generatedSeeds].map(createCompany);

function createEvidence(company: CompanyYearRecord): EvidenceItem[] {
  const ids = evidenceIdsFor(company.companyId);
  const [uprId] = ids.UPR;
  const [irId] = ids.IR;
  const [metricId] = ids.IMBALANCE;
  const [actionId] = ids.EASS;
  const [indexId] = ids.EAA_ESGSI;
  const externalId = company.companyId === "cy-materials" ? "ev-ext-1" : `${company.companyId}-external`;
  const sourceLabel = `${company.reportYear} 可持续发展报告（合成）`;
  return [
    {
      id: uprId, companyId: company.companyId, reportYear: company.reportYear, type: "claim", metricCode: "UPR",
      title: company.companyId === "cy-materials" ? "2030 年低碳材料目标缺少验证基准" : `${company.companyName}环境计划缺少验证要素`,
      excerpt: "报告提出环境改善计划，但当前段落未同时披露基准年、阶段目标、量化 KPI、实施方法和第三方鉴证边界。",
      page: 42, sourceLabel, status: company.evidenceStatus,
    },
    {
      id: irId, companyId: company.companyId, reportYear: company.reportYear, type: "claim", metricCode: "IR",
      title: "环境声明缺少可核验的量化边界",
      excerpt: "报告使用持续优化、稳步提升等方向性措辞，但当前句段没有提供对应的绝对量、同比口径或完成状态。",
      page: 45, sourceLabel, status: company.evidenceStatus,
    },
    {
      id: metricId, companyId: company.companyId, reportYear: company.reportYear, type: "metric", metricCode: "ESGSI",
      title: "实质环境信息缺少跨年可比数据",
      excerpt: "报告列出环境改善方向，但没有同时提供核算边界、绝对量和与上一年度可比的量化结果。",
      page: 47, sourceLabel, status: company.evidenceStatus === "verified" ? "verified" : "pending",
    },
    {
      id: actionId, companyId: company.companyId, reportYear: company.reportYear, type: "action", actionClass: "planning", metricCode: "EASS",
      title: "环境行动仍处于计划阶段",
      excerpt: "报告描述后续追踪机制，但未提供已经实施的项目结果、预算投入或可核验绩效。",
      page: 43, sourceLabel, status: company.evidenceStatus === "verified" ? "verified" : "pending",
    },
    {
      id: indexId, companyId: company.companyId, reportYear: company.reportYear, type: "verification", metricCode: "EAA_ESGSI",
      title: "最终指数由基础严重度与三项惩罚构成",
      excerpt: "该合成证据用于回溯 ESGSI、行动实质性、模糊声明与未验证计划对最终调整指数的构成。",
      page: 49, sourceLabel, status: company.evidenceStatus,
    },
    {
      id: externalId, companyId: company.companyId, reportYear: company.reportYear, type: "external",
      title: "园区排放许可记录发生口径变更",
      excerpt: "合成事件记录显示，报告发布前一个季度排放许可核算边界发生调整，需确认是否影响年度可比口径。",
      eventDate: "2025-11-18", sourceLabel: "区域环境观察站（虚构）", sourceUrl: `https://source.example.invalid/event/${company.companyId}`, status: "pending",
    },
  ];
}

export const evidence: EvidenceItem[] = companies.flatMap(createEvidence);
