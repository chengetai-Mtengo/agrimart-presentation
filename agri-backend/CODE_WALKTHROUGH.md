# AgriMart Backend Code Walkthrough

This file explains how the backend code works module by module. Read it together with `README.md`: the README explains how to run and use the API, while this file explains how the code is organized internally.

## Request Lifecycle

Every request follows this flow:

```text
client
  -> server.js
  -> src/app.js
  -> global middleware
  -> /api/health or /api routes
  -> route file
  -> validation middleware
  -> authentication middleware when required
  -> controller
  -> service
  -> PostgreSQL through pg pool
  -> response
  -> centralized error handler if anything fails
```

## `server.js`

`server.js` is the runtime entry point. It does not define routes or business logic.

It does four things:

1. Imports the Express app from `src/app.js`.
2. Calls `initializeDatabase()` before listening on the HTTP port.
3. Starts `app.listen()` only after Supabase PostgreSQL is reachable.
4. Handles port conflicts and graceful shutdown signals.

This is why the backend no longer falls back to memory. If the database does not connect, the server does not pretend to run normally.

## `src/app.js`

`src/app.js` creates and configures the Express app.

It installs global middleware:

- `helmet()` for security headers.
- `compression()` for compressed responses.
- `cors()` using `ALLOWED_ORIGINS`.
- `express-rate-limit` to limit repeated requests.
- `express.json()` and `express.urlencoded()` for request body parsing.
- Morgan request logging through `requestLogger`.
- Static file serving for `/uploads`.
- Swagger UI at `/api-docs`.

It also defines:

- `GET /api/health`
- the global database guard for `/api`
- all API routes from `src/routes/index.js`
- the not-found handler
- the centralized error handler

## `src/config/env.js`

This file loads `.env` from the backend root.

It validates that required variables exist:

- `DATABASE_URL`
- `JWT_SECRET`

It also checks that `DATABASE_URL` uses `postgres://` or `postgresql://`. This catches configuration mistakes early during startup.

## `src/config/config.js`

This module turns raw environment variables into application configuration.

Examples:

- Converts `PORT` into a number.
- Converts `ALLOWED_ORIGINS` from comma-separated text into an array.
- Exposes booleans such as `isProduction`, `isDevelopment`, and `isTest`.

Other files import `config` instead of reading `process.env` directly.

## `src/config/database.js`

This module owns the PostgreSQL connection.

It creates a `pg.Pool` using the existing Supabase `DATABASE_URL`. It enables SSL automatically for remote database URLs and disables SSL for local database URLs.

Important exports:

- `pool`: shared PostgreSQL pool used by services.
- `initializeDatabase()`: connects and runs `SELECT 1`.
- `isDatabaseReady()`: tells the app whether the DB is available.
- `closeDatabase()`: closes the pool during shutdown.

## `src/config/logger.js`

This file configures Winston.

It writes logs to:

- `logs/app.log`
- `logs/error.log`

During development it also prints logs to the terminal. The logger is used by startup, request logging, and centralized error handling.

## `src/config/swagger.js`

This builds the OpenAPI document used by Swagger UI.

Swagger scans route files in `src/routes/*.js`, then `src/app.js` serves the UI at:

```text
/api-docs
```

## `src/routes/index.js`

This is the route registry. It mounts each route group:

```text
/api/auth     -> authRoutes
/api/users    -> userRoutes
/api/products -> productRoutes
/api/saved    -> savedRoutes
```

Keeping this file small makes it easy to see the whole API surface.

## Auth Routes

File:

```text
src/routes/authRoutes.js
```

Routes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Register and login run Joi validation first. `/me` runs the `authenticate` middleware first, because it needs a valid JWT.

## User Routes

File:

```text
src/routes/userRoutes.js
```

Routes:

- `GET /api/users`
- `GET /api/users/:id`

These return public profile fields only. Password hashes are never returned.

## Product Routes

File:

```text
src/routes/productRoutes.js
```

Routes:

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `POST /api/products/:id/mark-sold-out`

Create, update, delete, and mark-sold-out require authentication. The service also checks ownership for update/delete/sold-out by matching `supplier_id` to the authenticated user ID.

## Saved Product Routes

File:

```text
src/routes/savedRoutes.js
```

Routes:

- `GET /api/saved`
- `POST /api/saved/:productId`
- `DELETE /api/saved/:productId`

All saved-product routes require authentication because saved products belong to a user.

## Controllers

