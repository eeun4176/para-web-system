# IT302P – System Integration and Architecture

# Business Requirement Document (BRD)

**Project Name:** Para — Fare Commuter System  
**Feature:** Language Switch (English / Filipino)

## 1. Purpose

The Language Switch allows users to view the passenger pages of PARA in either English or Filipino. It helps commuters in San Jose del Monte who are more comfortable reading Filipino to understand the fare, the route notes, and the system’s instructions.

## 2. Benefits

- Makes the system easier to understand for commuters who prefer Filipino.
- Keeps the user’s chosen language on every page and on their next visit.
- Translates the results and messages too, not only the page titles and buttons.

## 3. Business Requirements

- **Language Toggle**

  The language toggle is located in the navigation bar, beside the theme toggle.

  1. **EN / FIL Button** - Displays the current language (EN or FIL) and switches to the other language when clicked.
  2. **Saved Choice** - The selected language is remembered by the browser and applied to every passenger page.

- **Translated Content**

  1. **Page Content** - Headings, descriptions, buttons, links, and form labels are shown in the selected language.
  2. **Field Hints** - Placeholders, tooltips, and screen reader labels are also translated.
  3. **Fare Results** - The distance, travel time, discount, and access alerts of the fare result are translated.
  4. **Messages** - Notifications and the common error messages from the server are translated.
  5. **Browser Tab Title** - The title of the page is translated.

- **Content That Stays the Same**

  1. **Names** - Place names, user names, and landmark names are not translated.
  2. **Vehicle Names** - Vehicle names (e.g., Modern Jeepney, Bus (Aircon)) stay in English since these are the terms commuters use.

- **Covered Pages**

  The language switch is available on the Homepage, Calculate, About Us, Log In / Sign Up / Forgot Password, and Account Settings pages.

## 4. User Story

As a commuter in San Jose del Monte who is more comfortable with Filipino, I want to switch PARA to Filipino, so that I can easily understand my fare and the route notes.

## 5. Acceptance Criteria

| No. | Acceptance Criteria |
| --- | --- |
| 1 | The EN / FIL button must be shown in the navigation bar of every passenger page. |
| 2 | Clicking the button must switch the page between English and Filipino without reloading. |
| 3 | The chosen language must stay the same when the user opens another page or comes back later. |
| 4 | The fare result, access alerts, and notifications must appear in the selected language. |
| 5 | Place names, user names, and landmark names must not be changed by the translation. |
| 6 | Switching back to English must restore the original English text. |

## 6. User Interface

Image 1 - Homepage in Filipino

Image 2 - Calculate Page in Filipino

## 7. Additional Considerations

- Browser Compatibility:
  1. Microsoft Edge
  2. Google Chrome
- The admin pages stay in English since they are used by the system operators.
- The Continue with Google button follows the language of the user’s browser.
- New text added to the system must also be added to the Filipino translation list.
