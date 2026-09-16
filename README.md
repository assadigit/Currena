# Currena

Currency converter with live Iranian Toman (open-market) and international rates.
TypeScript monorepo: **Hono API on Cloudflare Workers** + **Vite React SPA (PWA)**.

Parallel rebuild of the legacy Django app (live at
https://aliassadi1993.pythonanywhere.com/ — untouched until an explicit human cutover).

- **Status / phases / gates**: `docs/PROGRESS.md`
- **Feature inventory**: `docs/FEATURE_MAP.md`
- **Keep / Defer / Cut decisions**: `docs/MIGRATION_CHECKLIST.md`
- **Conventions & rules**: `AGENTS.md`

## Quick start

```bash
pnpm install
pnpm --parallel dev      # api on :8787 · web on :5173
pnpm -r test
pnpm -r typecheck
```
