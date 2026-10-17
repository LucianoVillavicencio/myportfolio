import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePortfolioData } from '../../context/PortfolioDataContext';
import { groupByStatus } from '../../lib/books';

/** "currently reading / contact / admin" pills shown in the top-right corner. */
export const TopPills: React.FC = () => {
  const { books } = usePortfolioData();
  const { isAdmin } = useAdminAuth();
  const readingCount = groupByStatus(books).reading.length;

  return (
    <div className="pills">
      <Link to="/books" className="pill pill--photos anim d1">
        currently reading ({readingCount})
      </Link>
      <Link to="/#contact" className="pill pill--contact anim d2">
        contact
      </Link>
      {isAdmin && (
        <Link to="/admin" className="pill pill--admin anim d2">
          owner panel
        </Link>
      )}
    </div>
  );
};
