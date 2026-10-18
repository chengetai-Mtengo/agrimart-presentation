# AgriMart Backend

AgriMart Backend is a production-ready Node.js and Express API for the AgriMart agricultural marketplace. It connects to the existing Supabase PostgreSQL database through `DATABASE_URL`, serves authentication, user profiles, product listings, saved products, health checks, and interactive API documentation.

## What This Backend Includes

- Express REST API with a modular `src/` architecture.
- Supabase PostgreSQL connection using the existing `.env` database link.
- No in-memory fallback. If the database is unavailable, startup fails or API routes return `503`.
- JWT authentication for protected routes.
- Password hashing with `bcryptjs`.
- Centralized error classes and error responses.
- Joi request validation.
- Winston application logging and Morgan HTTP request logging.
- Helmet security headers.
- CORS configuration from environment variables.
- Rate limiting.
- Compression.
- Swagger/OpenAPI documentation at `/api-docs`.
- Jest and Supertest test setup.
- GitHub Actions CI workflow.

## Project Structure

```text
agri-backend/
├── .github/workflows/ci.yml
├── logs/
├── migrations/
├── scripts/deploy.sh
├── src/
│   ├── __tests__/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── validations/
│   └── app.js
├── .env
├── .env.example
├── package.json
└── server.js
```

## Requirements

- Node.js 22 or newer is recommended.
- npm.
- A Supabase PostgreSQL database with these public tables:
  - `profiles`
  - `products`
  - `saved_products`

## Environment Variables

The backend loads variables from `agri-backend/.env`. The important part is that `DATABASE_URL` must point to your Supabase PostgreSQL connection string.

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
JWT_SECRET=replace-with-a-long-random-secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace-with-service-role-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
API_URL=http://localhost:5000
LOG_LEVEL=info
```

Never commit `.env`. It contains live credentials. Use `.env.example` as the public template.

Before running the mobile integration against an older database, apply the
idempotent profile-coordinate migration:

```bash
psql "$DATABASE_URL" -f migrations/001_profile_coordinates.sql
psql "$DATABASE_URL" -f migrations/002_marketplace_categories.sql
```

## Installation

```bash
npm install
```

The required production dependencies are already listed in `package.json`: `express`, `pg`, `joi`, `helmet`, `express-rate-limit`, `morgan`, `winston`, `swagger-jsdoc`, `swagger-ui-express`, `compression`, `cors`, `bcryptjs`, and `jsonwebtoken`.

## Running Locally

Development mode with auto-restart:

```bash
npm run dev
```

Production-style start:

```bash
npm start
```

If startup is successful, the logs will show that the backend connected to Supabase and is listening on the configured port.

## Useful URLs

- API health check: `http://localhost:5000/api/health`
- Swagger API docs: `http://localhost:5000/api-docs`

## Database Behavior

The server validates `.env`, opens a PostgreSQL connection, and runs `SELECT 1` before it starts listening. If Supabase cannot be reached, the process exits with a clear error.

At runtime, `/api/health` reports:

```json
{
  "ok": true,
  "status": "ok",
  "database": "supabase"
}
```

If the database is unavailable before route handling, protected API routes return:

```json
{
  "error": "Database unavailable"
}
```

## API Overview

### Health

```text
GET /api/health
```

Returns service status, database status, uptime, environment, version, and memory usage.

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

Registration returns a success message. Login accepts a username or unique
account email in the `username` field and returns:

```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "farmer"
  }
}
```

Send authenticated requests with:

```text
Authorization: Bearer <token>
```

### Users

```text
GET /api/users
GET /api/users/:id
PUT /api/users/profile
PUT /api/users/location
POST /api/users/change-password
```

Returns public user profile data.

### Products

```text
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
POST   /api/products/:id/mark-sold-out
```

Supported list filters:

```text
category
search
supplier
limit
```

Creating, updating, deleting, and marking a product sold out require a JWT.

### Saved Products

```text
GET    /api/saved
POST   /api/saved/:productId
DELETE /api/saved/:productId
```

All saved-product routes require a JWT.

## Validation

Joi validates request bodies and selected query strings before controllers run. Invalid input returns a `400` response with a readable message. Unknown input fields are stripped to avoid accidental writes.

## Error Handling

Errors are represented by custom classes in `src/utils/errors.js`. Controllers and services throw these errors, and `src/middleware/errorHandler.js` converts them into consistent JSON responses.

Common statuses:

- `400` for validation errors.
- `401` for missing or invalid authentication.
- `404` for missing resources.
- `409` for duplicate registrations.
- `500` for unexpected server errors.

## Logging

Logs are written to:

- `logs/app.log`
- `logs/error.log`

HTTP requests are logged through Morgan into Winston. In development, logs are also printed to the terminal.

## Security

The backend uses:

