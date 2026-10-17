import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api } from '../lib/api';
import type { Book, Profile, Project } from '../types';

interface PortfolioData {
  profile: Profile | null;
  books: Book[];
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const PortfolioDataContext = createContext<PortfolioData | null>(null);

/** Loads the public content once and shares it between pages. */
export const PortfolioDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [profileData, booksData, projectsData] = await Promise.all([
        api.getProfile(),
        api.getBooks(),
        api.getProjects(),
      ]);
      setProfile(profileData);
      setBooks(booksData);
      setProjects(projectsData);
      setError(null);
    } catch (err) {
      console.error('Error loading portfolio data:', err);
      setError('Could not load content from the API.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(
    () => ({ profile, books, projects, isLoading, error, reload }),
    [profile, books, projects, isLoading, error, reload],
  );

  return (
    <PortfolioDataContext.Provider value={value}>
      {children}
    </PortfolioDataContext.Provider>
  );
};

export function usePortfolioData() {
  const ctx = useContext(PortfolioDataContext);
  if (!ctx) {
    throw new Error('usePortfolioData must be used inside PortfolioDataProvider');
  }
  return ctx;
}
