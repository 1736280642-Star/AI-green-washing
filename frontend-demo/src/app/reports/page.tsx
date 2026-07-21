"use client";

import { AlertTriangle, Check, ChevronRight, FileText, Minimize2, Play, RotateCcw, UploadCloud } from "lucide-react";
import { DragEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDemoStore } from "@/stores/demo-store";

type Phase = "idle" | "validating" | "extracting" | "classifying" | "matching" | "scoring" | "complete" | "failed" | "ocr";
const steps: Array<{ id: Phase; label: string; detail: string; duration: number }> = [
  { id: "validating", label: "文件校验", detail: "类型、大小与基本结构", duration: 600 },
  { id: "extracting", label: "文本抽取", detail: "仅模拟文本层检测", duration: 1200 },
  { id: "classifying", label: "声明识别", detail: "定位目标、行动与量化指标", duration: 900 },
  { id: "matching", label: "证据匹配", detail: "关联合成外部事实", duration: 1200 },
  { id: "scoring", label: "生成结果", detail: "汇总风险与证据覆盖", duration: 900 },
];

export default function ReportsPage() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [company, setCompany] = useState("cy-materials");
  const [year, setYear] = useState("2025");
  const [phase, setPhase] = useState<Phase>("idle");
  const [completed, setCompleted] = useState<Phase[]>([]);
  const { notify, showToast } = useDemoStore();

  useEffect(() => {
    if (!["validating","extracting","classifying","matching","scoring"].includes(phase)) return;
    const current = steps.find((step) => step.id === phase)!;
    const timer = setTimeout(() => {
      if (phase === "extracting" && file?.name.toLowerCase().includes("broken")) { setPhase("failed"); return; }
      if (phase === "extracting" && file?.name.toLowerCase().includes("scan")) { setPhase("ocr"); return; }
      setCompleted((list) => [...list, phase]);
      const index = steps.findIndex((step) => step.id === phase);
      if (index === steps.length - 1) { setPhase("complete"); notify("报告检测完成", `${file?.name} 的合成分析已生成。`); showToast("报告检测已完成"); }
      else setPhase(steps[index + 1].id);
    }, current.duration);
    return () => clearTimeout(timer);
  }, [phase, file, notify, showToast]);

  function accept(candidate?: File) {
    if (!candidate) return;
    if (candidate.type !== "application/pdf" && !candidate.name.toLowerCase().endsWith(".pdf")) { showToast("请选择 PDF 文件"); return; }
    if (candidate.size > 30 * 1024 * 1024) { showToast("文件超过 30MB 限制"); return; }
    setFile({ name: candidate.name, size: candidate.size }); setPhase("idle"); setCompleted([]);
  }
  function drop(event: DragEvent) { event.preventDefault(); accept(event.dataTransfer.files[0]); }
  function start() { setCompleted([]); setPhase("validating"); }
  function reset() { setFile(null); setPhase("idle"); setCompleted([]); }
  const running = steps.some((step) => step.id === phase);

  return <div className="page reports-page">
    <header className="page-header"><div><h2>报告检测</h2><p>文件只在浏览器中读取名称、类型和大小，不读取正文、不上传。</p></div>{running && <button className="secondary-button" onClick={() => { notify("检测任务在后台运行", file?.name ?? "合成报告"); showToast("任务已最小化"); }}><Minimize2 size={15}/>最小化任务</button>}</header>
    {phase === "idle" && <div className="report-setup"><section className={`upload-zone ${file ? "has-file" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={drop}><input ref={input} type="file" accept="application/pdf" aria-label="选择待检测的 PDF 报告" onChange={(event) => accept(event.target.files?.[0])}/>{file ? <><FileText size={34}/><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</span><button className="text-button" onClick={() => input.current?.click()}>更换文件</button></> : <><UploadCloud size={36}/><strong>拖入 PDF 报告</strong><span>或点击选择文件 · 单个文件不超过 30MB</span><button className="secondary-button" onClick={() => input.current?.click()}>选择 PDF</button></>}</section><section className="panel report-options"><header className="panel-header"><h3>检测设置</h3><span>合成任务</span></header><div className="panel-body form-stack"><label><span>虚构公司</span><select value={company} onChange={(e)=>setCompany(e.target.value)}><option value="cy-materials">澄岳新材</option><option value="linhai-energy">林海能源</option><option value="qiming-mobility">启明交通</option></select></label><label><span>报告年度</span><select value={year} onChange={(e)=>setYear(e.target.value)}>{[2026,2025,2024,2023,2022,2021].map((item)=><option key={item}>{item}</option>)}</select></label><div className="privacy-note"><Check size={16}/><span><strong>本地演示模式</strong>不会读取或保存文件正文。</span></div><button className="primary-button" disabled={!file} onClick={start}><Play size={15}/>开始检测</button></div></section></div>}
    {phase !== "idle" && phase !== "complete" && <section className="panel task-panel"><header className="panel-header"><div><h3>{file?.name}</h3><p>{company} · {year} · 前端状态机</p></div><span className="status-chip pending">{phase === "failed" ? "检测失败" : phase === "ocr" ? "需要 OCR" : "处理中"}</span></header><div className="task-layout"><div className="task-stepper">{steps.map((step,index) => { const active=phase===step.id; const done=completed.includes(step.id); const failed=phase==="failed" && step.id==="extracting"; return <div className={`task-step ${active?"active":""} ${done?"done":""} ${failed?"failed":""}`} key={step.id}><span>{done?<Check size={15}/>:failed?<AlertTriangle size={15}/>:index+1}</span><div><strong>{step.label}</strong><small>{step.detail}</small></div><em>{done?`${step.duration}ms`:active?"进行中":"等待"}</em></div>; })}</div>{phase === "failed" && <ErrorBlock title="未检测到可解析文本层" impact="无法生成声明特征与风险分。" next="启用演示 OCR 或更换文本版 PDF。" onRetry={() => { setFile((item)=>item?{...item,name:item.name.replace(/broken/ig,"ocr")}:item); setCompleted(["validating"]); setPhase("extracting"); }} />}{phase === "ocr" && <div className="task-callout"><AlertTriangle/><div><h3>建议启用 OCR</h3><p><strong>成因：</strong>文件名触发了扫描件演示路径。</p><p><strong>影响：</strong>当前无法继续识别声明。</p><p><strong>下一步：</strong>启用演示 OCR 后从文本抽取阶段重试。</p><button className="primary-button" onClick={() => { setFile((item)=>item?{...item,name:item.name.replace(/scan/ig,"ocr")}:item); setPhase("extracting"); }}>启用演示 OCR</button></div></div>}</div></section>}
    {phase === "complete" && <section className="report-result"><header><span className="result-check"><Check/></span><div><span className="section-kicker">检测完成</span><h2>合成分析已生成</h2><p>{file?.name} · {year} · 全部结果仅用于前端演示</p></div></header><div className="result-strip"><div><span>输入质量</span><strong>可解析</strong><small>文本层完整</small></div><div><span>风险结果</span><strong className="risk-score">78 / 100</strong><small>高风险，建议优先复核</small></div><div><span>证据覆盖</span><strong className="risk-score">64%</strong><small>基准年与鉴证缺失</small></div><div><span>模型版本</span><strong><code>GL-RISK-1.3</code></strong><small>合成规则集</small></div></div><div className="header-actions"><button className="quiet-button" onClick={reset}><RotateCcw size={15}/>新建检测</button><button className="secondary-button" onClick={() => showToast("演示摘要已下载")}><FileText size={15}/>下载演示摘要</button><button className="primary-button" onClick={() => router.push(`/companies/${company}?year=${year}`)}>打开完整分析 <ChevronRight size={15}/></button></div></section>}
  </div>;
}

function ErrorBlock({ title, impact, next, onRetry }: { title:string; impact:string; next:string; onRetry:()=>void }) { return <div className="task-callout error"><AlertTriangle/><div><h3>{title}</h3><p><strong>成因：</strong>当前演示路径模拟文件没有可解析文本层。</p><p><strong>影响：</strong>{impact}</p><p><strong>下一步：</strong>{next}</p><button className="primary-button" onClick={onRetry}>启用演示 OCR</button></div></div>; }
