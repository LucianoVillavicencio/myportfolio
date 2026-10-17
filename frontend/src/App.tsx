import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { PortfolioDataProvider } from './context/PortfolioDataContext';
import { InkBleedFilters } from './components/illustrations';
import { ScrollManager } from './components/layout/ScrollManager';
import { AdminShortcut } from './components/layout/AdminShortcut';
import { HomePage } from './pages/home/HomePage';
import { BooksPage } from './pages/books/BooksPage';
import { AdminPage } from './pages/admin/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => (
  <BrowserRouter>
    <AdminAuthProvider>
      <PortfolioDataProvider>
        {/* SVG filters (#ink-bleed, frame boil) + fractal-noise paper overlay */}
        <InkBleedFilters />
        <div className="paper" aria-hidden="true" />

        <ScrollManager />
        <AdminShortcut />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/login" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </PortfolioDataProvider>
    </AdminAuthProvider>
  </BrowserRouter>
);
