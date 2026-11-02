# Para: SJDM Fare and Route Guide

**Know your fare before you ride.**

Para is a web app for commuters in San Jose del Monte, Bulacan. Search where you are going and Para draws the real road route, estimates the travel time, and computes the jeepney or bus fare from the LTFRB fare matrix, with the Student, Senior Citizen, and PWD discount applied for you.

- **Live site:** https://para-sjdm.vercel.app
- **Demo video:** [About Us → See Para in Action](https://para-sjdm.vercel.app/client/aboutus.html#demo)
- **Facebook:** https://www.facebook.com/profile.php?id=61596359450395
- **Instagram:** https://www.instagram.com/para.sjdm/

## Features

**For passengers**
- Place search inside SJDM that works with half-typed names, plus recent places and current location.
- Road route on the map with other route options, distance, travel time, and arrival time.
- Fare with a full breakdown and automatic 20% discount for Student, Senior Citizen, and PWD.
- Notes when the last part needs a walk or a tricycle, or when a long trip may need a transfer.
- Free account (email or Google): recent trips saved by themselves, favorite routes, your own landmarks, and default vehicle and passenger type.
- English / Filipino switch and light / dark mode.

**For the admin**
- Dashboard with totals, charts, a trips calendar, and a heat map of where people go.
- Fare management (vehicles, rates, discounts), public landmarks, users, and an audit log of every change.

## Tech Stack

| Part | Used |
| --- | --- |
| Front end | HTML, CSS, jQuery 3.7.1 (AJAX + JSON), Lucide icons |
| Map | MapLibre GL with OpenFreeMap tiles, OSRM road routes, Photon / Nominatim search |
| Back end | PHP 8 (PDO) |
| Database | PostgreSQL on Supabase |
| Hosting | Vercel (`vercel-php` runtime) |
| Sign-in | Email + password (bcrypt) and Google Identity Services |

## Run It Locally (XAMPP)

1. Put the project in `htdocs` (or point Apache to it). PHP 8 with the `pdo_pgsql` extension turned on is required.
2. Create the database: run `database/para_db.pgsql.sql` in the Supabase SQL Editor (or any PostgreSQL 15+).
3. Copy `api/config/db.local.example.php` to `api/config/db.local.php` and fill in the connection details. This file is git-ignored; never commit it.
4. Open `http://localhost/para-web-system/` (or `php -S localhost:8000` from the project folder, then `http://localhost:8000/client/index.html`).

The admin account is not created by `para_db.pgsql.sql`; create it once in the database (the team has the script) and sign in at `client/admin-login.html`. The sign-in for checking the live site is in [docs/NOTE.md](docs/NOTE.md).

## Deploy (Vercel)

1. Import the GitHub repository in Vercel.
2. Add the environment variables `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` (Supabase → Connect → Session pooler).
3. Deploy. `vercel.json` sends every `/api/*.php` request to `api/index.php`, so the whole API runs as one function.

## Project Structure

```
client/     pages (home, calculate, about us, log in, account settings, admin log in)
api/        PHP API (auth, trips, favorites, landmarks, admin) and the admin pages (api/pages)
scripts/    front-end JavaScript (jQuery)
style/      CSS (global.css holds the design tokens)
assets/     logo, Para images, showcase video, SJDM boundary
database/   PostgreSQL schema and seed data
docs/       architecture, system guide, design system, note for the professor
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md): how the pages, API, and database fit together, plus security and deployment.
- [System Guide](docs/SYSTEM-GUIDE.md): how to use Para as a passenger and as the admin.
- [Design System](docs/DESIGN-SYSTEM.md): colors, fonts, spacing, motion, and components.
- [Note for the Professor](docs/NOTE.md): links, the admin sign-in, and a quick checking guide.

## Credits

- Map data © OpenStreetMap contributors, tiles by OpenFreeMap / OpenMapTiles.
- Demo video music: "Carefree" by Kevin MacLeod (incompetech.com), licensed under CC BY 4.0. Narration: Kokoro TTS.
- Course project for IT305W, 2026.
