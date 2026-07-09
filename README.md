# Interns Directory — Project 4: Frontend & Backend Integration

**DecodeLabs Full Stack Development · Industrial Training Kit · Batch 2026**

A small, production-shaped full-stack app built to satisfy every requirement in the
Project 4 brief: send requests from frontend to backend, display dynamic data on the
UI, and handle errors and responses correctly — using plain HTML/CSS/JS on the
frontend and Node.js/Express on the backend, exactly as illustrated in the training
deck's diagrams (native `fetch()`, `async`/`await`, manual DOM injection via
`createElement`/`textContent`, REST verbs, CORS, and HTTP status codes).

---

## 1. Architecture (the I-P-O model, made concrete)

```
project4-interns-directory/
├── backend/                 # Stage 2: Process (Cognitive)
│   ├── server.js             # App bootstrap: CORS, JSON parsing, routes, error handling
│   ├── config/corsConfig.js  # Same-Origin Policy gatekeeper (slide: "The CORS Barrier")
│   ├── routes/               # REST endpoints — nouns, not verbs (/interns)
│   ├── controllers/          # One async handler per verb, always forwards errors via next(err)
│   ├── data/                 # In-memory "database" (swap for Postgres/Mongo later)
│   ├── middleware/           # Centralized error handler + 404 handler
│   └── utils/                # AppError class + request validators
│
└── frontend/                 # Stage 1 & 3: Input (Sensory) / Output (Motor)
    ├── index.html             # Toolbar, intern grid, add/edit drawer, network console
    ├── css/styles.css         # Design tokens, cards, drawer, toasts, network console
    └── js/
        ├── apiClient.js       # fetch() wrapper — single source of "check response.ok"
        ├── ui.js              # All DOM writes — textContent only, never innerHTML
        ├── networkConsole.js  # Live HTTP traffic log (this project's signature element)
        ├── toast.js           # Non-blocking success/error notifications
        └── app.js             # Wires events to API calls; try/catch/finally everywhere
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
Any static file server works (the frontend has no build step). From the `frontend/`
folder:
```bash
python3 -m http.server 5500
# or use VS Code's "Live Server" extension (also serves on 5500 by default)
```
Open `http://localhost:5500/index.html`. If you serve it on a different port, add
that origin to `CORS_ORIGIN` in `backend/.env`.

## 3. REST surface

| Method | Endpoint            | Purpose                     | Idempotent | Success | Errors     |
|--------|----------------------|------------------------------|:----------:|:-------:|------------|
| GET    | `/api/interns`        | List interns (optional `?department=`) | ✅ | 200 | 500 |
| GET    | `/api/interns/:id`    | Fetch one intern             | ✅ | 200 | 404 |
| POST   | `/api/interns`        | Create an intern              | ❌ | 201 | 422 |
| PUT    | `/api/interns/:id`    | Replace an intern (full body) | ✅ | 200 | 404, 422 |
| PATCH  | `/api/interns/:id`    | Update part of an intern      | ❌ | 200 | 404, 422 |
| DELETE | `/api/interns/:id`    | Remove an intern              | ✅ | 204 | 404 |

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
| HTTP status code vocabulary                 | `controllers/internsController.js` (200/201/204/404/422), `middleware/errorHandler.js` |
| JSON parsing & serialization                | `apiClient.js` (`JSON.stringify` on the way out, safe `JSON.parse` on the way in) |
| DOM injection without XSS                   | `frontend/js/ui.js` — `el()` helper uses `textContent` exclusively |
| try/catch/finally, no silent failures       | `frontend/js/app.js` — every handler (`loadInterns`, `handleFormSubmit`, `handleDelete`) |
| Anti-patterns avoided (Promise.all, checked `response.ok`, no `console.log` swallowing) | `app.js` `init()` uses `Promise.all`; `apiClient.js` always checks `response.ok` before parsing |

## 5. The Network Console

The panel fixed to the bottom-right of the UI is a live log of every request and
response this page makes — the normally invisible network hop between "Frontend
(Sensory Interface)" and "Backend (Cognitive Vault)" made visible, color-coded by
status class (2xx green / 4xx amber / 5xx red), exactly mirroring the HTTP Status
Code Diagnostic Matrix from the deck.

## 6. Next steps (natural extensions, not required for this milestone)

- Swap `data/internsStore.js` for a real database (Postgres via Prisma, or MongoDB) —
  the controller layer already treats it as a black-box repository, so nothing else changes.
- Add auth (JWT) and enforce it in the CORS `allowedHeaders`.
- Wire `middleware/errorHandler.js`'s `console.error` branch to Sentry, as flagged in
  the deck's "Intern Anti-Patterns" table.
