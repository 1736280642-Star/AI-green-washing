"use client";

import * as echarts from "echarts";
import { RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CompanyYearRecord, DashboardInsights, RiskComponent } from "@/types";

type FactorCode = RiskComponent["code"];
type DiagnosticMode = "risk" | "evidence" | "review";

interface RiskInsightsProps {
  companies: CompanyYearRecord[];
  insights: DashboardInsights;
  selectedFactor: FactorCode | null;
  onSelectFactor: (factor: FactorCode | null) => void;
  onSelectIndustry: (industry: string) => void;
}

const tooltip = {
  backgroundColor: "rgba(12,17,16,.97)",
  borderColor: "rgba(255,255,255,.16)",
  textStyle: { color: "#F4F7F5", fontSize: 11 },
};

export function DashboardRiskInsights({ companies, insights, selectedFactor, onSelectFactor, onSelectIndustry }: RiskInsightsProps) {
  const paretoRef = useRef<HTMLDivElement>(null);
  const heatmapRef = useRef<HTMLDivElement>(null);
  const diagnosticRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<DiagnosticMode>("risk");

  const factors = useMemo(() => companies[0].components.map((component, index) => ({
    code: component.code,
    label: component.label,
    index,
  })), [companies]);

  const pareto = useMemo(() => {
    const values = factors.map((factor) => ({
      ...factor,
      cases: companies.filter((company) => company.components[factor.index].value >= 55).length,
    })).sort((a, b) => b.cases - a.cases);
    const total = values.reduce((sum, item) => sum + item.cases, 0);
    return values.map((item, index) => ({
      ...item,
      cumulative: Math.round(values.slice(0, index + 1).reduce((sum, entry) => sum + entry.cases, 0) / Math.max(1, total) * 100),
    }));
  }, [companies, factors]);

  const industries = useMemo(() => [...new Set(companies.map((company) => company.industry))], [companies]);
  const heatmapData = useMemo(() => industries.flatMap((industry, industryIndex) => factors.map((factor, factorIndex) => {
    const group = companies.filter((company) => company.industry === industry);
    const average = Math.round(group.reduce((sum, company) => sum + company.components[factor.index].value, 0) / Math.max(1, group.length));
    return [factorIndex, industryIndex, average];
  })), [companies, factors, industries]);

  useEffect(() => {
    if (!paretoRef.current) return;
    const chart = echarts.init(paretoRef.current, undefined, { renderer: "canvas" });
    chart.setOption({
      animationDuration: 320,
      aria: { enabled: true, decal: { show: false }, description: "按高信号样本数排序的问题类型帕累托图，折线表示累计占比。" },
      grid: { left: 88, right: 40, top: 24, bottom: 28 },
      tooltip: { ...tooltip, trigger: "axis" },
      xAxis: { type: "value", splitLine: { lineStyle: { color: "rgba(255,255,255,.06)" } }, axisLabel: { color: "#718078", fontSize: 9 }, axisLine: { show: false } },
      yAxis: { type: "category", inverse: true, data: pareto.map((item) => item.label), axisTick: { show: false }, axisLine: { show: false }, axisLabel: { color: "#AEB8B3", fontSize: 10 } },
      series: [
        {
          name: "高信号样本",
          type: "bar",
          barWidth: 10,
          data: pareto.map((item) => ({
            value: item.cases,
            itemStyle: { color: selectedFactor === item.code ? "#F4D35E" : "#38E07B", borderRadius: [0, 2, 2, 0] },
          })),
        },
        {
          name: "累计占比",
          type: "line",
          xAxisIndex: 0,
          symbolSize: 5,
          lineStyle: { color: "#30D5E8", width: 1.5 },
          itemStyle: { color: "#30D5E8" },
          data: pareto.map((item) => Math.round(item.cumulative * Math.max(...pareto.map((entry) => entry.cases), 1) / 100)),
          tooltip: { valueFormatter: (value: number) => `${Math.round(Number(value) / Math.max(...pareto.map((entry) => entry.cases), 1) * 100)}%` },
        },
      ],
    });
    chart.on("click", (params) => {
      const factor = pareto[params.dataIndex];
      if (factor) onSelectFactor(selectedFactor === factor.code ? null : factor.code);
    });
    const resize = new ResizeObserver(() => chart.resize());
    resize.observe(paretoRef.current);
    return () => { resize.disconnect(); chart.dispose(); };
  }, [onSelectFactor, pareto, selectedFactor]);

  useEffect(() => {
    if (!heatmapRef.current) return;
    const chart = echarts.init(heatmapRef.current, undefined, { renderer: "canvas" });
    chart.setOption({
      animationDuration: 320,
      aria: { enabled: true, decal: { show: false }, description: "行业与六类风险信号的平均强度热力图。" },
      grid: { left: 80, right: 16, top: 12, bottom: 54 },
      tooltip: { ...tooltip, formatter: (params: { value: number[] }) => `${industries[params.value[1]]}<br/>${factors[params.value[0]].label} · ${params.value[2]}` },
      xAxis: { type: "category", data: factors.map((factor) => factor.label), splitArea: { show: false }, axisLine: { lineStyle: { color: "rgba(255,255,255,.12)" } }, axisTick: { show: false }, axisLabel: { color: "#89958F", fontSize: 9, interval: 0, rotate: 24 } },
      yAxis: { type: "category", data: industries, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: "#AEB8B3", fontSize: 10 } },
      visualMap: { min: 25, max: 85, show: false, inRange: { color: ["#17221E", "#1E6150", "#F4D35E", "#FF5C6C"] } },
      series: [{
        type: "heatmap",
        data: heatmapData,
        label: { show: true, color: "#F4F7F5", fontSize: 9 },
        itemStyle: { borderColor: "#0C1110", borderWidth: 2 },
        emphasis: { itemStyle: { borderColor: "#F4F7F5", borderWidth: 1 } },
      }],
    });
    chart.on("click", (params) => {
      const cell = params.data as number[];
      const factor = factors[cell[0]];
      const industry = industries[cell[1]];
      if (factor && industry) {
        onSelectFactor(factor.code);
        onSelectIndustry(industry);
      }
    });
    const resize = new ResizeObserver(() => chart.resize());
    resize.observe(heatmapRef.current);
    return () => { resize.disconnect(); chart.dispose(); };
  }, [factors, heatmapData, industries, onSelectFactor, onSelectIndustry]);

  useEffect(() => {
    if (!diagnosticRef.current) return;
    const chart = echarts.init(diagnosticRef.current, undefined, { renderer: "canvas" });
    const base = {
      animationDuration: 280,
      aria: { enabled: true, decal: { show: false } },
      tooltip,
      grid: { left: 90, right: 24, top: 18, bottom: 28 },
    };
    if (mode === "risk") {
      const bins = [0, 20, 40, 60, 80];
      const counts = bins.map((start) => companies.filter((company) => (company.riskScore ?? 0) >= start && (company.riskScore ?? 0) < start + 20).length);
      chart.setOption({ ...base, xAxis: { type: "category", data: bins.map((start) => `${start}-${start + 19}`), axisLabel: { color: "#89958F" }, axisLine: { lineStyle: { color: "rgba(255,255,255,.12)" } } }, yAxis: { type: "value", axisLabel: { color: "#718078" }, splitLine: { lineStyle: { color: "rgba(255,255,255,.06)" } } }, series: [{ type: "bar", data: counts, barMaxWidth: 34, itemStyle: { color: "#FF9F43", borderRadius: [2, 2, 0, 0] } }] });
    } else if (mode === "evidence") {
      chart.setOption({ ...base, grid: { left: 98, right: 34, top: 12, bottom: 18 }, xAxis: { type: "value", max: 100, axisLabel: { color: "#718078", formatter: "{value}%" }, splitLine: { lineStyle: { color: "rgba(255,255,255,.06)" } } }, yAxis: { type: "category", inverse: true, data: insights.evidenceCoverage.map((item) => item.label), axisLabel: { color: "#AEB8B3" }, axisLine: { show: false }, axisTick: { show: false } }, series: [{ type: "bar", data: insights.evidenceCoverage.map((item) => item.coverage), barWidth: 10, itemStyle: { color: "#30D5E8", borderRadius: [0, 2, 2, 0] }, markLine: { silent: true, symbol: "none", lineStyle: { color: "#F4D35E", type: "dashed" }, data: [{ xAxis: 70 }] } }] });
    } else {
      const statuses = [
        { name: "待复核", value: companies.filter((company) => company.reviewStatus === "pending").length, itemStyle: { color: "#F4D35E" } },
        { name: "部分完成", value: companies.filter((company) => company.reviewStatus === "partial").length, itemStyle: { color: "#30D5E8" } },
        { name: "已复核", value: companies.filter((company) => company.reviewStatus === "reviewed").length, itemStyle: { color: "#38E07B" } },
        { name: "存在争议", value: companies.filter((company) => company.reviewStatus === "disputed").length, itemStyle: { color: "#E879F9" } },
      ];
      chart.setOption({ ...base, legend: { bottom: 0, textStyle: { color: "#89958F", fontSize: 10 }, itemWidth: 8, itemHeight: 8 }, series: [{ type: "pie", radius: ["46%", "72%"], center: ["50%", "44%"], label: { color: "#AEB8B3", fontSize: 10, formatter: "{b} {c}" }, itemStyle: { borderColor: "#0C1110", borderWidth: 2 }, data: statuses }] });
    }
    const resize = new ResizeObserver(() => chart.resize());
    resize.observe(diagnosticRef.current);
    return () => { resize.disconnect(); chart.dispose(); };
  }, [companies, insights.evidenceCoverage, mode]);

  return (
    <section className="dashboard-band risk-insights-band" aria-labelledby="risk-insights-title">
      <header className="dashboard-band-heading">
        <div><span className="section-kicker">RISK STRUCTURE</span><h2 id="risk-insights-title">风险从哪里聚集</h2><p>先定位共性问题，再下钻行业与单个任务。信号用于安排复核，不代表已确认结论。</p></div>
        {selectedFactor ? <button className="quiet-button" onClick={() => onSelectFactor(null)}><RotateCcw size={13} />清除问题筛选</button> : <span className="band-context">高信号阈值 ≥ 55</span>}
      </header>
      <div className="risk-insights-grid">
        <section className="insight-panel pareto-panel"><header><div><h3>问题类型 Pareto</h3><p>贡献最多的风险线索</p></div><span>5 / 12</span></header><div ref={paretoRef} className="insight-chart" role="img" aria-label="问题类型帕累托图" /><div className="pareto-factor-controls" aria-label="问题类型筛选">{pareto.map((factor) => <button key={factor.code} className={selectedFactor === factor.code ? "active" : ""} onClick={() => onSelectFactor(selectedFactor === factor.code ? null : factor.code)} aria-label={`筛选${factor.label}`} aria-pressed={selectedFactor === factor.code}>{factor.label}</button>)}</div></section>
        <section className="insight-panel heatmap-panel"><header><div><h3>行业 × 风险维度</h3><p>点击单元格联动任务流</p></div><span>7 / 12</span></header><div ref={heatmapRef} className="insight-chart" role="img" aria-label="行业风险维度热力图" /></section>
        <section className="insight-panel diagnostic-panel">
          <header><div><h3>结构诊断</h3><p>同一位置切换视角，避免重复图表</p></div><div className="segmented" role="tablist" aria-label="结构诊断视图">{([['risk','风险分布'],['evidence','证据缺口'],['review','复核状态']] as const).map(([key, label]) => <button key={key} role="tab" aria-selected={mode === key} className={mode === key ? "active" : ""} onClick={() => setMode(key)}>{label}</button>)}</div></header>
          <div ref={diagnosticRef} className="diagnostic-chart" role="img" aria-label={`${mode === "risk" ? "风险分布" : mode === "evidence" ? "证据缺口" : "复核状态"}图`} />
        </section>
      </div>
    </section>
  );
}
