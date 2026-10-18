import React, { useCallback, useEffect, useState } from 'react';
import type { CaseStory, SupportCard } from '../../../types';
import { api } from '../../../lib/api';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { localized, useI18n } from '../../../i18n/LanguageContext';
import { useAdminMutation } from '../useAdminMutation';
import { AdminRow, ManagerLayout } from '../ManagerLayout';
import { CardForm } from './CardForm';
import { StoryForm } from './StoryForm';

/** Admin tab for the IT support card and its case stories (always shows everything, even disabled). */
export const SupportManager: React.FC = () => {
  const { adminKey } = useAdminAuth();
  const { lang, t } = useI18n();
  const copy = t.admin.support;
  const { run, isBusy, error } = useAdminMutation();
  const [card, setCard] = useState<SupportCard | null>(null);
  const [stories, setStories] = useState<CaseStory[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const load = useCallback(async () => {
    if (!adminKey) return;
    try {
      const data = await api.getSupportAdmin(adminKey);
      setCard(data.card);
      setStories(data.stories);
      setLoadFailed(false);
    } catch (err) {
      console.error('Error loading support admin data:', err);
      setLoadFailed(true);
    }
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  /** Runs a write, then refreshes this tab's own copy of the data. */
  const mutate = async (action: (key: string) => Promise<unknown>) => {
    const ok = await run(action);
    if (ok) await load();
    return ok;
  };

  const editingStory = stories.find((s) => s.id === editingId);
  const titleOf = (story: CaseStory) => localized(lang, story.titleEs, story.titleEn);

  const closeForm = () => {
    setEditingId(null);
    setFormKey((k) => k + 1);
  };

  const remove = async (story: CaseStory) => {
    if (!window.confirm(t.admin.confirmDelete(titleOf(story)))) return;
    const ok = await mutate((key) => api.deleteCaseStory(story.id, key));
    if (ok && story.id === editingId) closeForm();
  };

  if (!card) {
    return (
      <p className={loadFailed ? 'form-error' : 'admin-hint'}>
        {loadFailed ? copy.loadError : copy.loading}
      </p>
    );
  }

  return (
    <>
      <section className="admin-panel admin-panel--form support-card-panel">
        <h2 className="admin-panel-title">{copy.cardTitle}</h2>
        <CardForm card={card} onSave={mutate} />
      </section>

      <ManagerLayout
        listTitle={copy.storiesTitle(stories.length)}
        onNew={editingStory ? closeForm : undefined}
        newLabel={t.admin.newItem}
        list={
          <>
            {error && <p className="form-error">{error}</p>}
            {stories.length === 0 ? (
              <p className="admin-hint">{copy.emptyStories}</p>
            ) : (
              <ul className="admin-list">
                {stories.map((story) => (
                  <AdminRow
                    key={story.id}
                    isSelected={story.id === editingId}
                    title={titleOf(story)}
                    meta={`#${story.sortOrder}`}
                    actions={
                      <>
                        <button type="button" onClick={() => setEditingId(story.id)}>
                          {t.admin.edit}
                        </button>
                        <button
                          type="button"
                          className="danger-btn"
                          disabled={isBusy}
                          onClick={() => remove(story)}
                          aria-label={t.admin.deleteLabel(titleOf(story))}
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
        formTitle={editingStory ? copy.editStory : copy.addStory}
        form={
          <StoryForm
            key={editingStory?.id ?? `new-${formKey}`}
            story={editingStory}
            nextOrder={stories.length ? Math.max(...stories.map((s) => s.sortOrder)) + 1 : 1}
            mutate={mutate}
            onDone={closeForm}
          />
        }
      />
    </>
  );
};
