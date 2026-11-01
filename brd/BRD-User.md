# IT302P – System Integration and Architecture

# Business Requirement Document (BRD)

**Project Name:** Para — Fare Commuter System  
**Feature:** User Account

## 1. Purpose

The User Account feature gives commuters a registered PARA account that keeps their personal commuting data in one place. It covers creating an account, staying signed in while moving between pages, and managing the items tied to the account: Recent Trips, Favorite Routes, and My Landmarks.

Guests can still compute fares without an account. Saving trips, keeping favorite routes, and adding personal landmarks require the user to be logged in, and each user can only see and manage their own saved items.

## 2. Benefits

- Commuters can create their own PARA account using their name, email address, and password, or with their Google account.
- Logged-in users do not have to re-enter the same origin and destination every time, because trips are saved and can be run again.
- Frequently used routes can be kept as Favorite Routes with a custom label for faster retrieval.
- Users can mark and describe their own landmarks on the SJDM map, including places not commonly shown on public maps.
- Personal data stays tied to the account, so users only see their own trips, favorites, and landmarks.

## 3. Business Requirements

- **Navigation Bar**

  The navigation bar should be located at the top section of the page and provide users with quick access to the main pages and functions of the PARA commuter system. It should consist of the following elements:

  1. **PARA Logo** - Display of the system’s logo and serves as a link that redirects users to the homepage. For logged-in users, it redirects to the Calculate page.
  2. **Home** - A navigation link that directs the users to the homepage.
  3. **Calculate** - A navigation link that directs the users to the fare calculation page, where users can calculate their estimated commuting fares.
  4. **About Us** - A navigation link that provides information about the system, its purpose, and its mascot.
  5. **Language Toggle** - A button (EN / FIL) that allows users to switch the page between English and Filipino.
  6. **Theme Toggle** - A toggle button that allows users to switch between light and dark modes.
  7. **Log In / Profile Menu** - Displays the appropriate authentication option depending on the user's login status.

### Account Registration (Sign Up)

The Sign Up form allows a new user to create a PARA account. It is reached through the Sign Up link on the Log In page.

- **Sign Up Title** - Displays the heading "Create Your Account" to identify the current form.
- **Continue with Google Button** - Allows the user to create an account with their Google account.
- **Name Field** - Allows the user to enter their name.
- **Email Field** - Allows the user to enter the email address that will be used to log in.
- **Password Field** - Allows the user to enter the account password.
- **Password Visibility Toggle** - Allows the user to show or hide the entered password.
- **Terms Agreement Checkbox** - Requires the user to agree to the Terms of Service and Privacy Policy before creating an account.
- **Create Account Button** - Submits the registration details.
- **Log In Link** - Returns the user to the Log In form if they already have an account.

### Registration Validation

- **Required Fields** - Name, email, and password must be completed before the account can be created.
- **Terms Agreement** - The system must block registration and show the message "Please agree to the Terms of Service." if the checkbox is not ticked.
- **Email Format** - The system must check that the entered email follows a valid format.
- **Duplicate Email** - An email that is already registered must not be used to create another account.
- **Successful Registration** - When all details are valid, the system must create the account and show a 12-character recovery code. The user must save this code before continuing, because it is needed to reset the password.
- **Password Security** - Passwords must be stored securely (hashed) and never displayed back to the user.

### Authenticated Session

- **Session Persistence** - After logging in, the user must stay logged in while moving between the Calculate and Account Settings pages. Home and About Us are meant for guests, so logged-in users are taken to the Calculate page.
- **Account-Only Features** - Saving trips, Favorite, and Save Landmark must be enabled only for logged-in users.
- **Guest Prompt** - When a guest clicks "Save as favorite", the system must prompt them to log in first.
- **Session End** - Logging out ends access to all account-only features (see the Log Out BRD).

### Recent Trips

Recent Trips stores every trip the logged-in user calculates on the Calculate page.

- **Automatic Saving** - Saves the current origin, destination, transportation, and passenger type to Recent Trips once the fare is calculated.
- **Recent Trips List** - Lists the user's saved trips in the Saved tab of the trip panel.
- **Run Again** - Tapping a saved trip reloads it into the Calculate form and shows its fare and route.
- **Remove Trip** - The remove (X) button deletes one trip from the list.
- **Clear All** - Deletes all of the user's recent trips at once.
- **Export JSON** - Downloads the user's trip history as a JSON file.

### Favorite Routes

Favorite Routes stores routes the user wants to keep for repeated use.

