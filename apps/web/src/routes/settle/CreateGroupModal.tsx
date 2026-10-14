/**
 * settle/CreateGroupModal — the create-group modal: name, the legacy
 * emoji picker (aria-pressed buttons), comma-separated members ("You" is
 * added automatically by the shell's createGroup) (Phase: WS-4 module
 * split of the former Settle.tsx monolith — zero behavior change, code
 * moved verbatim; the shell owns the state and the create action).
 */

import { Button } from '../../components/ui';
import { useI18n } from '../../lib/locale';
import { Modal } from './Modal';
import { EMOJIS, inputClass } from './shared';

export function CreateGroupModal(props: {
  createName: string;
  setCreateName: (v: string) => void;
  createMembers: string;
  setCreateMembers: (v: string) => void;
  createEmoji: string;
  setCreateEmoji: (v: string) => void;
  onClose: () => void;
  onCreate: () => void;
}) {
  const { t } = useI18n();
  const { createName, setCreateName, createMembers, setCreateMembers, createEmoji, setCreateEmoji, onClose, onCreate } = props;

  return (
    <Modal title={t('splitSettle.createNewGroup')} onClose={onClose}>
      <label htmlFor="groupName" className="mb-1.5 block text-sm font-bold">
        {t('splitSettle.groupName')}
      </label>
      <input
        id="groupName"
        type="text"
        className={`${inputClass} mb-4`}
        placeholder={t('splitSettle.groupNamePlaceholder')}
        value={createName}
        onChange={(e) => setCreateName(e.target.value)}
      />

      <p className="mb-1.5 text-sm font-bold">{t('splitSettle.chooseEmoji')}</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => setCreateEmoji(emoji)}
            aria-pressed={createEmoji === emoji}
            className={`h-11 w-11 cursor-pointer rounded-[12px] border-2 text-xl transition-all duration-300 ${
              createEmoji === emoji
                ? 'border-currena-blue bg-currena-blue/10 scale-110'
                : 'border-transparent bg-currena-soft'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <label htmlFor="groupMembers" className="mb-1.5 block text-sm font-bold">
        {t('splitSettle.membersLabel')}
      </label>
      <input
        id="groupMembers"
        type="text"
        className={`${inputClass} mb-1`}
        placeholder={t('splitSettle.membersPlaceholder')}
        value={createMembers}
        onChange={(e) => setCreateMembers(e.target.value)}
      />
      <p className="mb-5 text-xs text-currena-muted">{t('splitSettle.youAddedAutomatically')}</p>

      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="secondary" className="py-3" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="cta" className="py-3" onClick={onCreate}>
          {t('splitSettle.createGroup')}
        </Button>
      </div>
    </Modal>
  );
}