Controllers live in:

```text
src/controllers/
```

They are intentionally thin. A controller receives an HTTP request, calls a service, and sends the response.

Examples:

- `authController.register()` calls `authService.registerUser()`.
- `productController.createProduct()` calls `productService.createProduct()`.
- `savedController.toggleSavedProduct()` calls `savedService.toggleSavedProduct()`.

Controllers use `asyncHandler`, so thrown errors automatically go to the centralized error handler.

## Services

Services live in:

```text
src/services/
```

Services contain business logic and SQL.

### `authService.js`

Handles:

- duplicate email checks
- password hashing
- profile inserts
- password comparison
- JWT creation
- fetching the authenticated profile

It only returns mapped public user objects, never `password_hash`.

### `userService.js`

Handles:

- listing public users
- fetching one user by ID

### `productService.js`

Handles:

- listing products with filters
- fetching one product
- creating listings
- updating only allowed fields
- deleting only listings owned by the authenticated user
- marking owned listings as sold out

SQL queries are parameterized. User input is never interpolated directly into SQL values.

### `savedService.js`

Handles:

- listing saved products
- toggling saved status
- removing a saved product

Before saving a product, it checks that the product exists.

## Validation

Validation files live in:

```text
src/validations/
```

`authValidation.js` validates register and login payloads.

`productValidation.js` validates product creation, product updates, and product list query filters.

The validation middleware strips unknown fields so clients cannot accidentally send extra data into service logic.

## Middleware

Middleware lives in:

```text
src/middleware/
```

### `auth.js`

Reads the `Authorization` header, verifies the JWT, and attaches:

- `req.userId`
- `req.userRole`

### `databaseRequired.js`

Blocks `/api` routes with `503` when the database is not ready.

### `validation.js`

Runs Joi validation against `req.body` or `req.query`.

### `errorHandler.js`

Converts thrown errors into JSON responses. It logs every error with method, URL, IP, stack trace, and user ID when available.

### `notFound.js`

Creates a clean `404` response for unknown routes.

### `requestLogger.js`

Connects Morgan HTTP request logs to Winston.

## Utilities

Utilities live in:

```text
src/utils/
```

### `errors.js`

Defines typed errors:

- `ValidationError`
- `AuthenticationError`
- `ForbiddenError`
- `NotFoundError`
- `ConflictError`

These keep status codes consistent across the API.

### `asyncHandler.js`

Wraps async controllers and forwards thrown errors to Express.

### `mappers.js`

Converts database rows into frontend-friendly response objects.

Example:

```text
joined_date -> joinedDate
avatar_color -> avatarColor
category_id -> categoryId
image_url -> imageUrl
supplier_id -> supplierId
created_at -> createdAt
```

This lets the database keep snake_case while the frontend keeps camelCase.

## Tests

Tests live in:

```text
src/__tests__/
```

The current test file checks:

- `/api/health` returns a structured response.
- `/api/products` returns `503` when the database has not been initialized in the test process.

The app is importable without starting the HTTP server, which makes it testable with Supertest.

## Why There Is No Memory Store

The old backend had an in-memory demo store. That was useful for a prototype, but dangerous for a real backend because data disappears on restart and can hide broken database configuration.

The new backend is database-first:

- startup requires a successful DB connection
- `/api` routes require DB readiness
- all persistent data goes through Supabase PostgreSQL

## How A Login Request Works

1. Frontend sends `POST /api/auth/login` with `email` and `password`.
2. `authRoutes.js` validates the payload with `loginSchema`.
3. `authController.login()` calls `authService.loginUser()`.
4. `authService` looks up the profile by email.
5. `bcrypt.compare()` checks the password.
6. A JWT is signed with `JWT_SECRET`.
7. The controller returns `{ token, user }`.
8. The frontend stores the token and uses it on later requests.

## How A Product Create Request Works

1. Frontend sends `POST /api/products` with a bearer token.
2. `authenticate` verifies the token.
3. Joi validates product fields.
4. `productController.createProduct()` calls `productService.createProduct()`.
5. The service inserts the product with `supplier_id = req.userId`.
6. The inserted row is mapped to camelCase and returned.

## How Errors Move Through The App

1. A service throws a custom error, such as `NotFoundError`.
2. `asyncHandler` catches it and calls `next(error)`.
3. `errorHandler` logs it.
4. `errorHandler` sends JSON with the right HTTP status.

This keeps controllers clean and makes error responses predictable.
