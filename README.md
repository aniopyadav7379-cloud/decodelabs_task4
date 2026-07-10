# Interns Directory — Project 4: Frontend & Backend Integration

**DecodeLabs Full Stack Development · Industrial Training Kit · Batch 2026**

A production-shaped full-stack app built to satisfy every requirement in the
Project 4 brief — send requests from frontend to backend, display dynamic data on
the UI, handle errors and responses correctly — using plain HTML/CSS/JS on the
frontend and Node.js/Express on the backend. Beyond the core brief it now also
includes auth, search/sort/pagination, CSV/JSON export, bulk actions, dark mode,
and a profile detail view (see Section 5).

---

## 1. Architecture (the I-P-O model, made concrete)

```
project4-interns-directory/
├── backend/                    # Stage 2: Process (Cognitive)
│   ├── server.js                # App bootstrap: CORS, JSON parsing, routes, error handling
│   ├── config/corsConfig.js     # Same-Origin Policy gatekeeper (slide: "The CORS Barrier")
│   ├── routes/                  # REST endpoints — nouns, not verbs (/interns, /auth)
│   ├── controllers/             # One async handler per verb, always forwards errors via next(err)
│   ├── data/internsStore.js     # In-memory "database": CRUD + search/sort/paginate + bulk remove
│   ├── middleware/
│   │   ├── errorHandler.js       # Centralized error handler + 404 handler
│   │   └── requireAuth.js        # Guards mutating routes behind a valid JWT
│   └── utils/                   # AppError, validators, CSV serializer
│
└── frontend/                    # Stage 1 & 3: Input (Sensory) / Output (Motor)
    ├── index.html                 # Toolbar, grid, drawers, login modal, network console
    ├── css/styles.css             # Design tokens (incl. dark theme), all component styles
    └── js/
        ├── config.js               # Deployment-configurable API base URL
        ├── apiClient.js             # fetch() wrapper — attaches auth header, checks response.ok
        ├── auth.js                  # Token storage, expiry check
        ├── theme.js                 # Dark/light mode, persisted
        ├── ui.js                    # All DOM writes — textContent only, never innerHTML
        ├── networkConsole.js        # Live HTTP traffic log (this project's signature element)
        ├── toast.js                 # Non-blocking success/error notifications
        └── app.js                   # Wires events to API calls; try/catch/finally everywhere
```

## 2. Running it

**Backend**
```bash
cd backend
npm install
cp .env.example .env
npm run dev        # nodemon, restarts on save
# or: npm start
```
The API starts at `http://localhost:5000`. Verify with:
```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/interns
```

**Frontend**
Any static file server works (no build step). From the `frontend/` folder:
```bash
python3 -m http.server 5500
# or use VS Code's "Live Server" extension (also serves on 5500 by default)
```
Open `http://localhost:5500/index.html`. If you serve it on a different port, add
that origin to `CORS_ORIGIN` in `backend/.env`.

**Default login** (change before deploying anywhere real):
```
username: admin
password: ChangeMe123!
```
Set your own in `backend/.env` via `ADMIN_USERNAME` / `ADMIN_PASSWORD`, and set a
long random `JWT_SECRET`. The server refuses to start if `JWT_SECRET` is missing.

## 3. REST surface

| Method | Endpoint                     | Purpose                              | Auth required | Success | Errors |
|--------|-------------------------------|----------------------------------------|:---:|:---:|------------|
| POST   | `/api/auth/login`              | Log in, returns a JWT                 | – | 200 | 400, 401 |
| GET    | `/api/interns`                 | List interns (search/sort/paginate)   | – | 200 | 500 |
| GET    | `/api/interns/:id`              | Fetch one intern                      | – | 200 | 400, 404 |
| GET    | `/api/interns/export`          | Export current filtered view as CSV/JSON | – | 200 | 422 |
| POST   | `/api/interns`                 | Create an intern                      | ✅ | 201 | 401, 409, 422 |
| PUT    | `/api/interns/:id`              | Replace an intern (full body)         | ✅ | 200 | 400, 401, 404, 409, 422 |
| PATCH  | `/api/interns/:id`              | Update part of an intern              | ✅ | 200 | 400, 401, 404, 409, 422 |
| DELETE | `/api/interns/:id`              | Remove an intern                      | ✅ | 204 | 400, 401, 404 |
| POST   | `/api/interns/bulk-delete`     | Remove many at once `{ids:[1,2,3]}`   | ✅ | 200 | 401, 422 |

