# features-tools/settle/

The `/settle` tool — `Settle.tsx` + the `settle/` children (GroupCard, GroupDetail, GroupTabs, AddExpenseModal, CreateGroupModal, ExpensePhoto, Modal, shared) with its own storage: `lib/settle-storage` (the groups store) and `lib/photo-store` (the expense photos). The roving-focus hook it shares with alerts/batch stays in `shared/hooks`.
