# Personal Portfolio & Live Reading Tracker

A full-stack personal website with a tactile neo-brutalist dark aesthetic, built with **React + TypeScript + Vite** and a **NestJS + TypeORM + SQLite** API.

All content — projects, books and your profile/contact info — lives in the database and is managed from the owner panel at `/admin`.

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

| Variable        | Default                          | Notes                                                        |
| --------------- | -------------------------------- | ------------------------------------------------------------ |
| `ADMIN_API_KEY` | `secret-admin-key` (dev only)    | **Required** when `NODE_ENV=production`.                     |
| `DB_PATH`       | `backend/portfolio.sqlite`       | Where the SQLite file is stored. **Required** when `NODE_ENV=production`. |
| `STATIC_DIR`    | `frontend/dist`                  | Built frontend served by Nest (the Docker image sets `/app/public`). |
| `CORS_ORIGIN`   | any origin                       | Comma-separated allow-list, e.g. `https://example.com`. Not needed when Nest serves the frontend. |
| `PORT`          | `3000`                           |                                                              |

## Owner panel

Go to `/admin` (or press **Alt + A** / **Ctrl + Shift + A** anywhere) and enter your `ADMIN_API_KEY`. From there you can:

- **Books** — add (with OpenLibrary cover auto-find), edit, rate, bump progress `+10p`, delete.
- **Projects** — add, edit, feature/unfeature (featured ones are listed first), delete.
- **Profile** — name, roles, intro text, availability, stack, email and social links shown in the hero and footer.
- **Backup** — the **Descargar backup** button downloads a copy of the SQLite database.

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

### Backups

- Use the **Descargar backup** button in `/admin`, and/or Railway's volume backups.
- A downloaded backup is a full SQLite file. Restoring it into Railway is not supported yet (a restore/import feature is a planned follow-up).
- Always download a backup **before deploying entity changes**: `synchronize: true` alters the schema on boot.

## Languages

The site is in **Spanish by default**, with an **ES / EN** switch in the top bar (the choice is remembered in the browser).

- Fixed UI text lives in `frontend/src/i18n/translations.ts`. The English dictionary is typed against the Spanish one, so a missing key fails the build.
- The profile intro, roles and availability, and project summaries, have separate ES and EN fields in `/admin`. If one language is left empty, the other one is shown.
- Book titles and notes are shown exactly as written in both languages.

## Project structure

```
backend/src
  auth/          POST /api/auth/verify
  books/         /api/books      (CRUD, writes need x-admin-key)
  projects/      /api/projects   (CRUD, writes need x-admin-key)
  profile/       /api/profile    (GET, PATCH)
  common/        admin-key guard, DTO transforms

frontend/src
  App.tsx        routes: /, /books, /admin, 404
  context/       AdminAuthContext (session key), PortfolioDataContext (shared data)
  i18n/          translations (es, en) and LanguageContext
  lib/           api client, book/profile helpers
  hooks/         useDocumentTitle, useFormState
  components/    illustrations/, books/, projects/, layout/, form/
  pages/         home/, books/, admin/, NotFoundPage
  styles/        CSS split by area, imported in order from styles/index.css
```
