"use client";

import { ChevronDown, FlaskConical, Info, ShieldCheck } from "lucide-react";
import { useState } from "react";

const methods=[
  {id:"eass",title:"EASS · 环境行动实质性",formula:"(implemented + alpha × planning) / environmental_statements",direction:"越高表示行动披露越实质",threshold:"低于 0.50 建议复核",example:"12 条已实施、18 条计划、20 条模糊；alpha 由后端返回。",status:"alpha 版本化"},
  {id:"ir",title:"IR · 模糊声明比例",formula:"indeterminate / environmental_statements",direction:"越高表示不可核验表达越多",threshold:"高于 0.33 进入关注",example:"20 / 50 = 0.40。",status:"已定义"},
  {id:"upr",title:"UPR · 未验证计划比例",formula:"unverified_planning / planning_statements",direction:"越高表示计划支撑要素越少",threshold:"高于 0.60 建议复核",example:"检查时间、KPI、方法与行动路径。",status:"属性规则版本化"},
  {id:"esgsi",title:"ESGSI · 漂绿严重度",formula:"positive_ESG_language - substantive_ESG_information",direction:"越高表示宣传与实质信息差距越大",threshold:"高于 0.50 进入关注",example:"前端只展示后端结果与构成，不在浏览器重算。",status:"归一化待确认"},
  {id:"eaa",title:"E-AA-ESGSI · 最终调整指数",formula:"ESGSI + action_penalty + IR_penalty + UPR_penalty",direction:"越高表示综合风险信号越强",threshold:"低 ≤ .33；中 ≤ .66；高 > .66",example:"0.55 + 0.10 + 0.06 + 0.07 = 0.78。",status:"Penalty 权重版本化"},
  {id:"imbalance",title:"Imbalance · ESG 失衡",formula:"dispersion(E_focus, S_focus, G_focus)",direction:"需结合行业语境解释",threshold:"演示阈值 0.45",example:"E 关注显著高于 S/G 时触发复核。",status:"聚合公式待确认"},
];
const pipeline=[
  ["collect_ESG_reports","报告采集"],
  ["preprocess_text","文本预处理"],
  ["extract_ESG_features","ESG 特征提取"],
  ["calculate_ESG_focus","关注度计算"],
  ["calculate_ESG_imbalance","失衡计算"],
  ["classify_environmental_action","行动分类"],
  ["calculate_EASS","EASS"],
  ["calculate_IR","IR"],
  ["calculate_UPR","UPR"],
  ["calculate_ESGSI","ESGSI"],
  ["calculate_eaa_esgsi","E-AA-ESGSI"],
  ["risk_classification","风险分级"],
] as const;

export default function MethodologyPage(){
  const [open,setOpen]=useState("eass");
  return<div className="methodology-layout"><aside className="method-toc"><span>本页目录</span>{["函数链","指标字典","数据契约","风险分级","适用边界","版本"].map((item,i)=><a href={`#section-${i}`} key={item}>{item}</a>)}</aside><article className="method-document"><header><span className="demo-badge">METRIC CONTRACT V1</span><h2>方法与模型</h2><p>从报告处理到最终风险分级的可追溯函数链。风险是复核信号，不是企业判决。</p></header>
    <section id="section-0"><span className="section-kicker">十二步函数链</span><h3>每一步都返回可检查的中间结果</h3><div className="pipeline-grid">{pipeline.map(([identifier,label])=><div key={identifier}><code>{identifier}</code><strong>{label}</strong></div>)}</div></section>
    <section id="section-1"><span className="section-kicker">核心指标</span><h3>公式、方向、阈值和状态同时展示</h3><div className="method-accordions">{methods.map((method)=><div className={open===method.id?"open":""} key={method.id}><button onClick={()=>setOpen(open===method.id?"":method.id)}><span><strong>{method.title}</strong><small>{method.direction}</small></span><ChevronDown/></button>{open===method.id&&<div><code>{method.formula}</code><dl><div><dt>方向</dt><dd>{method.direction}</dd></div><div><dt>阈值</dt><dd>{method.threshold}</dd></div><div><dt>示例</dt><dd>{method.example}</dd></div><div><dt>公式状态</dt><dd>{method.status}</dd></div></dl></div>}</div>)}</div></section>
    <section id="section-2"><span className="section-kicker">数据契约</span><h3>前端消费结果，不补造生产公式</h3><div className="concept-row"><div><FlaskConical/><strong>原始值</strong><p>保留分子、分母和计算状态。</p></div><div><ShieldCheck/><strong>风险方向值</strong><p>EASS 反向，其余按契约解释。</p></div><div><Info/><strong>版本</strong><p>Schema、特征、模型、公式和阈值分开记录。</p></div></div></section>
    <section id="section-3"><span className="section-kicker">风险分级</span><h3>连续边界不留空档</h3><table><thead><tr><th>区间</th><th>等级</th><th>用途</th></tr></thead><tbody><tr><td><code>[0, .33]</code></td><td>低</td><td>保留抽查</td></tr><tr><td><code>(.33, .66]</code></td><td>中</td><td>建议核验</td></tr><tr><td><code>(.66, 1]</code></td><td>高</td><td>优先复核</td></tr></tbody></table></section>
    <section id="section-4"><span className="section-kicker">适用边界</span><h3>人工判断保留在三个位置</h3><ul><li>环境声明的行动分类是否正确。</li><li>计划是否具备时间、KPI、方法和路径。</li><li>外部证据是否与报告主体和时间窗口一致。</li></ul></section>
    <section id="section-5"><span className="section-kicker">版本</span><h3>当前演示契约</h3><table><tbody><tr><th>Schema</th><td><code>metric-contract-v1</code></td></tr><tr><th>模型</th><td><code>EAA-ESGSI-DEMO-1.0</code></td></tr><tr><th>状态</th><td>全部数值为合成 Mock</td></tr></tbody></table></section>
  </article><aside className="method-aside"><span>当前版本</span><code>metric-contract-v1</code><dl><div><dt>数据</dt><dd>SYN-2026.07</dd></div><div><dt>阈值</dt><dd>risk-band-v1</dd></div><div><dt>用途</dt><dd>前端演示</dd></div></dl></aside></div>;
}
