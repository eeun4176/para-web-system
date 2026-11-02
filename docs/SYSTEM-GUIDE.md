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

### 1. Log In or Create an Account (optional)

Logging in and signing up are the same steps:

1. Click **Log In** or **Sign Up** in the navbar.
2. Click **Continue with Google**, or type your email. While you type, the note under the box says if the email is missing an @, if it is **registered to Para**, or if it is new.
3. Click **Continue**:
   - **New email:** Para emails a **6-digit code**. Enter it and your account is made. Your name starts as the part of your email before the @ (change it in Account Settings).
   - **Registered email with a password:** choose **Send Code to Email** or **Log In with Password**.
   - **Registered email without a password** (made with Google or a code): Para emails a code.
4. A code works once, for 10 minutes. You can ask for a new one after 1 minute; 5 wrong tries cancel it.

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
   - a **note** when your starting point or your stop is away from the main roads that jeepneys and buses use (walk if it is close, ride a tricycle if it is far), when the whole trip is under 0.5 km (walking may be easier), or when a long trip may need a transfer.

The fare follows the LTFRB fare matrix stored in Para's database: a base fare for the first kilometers, then a fixed amount for each kilometer after. The fare is rounded to the nearest peso (₱13.60 becomes ₱14.00); the breakdown shows the exact amount before rounding.
Real fares and times can still change with the driver's road and traffic.

### 3. Save Your Trips (signed in)

- **Recent:** every computed trip is saved by itself. Open **Saved → Recent** to see it again, export it as JSON, or clear the list.
- **Favorites:** after computing a trip, save it as a favorite (for example "Home to School") and open it later in one tap.
- **Landmarks:** right-click a spot on the map and choose to add a landmark. Give it a name, category, and description. Only you can see your landmarks; public landmarks come from the admin.

### 4. Account Settings

Open your profile picture → **Account Settings**. The tabs are:

- **Profile:** name, email, and profile picture. Changing your email sends a code to the new address; it changes once you enter it.
- **Security:** set a password (optional) or change it. Right after logging in (10 minutes), Para does not ask for your current password.
- **Preferences:** the vehicle and passenger type the calculator starts with.
- **Activity:** your saved trips, favorites, and landmarks, with delete buttons.

### 5. Language and Theme

- Click **EN / FIL** in the navbar to switch the passenger pages between English and Filipino.
- Click the **sun / moon** switch for light or dark mode.
- Both choices are remembered on your device.

### 6. Log Out

Profile picture → **Log Out**. After logging out, the browser's Back button will not show your signed-in pages again.

### Forgot Your Password?

Log in with a code instead: enter your email, choose **Send Code to Email** (or **Log in with a code instead** on the password step), then open **Account Settings → Security** and set a new password. No current password is needed right after logging in.

## Admin

### Sign In

- Go to **/client/admin-login.html** (not the passenger log-in page).
- Sign in with the **account key** and password. The sign-in for checking is in [NOTE.md](NOTE.md).
- 5 wrong tries lock the sign-in for 15 minutes.

### Pages

| Page | What you can do |
| --- | --- |
| **Dashboard** | Totals (users, trips, fares, landmarks), "+N vs last week", charts (trips per day, by vehicle, top destinations), the **calendar** of trips per day, and the **Where People Go** heat map of trip destinations from the last 90 days. |
| **Fare Management** | Change a vehicle's base fare, base km, rate per km, and average speed; change passenger discounts; add, turn on/off, or delete vehicle and passenger types (deleting one that saved trips used hides it, and those trips keep their fare). Changes apply to the next fare computed. |
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
| The log-in code didn't arrive | Check the spam folder. After 1 minute, click **resend the code**, or log in with your password or Google. |
| The page still looks signed in after logging out | Reload the page. |
