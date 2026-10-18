import React, { useState } from 'react';
import type { TimelineEntry } from '../../../types';
import { api } from '../../../lib/api';
import { usePortfolioData } from '../../../context/PortfolioDataContext';
import { localized, useI18n } from '../../../i18n/LanguageContext';
import { useAdminMutation } from '../useAdminMutation';
import { AdminRow, ManagerLayout } from '../ManagerLayout';
import { TimelineForm } from './TimelineForm';

export const TimelineManager: React.FC = () => {
  const { timeline } = usePortfolioData();
  const { lang, t } = useI18n();
  const copy = t.admin.timeline;
  const { run, isBusy, error } = useAdminMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const editingEntry = timeline.find((e) => e.id === editingId);
  const titleOf = (entry: TimelineEntry) => localized(lang, entry.titleEs, entry.titleEn);

  const closeForm = () => {
    setEditingId(null);
    setFormKey((k) => k + 1);
  };

  const remove = async (entry: TimelineEntry) => {
    if (!window.confirm(t.admin.confirmDelete(titleOf(entry)))) return;
    const ok = await run((key) => api.deleteTimelineEntry(entry.id, key));
    if (ok && entry.id === editingId) closeForm();
  };

  return (
    <ManagerLayout
      listTitle={copy.listTitle(timeline.length)}
      onNew={editingEntry ? closeForm : undefined}
      newLabel={t.admin.newItem}
      list={
        <>
          {error && <p className="form-error">{error}</p>}
          {timeline.length === 0 ? (
            <p className="admin-hint">{copy.empty}</p>
          ) : (
            <ul className="admin-list">
              {timeline.map((entry) => (
                <AdminRow
                  key={entry.id}
                  isSelected={entry.id === editingId}
                  title={titleOf(entry)}
                  meta={`${t.timeline.kinds[entry.kind]} · ${entry.period} · ${entry.sortYear}`}
                  actions={
                    <>
                      <button type="button" onClick={() => setEditingId(entry.id)}>
                        {t.admin.edit}
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        disabled={isBusy}
                        onClick={() => remove(entry)}
                        aria-label={t.admin.deleteLabel(titleOf(entry))}
                      >
                        {t.admin.delete}
                      </button>
                    </>
                  }
                />
              ))}
            </ul>
          )}
        </>
      }
      formTitle={editingEntry ? copy.editTitle : copy.addTitle}
      form={
        <TimelineForm
          key={editingEntry?.id ?? `new-${formKey}`}
          entry={editingEntry}
          onDone={closeForm}
        />
      }
    />
  );
};