**List query params:** `?department=`, `?search=`, `?sort=name\|department\|role\|joinedOn`,
`?order=asc\|desc`, `?page=`, `?limit=` (max 50). `/export` accepts the same filters
(minus pagination) plus `?format=csv|json`, so exports always match what's on screen.

**Auth:** send `Authorization: Bearer <token>` on protected routes. Reads stay public —
this is "login so only you can edit," not a full multi-user system.

Every response has a consistent shape:
```json
{ "success": true,  "data": { /* ... */ } }
{ "success": false, "error": { "message": "...", "code": "VALIDATION_ERROR" } }
```

## 4. Where each training-deck concept lives in the code

| Concept from the deck                     | Where to find it |
|--------------------------------------------|-------------------|
| I-P-O architecture                          | `backend/server.js` middleware order; folder split above |
| RESTful nouns + idempotency matrix          | `backend/routes/internsRoutes.js`, `controllers/internsController.js` |
| Synchronous freeze vs. async/await          | `frontend/js/apiClient.js` — every call is `async`, awaited, never blocking |
| Native `fetch()` skeleton                   | `frontend/js/apiClient.js` → `request()` |
| CORS & the preflight barrier                | `backend/config/corsConfig.js` |
| HTTP status code vocabulary                 | `controllers/internsController.js`, `middleware/errorHandler.js` |
| JSON parsing & serialization                | `apiClient.js` (`JSON.stringify` out, safe `JSON.parse` in) |
| DOM injection without XSS                   | `frontend/js/ui.js` — `el()` helper uses `textContent` exclusively |
| try/catch/finally, no silent failures       | `frontend/js/app.js` — every handler |
| Anti-patterns avoided (Promise.all, checked `response.ok`, stale-response guard) | `app.js` `init()`, `loadInterns()`'s `requestSeq` guard |

## 5. Feature additions beyond the core brief

- **Auth** — `POST /api/auth/login` issues a JWT (`backend/controllers/authController.js`);
  `requireAuth` middleware protects all writes. Frontend stores the token in
  `localStorage` (`frontend/js/auth.js`) and gates Add/Edit/Delete/bulk-delete UI
  accordingly (`ui.js` → `setAuthUI`).
- **Search / sort / pagination** — `internsStore.queryAll()` + `paginate()` back both
  the list and export endpoints, so what you search/sort/filter is exactly what you export.
- **Export** — CSV (RFC 4180-escaped, `backend/utils/csv.js`) and JSON, downloadable
  from the toolbar; respects current search/filter/sort.
- **Bulk actions** — checkboxes appear on cards once logged in; the bulk toolbar sends
  one `POST /api/interns/bulk-delete` request instead of N sequential deletes.
- **Profile view** — clicking an intern's name opens a read-only drawer with the full
  profile (phone, manager, LinkedIn, notes), with Edit/Delete shortcuts when logged in.
- **Dark mode** — `frontend/js/theme.js` toggles a `data-theme` attribute; every color
  in `styles.css` is a CSS variable, so no component-specific dark rules were needed.

## 6. The Network Console

The panel fixed to the bottom-right of the UI is a live log of every request and
response this page makes — the normally invisible network hop between "Frontend
(Sensory Interface)" and "Backend (Cognitive Vault)" made visible, color-coded by
status class (2xx green / 4xx amber / 5xx red), exactly mirroring the HTTP Status
Code Diagnostic Matrix from the deck.

## 7. Next steps

- Swap `data/internsStore.js` for a real database (Postgres via Prisma, or MongoDB) —
  the controller layer already treats it as a black-box repository, so nothing else changes.
- Move from a single hardcoded admin to a real users table + refresh tokens if this
  ever needs more than one editor.
- Wire `middleware/errorHandler.js`'s `console.error` branch to Sentry, as flagged in
  the deck's "Intern Anti-Patterns" table.
