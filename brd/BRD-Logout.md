# IT302P – System Integration and Architecture

# Business Requirement Document (BRD)

**Project Name:** Para — Fare Commuter System  
**Feature:** Log Out

## 1. Purpose

The Log Out feature allows authenticated users to terminate their active PARA session when they no longer wish to use their account. The feature is intended to prevent continued access to account-restricted functionality after a user logs out. It should also provide clear feedback that the logout process has completed.

## 2. Benefits

- Allows users to end their authenticated session.
- Helps prevent unauthorized access when a user leaves a shared or public device.
- Provides feedback when the logout action is completed.
- Maintains a clear distinction between authenticated and guest users.

## 3. Business Requirements

- **Navigation Bar**

  The navigation bar should be located at the top section of the page and provide users with quick access to the main pages and functions of the PARA commuter system. It should consist of the following elements:

  1. **PARA Logo** - Display of the system’s logo and serves as a link that redirects users to the homepage. For logged-in users, it redirects to the Calculate page.
  2. **Home** - A navigation link that directs the users to the homepage.
  3. **Calculate** - A navigation link that directs the users to the fare calculation page, where users can calculate their estimated commuting fares.
  4. **About Us** - A navigation link that provides information about the system, its purpose, and its mascot.
  5. **Language Toggle** - A button (EN / FIL) that allows users to switch the page between English and Filipino.
  6. **Theme Toggle** - A toggle button that allows users to switch between light and dark modes.
  7. **Log In / Sign Up / Profile Menu** - Displays the appropriate authentication option depending on the user's login status. Logged-in users see their profile picture, which opens a menu that includes the Log Out button.

- **Log Out Location**

  1. **Profile Menu** - The Log Out button is found in the menu that opens from the user’s profile picture.
  2. **Account Settings** - The Log Out button is also found beside the user’s name on the Account Settings page.
  3. **Admin Sidebar** - Administrators log out through the Log Out button at the bottom of the admin sidebar.

- **Logout Feedback and Validation**

  The system must verify that the authenticated session is no longer active after logout. If the logout request fails and the session cannot be confirmed as terminated, the system must provide appropriate feedback and avoid falsely reporting successful logout. When the logout succeeds, the system shows the message "Logged out. See you soon!".

- **Logout Confirmation**

  1. **Confirmation Prompt** - The system should display a confirmation dialog.
  2. **Confirm Logout** - Agreeing must proceed with the logout process.
  3. **Cancel Logout** - Cancelling must close the dialog and keep the user logged in.
  4. **Restricted Feature Access** - Users can no longer access features that require an active account.

## 4. User Story

As an authenticated PARA user, I want to log out of my account so that I can end my session when I have finished using the system.

## 5. Acceptance Criteria

| No. | Acceptance Criteria |
| --- | --- |
| 1 | The Log Out option must be available when the user is authenticated. |
| 2 | The system must redirect the user to an appropriate public page or logged-out view after logout. Passengers go to the Log In page, while administrators go to the admin sign-in page. |
| 3 | When navigating the confirmation dialog, selecting Cancel must leave the user authenticated, while confirming must proceed with logout. |
| 4 | Guest users must not be presented with an active Log Out action when no authenticated session exists. |
| 5 | The system must prevent further access to protected account features using the terminated session. |
| 6 | Pressing the browser's back button after logging out must not bring back the logged-in session. |

## 6. User Interface

Image 1 - Successful logout validation

## 7. Additional Considerations

- Browser Compatibility:
  1. Microsoft Edge
  2. Google Chrome
