"use client";

import * as echarts from "echarts";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CompanyYearRecord } from "@/types";
import { useDemoStore } from "@/stores/demo-store";

const statusColors = { verified: "#38E07B", pending: "#F4D35E", insufficient: "#7F8C86", disputed: "#E879F9" };

export function ClaimFactMatrix({ companies }: { companies: CompanyYearRecord[] }) {
  const element = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { selectedCompanyId, selectCompany } = useDemoStore();
  const [showTable, setShowTable] = useState(false);
  const selected = companies.find((company) => company.companyId === selectedCompanyId);
  const data = useMemo(() => companies.map((company) => ({
    name: company.companyName,
    companyId: company.companyId,
    value: [company.claimPercentile, company.factPercentile, Math.max(8, company.eventCount * 2 + 6)],
    itemStyle: {
      color: statusColors[company.evidenceStatus],
      opacity: !selectedCompanyId || selectedCompanyId === company.companyId ? 1 : 0.28,
      borderColor: selectedCompanyId === company.companyId ? "#F4F7F5" : statusColors[company.evidenceStatus],
      borderWidth: selectedCompanyId === company.companyId ? 2 : 1,
    },
  })), [companies, selectedCompanyId]);

  useEffect(() => {
    if (!element.current) return;
    const chart = echarts.init(element.current, undefined, { renderer: "canvas" });
    chart.setOption({
      animationDurationUpdate: 320,
      textStyle: { fontFamily: "Inter, Noto Sans SC, sans-serif", color: "#A7B0AC" },
      grid: { left: 56, right: 24, top: 32, bottom: 54 },
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(12,17,16,.96)", borderColor: "rgba(255,255,255,.16)", textStyle: { color: "#F4F7F5" },
        formatter: (params: { data: { name: string; value: number[]; companyId: string } }) => {
          const company = companies.find((item) => item.companyId === params.data.companyId);
          return `<b>${params.data.name}</b><br/>声明强度：${params.data.value[0]} 分位<br/>外部事实：${params.data.value[1]} 分位<br/>事件：${company?.eventCount ?? 0} 条<br/>点击固定 · 双击打开分析`;
        },
      },
      xAxis: {
        type: "value", min: 0, max: 100, name: "绿色声明强度分位 →", nameLocation: "middle", nameGap: 34,
        axisLine: { lineStyle: { color: "rgba(255,255,255,.14)" } }, axisLabel: { color: "#6F7A75" }, splitLine: { lineStyle: { color: "rgba(255,255,255,.055)" } },
      },
      yAxis: {
        type: "value", min: 0, max: 100, name: "外部事实强度分位 ↑", nameGap: 38,
        axisLine: { lineStyle: { color: "rgba(255,255,255,.14)" } }, axisLabel: { color: "#6F7A75" }, splitLine: { lineStyle: { color: "rgba(255,255,255,.055)" } },
      },
      series: [{
        type: "scatter", data, symbolSize: (value: number[]) => value[2],
        markArea: { silent: true, itemStyle: { color: "rgba(255,92,108,.035)", borderColor: "rgba(255,92,108,.35)", borderWidth: 1 }, label: { show: true, color: "#FF9F43", fontSize: 10 }, data: [[{ name: "优先复核区", xAxis: 70, yAxis: 70 }, { xAxis: 100, yAxis: 100 }]] },
        emphasis: { scale: false },
      }],
    });
    chart.on("click", (params) => selectCompany((params.data as { companyId: string }).companyId));
    chart.on("dblclick", (params) => router.push(`/companies/${(params.data as { companyId: string }).companyId}?year=2025`));
    const resize = new ResizeObserver(() => chart.resize());
    resize.observe(element.current);
    return () => { resize.disconnect(); chart.dispose(); };
  }, [companies, data, router, selectCompany]);

  function moveSelection(direction: number) {
    const current = Math.max(0, companies.findIndex((company) => company.companyId === selectedCompanyId));
    const next = (current + direction + companies.length) % companies.length;
    selectCompany(companies[next].companyId);
  }

  return (
    <div className="chart-wrap">
      <div ref={element} className="chart-canvas" role="img" tabIndex={0} aria-label="声明强度与外部事实强度散点矩阵。右上象限是优先复核区。按左右方向键切换公司。" onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowUp") moveSelection(1);
        if (event.key === "ArrowLeft" || event.key === "ArrowDown") moveSelection(-1);
        if (event.key === "Escape") selectCompany(null);
        if (event.key === "Enter" && selectedCompanyId) router.push(`/companies/${selectedCompanyId}?year=2025`);
      }} />
      {selected && <>
        <svg className="trace-line" viewBox="0 0 240 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 68 L88 68 L108 30 L240 30" /></svg>
        <button className="selected-summary" onClick={() => router.push(`/companies/${selected.companyId}?year=2025`)}>
          <strong>{selected.companyName}</strong><span>风险 {selected.riskScore} · {selected.eventCount} 条事件</span>
        </button>
      </>}
      <button className="text-button chart-table-toggle" onClick={() => setShowTable(!showTable)}>{showTable ? "隐藏数据表" : "查看数据表"}</button>
      {showTable && <div className="chart-data-table"><table><thead><tr><th>公司</th><th>声明分位</th><th>事实分位</th></tr></thead><tbody>{companies.map((company) => <tr key={company.companyId}><td>{company.companyName}</td><td>{company.claimPercentile}</td><td>{company.factPercentile}</td></tr>)}</tbody></table></div>}
    </div>
  );
}
