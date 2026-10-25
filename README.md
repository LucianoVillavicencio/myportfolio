# Personal Portfolio & Live Reading Tracker

A full-stack personal website with a tactile neo-brutalist dark aesthetic, built with **React + TypeScript + Vite** and a **NestJS + TypeORM + SQLite** API.

All content — projects, books and your profile/contact info — lives in the database, and uploaded CV PDFs and project images are stored as files next to it. Everything is managed from the owner panel at `/admin`.

## Quick start

```powershell
# 1. API on http://localhost:3000/api
cd backend
npm install
npm run start:dev

# 2. Frontend on http://localhost:5173 (proxies /api to the backend)
cd frontend
npm install
npm run dev
```

The SQLite file `backend/portfolio.sqlite` is created on first launch, with your profile pre-filled. Projects and books start empty.

### Environment variables (backend)

For local development, copy `backend/.env.example` to `backend/.env` and fill it in; it is git-ignored and only loaded outside production. Real environment variables always win.

| Variable        | Default                          | Notes                                                        |
| --------------- | -------------------------------- | ------------------------------------------------------------ |
| `ADMIN_API_KEY` | `secret-admin-key` (dev only)    | **Required** when `NODE_ENV=production`.                     |
| `DB_PATH`       | `backend/portfolio.sqlite`       | Where the SQLite file is stored. **Required** when `NODE_ENV=production`. |
| `CV_DIR`        | `cv/` next to `DB_PATH`          | Where CVs uploaded from `/admin` are stored.                 |
| `MEDIA_DIR`     | `media/` next to `DB_PATH`       | Where project images uploaded from `/admin` are stored.      |
| `RESEND_API_KEY` | _(unset)_                       | Optional. Resend API key for the contact form; without it `POST /api/contact` answers 503. |
| `CONTACT_FROM`  | `Portfolio <onboarding@resend.dev>` | Sender of contact emails. With `onboarding@resend.dev` Resend only delivers to the Resend account's own address; verify a domain to send elsewhere. |
| `CONTACT_TO`    | the profile email                | Where contact emails are delivered.                          |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | _(unset)_             | Optional. Credentials of a Spotify developer app; see [Spotify](#spotify). |
| `SPOTIFY_REDIRECT_URI` | _(unset)_                 | Must match a Redirect URI of that app, e.g. `https://your-site/api/spotify/callback`. |
| `STATIC_DIR`    | `frontend/dist`                  | Built frontend served by Nest (the Docker image sets `/app/public`). |
| `CORS_ORIGIN`   | any origin (dev), none (prod)    | Comma-separated allow-list, e.g. `https://example.com`. Not needed when Nest serves the frontend. |
| `PORT`          | `3000`                           |                                                              |

## Owner panel

Go to `/admin` (or press **Alt + A** / **Ctrl + Shift + A** anywhere) and enter your `ADMIN_API_KEY`. From there you can:

- **Books** — add (with OpenLibrary cover auto-find), edit, rate, bump progress `+10p`, delete.
- **Projects** — add, edit, feature/unfeature (featured ones are listed first), delete. Each project can have case study fields and up to 8 screenshots, uploaded from here.
- **Journey** — the timeline of your career and education entries shown on the home page.
- **Support** — your IT support card and the case stories shown on the home page.
- **Profile** — name, roles, intro text, availability, stack, email and social links shown in the hero and footer, and a yearly reading goal shown on `/books`.
- **CV** — replace the Spanish and English CV PDFs opened from the home page. Uploads are stored next to the database (so on the Railway volume); until you upload one, the PDF bundled in `frontend/public/` is served.
- **Spotify** — connect your account and pick (and order) the playlists shown on the home page. Your most listened artist of the last month (a Spotify "short term" top artist) shows above them with no setup.
- **Analytics** — cookieless daily counters for page views, outbound clicks, contact submissions and CV downloads (counted server-side). Nothing is stored per visitor. Your own visits are not counted once you have logged in to `/admin` in that browser.
- **Backup** — the **Descargar backup** button downloads a zip with the SQLite database, the uploaded CV PDFs and the uploaded images.

## Deploy (Railway)

The repo ships a multi-stage `Dockerfile` and a `railway.json`; the backend serves the built frontend, so one service is enough.

1. Create a Railway service from the GitHub repo. Railway picks up `railway.json` and builds the `Dockerfile`.
2. Add a volume to the service and mount it at `/data`.
3. Set the variables:
   - `NODE_ENV=production`
   - `ADMIN_API_KEY` — generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `DB_PATH=/data/portfolio.sqlite`
4. Generate a domain in the service's networking settings.
5. The first deploy is green once `/api/health` answers.
6. Load your content from `/admin`: profile, projects, and your Goodreads user ID followed by **Sync**.
7. Verify persistence: trigger a redeploy and check the content is still there.

Keep the service at **1 replica** (SQLite is a single file on a single volume).

The backend also serves `/sitemap.xml` and `/robots.txt` (the sitemap lists the home page, `/books` and every project). Project pages get their own server-rendered title and social preview (Open Graph / Twitter card), so links shared on social networks show the project, not the generic site.

### Contact form (Resend)

The contact form sends mail through [Resend](https://resend.com). It is optional: without a key the form shows a fallback with your email address.

1. Create a free account at Resend and create an API key (Dashboard → API Keys).
2. In Railway, set `RESEND_API_KEY` to that key on the service and redeploy.
3. Optional: to send to any address, verify your domain in Resend (Domains), then set `CONTACT_FROM` to a sender on it, e.g. `Portfolio <hola@yourdomain.com>`.
4. Optional: set `CONTACT_TO` if the messages should go somewhere other than the profile email.

Until a domain is verified, Resend only delivers to the email address of your Resend account, so keep the default `CONTACT_FROM` for testing only.

### Spotify

1. Create an app at <https://developer.spotify.com/dashboard> and add a Redirect URI (`http://127.0.0.1:3000/api/spotify/callback` locally, `https://<your-domain>/api/spotify/callback` in production).
2. Set `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` and `SPOTIFY_REDIRECT_URI` on the backend.
3. In `/admin` → **Spotify**, press **Connect Spotify**, approve access, then pick your playlists.

The refresh token is stored in the SQLite database (so it is part of the backup zip). Visitors never call Spotify: the playlists are a snapshot refreshed hourly, and the top artist is cached on the server for an hour.

### Backups

- Use the **Descargar backup** button in `/admin`, and/or Railway's volume backups.
- A downloaded backup is a zip with `portfolio.sqlite`, the uploaded CV PDFs in `cv/` and the uploaded images in `media/`. Restoring it into Railway is not supported yet (a restore/import feature is a planned follow-up).
- Always download a backup **before deploying entity changes**: `synchronize: true` alters the schema on boot.

## Languages

The site is in **Spanish by default**, with an **ES / EN** switch in the top bar (the choice is remembered in the browser).

- Fixed UI text lives in `frontend/src/i18n/translations.ts`. The English dictionary is typed against the Spanish one, so a missing key fails the build.
- The profile intro, roles and availability, and project summaries, have separate ES and EN fields in `/admin`. If one language is left empty, the other one is shown.
- Book titles and notes are shown exactly as written in both languages.

## Project structure

```
backend/src
  analytics/     /api/analytics  (cookieless daily counters)
  auth/          POST /api/auth/verify
  backup/        /api/backup     (zip of DB, CVs and images)
  books/         /api/books      (CRUD, writes need x-admin-key)
  common/        admin-key guard, DTO transforms
  contact/       /api/contact    (Resend mailer)
  cv/            /api/cv         (uploaded CV PDFs)
  goodreads/     Goodreads feed sync
  media/         uploaded project images
  profile/       /api/profile    (GET, PATCH)
  projects/      /api/projects   (CRUD, writes need x-admin-key)
  seo/           server-rendered meta, /sitemap.xml, /robots.txt
  support/       IT support card and case stories
  timeline/      journey entries

frontend/src
  App.tsx        routes: /, /books, /projects/:slug, /admin, /login (redirects to /admin), 404
  context/       AdminAuthContext (session key), PortfolioDataContext (shared data)
  i18n/          translations (es, en) and LanguageContext
  lib/           api client, book/profile helpers, analytics
  hooks/         useDocumentTitle, useFormState
  components/    illustrations/, books/, projects/, layout/, form/
  pages/         home/, books/, projects/, admin/ (Books, Projects, Timeline, Support, Profile, CV, Analytics), NotFoundPage
  styles/        CSS split by area, imported in order from styles/index.css
```
