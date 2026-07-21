# Frontend demo retrospective

## Conclusion

The most effective interaction is the continuous evidence path: matrix selection changes risk contributions and the queue, the company contribution locates a report phrase, AI citations return to that phrase, and a human review updates shared state. This makes the product's value understandable without relying on a single score.

## What improved understanding

- The claim-by-fact matrix answers who deserves attention and why.
- Separate risk, evidence coverage, and review objects prevent low coverage from reading as low risk.
- Precise underlines preserve report readability better than full-paragraph highlighting.
- Cause-impact-next-action errors make report failure paths demonstrable rather than dead ends.

## What increased cognitive cost

- Showing the whole evidence matrix while loading initially produced misleading blank screenshots. The Playwright helper now waits for a nonblank Canvas before capture.
- The original muted token missed WCAG AA by a small margin on base surfaces and by more on selected rows. It was raised from `#6F7A75` to `#89958F` to guarantee at least 4.5:1 in the implemented states.
- Marketing-style MongoDB pills and large headings reduced data density, so they were not carried into the workbench.

## Real API migration

- Replace `demoRepository` methods with HTTP adapters while keeping `CompanyYearRecord`, `EvidenceItem`, and `ReviewRecord` stable.
- Move query scenario behavior to test adapters, not production requests.
- Replace local review persistence with an optimistic mutation and server reconciliation.
- Preserve URL state for year, tab, company, and evidence to retain shareable investigations.

## Black glass tradeoffs

- Glass is limited to top-level tools and overlays; data panels use opaque surfaces for contrast and rendering stability.
- The background grid is restricted to Dashboard and company analysis.
- High-density tables need stronger dividers at 200% zoom; the high-contrast media query increases both divider and muted-text contrast.

## Reusable assets

The repeated acceptance workflow has been automated in `tests/e2e/workflows.spec.ts`. Repository scenario handling, evidence status components, contribution bars, responsive app shell, and accessibility checks are reusable foundations for later API-backed iterations.