- **Save as Favorite Button** - Opens the Save Favorite Route dialog after a fare has been calculated.
- **Label Field** - Allows the user to name the route (e.g., "Home to School").
- **Save / Cancel** - Save adds the route to the Favorites list; Cancel closes the dialog without saving.
- **Favorites List** - Lists the user's favorite routes with their labels.
- **Open Favorite** - Selecting a favorite reloads its route into the Calculate form.
- **Remove Favorite** - The remove (X) button deletes a favorite route.

### My Landmarks

My Landmarks lets users mark their own places on the SJDM map.

- **Add Landmark** - Right-clicking a point on the map opens the Add a Landmark dialog.
- **Landmark Details Entry** - The dialog accepts a Name, a Category (Other, School, Hospital, Terminal, Market, Church, Park, Food), and a Short Description.
- **Add / Cancel** - Add Landmark saves it to My Landmarks; Cancel closes the dialog without saving.
- **My Landmarks List** - Lists the user's saved landmarks together with the public landmarks.
- **Landmark Details** - Selecting a landmark shows its name, category, and short description with Edit, Delete, and Close buttons.
- **Edit Landmark** - Allows the user to change the name, category, and short description and save the changes.
- **Delete Landmark** - Removes the landmark from My Landmarks and from the map.

### Account Data Ownership

- **Own Data Only** - Recent Trips, Favorite Routes, and My Landmarks must show only the items saved by the logged-in user.
- **Data Persistence** - Saved items must still be available after the user logs out and logs back in.
- **Data Privacy** - Personal information is handled in line with the Data Privacy Act of 2012 (RA 10173).

## 4. User Story

- As a new commuter in San Jose del Monte, I want to create a PARA account, so that I can keep my trips and places in one account.
- As a logged-in user, I want my trips to be saved so I can run them again, so that I don't have to re-enter the same route every day.
- As a logged-in user, I want to label my frequently used routes as favorites, so that I can find them quickly.
- As a logged-in user, I want to add, edit, and delete my own landmarks on the map, so that I can mark places that matter to my commute.
- As a registered user, I want only my own saved items to be shown, so that my personal commuting data stays private.

## 5. Acceptance Criteria

| No. | Acceptance Criteria |
| --- | --- |
| 1 | The Sign Up form must contain Name, Email, and Password fields, a password show/hide toggle, a Terms agreement checkbox, and a Create Account button. |
| 2 | The system must prevent account creation when any required field is empty. |
| 3 | The system must block registration and show "Please agree to the Terms of Service." when the Terms checkbox is not ticked. |
| 4 | An email that is already registered must not be used to create another account. |
| 5 | Valid registration details must create a new account that can be used to log in, and the recovery code must be shown once. |
| 6 | After logging in, the user must remain logged in while navigating the Calculate and Account Settings pages, and the navigation bar must display the user's profile picture with "Log Out" in its menu. |
| 7 | When a guest clicks "Save as favorite", the system must prompt the user to log in first. |
| 8 | Every calculated trip of a logged-in user must be added to Recent Trips, and tapping a saved trip must run it again. |
| 9 | The remove (X) button must delete a single recent trip, and "Clear All" must delete all recent trips. |
| 10 | Saving a favorite must store the route with its label in the Favorites list; Cancel must close the dialog without saving. |
| 11 | Right-clicking the map must allow the user to add a landmark with a name, category, and short description, which then appears in My Landmarks. |
| 12 | Selecting a saved landmark must show its details with working Edit, Delete, and Close buttons. |
| 13 | Recent Trips, Favorites, and My Landmarks must show only the logged-in user's own items. |
| 14 | Saved trips, favorites, and landmarks must remain available after the user logs out and logs back in. |

## 6. User Interface

Image 1 - Sign Up Page

Image 2 - Logged-in Navigation Bar (Profile Menu with Log Out)

Image 3 - Save Favorite Route Dialog

Image 4 - Saved Tab: Recent Trips (Run Again, Remove, Clear All, Export JSON)

Image 5 - Add a Landmark Dialog

Image 6 - Landmark Details and Edit Landmark Dialog

## 7. Additional Considerations

- Browser Compatibility:
  1. Microsoft Edge
  2. Google Chrome
- Email verification (OTP or email link) during sign up is out of scope.
- Profile editing (changing name, email, password, and profile picture) is covered in the Account Settings BRD.
- Admin account functions are covered in the Admin Sign In, Admin Dashboard, and Admin Management BRDs.
- Landmarks and saved trips are limited to locations within San Jose del Monte, Bulacan.
