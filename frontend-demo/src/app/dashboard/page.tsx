"use client";

import { Bot, Download, FileWarning, RefreshCw, SearchCheck, Sigma, Users } from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { SubstanceSeverityMatrix } from "@/components/charts/claim-fact-matrix";
import { analysisRepository, type DemoScenario } from "@/repositories";
import { useDemoStore } from "@/stores/demo-store";
import { formatDecimal, formatPercent, getMetric, type CompanyYearRecord, type DashboardInsights, type MetricCode } from "@/types";

const DashboardTelemetry = dynamic(() => import("@/components/charts/dashboard-telemetry").then((module) => module.DashboardTelemetry), { ssr: false, loading: () => <TelemetryLoading /> });
const DashboardRiskInsights = dynamic(() => import("@/components/charts/dashboard-risk-insights").then((module) => module.DashboardRiskInsights), { ssr: false, loading: () => <LowerDashboardLoading label="正在整理指标结构" /> });
const DashboardReviewOperations = dynamic(() => import("@/components/dashboard-review-operations").then((module) => module.DashboardReviewOperations), { ssr: false, loading: () => <LowerDashboardLoading label="正在整理复核队列" /> });

const recommendations: Record<MetricCode, string> = {
  EASS: "核对已实施行动、计划行动与模糊声明的分类",
  IR: "抽查模糊声明的分子与环境声明总数",
  UPR: "核验时间、KPI、方法和行动路径",
  ESGSI: "比对积极语言与实质信息构成",
  EAA_ESGSI: "检查四项公式构成与版本",
  IMBALANCE: "确认 E/S/G 关注度差异是否符合行业语境",
};

export default function DashboardPage() { return <Suspense fallback={<DashboardLoading />}><DashboardContent /></Suspense>; }

