# Mock data dictionary

## Data policy

Every company, stock code, report excerpt, event, source, rating, and metric in the demo is synthetic. Values are fixed so refreshes and screenshots remain reproducible. Source links use `.invalid` domains and cannot resolve to a real site.

## Core records

| Company ID | Synthetic company | Synthetic code | Industry | 2025 risk | Review status |
| --- | --- | --- | --- | ---: | --- |
| `cy-materials` | 澄岳新材 | 688217 | 新材料 | 78 | 部分复核 |
| `linhai-energy` | 林海能源 | 600741 | 综合能源 | 72 | 待复核 |
| `qiming-mobility` | 启明交通 | 301482 | 交通设备 | 61 | 已复核 |
| `beichen-foods` | 北辰食品 | 002761 | 消费品 | 43 | 证据不足 |
| `yuanfang-tech` | 远方科技 | 688903 | 电子制造 | 29 | 已复核 |
| `jiuhe-build` | 九禾建设 | 601593 | 建筑 | 55 | 存在争议 |

以上 6 条是跨页面主流程样本；企业库另包含 24 条固定生成的合成记录，总计 30 条，用于验证每页 10 条的分页、搜索、排序、列设置和批量对比。生成记录使用 `demo-company-*` ID 与 `D*****` 虚构代码，每次刷新保持一致。

## Contracts

- `CompanyYearRecord`: one synthetic company and report year, with risk, coverage, review state, components, and versions.
- `RiskComponent`: one of six risk signals with a value, weight, contribution, industry median, and evidence references.
- `EvidenceItem`: a synthetic report phrase, metric gap, or external event with source and review status.
- `ReviewRecord`: the model decision, human decision, reason, note, and timestamp.

## Scenario controls

| Query | Behavior | User impact |
| --- | --- | --- |
| `?scenario=empty` | Repository returns no records | Verifies directional empty-state recovery |
| `?scenario=error` | Repository rejects the request | Verifies cause, impact, and next-step error copy |
| `?scenario=slow` | Repository delay rises to 900ms | Verifies fixed layout during loading |

## Report scan filenames

| Filename contains | Behavior |
| --- | --- |
| any normal PDF name | Completes the five-stage synthetic analysis |
| `scan` | Pauses at text extraction and offers demo OCR recovery |
| `broken` | Fails at text extraction with cause, impact, and next action; demo OCR then succeeds |

This state-based convention is cheaper and more reliable than keeping multiple fixture files. For evaluators, it makes all required paths reproducible without uploading or parsing sensitive documents.
