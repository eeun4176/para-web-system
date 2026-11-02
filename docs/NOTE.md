Hello po, Ma'am Layca! Thank you for checking **Para**, a fare and route guide for commuters in San Jose del Monte, Bulacan.
This page has everything needed to open and check the system.

## Links

| | Link |
| --- | --- |
| **Passenger site (end users)** | https://para-sjdm.vercel.app |
| **Admin sign-in** | https://para-sjdm.vercel.app/client/admin-login.html |
| **1-minute demo video** | https://para-sjdm.vercel.app/client/aboutus.html#demo |
| **Source code** | https://github.com/eeun4176/para-web-system |

## Admin Account

| Account key | Password |
| --- | --- |
| `ParaAdmin` | `Para2026` |

- Use the **admin sign-in link above**. The passenger log-in page does not accept the admin account.
- Five wrong passwords lock the sign-in for 15 minutes.
- Fare changes made in the admin panel apply to the live site right away, and every change is listed in the **Audit Log**.

## Passenger (End-User) Access

- **As a guest:** open the passenger site and click **Start Your Commute**. No account is needed to compute fares.
- **With an account:** click **Sign Up**, type an email you can open, and click **Continue**. Para emails a 6-digit code; enter it and the account is made (or use **Continue with Google**). A password can be added later in Account Settings. Signed-in passengers also get saved trips, favorites, landmarks, and account settings.

## How to Use Para (Quick Check, about 5 minutes)

**Passenger side**
1. Open https://para-sjdm.vercel.app and click **Start Your Commute**.
2. In **From**, type a place in SJDM (for example "Tungko"); in **To**, type another (for example "starm" for Starmall). Pick each from the list.
3. Para draws the road route. If **Route 1 / Route 2** appear, pick one.
4. Choose a vehicle and the **Student** passenger type: the fare shows the 20% discount and a full breakdown (base fare, added distance, discount), plus the distance, travel time, and arrival time.
5. Sign up, compute a trip again, then open **Saved**: the trip is in **Recent**. Save it as a **Favorite**, and right-click the map to add a **Landmark**.
6. Click **EN / FIL** to switch to Filipino, and the sun / moon button for dark mode.
7. Open the profile picture → **Account Settings** (profile, security, preferences, activity), then **Log Out**. Pressing the browser's Back button after logging out does not show the signed-in page again.

**Admin side**
1. Sign in at the admin link with the account above.
2. **Dashboard:** totals, charts, the trips calendar, and the **Where People Go** heat map.
3. **Fare Management:** change a vehicle's base fare, then compute a fare on the passenger site to see the new amount.
4. **Public Landmarks**, **Users**, and **Audit Log:** add or edit a landmark, search users, and see your changes listed in the log.

The full guide is in [SYSTEM-GUIDE.md](SYSTEM-GUIDE.md).

## Where the Rubric Items Are

| Criteria | Where to look |
| --- | --- |
| **JSON** | Every API answer is JSON (`api/helpers.php`: `ok()` / `fail()`); the heat map uses GeoJSON (`api/admin/heatmap.php`); trips can be exported as JSON (Saved → Recent → Export JSON). |
| **AJAX** | All data loads without page reloads through `scripts/api.js` (`API.get` / `API.post`, jQuery `$.ajax`). |
| **PHP** | 41 endpoints in `api/` (auth with email codes, trips, favorites, landmarks, admin). The fare is computed on the server in `api/fare_logic.php`. |
| **HTML / CSS** | Pages in `client/`, styles in `style/`, one set of design tokens with light and dark mode (`style/global.css`, see [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)). Responsive down to phone size. |
| **jQuery** | DOM updates, events, dialogs, filters, tabs, and toasts in `scripts/app.js`, `ui.js`, `admin.js`, `auth.js`. |
| **Database** | PostgreSQL on Supabase, 11 tables with keys and constraints (`database/para_db.pgsql.sql`). |
| **Integration** | Front end ↔ PHP ↔ database, plus the map (MapLibre / OpenFreeMap), road routes (OSRM), place search (Photon / Nominatim), and Google sign-in. See [ARCHITECTURE.md](ARCHITECTURE.md). |
| **User Experience** | Search that accepts half-typed names, road route with options, skeleton loading, toasts, English / Filipino, dark mode, the demo video. |
| **Security** | Emailed one-time codes (hashed, 10 minutes, 5 tries), bcrypt passwords, sign-in lockout and rate limits, CSRF tokens, prepared SQL statements, role checks on every admin request, escaped output, security headers. See the Security part of [ARCHITECTURE.md](ARCHITECTURE.md). |

## Good to Know

- The map, route, and search services are free public servers. If a route takes a moment, a dashed straight line shows first; the fare still works.
- The Google sign-in button only works on the live site, not on a local copy.
- The admin password will be changed after grading, since this repository is public.
