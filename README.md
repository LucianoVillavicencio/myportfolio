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
| `DB_PATH`       | `backend/portfolio.sqlite`       | Where the SQLite file is stored.                             |
| `CORS_ORIGIN`   | any origin                       | Comma-separated allow-list, e.g. `https://example.com`.      |
| `PORT`          | `3000`                           |                                                              |

## Owner panel

Go to `/admin` (or press **Alt + A** / **Ctrl + Shift + A** anywhere) and enter your `ADMIN_API_KEY`. From there you can:

- **Books** — add (with OpenLibrary cover auto-find), edit, rate, bump progress `+10p`, delete.
- **Projects** — add, edit, feature/unfeature (featured ones are listed first), delete.
- **Profile** — name, roles, intro text, availability, stack, email and social links shown in the hero and footer.

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
  lib/           api client, book/profile helpers
  hooks/         useDocumentTitle, useFormState
  components/    illustrations/, books/, projects/, layout/, form/
  pages/         home/, books/, admin/, NotFoundPage
  styles/        CSS split by area, imported in order from styles/index.css
```
