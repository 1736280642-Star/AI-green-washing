# GreenLens Frontend Demo Rules

## Scope

These rules apply to the entire `frontend-demo` project.

## Product Contract

- Follow `../../docs/frontend_demo_design_spec.md` as the authoritative product and UX specification.
- For `/dashboard`, follow `docs/dashboard-product-requirements-v2.md` when it is more specific than the general design specification.
- Use only synthetic companies, events, reports, ratings, and metrics.
- Always present risk as a signal requiring review, never as a confirmed greenwashing judgment.
- Keep the complete desktop investigation workflow and a deliberately reduced mobile workflow.

## Engineering Contract

- Pages read demo data through `src/repositories`, never directly from fixtures.
- Shared filters, selected evidence, comparisons, reviews, and notifications live in the demo store.
- URL query parameters preserve year, tab, company, and evidence state where applicable.
- Every command must give visible feedback. Errors state cause, impact, and the next action.
- Do not add secrets, private links, real company data, or real document text.

## Quality Gates

- Required: `npm run lint`, `npm run typecheck`, `npm run build`, and Playwright workflow tests.
- Check 1440x900, 1280x800, 768x1024, and 390x844 layouts.
- Console errors, horizontal page overflow, blank chart canvases, and serious accessibility issues are release blockers.
