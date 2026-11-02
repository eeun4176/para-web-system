# System Guide

How to use Para, for passengers and for the admin. Live site: **https://para-sjdm.vercel.app**

## Who Can Do What

| | Guest | Passenger (free account) | Admin |
| --- | --- | --- | --- |
| Home, About Us, FAQ | Yes | Goes straight to Calculate | No (admin panel only) |
| Search places, see road routes, compute fares | Yes | Yes | No |
| Recent trips, favorites, own landmarks | No | Yes | No |
| Account settings | No | Yes | Admin Settings instead |
| Change fares, public landmarks, users, audit log | No | No | Yes |

## Passengers

### 1. Create an Account (optional)

1. Click **Sign Up** in the navbar.
2. Enter your name, email, and a password, or click **Continue with Google**.
3. With email sign-up, Para shows a **12-character recovery code** once. Save it: you need it to reset your password, change your password, or change your email.

You can also click **Continue as Guest** to use the calculator without an account.

### 2. Compute a Fare

1. Open **Calculate**.
2. In **From**, type a place (half a name is fine, like "starm") and pick it from the list. You can also pick your current location or a recent place.
3. Do the same in **To**.
4. Para draws the road route on the map. If there are other ways to get there, they appear as **Route 1**, **Route 2**… Pick one.
5. Choose your **vehicle** (jeepney, bus…) and **passenger type** (Regular, Student, Senior Citizen, PWD).
6. Para shows:
   - the **fare**, with the 20% discount applied for Student, Senior Citizen, and PWD;
   - the **fare breakdown** (base fare, added distance, discount);
   - the **distance**, the **travel time**, and the **arrival time**;
   - a **note** when you need to walk or ride a tricycle for the last part, or when a long trip may need a transfer.

The fare follows the LTFRB fare matrix stored in Para's database: a base fare for the first kilometers, then a fixed amount for each kilometer after. The fare is rounded to the nearest peso (₱13.60 becomes ₱14.00); the breakdown shows the exact amount before rounding.
Real fares and times can still change with the driver's road and traffic.

### 3. Save Your Trips (signed in)

- **Recent:** every computed trip is saved by itself. Open **Saved → Recent** to see it again, export it as JSON, or clear the list.
- **Favorites:** after computing a trip, save it as a favorite (for example "Home to School") and open it later in one tap.
- **Landmarks:** right-click a spot on the map and choose to add a landmark. Give it a name, category, and description. Only you can see your landmarks; public landmarks come from the admin.

### 4. Account Settings

Open your profile picture → **Account Settings**. The tabs are:

- **Profile:** name, email, and profile picture.
- **Security:** change your password (needs your current password and recovery code).
- **Preferences:** the vehicle and passenger type the calculator starts with.
- **Activity:** your saved trips, favorites, and landmarks, with delete buttons.

### 5. Language and Theme

- Click **EN / FIL** in the navbar to switch the passenger pages between English and Filipino.
- Click the **sun / moon** switch for light or dark mode.
- Both choices are remembered on your device.

### 6. Log Out

Profile picture → **Log Out**. After logging out, the browser's Back button will not show your signed-in pages again.

### Forgot Your Password?

On the log-in page, click **Forgot Password?**, enter your email, your recovery code, and a new password.
Accounts made only with Google sign in with Google and have no password to reset.

## Admin

### Sign In

- Go to **/client/admin-login.html** (not the passenger log-in page).
- Sign in with the **account key** and password. The sign-in for checking is in [NOTE.md](NOTE.md).
- 5 wrong tries lock the sign-in for 15 minutes.

### Pages

| Page | What you can do |
| --- | --- |
| **Dashboard** | Totals (users, trips, fares, landmarks), "+N vs last week", charts (trips per day, by vehicle, top destinations), the **calendar** of trips per day, and the **Where People Go** heat map of trip destinations from the last 90 days. |
| **Fare Management** | Change a vehicle's base fare, base km, rate per km, and average speed; change passenger discounts; add, turn on/off, or delete vehicle and passenger types. Changes apply to the next fare computed. |
| **Public Landmarks** | Add, edit, and delete the landmarks every user sees on the map. |
| **Users** | Search by name or email, filter Passengers / Admins, and delete an account. |
| **Audit Log** | Every admin change: who, what, when, and the old → new values. Filter by fares, landmarks, or users. |
| **Settings** | The account key, display name, and password. |

The sidebar collapses to icons with the button next to the logo. Light and dark mode work on every admin page.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| "Cannot reach the server" | Check your internet connection. On a local copy, make sure Apache is running and `api/config/db.local.php` is filled in. |
| The road route does not appear (a dashed straight line stays) | The free routing service is busy. The fare still uses the straight-line distance; try again after a moment. |
| A place cannot be found | Para only searches inside San Jose del Monte. Try a nearby landmark or a shorter name. |
| "Too many attempts" on log in | Wait 15 minutes, then try again. |
| The page still looks signed in after logging out | Reload the page. |
