import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePortfolioData } from '../../context/PortfolioDataContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ShapeStar } from '../../components/illustrations';
import { LoginPanel } from './LoginPanel';
import { BooksManager } from './books/BooksManager';
import { ProjectsManager } from './projects/ProjectsManager';
import { ProfileForm } from './ProfileForm';

const TABS = ['books', 'projects', 'profile'] as const;
type AdminTab = (typeof TABS)[number];

export const AdminPage: React.FC = () => {
  const { isAdmin, logout } = useAdminAuth();
  const { profile, books, projects, error } = usePortfolioData();
  const [params, setParams] = useSearchParams();
  useDocumentTitle('Owner Panel');

  const requested = params.get('tab') as AdminTab | null;
  const tab: AdminTab = requested && TABS.includes(requested) ? requested : 'books';

  const tabLabels: Record<AdminTab, string> = {
    books: `Books (${books.length})`,
    projects: `Projects (${projects.length})`,
    profile: 'Profile',
  };

  return (
    <div className="admin-page">
      <div className="bf-topbar">
        <Link to="/" className="pill pill--back">
          <span className="arr">←</span> back home
        </Link>
        {isAdmin && (
          <button type="button" className="admin-lock-btn" onClick={logout}>
            Lock session
          </button>
        )}
      </div>

      <header className="admin-header">
        <h1 className="section-heading">
          <span>OWNER</span>
          <span className="accent">
            PANEL <ShapeStar className="admin-star" />
          </span>
        </h1>
      </header>

      {error && <p className="api-error-banner">{error}</p>}

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
              <p className="admin-hint">Loading profile…</p>
            ))}
        </>
      )}
    </div>
  );
};
