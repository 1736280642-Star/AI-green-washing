"use client";

import { useRef, useState } from "react";
import { DashboardDetailDialog } from "./dashboard-detail-dialog";
import type { DashboardCommandCenterData } from "@/types";
import { formatPercent } from "@/types";

interface KpiDefinition {
  label: string;
  value: string;
  note: string;
  definition: string;
  tone: string;
  trend: Array<number | null>;
}

function Sparkline({ values, detail = false }: { values: Array<number | null>; detail?: boolean }) {
  const available = values.map((value, index) => ({ value, index })).filter((item): item is { value: number; index: number } => item.value != null);
  if (available.length < 2) return <span className="cc-kpi-spark-empty"/>;
  const min = Math.min(...available.map((item) => item.value));
  const max = Math.max(...available.map((item) => item.value));
  const range = max - min || 1;
  const points = available.map((item) => `${item.index / Math.max(1, values.length - 1) * 88 + 2},${28 - (item.value - min) / range * 21}`).join(" ");
  return <svg className={detail ? "cc-kpi-detail-trend" : "cc-kpi-spark"} viewBox="0 0 92 32" aria-hidden="true"><polyline points={points}/><polyline className="glow" points={points}/></svg>;
}

export function KpiRail({ data }: { data: DashboardCommandCenterData }) {
  const [selected, setSelected] = useState<KpiDefinition | null>(null);
  const selectedTrigger = useRef<HTMLButtonElement | null>(null);
  const finalTrend = data.annualTrend.map((item) => item.medianFinalIndex);
  const highTrend = data.annualTrend.map((item) => item.highRiskRate);
  const eassTrend = data.annualTrend.map((item) => item.medianEass);
  const qualityTrend = data.quality.map((item) => item.qualityFlaggedRows + item.duplicateGroups + item.titleTargetYearNotFound);
  const definitions: KpiDefinition[] = [
    { label: "当前样本", value: data.kpis.sampleCount.toLocaleString(), note: "公司-年份", definition: "当前筛选条件下进入分析口径的有效公司-年份记录数。", tone: "cyan", trend: data.quality.map((item) => item.uniqueCompanyYears) },
    { label: "高风险", value: data.kpis.highRiskCount.toLocaleString(), note: "版本化分类", definition: "依据 metric-contract-v2 风险阈值进入高风险带、需要优先复核的样本数。", tone: "coral", trend: highTrend },
    { label: "三年持续高风险", value: data.kpis.persistentHighRiskCount.toLocaleString(), note: "连续三年", definition: "最近三个可用报告年度均处于高风险带的公司数，用于识别持续性待复核信号。", tone: "amber", trend: highTrend.slice(-3) },
    { label: "E-AA 中位数", value: formatPercent(data.kpis.medianFinalIndex), note: "当前样本", definition: "当前样本 E-AA 最终风险方向指数的中位数，不代表事实概率或确定性判断。", tone: "cyan", trend: finalTrend },
    { label: "证据不足", value: data.kpis.insufficientEvidenceCount.toLocaleString(), note: "不等于低风险", definition: "关键证据缺失或不足以支持评价的样本数。证据不足不会被换算成零或低风险。", tone: "amber", trend: eassTrend.map((value) => value == null ? null : 1 - value) },
    { label: "质量提醒", value: data.kpis.qualityAlertCount.toLocaleString(), note: "重复与异常", definition: "存在重复报告、年份异常或其他数据质量标记的记录数，与风险结果分开计算。", tone: "green", trend: qualityTrend },
  ];
  return <>
    <section className="cc-kpi-rail" aria-label="核心观测指标">{definitions.map((item) => <button type="button" className={`cc-kpi tone-${item.tone}`} key={item.label} onClick={(event) => { selectedTrigger.current = event.currentTarget; setSelected(item); }} aria-label={`查看${item.label}详情`}><span>{item.label}</span><strong>{item.value}</strong><Sparkline values={item.trend}/></button>)}</section>
    <DashboardDetailDialog open={selected != null} onOpenChange={(open) => { if (!open) setSelected(null); }} title={selected ? `${selected.label}详情` : "指标详情"} description="查看指标定义、统计口径与历史趋势" returnFocusRef={selectedTrigger}>
      {selected ? <section className={`cc-kpi-detail tone-${selected.tone}`}>
        <header><span>OBSERVATION METRIC</span><h3>{selected.label}</h3></header>
        <div className="cc-kpi-detail-value"><strong>{selected.value}</strong><span>{selected.note}</span></div>
        <div className="cc-kpi-detail-chart"><Sparkline values={selected.trend} detail/><span>历史可用年度趋势</span></div>
        <dl>
          <div><dt>指标定义</dt><dd>{selected.definition}</dd></div>
          <div><dt>当前口径</dt><dd>{data.scope.reportYear} 报告年度 · 当前筛选样本</dd></div>
          <div><dt>数据版本</dt><dd>{data.scope.dataVersion} · metric-contract-v2</dd></div>
        </dl>
        <footer>风险指标仅用于发现待复核信号，最终判断由研究人员完成。</footer>
      </section> : null}
    </DashboardDetailDialog>
  </>;
}
