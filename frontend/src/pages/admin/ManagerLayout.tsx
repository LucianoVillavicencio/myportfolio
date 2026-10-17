import React from 'react';

interface ManagerLayoutProps {
  listTitle: string;
  list: React.ReactNode;
  formTitle: string;
  form: React.ReactNode;
  onNew?: () => void;
  newLabel?: string;
}

/** Two-column admin layout: item list on the left, editor form on the right. */
export const ManagerLayout: React.FC<ManagerLayoutProps> = ({
  listTitle,
  list,
  formTitle,
  form,
  onNew,
  newLabel,
}) => (
  <div className="admin-grid">
    <section className="admin-panel">
      <div className="admin-panel-head">
        <h2 className="admin-panel-title">{listTitle}</h2>
        {onNew && (
          <button type="button" className="btn-ghost" onClick={onNew}>
            {newLabel}
          </button>
        )}
      </div>
      {list}
    </section>

    <section className="admin-panel admin-panel--form">
      <h2 className="admin-panel-title">{formTitle}</h2>
      {form}
    </section>
  </div>
);

interface AdminRowProps {
  thumb?: React.ReactNode;
  title: string;
  meta: React.ReactNode;
  isSelected: boolean;
  actions: React.ReactNode;
}

export const AdminRow: React.FC<AdminRowProps> = ({
  thumb,
  title,
  meta,
  isSelected,
  actions,
}) => (
  <li className={`admin-row ${isSelected ? 'is-selected' : ''}`}>
    {thumb}
    <div className="admin-row-text">
      <strong>{title}</strong>
      <span>{meta}</span>
    </div>
    <div className="admin-row-actions">{actions}</div>
  </li>
);
