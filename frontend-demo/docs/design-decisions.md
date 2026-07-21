# GreenLens visual decisions

## Outcome

GreenLens is a desktop-first evidence investigation workspace for ESG researchers. Its single job is to help a reviewer move from an anomalous company signal to cited evidence and a recorded human decision.

## Token system

- Base: `#070A09`
- Raised surface: `#0C1110`
- Primary text: `#F4F7F5`
- Secondary text: `#A7B0AC`
- Action and verified: `#38E07B`
- Data spectrum: cyan `#30D5E8`, blue `#5B8CFF`, yellow `#F4D35E`, orange `#FF9F43`, red `#FF5C6C`, magenta `#E879F9`
- UI type: Inter, Noto Sans SC, system sans-serif
- Data type: IBM Plex Mono, JetBrains Mono, monospace
- Radius: 6px panels and controls, 8px dialogs

## Layout

```text
+--------------+-------------------------------------------------------+
| 216 sidebar  | 64 topbar                                             |
|              +-------------------------------------------------------+
| primary nav  | 48 context filters                                    |
|              +--------------------------------------+----------------+
| demo status  | 8/12 evidence field                  | 4/12 analysis  |
|              +--------------------------------------+----------------+
|              | review queue                                          |
+--------------+-------------------------------------------------------+
```

At 1024px the sidebar collapses. Below 768px navigation moves to the top and complex comparison controls are replaced by concise summaries and evidence reading.

## Signature

The claim-by-fact matrix is the only expressive motion surface. Selecting a point dims the field and draws a narrow green trace into the evidence summary. This links anomaly discovery to evidence inspection without turning the interface into a game-like HUD.

## Design critique

The MongoDB reference suggests deep teal bands, bright green calls to action, large marketing typography, pill buttons, and rounded card grids. Only its dark/green contrast and disciplined use of accent color fit the product. The marketing hero, universal pills, 12px card radius, negative letter spacing, and generous landing-page whitespace were removed because they reduce scan density and conflict with the implementation specification. The resulting direction is specific to evidence review, not a reusable SaaS landing-page template.
