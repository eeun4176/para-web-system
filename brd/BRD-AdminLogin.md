# IT302P – System Integration and Architecture

# Business Requirement Document (BRD)

**Project Name:** Para — Fare Commuter System  
**Feature:** Admin Sign In

## 1. Purpose

The Admin Sign In page allows the system administrator to securely access the PARA admin panel using an account key and a password. It is separate from the passenger Log In page so that the admin side and the passenger side of the system stay apart.

## 2. Benefits

- Keeps the admin panel separate from the passenger pages.
- Allows the administrator to sign in with an account key instead of an email address.
- Protects the admin panel from repeated password guessing.

## 3. Business Requirements

- **Admin Sign In Form**

  The form follows the same design as the passenger Log In page.

  1. **Admin Sign In Title** - Displays the heading "Admin Sign In" to identify the current page.
  2. **Account Key Field** - Allows the administrator to enter their account key.
  3. **Password Field** - Allows the administrator to enter their password.
  4. **Password Visibility Toggle** - Allows the administrator to show or hide the entered password.
  5. **Sign In Button** - Submits the entered credentials for authentication.
  6. **Passenger Log In Link** - Directs users who are not administrators to the passenger Log In page.

- **Authentication and Validation**

  1. **Required Fields** - The account key and password must be completed before the form can be submitted.
  2. **Credential Verification** - The system must verify the account key and password against an administrator account.
  3. **Successful Sign In** - When valid credentials are submitted, the system must establish an authenticated session and redirect the administrator to the Admin Dashboard.
  4. **Invalid Credentials** - When the account key or password is incorrect, the system must display the message "Invalid account key or password."
  5. **Failed Attempt Limit** - After 5 failed attempts, the account must be locked from signing in for 15 minutes.
  6. **Loading Feedback** - The system should provide feedback while the request is being processed and prevent duplicate submissions.

- **Access Separation**

  1. **Admin Pages** - All admin pages must check on the server that the user is a signed-in administrator. Guests are sent to the Admin Sign In page.
  2. **Passenger Accounts** - Passenger accounts cannot sign in through the Admin Sign In page.
  3. **Administrator Accounts** - Administrator accounts cannot log in through the passenger Log In page or with Google.
  4. **Passenger Pages** - An administrator who opens a passenger page is sent to the Admin Dashboard.

## 4. User Story

As the administrator of PARA, I want to sign in with my account key and password, so that I can manage the fares, landmarks, and users of the system.

## 5. Acceptance Criteria

| No. | Acceptance Criteria |
| --- | --- |
| 1 | The Admin Sign In page must contain Account Key and Password fields, a password show/hide toggle, and a Sign In button. |
| 2 | Valid administrator credentials must open the Admin Dashboard. |
| 3 | An incorrect account key or password must show "Invalid account key or password." |
| 4 | After 5 failed attempts, the system must block further attempts for 15 minutes. |
| 5 | Opening any admin page without signing in must redirect to the Admin Sign In page. |
| 6 | Passenger accounts must not be able to sign in on the Admin Sign In page, and administrator accounts must not be able to log in on the passenger Log In page. |

## 6. User Interface

Image 1 - Admin Sign In Page

## 7. Additional Considerations

- Browser Compatibility:
  1. Microsoft Edge
  2. Google Chrome
- The system uses one shared administrator account, so every action in the audit log is recorded under the same administrator name.
- The administrator password must be changed after the system presentation, since the default password is known to the team.
