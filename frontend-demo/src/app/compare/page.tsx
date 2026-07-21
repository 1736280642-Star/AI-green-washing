"use client";

import { Download, Plus, Share2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { companies } from "@/mocks/fixtures/companies";
import { useDemoStore } from "@/stores/demo-store";

const colors = ["#30D5E8", "#5B8CFF", "#F4D35E", "#E879F9", "#FF9F43"];

export default function ComparePage() {
  const { compareIds, toggleCompare, showToast, notify } = useDemoStore();
  const [view, setView] = useState<"structure" | "ratings" | "timeline">("structure");
  const [mode, setMode] = useState<"companies" | "years">("companies");
  const [dimension, setDimension] = useState(1);
  const selected = useMemo(() => companies.filter((company) => compareIds.includes(company.companyId)), [compareIds]);
  function exportCompare() { notify("对比摘要已导出", `${selected.length} 家合成公司的对比摘要已生成。`); showToast("对比摘要已导出"); }
  if (selected.length < 2) return <div className="state-panel"><Plus size={24}/><h2>选择至少 2 家企业</h2><p>从企业库选择 2-5 家合成公司后，这里会展示风险结构、评级分歧和事件时间线。</p><Link className="primary-button" href="/companies">从企业库选择</Link></div>;
  return <div className="page compare-page">
    <header className="page-header"><div><h2>对比分析</h2><p>比较风险结构差异，不生成企业“好坏”排名。</p></div><div className="header-actions"><button className="secondary-button" onClick={() => { navigator.clipboard.writeText(location.href); showToast("分享链接已复制"); }}><Share2 size={15}/>复制链接</button><button className="secondary-button" onClick={exportCompare}><Download size={15}/>导出摘要</button></div></header>
    <section className="compare-selector"><div className="company-chips">{selected.map((company, index) => <button key={company.companyId} style={{ "--series-color": colors[index] } as React.CSSProperties} onClick={() => toggleCompare(company.companyId)}><i/>{company.companyName}<span>×</span></button>)}<Link href="/companies" className="icon-button" title="添加企业"><Plus/></Link></div><div className="segmented"><button className={mode==="companies"?"selected":""} onClick={()=>setMode("companies")}>企业对比</button><button className={mode==="years"?"selected":""} onClick={()=>setMode("years")}>年份对比</button></div></section>
    {mode === "years" && <div className="mode-notice">年份对比使用同一组合的 2024 与 2025 合成口径，所有图表保持当前公司颜色。</div>}
    <div className="tabs" role="tablist">{[["structure","风险结构"],["ratings","评级分歧"],["timeline","事件时间线"]].map(([id,label]) => <button role="tab" aria-selected={view === id} className={view === id ? "active" : ""} onClick={() => setView(id as typeof view)} key={id}>{label}</button>)}</div>
    {view === "structure" && <><section className="panel"><header className="panel-header"><div><h3>风险维度热力表</h3><p>颜色表达相对高低，单元格保留精确值</p></div></header><div className="heat-table" role="table"> <div className="heat-row heat-head"><span>风险维度</span>{selected.map((company) => <span key={company.companyId}>{company.companyName}</span>)}</div>{selected[0].components.map((component, componentIndex) => <button className={`heat-row ${dimension === componentIndex ? "selected" : ""}`} onClick={() => setDimension(componentIndex)} key={component.code}><strong>{component.label}</strong>{selected.map((company, companyIndex) => <span key={company.companyId} style={{ backgroundColor: `${colors[companyIndex]}${Math.round(company.components[componentIndex].value * 1.7).toString(16).padStart(2,"0")}` }}>{company.components[componentIndex].value}</span>)}</button>)}</div></section><section className="panel"><header className="panel-header"><div><h3>{selected[0].components[dimension].label} · 贡献对比</h3><p>当前维度跨企业保持同一颜色映射</p></div></header><div className="comparison-bars">{selected.map((company,index) => <div key={company.companyId}><span>{company.companyName}<code>{company.components[dimension].contribution}</code></span><i><b style={{ width: `${company.components[dimension].value}%`, background: colors[index] }}/></i></div>)}</div></section></>}
    {view === "ratings" && <section className="panel dotplot-panel"><header className="panel-header"><h3>多源评级分歧</h3><span>Northstar ESG · CivicRate · TerraIndex · Veritas E</span></header>{selected.map((company,index) => <div className="rating-row" key={company.companyId}><strong>{company.companyName}</strong><div>{[company.riskScore! - 18, company.riskScore! - 7, company.riskScore! + 4, company.riskScore! + 11].map((score,i) => <i title={`虚构评级源 ${i+1}: ${score}`} key={i} style={{ left: `${score}%`, background: colors[index] }}/>)}</div></div>)}</section>}
    {view === "timeline" && <section className="panel timeline-panel"><header className="panel-header"><h3>事件时间线</h3><span>事件日期与报告发布日期分开呈现</span></header>{selected.map((company,index) => <div className="timeline-row" key={company.companyId}><strong>{company.companyName}</strong><div><span style={{ left: "28%", borderColor: colors[index] }}>2023 报告</span><span style={{ left: "55%", borderColor: colors[index] }}>2024 事件</span><span style={{ left: "82%", borderColor: colors[index] }}>2025 报告</span></div></div>)}</section>}
  </div>;
}
