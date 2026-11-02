# Architecture

How Para is put together: the pages, the PHP API, the database, and how they talk to each other.

## Overview

```
Browser (HTML + CSS + jQuery)
   │  AJAX, JSON  (scripts/api.js)
   ▼
PHP API  (api/*.php)  ──PDO──►  PostgreSQL on Supabase
   │
   └─ Map, routes, search: called by the browser directly
      OpenFreeMap tiles · OSRM road routes · Photon / Nominatim search · Google sign-in
```

- **Front end:** plain HTML pages in `client/`, styled by `style/`, made interactive by `scripts/` (jQuery 3.7.1).
- **Back end:** one PHP script per action in `api/`. Every script returns JSON.
- **Database:** PostgreSQL on Supabase. PHP is the only thing that reads or writes it.
- **The server decides:** the fare, the admin role, and every check on user input happen in PHP. The browser only shows results.

## Folders

| Folder | What is inside |
| --- | --- |
| `client/` | The pages: `index.html` (home), `calculate.html`, `aboutus.html`, `auth.html` (log in or sign up: email, then a code or password), `account-settings.html`, `admin-login.html`. The `admin*.php` files here are small stubs for XAMPP. |
| `api/` | The PHP API. Subfolders by topic: `auth/`, `admin/`, `trips/`, `favorites/`, `landmarks/`. Shared code in `helpers.php`, `fare_logic.php` and `config/`. |
| `api/pages/` | The 6 admin pages (PHP, so the server can refuse non-admins before any HTML is sent). `partials/admin-nav.php` is the shared sidebar. |
| `scripts/` | Front-end JavaScript (see the table below). |
| `style/` | CSS. `global.css` holds the design tokens and shared parts; one file per page after that. |
| `assets/` | Logo, favicon, Para images (`img/`), the showcase video (`video/`), and the SJDM boundary GeoJSON. |
| `database/` | `para_db.pgsql.sql` (the full database) and a migration for older databases. Not uploaded to Vercel. |
| `docs/` | This documentation. |

## Front-end scripts

| File | Job |
| --- | --- |
| `early-theme.js` | Runs first in `<head>`: applies dark mode before the page is drawn, sends signed-in passengers away from guest pages, and reloads stale pages after the browser's Back button. |
| `api.js` | The `API.get` / `API.post` helper. Sends and receives JSON, attaches the CSRF token to every POST, and turns errors into `{ status, message, errors }`. Also `escapeHtml()`. |
| `auth.js` | The log-in steps (email check, emailed code, password), Google sign-in, log out, and the navbar's account area. |
| `i18n.js` | English / Filipino switch for the passenger pages (dictionary keyed by the English text). |
| `map-logic.js` | The MapLibre map: SJDM outline, place search, road routes (with alternatives), markers. |
| `fare-engine.js` | Loads the vehicle and passenger options from the database and asks `api/calculate.php` for the fare. |
| `data-manager.js` | Landmarks cache (`api/landmarks/*.php`). |
| `app.js` | The calculate page: inputs, results, saved trips, favorites, landmarks, profile menu, toasts. |
| `ui.js` | Shared UI on every page: icons, mobile menu, modals, segmented tabs, scroll animations, home page hero map. |
| `account-settings.js` | The account settings page. |
| `admin.js` | All admin pages: dashboard stats, charts, calendar, heat map, tables, fare editing. |

External libraries (loaded from CDNs): jQuery 3.7.1, MapLibre GL 5, Lucide icons, Google Identity Services.

## Request flow (example: computing a fare)

1. The user picks a start and a destination. `map-logic.js` asks OSRM for the road route and draws it.
2. `fare-engine.js` calls `API.get('calculate.php', { olat, olng, dlat, dlng, transport, passenger, roadKm, fromRoadM })`.
3. `api/calculate.php` validates every value, then `compute_fare()` in `api/fare_logic.php`:
   - reads the vehicle's base fare, base km, and per-km rate from `transport_types`, and the discount from `passenger_types`;
   - uses the road distance if it is believable (between 0.95× and 3× the straight line), else the straight line;
   - `fare = base fare + (km over the base km × rate per km) − discount`, rounded to the nearest peso (the exact amount is also sent for the breakdown);
   - ETA = distance ÷ the vehicle's average speed;
   - adds the walk / tricycle / long-trip notes from how far the start and the stop are from a main road (measured by `map-logic.js` from the map tiles: trunk, primary, secondary, or tertiary roads, where jeepneys and buses run).
4. PHP returns JSON. If the user is signed in, `app.js` saves the trip with `trips/add.php` (the server computes the fare again before saving).
5. `app.js` shows the fare, the breakdown, and the ETA.

## API

Every endpoint is `api/<folder>/<name>.php`, takes JSON (POST) or query values (GET), and answers with JSON:

```json
{ "success": true, "...": "..." }
{ "success": false, "message": "Please fix the highlighted fields.", "errors": { "email": "..." } }
```

| Folder | Endpoints |
| --- | --- |
| (root) | `calculate.php`, `fares.php` (active vehicle and passenger types) |
| `auth/` | `start` (email check), `send_code`, `verify_code`, `login` (password), `google`, `logout`, `me`, `profile`, `update_profile`, `change_email`, `change_password`, `preferences`, `update_profile_picture`, `avatar`, `admin_login` |
| `trips/` | `list`, `add`, `delete`, `clear` |
| `favorites/` | `list`, `add`, `delete` |
| `landmarks/` | `list`, `add`, `update`, `delete` |
| `admin/` | `stats`, `charts`, `calendar`, `heatmap`, `users_list`, `user_delete`, `audit_list`, `transport_update`, `passenger_update`, `type_add`, `type_toggle`, `type_delete`, `change_password` |

