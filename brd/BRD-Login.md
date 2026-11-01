# IT302P – System Integration and Architecture

# Business Requirement Document (BRD)

**Project Name:** Para — Fare Commuter System  
**Feature:** Log In Page

## 1. Purpose

The Log In feature allows registered users to securely access their PARA accounts by entering their registered email address and password, or by continuing with their Google account. It provides access to account-related functionality while allowing users to navigate to other system pages.

The Log In page also provides options for users to register a new account, recover access to an existing account, or continue as a guest because the system supports guest access.

## 2. Benefits

- Allows registered users to access and navigate their accounts.
- Allows users to recover forgotten passwords.
- Provides a convenient way to navigate to the Sign Up page.
- Allows guest mode to let users explore first publicly available features without logging in.
- Allows users to log in quickly with their Google account.

## 3. Business Requirements

The Log In page shall provide an interface through which registered users can submit their credentials for authentication. The system shall validate the submitted information and display appropriate feedback based on the authentication result.

- **Navigation Bar**

  The navigation bar shall be displayed at the top of the page.

  1. **PARA Logo** - Display of the system’s logo and serves as a link that redirects users to the homepage.
  2. **Language Toggle** - Allows users to switch the page between English and Filipino.
  3. **Theme Toggle** - Allows users to switch between light and dark mode.
  4. **Continue as Guest** - Allows users to continue as a guest.

- **Log In Form**

  The Log In form serves as the primary component of the page.

  1. **Log In Title** - Displays the heading “Welcome Back” to identify the current page.
  2. **Continue with Google Button** - Allows users to log in with their Google account.
  3. **Email Field** - Allows the users to enter their registered email address.
  4. **Password Field** - Allows users to enter their account password.
  5. **Password Visibility Toggle** - Allows users to show or hide the entered password.
  6. **Log In Button** - Submits the entered credentials for authentication.
  7. **Forgot Password Link** - Redirects users to the password recovery page.
  8. **Sign Up Link** - Redirects users to the account registration page.

- **Authentication and Validation**

  1. **Required Fields** - Email and password fields must be completed before the form can be submitted.
  2. **Email Validation** - The system must check whether the entered email follows a valid format.
  3. **Credential Verification** - The system must verify the submitted credentials against the registered account.
  4. **Successful Log In** - When valid credentials are submitted, the system must establish an authenticated session and redirect the user to the Calculate page.
  5. **Invalid Credentials** - When email or password is incorrect, the system must display an error message.
  6. **Unregistered Account** - If email does not correspond to an existing account, the system must show a message that authentication has failed.
  7. **Failed Attempt Limit** - After 5 failed attempts, the account must be locked from logging in for 15 minutes.
  8. **Loading Feedback** - The system should provide feedback while the authentication request is being processed and prevent duplicate submissions.
  9. **Session Management** - The system must maintain the authenticated state according to its implemented session management rules.
  10. **Administrator Accounts** - Administrator accounts must use the separate admin sign-in page and cannot log in through this page.

- **Sign Up Navigation**

  1. **Registration Access** - The Sign Up Link must redirect the user to the Sign Up page.
  2. **Account Registration** - Users must be able to enter the required registration information.

- **Forgot Password Navigation**

  1. **Password Recovery Access** - The Forgot Password link must redirect users to the password recovery interface.
  2. **Email Submission** - Users must first provide their email address associated with their account.
  3. **Reset Password Process** - Users must enter the 12-character recovery code they received when they signed up, then their new password twice. The system must provide appropriate feedback.
  4. **Return to Log In** - Users must be able to return to the Log In page after initiating or completing password recovery.

## 4. User Story

- As a user, I want to log in to my account or create one, so that I can save my trips and favorite destinations.
- As a user who does not want an account, I want to continue as a guest, so that I can still compute my fare.
- As a user who forgot my password, I want to reset it, so that I can access my account again.
- As a new user, I want to access the Sign Up page so that I can register for a PARA account.

## 5. Acceptance Criteria

| No. | Acceptance Criteria |
| --- | --- |
| 1 | The Log In page must be accessible to users who need to authenticate their PARA accounts. |
| 2 | The Log In form must contain email and password fields. |
| 3 | The password field must provide a show/hide visibility option. |
| 4 | The Log In button must submit the entered credentials for authentication. |
| 5 | The system must prevent submission when required fields are empty. |
| 6 | The system must validate the email format before or during submission. |
| 7 | Valid credentials must result in successful authentication while invalid credentials must result in an informative error message. |
| 8 | The Forgot Password link must navigate to the password recovery page. The password is updated only if the email and the recovery code match an existing account and the new password and the confirmation password match. |
| 9 | The Sign Up link must navigate to the registration page. An email that is already registered must not be used to create another account. |
| 10 | Clicking "Continue as Guest" on any of the three pages must take the user to the Homepage in guest mode. |
| 11 | After 5 failed log in attempts, the system must block further attempts for 15 minutes. |
| 12 | The Continue with Google button must log the user in with their Google account. |

## 6. User Interface

Image 1 - Log In Page

Image 2 - Sign Up Page

Image 3 - Forgot Password Page

## 7. Additional Considerations

- Browser Compatibility:
  1. Microsoft Edge
  2. Google Chrome
- The button on the Forgot Password page is labeled "Reset Password" to match its purpose.
- The system is a medium-scale project, so OTP and email link verification for resetting a password are out of scope. The recovery code is used instead.
