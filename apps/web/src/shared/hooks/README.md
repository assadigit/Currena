# shared/hooks/

The cross-domain hooks: `useInsightsCopy` (six domain pages + legacy), `use-roving-keys` (roving focus for the alerts/batch/settle tabs) and `useDialogFocus` (header, modals, receipt, settle). Deviation D8: the prompt's `use-mobile`/`use-toast` do not exist in this repo — these three are the actual cross-domain hooks, and `use-alert-evaluation` is shell-only (App.tsx), so it rides `infrastructure/` instead. Created empty in M1; the files arrive in Phase 2.
