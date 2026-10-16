# Evidence — round 44 meter colour grading (2026-10-19)

`meter-grading-light-dark.png` — the owner's round-44 decree rendered from a
scratch preview that mounts the EXACT round-44 CSS block (tokens + rules
copied verbatim from `apps/web/src/index.css`) in both themes:

- step 1 · stable — pure green, nothing before it to tint
- step 2 · cautious — [whiter yellow] [yellow]
- step 3 · stressed — [more pale orange] [pale orange] [orange]
- step 4 · critical — every grade a different tint of red, pale → full

Computed check (light, step 4): seg tints resolve to
rgb(244,188,191) → rgb(235,131,137) → rgb(226,79,87) → rgb(218,30,40)
(= Carbon Red 60 verbatim at the top of the ramp).

The scratch HTML was removed after capture; the production check rides the
owner's preview/deploy smoke (same as round 43's evidence flow).
