import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { PortfolioDataProvider } from './context/PortfolioDataContext';
import { InkBleedFilters } from './components/illustrations';
import { ScrollManager } from './components/layout/ScrollManager';
import { PageViewTracker } from './components/layout/PageViewTracker';
import { AdminShortcut } from './components/layout/AdminShortcut';
import { HomePage } from './pages/home/HomePage';
import { BooksPage } from './pages/books/BooksPage';
import { ProjectPage } from './pages/projects/ProjectPage';
import { AdminPage } from './pages/admin/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => (
  <BrowserRouter>
    <LanguageProvider>
      <AdminAuthProvider>
        <PortfolioDataProvider>
          {/* SVG filters (#ink-bleed, frame boil) + fractal-noise paper overlay */}
          <InkBleedFilters />
          <div className="paper" aria-hidden="true" />

          <ScrollManager />
          <PageViewTracker />
          <AdminShortcut />

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/books" element={<BooksPage />} />
            <Route path="/projects/:slug" element={<ProjectPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/login" element={<Navigate to="/admin" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </PortfolioDataProvider>
      </AdminAuthProvider>
    </LanguageProvider>
  </BrowserRouter>
);
