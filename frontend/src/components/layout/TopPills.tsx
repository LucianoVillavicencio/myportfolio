import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePortfolioData } from '../../context/PortfolioDataContext';
import { useI18n } from '../../i18n/LanguageContext';
import { groupByStatus } from '../../lib/books';
import { LanguageToggle } from './LanguageToggle';

/** Language switch + "currently reading / contact / admin" pills in the top-right corner. */
export const TopPills: React.FC = () => {
  const { books } = usePortfolioData();
  const { isAdmin } = useAdminAuth();
  const { t } = useI18n();
  const readingCount = groupByStatus(books).reading.length;

  return (
    <div className="pills">
      <LanguageToggle className="anim d1" />
      <Link to="/books" className="pill pill--photos anim d1">
        {t.nav.currentlyReading(readingCount)}
      </Link>
      <Link to="/#contact" className="pill pill--contact anim d2">
        {t.common.contact}
      </Link>
      {isAdmin && (
        <Link to="/admin" className="pill pill--admin anim d2">
          {t.common.ownerPanel}
        </Link>
      )}
    </div>
  );
};
