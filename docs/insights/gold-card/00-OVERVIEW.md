# Gold card redesign — overview and decisions

**Context:** Currena "Insights" page (currena.ir, repo assadigit/Currena, Cloudflare Workers). This package redesigns the existing gold card ("The aggregate of factors affecting the price of gold") and its silver twin. Same data, new presentation, three new behaviours (coverage rule, price as context, "what would flip it" line).

## Goal
A first-time visitor with no finance background answers one question in about five seconds: **"Is the backdrop good or bad for gold right now, and how sure is it?"**
Secondary signal: visitors open factor rows (the plain-language explanations work).

## Decisions (final, do not re-open)
1. Keep the balance-beam metaphor. Make it editorial: hairline beam, small pivot, level reference line, numbers as the main visual.
2. Verdict first. Order top to bottom: header, verdict, beam, neutral/unread band, price context, factor rows, flip line, footnote.
3. Factors appear as small tokens on the beam ends. Details live in rows below (progressive disclosure). The old two-column card grid is removed.
4. Drivers and price are separate. Real yields, inflation expectations, market stress and the US dollar are drivers and carry weight. The metal's own price behaviour is context only and carries no weight. The old "Price footing: Works against" rows are removed as weights.
5. All drivers weigh equally. Neutral drivers are shown aside, never on the beam.
6. Coverage rule: the beam tilts only when at least 75% of the asset's drivers could be read. Below that the beam stays level and the verdict says "Not enough readings to call".
7. Unreadable drivers appear as dashed "ghost" tokens in their own group. They are never hidden.
8. A "what would flip it" line gives one concrete threshold, only when the existing config already defines it.
9. Gold and silver use one template and one segmented control (Gold | Silver). Silver adds its own driver (industrial demand).
10. Colors are defined in `02-VISUAL-SPEC.md` for light and dark themes, contrast-checked. State is never carried by color alone.
11. Farsi (RTL) mirrors the layout. Trend arrows and chart time axes do not mirror. Farsi uses Persian digits.
12. Below 520px container width the in-beam token text is replaced by two lists under the beam.

## Out of scope
- Do not change how a factor's state (supports, pressures, neutral) is calculated.
- Do not change data fetching, caching or KV usage.
- Do not touch the hero, the stock-index section, or the currency section.
- Do not add a gauge. The gauge fallback is dropped.

## Files
| File | Purpose |
|---|---|
| `01-UX-SPEC.md` | What each part shows, states, interactions, accessibility, mobile |
| `02-VISUAL-SPEC.md` | Color tokens (light and dark), type, spacing, beam geometry, motion, RTL |
| `03-LOGIC-AND-DATA-SPEC.md` | Data contract, exact rules and formulas, test vectors |
| `04-COPY-EN-FA.md` | All English and Farsi strings |
| `05-ACCEPTANCE-AND-TESTS.md` | Acceptance checklist, test plan, verification loop |
| `reference/gold-card-reference.html` | Working visual reference (open in a browser; toggles theme, language, scenario, asset) |
| `reference/lean-logic.js` | Pure reference implementation of the rules |
| `reference/lean-logic.test.js` | Tests for the rules (`node lean-logic.test.js`) |
| `AGENT-PROMPT.md` | The one prompt that starts the build session |

## Source-of-truth order
Logic: file 03 wins. Behaviour: file 01. Look: the reference HTML wins over prose in file 02 when the two differ. Copy: file 04 wins, except that existing Currena Farsi terms found in the repo win over the Farsi proposals in file 04.
