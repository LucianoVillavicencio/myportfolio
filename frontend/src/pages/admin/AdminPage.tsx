import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { downloadBackup } from '../../lib/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePortfolioData } from '../../context/PortfolioDataContext';
import { useI18n } from '../../i18n/LanguageContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ShapeStar } from '../../components/illustrations';
import { LanguageToggle } from '../../components/layout/LanguageToggle';
import { LoginPanel } from './LoginPanel';
import { BooksManager } from './books/BooksManager';
import { ProjectsManager } from './projects/ProjectsManager';
import { ProfileForm } from './ProfileForm';
import { CvManager } from './CvManager';

const TABS = ['books', 'projects', 'profile', 'cv'] as const;
type AdminTab = (typeof TABS)[number];

export const AdminPage: React.FC = () => {
  const { isAdmin, adminKey, logout } = useAdminAuth();
  const { profile, books, projects, loadFailed } = usePortfolioData();
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  useDocumentTitle(t.admin.docTitle);

  const requested = params.get('tab') as AdminTab | null;
  const tab: AdminTab = requested && TABS.includes(requested) ? requested : 'books';

  const tabLabels: Record<AdminTab, string> = {
    books: t.admin.tabs.books(books.length),
    projects: t.admin.tabs.projects(projects.length),
    profile: t.admin.tabs.profile,
    cv: t.admin.tabs.cv,
  };

  const [backingUp, setBackingUp] = React.useState(false);
  const handleBackup = async () => {
    if (!adminKey) return;
    setBackingUp(true);
    try {
      const blob = await downloadBackup(adminKey);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-${new Date().toISOString().slice(0, 10)}.sqlite`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      window.alert(t.admin.backupError);
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="bf-topbar">
        <Link to="/" className="pill pill--back">
          <span className="arr">←</span> {t.common.backHome}
        </Link>
        <div className="pills">
          <LanguageToggle />
          {isAdmin && (
            <>
              <button
                type="button"
                className="admin-lock-btn"
                onClick={handleBackup}
                disabled={backingUp}
              >
                {t.admin.backup}
              </button>
              <button type="button" className="admin-lock-btn" onClick={logout}>
                {t.admin.lock}
              </button>
            </>
          )}
        </div>
      </div>

      <header className="admin-header">
        <h1 className="section-heading">
          <span>{t.admin.title}</span>
          <span className="accent">
            {t.admin.accent} <ShapeStar className="admin-star" />
          </span>
        </h1>
      </header>

      {loadFailed && <p className="api-error-banner">{t.common.loadError}</p>}

      {!isAdmin ? (
        <LoginPanel />
      ) : (
        <>
          <nav className="pf-tabs admin-tabs-nav" role="tablist">
            {TABS.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                className={`pf-tab ${tab === key ? 'is-on' : ''}`}
                onClick={() => setParams({ tab: key }, { replace: true })}
              >
                {tabLabels[key]}
              </button>
            ))}
          </nav>

          {tab === 'books' && <BooksManager />}
          {tab === 'projects' && <ProjectsManager />}
          {tab === 'profile' &&
            (profile ? (
              <ProfileForm profile={profile} />
            ) : (
              <p className="admin-hint">{t.admin.loadingProfile}</p>
            ))}
          {tab === 'cv' && <CvManager />}
        </>
      )}
    </div>
  );
};
