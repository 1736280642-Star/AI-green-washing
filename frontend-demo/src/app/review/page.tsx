"use client";

import { Check, ChevronRight, Clock3, SkipForward, Undo2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { companies, evidence } from "@/mocks/fixtures/companies";
import { useDemoStore } from "@/stores/demo-store";

const queue = [
  { id:"ev-2", company:"cy-materials", type:"报告证据", impact:16, wait:"2 小时" },
  { id:"ev-ext-1", company:"cy-materials", type:"事件相关性", impact:12, wait:"5 小时" },
  { id:"lh-1", company:"linhai-energy", type:"主体匹配", impact:11, wait:"1 天" },
  { id:"jh-1", company:"jiuhe-build", type:"风险标签", impact:9, wait:"2 天" },
];

export default function ReviewPage() {
  const [tab,setTab]=useState("报告证据");
  const [index,setIndex]=useState(0);
  const [decision,setDecision]=useState("insufficient");
  const [note,setNote]=useState("");
  const [completed,setCompleted]=useState(0);
  const [undoId,setUndoId]=useState<string|null>(null);
  const { pendingReviews, saveReview, undoReview, reviews, showToast }=useDemoStore();
  const visible=useMemo(()=>queue.filter((item)=>item.type===tab),[tab]);
  const current=visible[index % Math.max(1,visible.length)] ?? queue[0];
  const company=companies.find((item)=>item.companyId===current.company)!;
  const item=evidence.find((entry)=>entry.id===current.id) ?? evidence[0];
  useEffect(()=>{if(!undoId)return;const timer=setTimeout(()=>setUndoId(null),8000);return()=>clearTimeout(timer);},[undoId]);
  function save(next:boolean){ const id=`review-${current.id}`; saveReview({id,targetId:current.id,companyId:company.companyId,targetType:current.type==="事件相关性"?"event":"evidence",originalDecision:item.status,humanDecision:decision as "confirm"|"reject"|"partial"|"insufficient",reasonCode:"manual-review",note,reviewedAt:new Date().toISOString()}); setUndoId(id); setCompleted((value)=>value+1); setNote(""); if(next)setIndex((value)=>value+1); }
  return <div className="page review-page"><header className="page-header"><div><h2>复核中心</h2><p>人工判断会同步更新 Dashboard、公司状态与通知记录。</p></div><div className="session-stats"><span>本次完成 <strong>{completed}</strong></span><span>已跳过 <strong>0</strong></span><span>剩余 <strong>{pendingReviews}</strong></span></div></header><div className="tabs review-tabs">{["事件相关性","报告证据","主体匹配","风险标签"].map((label)=><button className={tab===label?"active":""} onClick={()=>{setTab(label);setIndex(0);}} key={label}>{label}<span>{queue.filter((item)=>item.type===label).length}</span></button>)}</div><div className="review-layout"><section className="review-queue"><header><span>待处理任务</span><small>{visible.length} 条</small></header>{visible.map((task,i)=>{const recordCompany=companies.find((item)=>item.companyId===task.company)!;return <button className={i===index?"selected":""} onClick={()=>setIndex(i)} key={task.id}><div><strong>{recordCompany.companyName}</strong><span className="status-chip">{task.type}</span></div><p>风险影响 <code>+{task.impact}</code></p><small><Clock3 size={12}/>{task.wait}<ChevronRight size={14}/></small></button>})}</section><section className="review-decision"><header><div><span className="section-kicker">{current.type}</span><h3>{item.title}</h3><p>{company.companyName} · 2025 · 风险影响 +{current.impact}</p></div><span className="status-chip pending">待复核</span></header><div className="review-evidence"><span>模型判断</span><strong>当前证据不足以验证方向性目标</strong><blockquote>{item.excerpt}</blockquote><small>{item.sourceLabel} · 第 {item.page ?? 42} 页</small></div><div className="decision-form"><fieldset><legend>人工决定</legend>{[["confirm","确认"],["reject","驳回"],["partial","部分相关"],["insufficient","证据不足"]].map(([value,label])=><label className={decision===value?"selected":""} key={value}><input type="radio" checked={decision===value} onChange={()=>setDecision(value)}/><span>{label}</span></label>)}</fieldset><label className="field-label"><span>原因与备注</span><textarea value={note} onChange={(e)=>setNote(e.target.value)} placeholder="记录判断依据，便于后续追溯"/></label></div><footer><button className="quiet-button" onClick={()=>setIndex((value)=>value+1)}><SkipForward size={15}/>跳过</button><div><button className="secondary-button" onClick={()=>save(false)}>保存</button><button className="primary-button" onClick={()=>save(true)}>保存并下一条 <ChevronRight size={15}/></button></div></footer></section></div>{undoId&&reviews.some((review)=>review.id===undoId)&&<div className="undo-banner"><Check size={16}/><span>已保存最近一条复核结果</span><button onClick={()=>{undoReview(undoId);setUndoId(null);showToast("已撤销复核结果");}}><Undo2 size={14}/>撤销</button><small>8 秒内有效</small></div>}</div>;
}
