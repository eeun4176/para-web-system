# IT302P – System Integration and Architecture

# Business Requirement Document (BRD)

**Project Name:** Para — Fare Commuter System  
**Feature:** Admin Management (Fare Management, Public Landmarks, Users, Audit Log, Admin Settings)

## 1. Purpose

The Admin Management pages allow the administrator to maintain the data that PARA depends on. The administrator can update the fare matrix and passenger discounts, manage the public landmarks that every user sees, manage the registered users, review every change made by administrators, and update the administrator account.

## 2. Benefits

- The fare matrix can be updated from the system whenever the official fares change, without editing the database directly.
- Public landmarks help all commuters find common places in San Jose del Monte.
- The administrator can remove accounts that should no longer use the system.
- Every administrator change is recorded, so changes can be checked later.

## 3. Business Requirements

- **Fare Management**

  This page allows the administrator to manage the vehicle types and passenger discounts used in the fare calculation.

  1. **Vehicle Types Table** - Lists each vehicle with its base fare, base kilometers, excess fare per kilometer, average speed, and status (Active or Inactive).
  2. **Edit and Save** - The administrator can change the numbers of a row. The Save button is enabled only after a change, and the row is marked "Unsaved changes" until it is saved.
  3. **Activate / Deactivate** - Deactivating a type hides it from the Calculate page while keeping the saved trips that use it. At least one type must stay active.
  4. **Delete** - Deletes a type that nobody has used. Types used by saved trips or favorites can only be deactivated.
  5. **Add Vehicle Type** - Adds a new vehicle with its code, label, base fare, base kilometers, excess fare per kilometer, and average speed.
  6. **Passenger Discounts Table** - Lists each passenger type with its discount (0 to 100%) and the same Save, Activate / Deactivate, and Delete buttons.
  7. **Add Passenger Type** - Adds a new passenger type with its code, label, and discount.

- **Public Landmarks**

  This page allows the administrator to manage the landmarks that every user and guest can see on the map.

  1. **Landmarks Table** - Lists the public landmarks with their name, category, and location.
  2. **Search** - Filters the table by the typed text.
  3. **Add Public Landmark** - The administrator clicks the spot on the map, then enters the name, category, and an optional description.
  4. **Delete** - Removes a public landmark after confirmation.

- **Users**

  This page allows the administrator to view and manage the registered accounts.

  1. **Users Table** - Lists each user with their name, email (or account key for the administrator), role, date joined, and number of trips, landmarks, and favorites.
  2. **Search and Filter** - Filters the table by the typed text and by role (All, Passengers, Admins).
  3. **Delete User** - Deletes a user account and its saved data after confirmation. The administrator cannot delete their own account.

- **Audit Log**

  This page shows every change made by administrators.

  1. **Audit Table** - Lists each change with when it happened, the administrator, the action, the target, and the details.
  2. **Search and Filter** - Filters the log by the typed text and by group (All, Fares, Landmarks, Users).
  3. **Recorded Actions** - Fare and discount updates, added, deactivated, and deleted types, public landmark changes, deleted users, and administrator password changes.

- **Admin Settings**

  This page allows the administrator to manage their own account.

  1. **Account Section** - Displays the account key and role, and allows the administrator to change the display name shown in the audit log.
  2. **Security Section** - Allows the administrator to change the password by entering the current password, the new password, and the confirmation.

- **Validation**

  1. **Numbers** - Fares, kilometers, and speeds must be valid numbers that are not negative, and discounts must be between 0 and 100%.
  2. **Type Codes** - Codes must use lowercase letters, numbers, and underscores, starting with a letter.
  3. **Landmark Location** - A public landmark must have a location chosen on the map.
  4. **Password** - The new administrator password must be at least 8 characters and must match its confirmation. After 5 wrong current passwords, the change is blocked for 15 minutes.
  5. **Confirmation** - Deleting a type, landmark, or user must ask for confirmation first.

## 4. User Story

- As the administrator of PARA, I want to update the fares and discounts, so that the fare calculation stays correct when the official fares change.
- As the administrator, I want to add and remove public landmarks, so that commuters can easily find common places in SJDM.
- As the administrator, I want to view and remove user accounts, so that I can keep the system’s users in order.
- As the administrator, I want to see a log of every change, so that I can check what was changed and when.

## 5. Acceptance Criteria

| No. | Acceptance Criteria |
| --- | --- |
| 1 | The admin management pages must only be accessible to signed-in administrators. |
| 2 | Saving a changed fare or discount must update the fare calculation on the Calculate page. |
| 3 | A deactivated vehicle or passenger type must no longer appear on the Calculate page, while saved trips that use it must still work. |
| 4 | A type that is used by saved trips or favorites must not be deleted, and the system must say to deactivate it instead. |
| 5 | Adding a public landmark must require a name and a location chosen on the map, and the landmark must then appear for all users. |
| 6 | The Users and Audit Log tables must filter by the search text and the selected filter. |
| 7 | Deleting a user must ask for confirmation, and the administrator must not be able to delete their own account. |
| 8 | Every change to fares, types, public landmarks, users, and the administrator password must appear in the Audit Log. |
| 9 | The administrator password must only change when the current password is correct and the new password has at least 8 characters and matches its confirmation. |

## 6. User Interface

Image 1 - Fare Management

Image 2 - Public Landmarks

Image 3 - Users

Image 4 - Audit Log

Image 5 - Admin Settings

## 7. Additional Considerations

- Browser Compatibility:
  1. Microsoft Edge
  2. Google Chrome
- Fare changes only apply to new calculations. Saved trips keep the fare they had when they were saved.
- The fare matrix is entered by the administrator and is not connected to the LTFRB website.
