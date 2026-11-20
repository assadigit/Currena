# ACTIVE LANES — the open parallel-lane registry (AGENTS.md §15)

> The live registry of concurrent lane sessions. A lane agent ADDS its row
> when it starts (append-only table); the integration session removes the
> rows it merges (§15.4). One lane = one agent = one worktree. Two agents
> never share a lane; two programs never share one page without an
> integration session between them.
>
> Lane session records live in this folder as `<YYYY-MM-DD>-<lane>-<n>.md`
> (the lane's own handoff — root HANDOFF.md is read-only for lanes).

| lane | branch | worktree | started | scope (one line) |
| --- | --- | --- | --- | --- |
| *(none — no lanes are currently open; the gold UX redesign S4–S9 runs as the normal single-session flow unless the owner starts it as a lane)* |
