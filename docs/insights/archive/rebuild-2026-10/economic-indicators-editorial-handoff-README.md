# Currena Economic Indicators UI handoff

This package contains the approved visual references, implementation-ready page specification, compact design tokens, two decorative background assets, and the coding-agent kickoff prompt for `https://github.com/assadigit/Currena`.

## Start here

1. Read `spec/economic-indicators-ui-spec.md` completely.
2. Review `references/01-approved-dashboard-reference.png` first; it is the primary visual target.
3. Review `references/02-design-system-and-mobile-board.png` and `references/03-desktop-mobile-rtl-style-board.png` for supplemental guidance.
4. Read `assets/ASSET-CATALOG.md` before integrating the background artwork.
5. Use `spec/design-tokens.css` and `spec/design-tokens.json` as suggested tokens, mapping them into the project's existing theme rather than adding a duplicate design system.
6. Follow `AGENT-KICKOFF-PROMPT.md` for repository access, implementation, verification, parallel-agent coordination, commit/push, and deployment.

## Reference priority

- The app's existing live data, calculations, severity classification, and functional behavior are authoritative.
- `references/01-approved-dashboard-reference.png` is the main visual direction.
- Other references provide context only; they are not pixel-perfect requirements and their sample numbers/copy are not data sources.
- Build real components. Never use a whole screenshot as the webpage background or substitute for functional UI.

## Current approved decisions

- Direction: editorial and financial, professional but approachable.
- Visual style: off-white surfaces, navy typography, subtle borders, restrained orange/red/green state accents.
- Desktop: Australia on left, Global on right.
- Mobile: Global first, horizontal swipe to Australia, with accessible controls.
- Default list: top 3 flagged indicators; expand remaining indicators inline.
- Languages: Persian RTL and English LTR; enforce correct direction at component/layout level.
- Scope: this page and directly related components only; preserve the app's framework and functionality.