- `helmet` to set safe HTTP headers.
- `cors` with `ALLOWED_ORIGINS`.
- `express-rate-limit` to reduce request abuse.
- `bcryptjs` for password hashing.
- `jsonwebtoken` for signed auth tokens.
- Parameterized SQL queries through `pg` to prevent SQL injection.

## Testing

Run:

```bash
npm test
```

The suite covers health/auth guards plus mobile-facing validation, user mapping,
and upload errors. Product CRUD integration tests require a dedicated test database.

## CI

GitHub Actions workflow lives at:

```text
.github/workflows/ci.yml
```

It installs dependencies and runs `npm test` in the backend folder.

## Deployment

`render.yaml` intentionally leaves `DATABASE_URL`, `JWT_SECRET`,
`SUPABASE_SERVICE_ROLE_KEY`, `API_URL`, and `ALLOWED_ORIGINS` for the provider
dashboard. Never put credential values in the manifest. If a database password,
JWT secret, or service-role key has previously been committed or shared, rotate it
in PostgreSQL/Supabase and the hosting provider before deploying this revision.

The optional deployment script is:

```text
scripts/deploy.sh
```

It pulls the latest code, installs production dependencies, and starts the server with `NODE_ENV=production`.

## Common Issues

### `DATABASE_URL` is missing

Make sure the file is named `.env`, not only `.env.example`, and that it is inside `agri-backend/`.

### `EADDRINUSE: address already in use :::5000`

Another process is already using port `5000`. Stop that process or change `PORT` in `.env`.

### Supabase connection fails

Check the database password, host, port, network access, and SSL settings. The backend uses SSL automatically for non-local database URLs.

# Backend fixes: rate limit + tight price comparison

Two drop-in file replacements for your `agri-backend` repo.

## 1. Rate limiting — extended significantly

**File:** `src/app.js` (full replacement — only the `apiLimiter` block and
the health-endpoint JSDoc changed; everything else is identical to what
you had)

Previously: **100 requests per 15 minutes per IP**, shared across every
route under `/api`. A single page load in the frontend can easily fire
3–5 requests (products list, users list for supplier name/photo joins,
saved products, notifications...), so a normal browsing session — not
abuse — could exhaust that in a few minutes, especially for anyone behind
a shared office/school IP where multiple people's traffic counts against
the same bucket.

Now: **2000 requests per 15 minutes per IP** — 20x more headroom, same
window shape (still recovers over time, still protects against real
scraping/abuse, since sustained hammering at that volume is still far
beyond normal use).

If you ever need to go further, the honest options are:
- Raise `max` again (it's just a number).
- Split into per-route limits — keep something strict on
  `POST /api/auth/login` specifically (to slow down password-guessing),
  and remove/loosen the limit entirely on read-only `GET` endpoints like
  `/api/products`, which is where normal browsing generates the most
  volume and carries the least abuse risk.
- Key the limiter by authenticated user id instead of IP for logged-in
  requests, so one busy user doesn't affect others in decoding a shared
  connection.

## 2. Price comparison — now tight (same product, same unit)

**File:** `src/services/productService.js` (full replacement — only
`compareProducts()` changed)

Previously, `GET /api/products/compare?productId=...` filtered **only by
category**. That meant viewing "White Maize" (category: grains) could
show "Rice" or any other grain as a "comparable" price, purely because
they share a category — not because they're the same product. Comparing
a per-kg price against a per-50kg-bag price for the same crop is just as
misleading, and that wasn't filtered either.

Fixed to require **category AND matching name (case-insensitive) AND
identical unit** — so a comparison is now only ever apples-to-apples:
same product, same pricing unit, different suppliers.

```diff
  WHERE category_id = $1
    AND id != $2
    AND availability != 'hidden'
+   AND LOWER(name) = LOWER($3)
+   AND unit = $4
  ORDER BY price ASC
  LIMIT 20
```

### Also fixed on the frontend, defensively

I tightened this on the frontend too (`app/products/[id]/page.js` and the
standalone `app/compare/page.js`), filtering client-side by name + unit
(and, on the standalone comparison page, category too) before rendering.
This means the UI is correct even before you deploy this backend fix —
but deploying this fix is still worth doing, since it's more efficient
(the database does the filtering instead of fetching up to 20 rows just
to discard most of them) and keeps the API itself honest for anyone else
building against it directly.

### One doc tweak if you applied the earlier Swagger update

If you already applied the Swagger overhaul from before, the `/compare`
endpoint's description there is still accurate (it already said "up to 20
other listings in the same category, cheapest first") — you may want to
tighten that wording to "...same category, same name, and same unit" to
match this fix exactly. Not required for anything to work, just for the
docs to stay precise.

## Applying this

Copy `src/app.js` and `src/services/productService.js` from this package
into your repo, overwriting the files at those paths. No other changes
needed — redeploy as usual.