Shared helpers in `api/helpers.php`: `ok()` / `fail()` for responses, `input()` for the JSON body, `require_post()` (method + CSRF), `require_login()`, `require_passenger()`, `require_admin()`, input cleaners (`clean_landmark`, `clean_route`, `clean_number`, `valid_id`), `audit()` for the admin log, the login lockout, and the email-code helpers (`issue_code`, `check_code`, `send_mail` through Brevo, `rate_limited`, `sign_in`).

## Database

PostgreSQL (`database/para_db.pgsql.sql`). Row Level Security is on with no policies, so Supabase's public REST API cannot read the tables; PHP connects as the database owner.

| Table | Holds |
| --- | --- |
| `users` | Passengers and the admin. Passengers sign in with an emailed code, a password (optional), or Google; the admin with an account key. `email_verified` is 1 once the user proved they own the email. Profile picture bytes, default vehicle and passenger type. |
| `transport_types` | Vehicles and their fare rules (base fare, base km, rate per km, average speed, active). |
| `passenger_types` | Regular, Student, Senior Citizen, PWD and their discount rate. |
| `trips` | Each computed trip of a signed-in passenger. |
| `favorite_routes` | Saved start → destination pairs. |
| `landmarks` | Private landmarks of a passenger, and public ones added by the admin. |
| `audit_log` | Every admin change (who, what, when, details). |
| `login_attempts` | Failed logins, for the 5-tries / 15-minute lockout. |
| `login_codes` | One-time 6-digit codes sent by email (log in / sign up, or confirming a new email). Only a hash is stored; a code works once, for 10 minutes, and 5 wrong tries cancel it. |
| `rate_limits` | Request counters for the email check and code sending. |
| `php_sessions` | PHP sessions (Vercel has no shared disk, so sessions live in the database). |

## Security

- **Passwords:** bcrypt (`password_hash` / `password_verify`), optional for passengers. 5 failed logins lock the account for 15 minutes.
- **Email codes:** 6 random digits, stored hashed, valid once for 10 minutes, cancelled after 5 wrong tries; one per minute and 5 per hour per email (10 per device). The email check is limited to 40 per 10 minutes per device.
- **Account takeover:** an email account is only created after its code is entered, so nobody can register someone else's email. When Google signs in to an older account that never proved its email, that account's password is removed and its other sessions end.
- **Sensitive changes:** changing the password or email needs the current password unless the user logged in within the last 10 minutes; a new email must be confirmed with a code sent to it. A password change signs out other devices.
- **Sessions:** stored in `php_sessions`, strict mode, cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` on HTTPS. The session ID changes on login.
- **CSRF:** every POST must carry the token from `auth/me.php` (`require_post()`).
- **Roles:** passenger endpoints use `require_passenger()`, admin endpoints and pages use `require_admin()`. The admin cannot use the passenger login, and passengers cannot open admin pages.
- **SQL:** prepared statements everywhere (PDO), no string-built queries.
- **Output:** text from users is escaped (`escapeHtml()` / jQuery `.text()`) before it is shown.
- **Input:** every field is checked on the server (types, lengths, ranges, SJDM bounds for map points). The road distance from the browser is only trusted within limits.
- **Headers:** `X-Frame-Options: DENY`, a `frame-ancestors 'none'` CSP, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, and `Cache-Control: no-store` on pages so Back after logout does not show a signed-in page.
- **Secrets:** database credentials and the Brevo email key (`BREVO_API_KEY`, `MAIL_FROM`) live in Vercel environment variables or the git-ignored `api/config/db.local.php`. Without the key, a local copy writes emails to `api/logs/mail.log` instead. The admin account is not created by the SQL file; its sign-in for grading is in `docs/NOTE.md` and should be changed after grading.

## Deployment

| | Vercel (live) | XAMPP (local) |
| --- | --- | --- |
| PHP | Only `api/index.php` runs, using the `vercel-php` runtime. `vercel.json` rewrites `/api/<route>.php` to `api/index.php?__route=<route>`, which checks the route against an allowlist and runs that script. This keeps the project at one serverless function. | Apache runs each `api/*.php` file directly. |
| Admin pages | `/client/admin*.php` is rewritten to `api/pages/`. | The stubs in `client/` include `api/pages/`. |
| Database | `DB_*` environment variables (Supabase session pooler). | `api/config/db.local.php` (copy `db.local.example.php`). |
| Not uploaded | `.vercelignore` skips `database/`, logs, the XAMPP stubs and local config. | |

## External services

| Service | Used for | Key needed |
| --- | --- | --- |
| OpenFreeMap (`positron` / `dark`) | Map tiles | No |
| OSRM demo server | Road routes, alternatives, distance from the nearest road | No |
| Photon, then Nominatim as a fallback | Place search inside SJDM | No |
| Google Identity Services | "Continue with Google" | Public client ID only |

The OSRM, Photon, and Nominatim demo servers are rate-limited. They are fine for a school project but not for heavy traffic.
