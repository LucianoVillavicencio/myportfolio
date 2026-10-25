import type {
  Book,
  BookInput,
  CvInfo,
  CvLang,
  CaseStory,
  CaseStoryInput,
  CvStatus,
  GoodreadsStatus,
  GoodreadsSyncResult,
  Profile,
  ProfileInput,
  Project,
  ProjectInput,
  ReadingStats,
  SupportCard,
  SupportCardInput,
  SupportData,
  TimelineEntry,
  TimelineInput,
  AnalyticsSummary,
} from '../types';

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function throwApiError(res: Response): Promise<never> {
  const body = await res.json().catch(() => null);
  // Nest validation errors come back as an array of messages
  const message = Array.isArray(body?.message)
    ? body.message.join(', ')
    : body?.message || `Request failed (${res.status})`;
  throw new ApiError(message, res.status);
}

async function request<T>(
  path: string,
  { adminKey, ...init }: RequestInit & { adminKey?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (init.body) headers['Content-Type'] = 'application/json';
  if (adminKey) headers['x-admin-key'] = adminKey;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) return throwApiError(res);
  return res.status === 204 ? (undefined as T) : res.json();
}

const send = <T>(method: string, path: string, adminKey: string, data?: unknown) =>
  request<T>(path, {
    method,
    adminKey,
    body: data === undefined ? undefined : JSON.stringify(data),
  });

export const api = {
  async verifyAdminKey(adminKey: string): Promise<boolean> {
    try {
      await send('POST', '/auth/verify', adminKey);
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return false;
      throw err;
    }
  },

  getProfile: () => request<Profile>('/profile'),
  updateProfile: (data: ProfileInput, adminKey: string) =>
    send<Profile>('PATCH', '/profile', adminKey, data),

  getBooks: () => request<Book[]>('/books'),
  getReadingStats: () => request<ReadingStats>('/books/stats'),
  createBook: (data: BookInput, adminKey: string) =>
    send<Book>('POST', '/books', adminKey, data),
  updateBook: (id: string, data: Partial<BookInput>, adminKey: string) =>
    send<Book>('PATCH', `/books/${id}`, adminKey, data),
  deleteBook: (id: string, adminKey: string) =>
    send<void>('DELETE', `/books/${id}`, adminKey),
  resetBook: (id: string, adminKey: string) =>
    send<Book>('POST', `/books/${id}/reset`, adminKey),

  getGoodreads: (adminKey: string) => send<GoodreadsStatus>('GET', '/goodreads', adminKey),
  setGoodreadsUser: (userId: string, adminKey: string) =>
    send<GoodreadsStatus>('PUT', '/goodreads', adminKey, { userId: userId.trim() || null }),
  syncGoodreads: (adminKey: string) =>
    send<GoodreadsSyncResult>('POST', '/goodreads/sync', adminKey),

  getProjects: () => request<Project[]>('/projects'),
  getProjectBySlug: (slug: string) =>
    request<Project>(`/projects/slug/${encodeURIComponent(slug)}`),
  createProject: (data: ProjectInput, adminKey: string) =>
    send<Project>('POST', '/projects', adminKey, data),
  updateProject: (id: string, data: Partial<ProjectInput>, adminKey: string) =>
    send<Project>('PATCH', `/projects/${id}`, adminKey, data),
  deleteProject: (id: string, adminKey: string) =>
    send<void>('DELETE', `/projects/${id}`, adminKey),

  getTimeline: () => request<TimelineEntry[]>('/timeline'),
  createTimelineEntry: (data: TimelineInput, adminKey: string) =>
    send<TimelineEntry>('POST', '/timeline', adminKey, data),
  updateTimelineEntry: (id: string, data: Partial<TimelineInput>, adminKey: string) =>
    send<TimelineEntry>('PATCH', `/timeline/${id}`, adminKey, data),
  deleteTimelineEntry: (id: string, adminKey: string) =>
    send<void>('DELETE', `/timeline/${id}`, adminKey),

  getSupport: () => request<SupportData>('/support'),
  getSupportAdmin: (adminKey: string) =>
    send<{ card: SupportCard; stories: CaseStory[] }>('GET', '/support/admin', adminKey),
  updateSupportCard: (data: Partial<SupportCardInput>, adminKey: string) =>
    send<SupportCard>('PATCH', '/support', adminKey, data),
  createCaseStory: (data: CaseStoryInput, adminKey: string) =>
    send<CaseStory>('POST', '/support/stories', adminKey, data),
  updateCaseStory: (id: string, data: Partial<CaseStoryInput>, adminKey: string) =>
    send<CaseStory>('PATCH', `/support/stories/${id}`, adminKey, data),
  deleteCaseStory: (id: string, adminKey: string) =>
    send<void>('DELETE', `/support/stories/${id}`, adminKey),

  sendContact: (data: { name: string; email: string; message: string; website: string }) =>
    request<void>('/contact', { method: 'POST', body: JSON.stringify(data) }),

  getCvStatus: (adminKey: string) => send<CvStatus>('GET', '/cv', adminKey),
};

/** Public URL of the CV PDF for a language (the uploaded one, or the bundled fallback). */
export const cvUrl = (lang: CvLang) => `${API_BASE}/cv/${lang}`;

/** Replaces the CV PDF for a language. */
export async function uploadCv(lang: CvLang, file: File, adminKey: string): Promise<CvInfo> {
  const body = new FormData();
  body.append('file', file);
  // No Content-Type header: the browser sets the multipart boundary itself.
  const res = await fetch(`${API_BASE}/cv/${lang}`, {
    method: 'PUT',
    headers: { 'x-admin-key': adminKey },
    body,
  });
  if (!res.ok) return throwApiError(res);
  return res.json();
}

/** Uploads an image (PNG, JPEG or WebP) and returns its public URL. */
export async function uploadMedia(file: File, adminKey: string): Promise<{ url: string }> {
  const body = new FormData();
  body.append('file', file);
  const res = await fetch(`${API_BASE}/media`, {
    method: 'POST',
    headers: { 'x-admin-key': adminKey },
    body,
  });
  if (!res.ok) return throwApiError(res);
  return res.json();
}

/** Fetches the SQLite database file as a Blob. */
export async function downloadBackup(adminKey: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/backup`, {
    headers: { 'x-admin-key': adminKey },
  });
  if (!res.ok) return throwApiError(res);
  return res.blob();
}

/** Looks up a cover image on OpenLibrary for the given title/author. */
export async function findOpenLibraryCover(
  title: string,
  author: string,
): Promise<string | null> {
  const q = encodeURIComponent(`${title} ${author}`.trim());
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${q}&limit=5&fields=cover_i`,
  );
  if (!res.ok) throw new Error('OpenLibrary search failed');
  const data: { docs?: { cover_i?: number }[] } = await res.json();
  const coverId = data.docs?.find((d) => d.cover_i)?.cover_i;
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null;
}

/** Aggregated, cookieless analytics for the last `days` days (admin only). */
export const getAnalytics = (days: number, adminKey: string) =>
  request<AnalyticsSummary>(`/analytics?days=${days}`, { adminKey });
