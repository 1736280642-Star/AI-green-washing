# GreenLens Frontend Demo

GreenLens is a desktop-first ESG evidence investigation workspace. It uses fixed synthetic data to demonstrate the complete flow from anomaly discovery to cited evidence, human review, and an explicitly marked research export.

> 演示数据：企业、事件、报告与指标均为合成内容，不代表任何真实主体。

## Run locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000/dashboard`. The currently verified development server for this workspace is available at `http://127.0.0.1:3030`.

## Quality gates

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

The Playwright suite covers the investigation workflow, report success/OCR/failure paths, comparisons, review undo, serious accessibility violations, nonblank chart canvas, horizontal overflow, and screenshots at 1440x900, 1280x800, 768x1024, and 390x844.

## Routes

| Route | Purpose |
| --- | --- |
| `/dashboard` | Discover high-priority signals in the claim-by-fact matrix |
| `/companies` | Search, sort, paginate, configure columns, compare, and export 30 synthetic companies |
| `/companies/cy-materials` | Inspect contributions, report evidence, external facts, ratings, and history |
| `/compare` | Compare 2-5 companies without producing a simplistic ranking |
| `/reports` | Run a local-only report scan state machine |
| `/review` | Record a human decision and undo it within 8 seconds |
| `/methodology` | Explain model logic, boundaries, and synthetic validation metrics |

## Implementation logic

- Pages obtain records through `src/repositories/demo-repository.ts`; fixtures are replaceable implementation details.
- Zustand persists filters, comparisons, reviews, and notifications in `localStorage`, but never stores identity or uploaded file contents.
- ECharts renders the claim-by-fact matrix; TanStack Table owns company sorting and filtering.
- Report scanning is a finite state machine. The browser reads only file metadata, never the PDF body.
- URL parameters preserve company, tab, year, and evidence context for refreshable demonstrations.

The underlying reason for these boundaries is migration cost: a real API can replace the Repository without rewriting route behavior, while risk, evidence quality, and review status remain distinct contracts. For users, this produces a coherent evidence trail and prevents a synthetic score from being mistaken for a verdict.

## Documentation

- [Design decisions](docs/design-decisions.md)
- [Mock data dictionary](docs/mock-data-dictionary.md)
- [Demo guide](docs/demo-guide.md)
- [Retrospective](docs/frontend_demo_retrospective.md)
