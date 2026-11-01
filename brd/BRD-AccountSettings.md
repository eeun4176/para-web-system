# IT302P – System Integration and Architecture

# Business Requirement Document (BRD)

**Project Name:** Para — Fare Commuter System  
**Feature:** Account Settings

## 1. Purpose

The Account Settings page allows logged-in users to view and manage the details of their PARA account. It covers the user’s profile picture, name, email address, password, commute preferences, and a summary of their saved activity. The page is divided into sections so that users can find each setting easily.

## 2. Benefits

- Allows users to keep their name, email address, and profile picture up to date.
- Allows users to change their password securely.
- Saves the user’s usual passenger type and vehicle, so the Calculate page starts with them.
- Shows users a summary of what they have saved in PARA.

## 3. Business Requirements

- **Navigation Bar**

  The navigation bar should be located at the top section of the page and provide users with quick access to the main functions of the PARA commuter system. It should consist of the following elements:

  1. **PARA Logo** - Display of the system’s logo and serves as a link that redirects logged-in users back to the Calculate page.
  2. **Language Toggle** - A button (EN / FIL) that allows users to switch the page between English and Filipino.
  3. **Theme Toggle** - A toggle button that allows users to switch between light and dark modes.
  4. **Profile Menu** - Displays the user’s profile picture, which opens a menu with Account Settings, their saved items, and Log Out.

- **Profile Header**

  The profile header identifies the account being managed.

  1. **Profile Picture** - Displays the user’s profile picture, or the first letter of their name when no picture is set.
  2. **Change Picture Button** - Allows users to upload a new profile picture (JPG, PNG, or WebP, up to 2 MB).
  3. **Name and Email** - Displays the user’s name and email address beside the profile picture.
  4. **Log Out Button** - Allows users to log out of their account (see the Log Out BRD).

- **Section Tabs**

  The page shows one section at a time through tabs: Profile, Security, Preferences, and Activity. The highlight slides to the selected tab.

- **Profile Section**

  1. **Name** - Displays the user’s name with an Edit button that opens the Edit Name dialog.
  2. **Email** - Displays the user’s email address with a Change button that opens the Change Email dialog. Changing the email requires the recovery code.
  3. **Member Since** - Displays the date the account was created.

- **Security Section**

  1. **Change Password** - Opens the Change Password dialog, which asks for the current password, the recovery code, the new password, and the confirmation of the new password.

- **Preferences Section**

  1. **Passenger Type** - Allows users to choose their usual passenger type.
  2. **Transportation** - Allows users to choose their usual vehicle.
  3. **Save Preferences Button** - Saves both preferences. The Calculate page then starts with the saved choices.

- **Activity Section**

  1. **Trips** - Displays the number of saved trips.
  2. **Total Fare** - Displays the total fare of the saved trips.
  3. **Favorites** - Displays the number of favorite routes.
  4. **Landmarks** - Displays the number of the user’s own landmarks.

- **Validation**

  1. **Required Fields** - The name, the new email, and the passwords must not be empty.
  2. **Password Length** - The new password must be at least 8 characters.
  3. **Password Match** - The new password and its confirmation must match.
  4. **Recovery Code** - The email and password can only be changed when the correct recovery code is entered.
  5. **Picture Size** - Pictures larger than 2 MB or not in JPG, PNG, or WebP format must be rejected with a message.

## 4. User Story

- As a logged-in user, I want to update my name, email, and profile picture, so that my account shows my current details.
- As a logged-in user, I want to change my password, so that I can keep my account secure.
- As a logged-in user, I want to save my usual passenger type and vehicle, so that I don't have to pick them every time I calculate a fare.
- As a logged-in user, I want to see a summary of my saved trips, favorites, and landmarks, so that I know how I use PARA.

## 5. Acceptance Criteria

| No. | Acceptance Criteria |
| --- | --- |
| 1 | The Account Settings page must only be accessible to logged-in users. Guests must be sent to the Log In page, and administrators to the Admin Settings page. |
| 2 | The profile picture must be shown beside the user’s name, and the user must be able to replace it with a JPG, PNG, or WebP image up to 2 MB. |
| 3 | The Profile, Security, Preferences, and Activity tabs must each show their own section when clicked. |
| 4 | The Edit Name dialog must save the new name and update it on the page and in the profile menu. |
| 5 | The email must only change when the correct recovery code is entered. |
| 6 | The password must only change when the current password and the recovery code are correct, and the new password has at least 8 characters and matches its confirmation. |
| 7 | Saved preferences must be selected automatically the next time the user opens the Calculate page. |
| 8 | The Activity section must show the user’s number of trips, total fare, favorites, and landmarks. |

## 6. User Interface

Image 1 - Account Settings: Profile

Image 2 - Account Settings: Security

Image 3 - Account Settings: Preferences

Image 4 - Account Settings: Activity

## 7. Additional Considerations

- Browser Compatibility:
  1. Microsoft Edge
  2. Google Chrome
- Email verification (OTP or email link) when changing the email is out of scope. The recovery code is used instead.
- Deleting one’s own account is not covered by this BRD.