function DashboardContent() {
  const params = useSearchParams(); const scenario = (params.get("scenario") ?? "success") as DemoScenario;
  const [items,setItems]=useState<CompanyYearRecord[]>([]); const [insights,setInsights]=useState<DashboardInsights|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState<string|null>(null); const [selectedFactor,setSelectedFactor]=useState<MetricCode|null>(null);
  const [compactMobile,setCompactMobile]=useState(false);
  const { year,industry,risk,selectedCompanyId,pendingReviews,openDrawer,notify,showToast,setFilters,selectCompany }=useDemoStore();
  useEffect(()=>{let active=true;void Promise.resolve().then(()=>{if(active){setLoading(true);setError(null);}});const riskBand={"高风险":"high","中风险":"medium","低风险":"low","暂不可评分":"unavailable"}[risk];Promise.all([analysisRepository.listCompanies(scenario,{year,industry:industry==="全部行业"?undefined:industry,riskBand}),analysisRepository.getDashboardInsights(scenario)]).then(([companies,dashboard])=>{if(active){setItems(companies);setInsights(dashboard);}}).catch((reason:Error)=>active&&setError(reason.message)).finally(()=>active&&setLoading(false));return()=>{active=false;};},[industry,risk,scenario,year]);
  useEffect(()=>{const query=window.matchMedia("(max-width: 767px)");const update=()=>setCompactMobile(query.matches);update();query.addEventListener("change",update);return()=>query.removeEventListener("change",update);},[]);
  const handleIndustrySelect=useCallback((value:string)=>setFilters({industry:value}),[setFilters]);
  const filtered=items;
  const selected=filtered.find((company)=>company.companyId===selectedCompanyId)??filtered[0];
  const focused=useMemo(()=>selectedFactor?filtered.filter((company)=>(getMetric(company,selectedFactor)?.riskValue??0)>=.5):filtered,[filtered,selectedFactor]);
  const totalStatements=filtered.reduce((sum,company)=>sum+company.environmentalActions.totalStatements,0); const highRisk=filtered.filter((company)=>company.riskBand==="high").length;

  function exportSummary(){const content=`演示数据，不代表任何真实主体。\n\nMetric contract: v1\n公司-年份：${filtered.length}\n环境声明：${totalStatements}\n高风险：${highRisk}\n待复核：${pendingReviews}\n`;const url=URL.createObjectURL(new Blob([content],{type:"text/plain;charset=utf-8"}));const anchor=document.createElement("a");anchor.href=url;anchor.download=`greenlens-eaa-esgsi-demo-${new Date().toISOString().slice(0,10)}.txt`;anchor.click();URL.revokeObjectURL(url);notify("导出已完成","E-AA-ESGSI 合成摘要已生成。");showToast("演示研究摘要已导出");}
  if(loading)return<DashboardLoading/>; if(error)return<StatePanel title="演示数据载入失败" detail={`成因：${error}。影响：当前图表无法展示。下一步：检查数据接口后重新载入。`} action="重新载入" onAction={()=>location.reload()}/>; if(!filtered.length)return<StatePanel title="当前筛选下没有样本" detail="当前报告年、行业或风险组合没有公司-年份记录。" action="恢复默认视图" onAction={()=>setFilters({year:2025,industry:"全部行业",risk:"全部风险"})}/>;
  const primaryMetric=[...selected.metrics].filter((metric)=>metric.code!=="EAA_ESGSI").sort((a,b)=>(b.riskValue??0)-(a.riskValue??0))[0];
  return <div className="page dashboard-page dense-dashboard">
    <header className="page-header dense-page-header"><div><h2>风险总览</h2><p>E-AA-ESGSI 计算审计台 · 报告年 {year} · 合成数据</p></div><div className="header-actions"><code className="contract-code">metric-contract-v1</code><button className="secondary-button" onClick={exportSummary}><Download size={15}/>导出演示</button></div></header>
    <section className="metric-strip" aria-label="总览指标"><Metric icon={<Users/>} label="公司-年份" value={String(filtered.length)} note="当前筛选"/><Metric icon={<Sigma/>} label="环境声明" value={totalStatements.toLocaleString()} note="行动分类分母"/><Metric icon={<FileWarning/>} label="高风险" value={String(highRisk)} note="最终指数 > 0.66"/><button className="metric-item metric-button" onClick={()=>location.assign("/review")}><span className="metric-label"><span>待复核</span><SearchCheck size={14}/></span><div className="metric-value">{pendingReviews}<small>进入队列</small></div></button></section>
    <div className="dashboard-grid dense-dashboard-grid">
      <DashboardTelemetry companies={filtered}/>
      <section className="panel chart-panel"><header className="panel-header"><div><h3>行动实质性 × 最终指数</h3><p>左上象限优先复核 · 气泡大小为环境声明数</p></div><span className="chart-legend"><i className="danger"/>高 <i className="pending"/>中 <i className="low"/>低</span></header><SubstanceSeverityMatrix companies={filtered}/></section>
      <section className="panel dashboard-analysis-panel formula-ledger-panel"><header className="panel-header"><div><h3>{selected.companyName} · 指数账本</h3><p>原始值、风险方向与公式构成</p></div><span className={`status-chip ${selected.riskBand}`}>{formatPercent(selected.finalIndex)}</span></header><div className="panel-body">
        <div className="metric-ledger">{selected.metrics.filter((metric)=>metric.code!=="EAA_ESGSI").map((metric)=><button key={metric.code} className="ledger-row" disabled={!metric.evidenceIds[0]} onClick={()=>{selectCompany(selected.companyId,selected.reportYear);useDemoStore.getState().selectEvidence(metric.evidenceIds[0]);openDrawer("ai");}}><span><strong>{metric.code}</strong><small>{metric.label}</small></span><span className="ledger-meter"><i style={{width:`${(metric.riskValue??0)*100}%`}}/><b style={{left:`${(metric.threshold??.5)*100}%`}}/></span><code>{metric.rawValue==null?"--":`${Math.round(metric.rawValue*100)}%`}</code></button>)}</div>
        <div className="index-waterfall" aria-label="最终指数公式拆解"><span><small>ESGSI</small><strong>{formatDecimal(selected.indexBreakdown.baseEsgsi)}</strong></span><i>+</i><span><small>行动</small><strong>{formatDecimal(selected.indexBreakdown.actionPenalty)}</strong></span><i>+</i><span><small>模糊</small><strong>{formatDecimal(selected.indexBreakdown.indeterminatePenalty)}</strong></span><i>+</i><span><small>计划</small><strong>{formatDecimal(selected.indexBreakdown.planningPenalty)}</strong></span><i>=</i><span className="final"><small>最终</small><strong>{formatDecimal(selected.indexBreakdown.finalIndex)}</strong></span></div>
        <section className="signal-brief"><div className="signal-brief-heading"><span><Bot size={13}/>首要线索</span><code>{primaryMetric.code}</code></div><p>{primaryMetric.label}风险方向值为<strong>{formatPercent(primaryMetric.riskValue)}</strong>。{recommendations[primaryMetric.code]}</p><button className="text-button" disabled={!primaryMetric.evidenceIds[0]} onClick={()=>{selectCompany(selected.companyId,selected.reportYear);useDemoStore.getState().selectEvidence(primaryMetric.evidenceIds[0]);openDrawer("ai");}}>查看分子分母与证据</button></section>
      </div></section>
    </div>
    {insights&&<><DashboardRiskInsights companies={focused.length?focused:filtered} insights={insights} selectedFactor={selectedFactor} onSelectFactor={setSelectedFactor} onSelectIndustry={handleIndustrySelect}/><DashboardReviewOperations companies={focused.length?focused:filtered} insights={insights} selectedFactor={selectedFactor} compact={compactMobile}/></>}
  </div>;
}

function Metric({icon,label,value,note}:{icon:React.ReactNode;label:string;value:string;note:string}){return<div className="metric-item"><span className="metric-label"><span>{label}</span>{icon}</span><div className="metric-value">{value}<small>{note}</small></div></div>;}
function DashboardLoading(){return<div className="page"><div className="skeleton skeleton-header"/><div className="metric-strip">{[1,2,3,4].map((i)=><div className="metric-item" key={i}><span className="skeleton skeleton-line"/><span className="skeleton skeleton-value"/></div>)}</div><div className="dashboard-grid"><div className="panel skeleton-panel"/><div className="panel skeleton-panel"/></div></div>;}
function TelemetryLoading(){return<div className="panel dashboard-telemetry telemetry-loading"><span className="skeleton skeleton-line"/><span className="skeleton skeleton-panel"/></div>;}
function LowerDashboardLoading({label}:{label:string}){return<section className="dashboard-band lower-dashboard-loading" aria-label={label}><span className="skeleton skeleton-line"/><div className="skeleton skeleton-panel"/></section>;}
function StatePanel({title,detail,action,onAction}:{title:string;detail:string;action:string;onAction:()=>void}){return<div className="state-panel"><RefreshCw size={24}/><h2>{title}</h2><p>{detail}</p><button className="primary-button" onClick={onAction}>{action}</button></div>;}
