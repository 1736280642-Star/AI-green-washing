"use client";

import * as echarts from "echarts";
import { useEffect, useMemo, useRef } from "react";
import { useDemoStore } from "@/stores/demo-store";
import type { CompanyYearRecord } from "@/types";

const riskBands = [
  { key: "high", label: "高风险", color: "#FF5C6C" },
  { key: "medium", label: "中风险", color: "#FF9F43" },
  { key: "low", label: "低风险", color: "#5B8CFF" },
] as const;

const evidenceStates = [
  { key: "verified", label: "已验证", color: "#38E07B" },
  { key: "pending", label: "待复核", color: "#F4D35E" },
  { key: "insufficient", label: "证据不足", color: "#7F8C86" },
  { key: "disputed", label: "存在争议", color: "#E879F9" },
] as const;

export function DashboardTelemetry({ companies }: { companies: CompanyYearRecord[] }) {
  const riskChart = useRef<HTMLDivElement>(null);
  const radarChart = useRef<HTMLDivElement>(null);
  const { selectedCompanyId, selectCompany, setFilters } = useDemoStore();
  const selected = companies.find((company) => company.companyId === selectedCompanyId) ?? companies[0];

  const riskData = useMemo(() => riskBands.map((band) => ({
    ...band,
    value: companies.filter((company) => company.riskBand === band.key).length,
  })), [companies]);
  const evidenceData = useMemo(() => evidenceStates.map((state) => ({
    ...state,
    value: companies.filter((company) => company.evidenceStatus === state.key).length,
  })), [companies]);
  const componentAverages = useMemo(() => selected.components.map((component, index) => {
    const total = companies.reduce((sum, company) => sum + company.components[index].value, 0);
    return Math.round(total / Math.max(1, companies.length));
  }), [companies, selected.components]);

  useEffect(() => {
    if (!riskChart.current) return;
    const chart = echarts.init(riskChart.current, undefined, { renderer: "canvas" });
    chart.setOption({
      animationDuration: 360,
      aria: { enabled: true, decal: { show: false }, description: `当前筛选共 ${companies.length} 家合成公司，按风险等级展示样本数量。` },
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(12,17,16,.96)",
        borderColor: "rgba(255,255,255,.16)",
        textStyle: { color: "#F4F7F5" },
        formatter: "{b}<br/>{c} 家 · {d}%",
      },
      series: [{
        type: "pie",
        radius: ["58%", "82%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: true,
        silent: true,
        label: { show: false },
        itemStyle: { borderColor: "#0C1110", borderWidth: 2 },
        data: riskData.map((item) => ({ name: item.label, value: item.value, itemStyle: { color: item.color } })),
      }],
      graphic: [{
        type: "text",
        left: "center",
        top: "38%",
        style: { text: `${companies.length}\n样本`, fill: "#F4F7F5", font: '600 14px "IBM Plex Mono", monospace', textAlign: "center", lineHeight: 18 },
      }],
    });
    const resize = new ResizeObserver(() => chart.resize());
    resize.observe(riskChart.current);
    return () => { resize.disconnect(); chart.dispose(); };
  }, [companies.length, riskData]);

  useEffect(() => {
    if (!radarChart.current) return;
    const chart = echarts.init(radarChart.current, undefined, { renderer: "canvas" });
    chart.setOption({
      animationDurationUpdate: 320,
      aria: { enabled: true, decal: { show: false }, description: `${selected.companyName}六类风险信号与当前样本均值对比。` },
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(12,17,16,.96)",
        borderColor: "rgba(255,255,255,.16)",
        textStyle: { color: "#F4F7F5" },
      },
      radar: {
        center: ["50%", "52%"],
        radius: "62%",
        splitNumber: 4,
        indicator: selected.components.map((component) => ({ name: component.label.replace("未验证", "未验证\n"), max: 100 })),
        axisName: { color: "#89958F", fontSize: 9, lineHeight: 11 },
        axisLine: { lineStyle: { color: "rgba(255,255,255,.09)" } },
        splitLine: { lineStyle: { color: "rgba(255,255,255,.08)" } },
        splitArea: { show: false },
      },
      series: [{
        type: "radar",
        symbol: "none",
        lineStyle: { width: 1.5 },
        data: [
          { name: selected.companyName, value: selected.components.map((component) => component.value), lineStyle: { color: "#FF9F43" }, areaStyle: { color: "rgba(255,159,67,.16)" } },
          { name: "当前样本均值", value: componentAverages, lineStyle: { color: "#30D5E8", type: "dashed" }, areaStyle: { color: "rgba(48,213,232,.04)" } },
        ],
      }],
    });
    const resize = new ResizeObserver(() => chart.resize());
    resize.observe(radarChart.current);
    return () => { resize.disconnect(); chart.dispose(); };
  }, [componentAverages, selected]);

  return (
    <section className="panel dashboard-telemetry" aria-label="样本遥测">
      <header className="panel-header"><div><h3>样本遥测</h3><p>分布、证据与六类信号</p></div><code>SYN-25</code></header>
      <div className="telemetry-body">
        <section className="telemetry-block risk-mix">
          <div className="telemetry-block-title"><span>风险分布</span><small>点击筛选</small></div>
          <div className="telemetry-risk-layout">
            <div ref={riskChart} className="telemetry-donut" role="img" aria-label="风险等级分布环图" />
            <div className="telemetry-legend">
              {riskData.map((item) => <button key={item.key} onClick={() => setFilters({ risk: item.label })}><i style={{ background: item.color }} /><span>{item.label}</span><code>{item.value}</code></button>)}
            </div>
          </div>
        </section>
        <section className="telemetry-block evidence-mix">
          <div className="telemetry-block-title"><span>证据状态</span><small>{companies.length} 个公司-年份</small></div>
          <div className="evidence-stack" aria-label="证据状态占比">
            {evidenceData.map((item) => <i key={item.key} style={{ width: `${item.value / Math.max(1, companies.length) * 100}%`, background: item.color }} title={`${item.label} ${item.value} 家`} />)}
          </div>
          <div className="evidence-state-grid">
            {evidenceData.map((item) => <button key={item.key} onClick={() => selectCompany(companies.find((company) => company.evidenceStatus === item.key)?.companyId ?? null)}><span><i style={{ background: item.color }} />{item.label}</span><code>{item.value}</code></button>)}
          </div>
        </section>
        <section className="telemetry-block signal-radar">
          <div className="telemetry-block-title"><span>六类信号</span><small><i className="selected-series" />选中 <i className="average-series" />样本均值</small></div>
          <div ref={radarChart} className="telemetry-radar" role="img" aria-label={`${selected.companyName}六类风险信号雷达图`} />
        </section>
      </div>
    </section>
  );
}
