import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api } from '../lib/api';
import type { Book, Profile, Project, TimelineEntry } from '../types';

/**
 * Optional sections must never take the core content down with them: a failed
 * fetch is logged and falls back to an empty list, so the section just hides.
 */
function optional<T>(name: string, request: Promise<T[]>): Promise<T[]> {
  return request.catch((err) => {
    console.error(`Error loading optional ${name}:`, err);
    return [];
  });
}

interface PortfolioData {
  profile: Profile | null;
  books: Book[];
  projects: Project[];
  timeline: TimelineEntry[];
  isLoading: boolean;
  /** True when the last load failed; pages show a translated message. */
  loadFailed: boolean;
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
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const reload = useCallback(async () => {
    try {
      const [profileData, booksData, projectsData, timelineData] = await Promise.all([
        api.getProfile(),
        api.getBooks(),
        api.getProjects(),
        optional('timeline', api.getTimeline()),
      ]);
      setProfile(profileData);
      setBooks(booksData);
      setProjects(projectsData);
      setTimeline(timelineData);
      setLoadFailed(false);
    } catch (err) {
      console.error('Error loading portfolio data:', err);
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(
    () => ({ profile, books, projects, timeline, isLoading, loadFailed, reload }),
    [profile, books, projects, timeline, isLoading, loadFailed, reload],
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
