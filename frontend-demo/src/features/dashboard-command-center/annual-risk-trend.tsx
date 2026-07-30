"use client";

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import { CommandPanelHeading } from "./panel-heading";
import { useEChart } from "./use-echart";
import type { DashboardAnnualTrendPoint } from "@/types";

export function AnnualRiskTrend({ data, expanded = false, onExpand }: { data: DashboardAnnualTrendPoint[]; expanded?: boolean; onExpand?: () => void }) {
  const option = useMemo<EChartsOption>(() => ({
    animationDuration: 720,
    grid: { left: expanded ? 54 : 42, right: expanded ? 32 : 18, top: expanded ? 42 : 28, bottom: expanded ? 42 : 30 },
    tooltip: { trigger: "axis", backgroundColor: "rgba(4,18,9,.96)", borderColor: "rgba(59,220,131,.35)", textStyle: { color: "#e5f3e9", fontSize: 12 }, valueFormatter: (value) => value == null ? "—" : `${Math.round(Number(value) * 100)}%` },
    legend: { top: 0, right: 8, itemWidth: 12, itemHeight: 3, textStyle: { color: "#9bb2a2", fontSize: expanded ? 14 : 13 } },
    xAxis: { type: "category", boundaryGap: false, data: data.map((item) => item.year), axisLabel: { color: "#91aa99", fontSize: expanded ? 14 : 13 }, axisLine: { lineStyle: { color: "rgba(79,168,107,.18)" } }, axisTick: { show: false } },
    yAxis: { type: "value", min: 0, max: 1, axisLabel: { color: "#91aa99", fontSize: expanded ? 14 : 13, formatter: (value: number) => `${Math.round(value * 100)}%` }, splitLine: { lineStyle: { color: "rgba(79,168,107,.08)" } } },
    series: [
      { name: "E-AA 中位数", type: "line", smooth: .25, showSymbol: false, data: data.map((item) => item.medianFinalIndex), lineStyle: { width: 2, color: "#3bdc83" }, areaStyle: { color: "rgba(59,220,131,.09)" } },
      { name: "高风险比例", type: "line", smooth: .25, showSymbol: false, data: data.map((item) => item.highRiskRate), lineStyle: { width: 1.5, color: "#ff6b5e" } },
      { name: "EASS 中位数", type: "line", smooth: .25, showSymbol: false, data: data.map((item) => item.medianEass), lineStyle: { width: 1, type: "dashed", color: "#89aa94" } },
    ],
  }), [data, expanded]);
  const ref = useEChart(option);
  return <section className={`cc-panel cc-trend-panel ${expanded ? "cc-panel-expanded" : ""}`}><CommandPanelHeading eyebrow="2016–2025" title="十年风险趋势" detail={expanded ? "离散年度 · 不补齐缺失" : undefined} onExpand={expanded ? undefined : onExpand} expandLabel="展开十年风险趋势"/><div className="cc-bottom-chart" ref={ref} role="img" aria-label="十年 E-AA、高风险比例与 EASS 趋势图"/></section>;
}
