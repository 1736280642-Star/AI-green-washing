# Frontend demo retrospective

## Conclusion

The most effective interaction is the continuous evidence path: quadrant selection changes the metric ledger and queue, the ledger locates a report phrase, AI citations return to that phrase, and a human review updates shared state. This makes the product's value understandable without relying on a single score.

## What improved understanding

- The EASS-by-E-AA-ESGSI quadrant answers who deserves attention and whether weak action substance aligns with a high final index.
- The dense Dashboard keeps KPI, action composition, formula breakdown, industry heatmap, and review operations within a compact scan path.
- Separate risk, evidence coverage, and review objects prevent low coverage from reading as low risk.
- Precise underlines preserve report readability better than full-paragraph highlighting.
- Cause-impact-next-action errors make report failure paths demonstrable rather than dead ends.
- Mobile deliberately keeps KPIs, telemetry, the main quadrant, formula ledger, diagnostics, and Top 3 review tasks while omitting queue throughput and governance charts that require desktop comparison space.

## What increased cognitive cost

- Showing the whole evidence matrix while loading initially produced misleading blank screenshots. The Playwright helper now waits for a nonblank Canvas before capture.
- The original muted token missed WCAG AA by a small margin on base surfaces and by more on selected rows. It was raised from `#6F7A75` to `#89958F` to guarantee at least 4.5:1 in the implemented states.
- Marketing-style MongoDB pills and large headings reduced data density, so they were not carried into the workbench.

## Real API migration

- Set `NEXT_PUBLIC_ANALYSIS_REPOSITORY=http` at the single Repository composition root while keeping `CompanyYearRecord`, `EvidenceItem`, and `ReviewRecord` stable.
- Keep runtime Zod validation at both Mock and HTTP boundaries so schema drift, duplicate metrics, invalid zero-denominator values, and incoherent unavailable states fail before rendering.
- Move query scenario behavior to test adapters, not production requests.
- Keep `saveReview` as the required write boundary; the current UI updates its local cache only after the Repository returns successfully. A production implementation may add optimistic updates with server reconciliation.
- Preserve URL state for year, tab, company, and evidence to retain shareable investigations.

The audit found that an interface alone was insufficient while pages still imported `demoRepository` directly, report results were hard-coded, global selection omitted `reportYear`, and Dashboard queue parameters were ignored by `/review`. All routes now consume `analysisRepository`; company, evidence, report, and review flows preserve company-year context; report progress is polled through `getAnalysisJob`; and review writes use `saveReview`. HTTP mode no longer requires route-by-route rewrites.

## Black glass tradeoffs

- Glass is limited to top-level tools and overlays; data panels use opaque surfaces for contrast and rendering stability.
- The background grid is restricted to Dashboard and company analysis.
- High-density tables need stronger dividers at 200% zoom; the high-contrast media query increases both divider and muted-text contrast.

## Reusable assets

The repeated acceptance workflow is automated in `tests/e2e/workflows.spec.ts`. Repository scenario handling, metric-contract validation, zero-denominator guards, evidence states, responsive audit layouts, and accessibility checks are reusable foundations for later API-backed iterations.
