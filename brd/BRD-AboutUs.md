# IT302P – System Integration and Architecture

# Business Requirement Document (BRD)

**Project Name:** Para — Fare Commuter System  
**Feature:** About Us

## 1. Purpose

The About Us page provides users with information about the PARA commuter system, its purpose, mission, and the role of its mascot. It introduces PARA as a digital commuting guide designed to help commuters navigate San Jose del Monte, Bulacan, through fare calculation, route visualization, and commuting information. It also shows a short video of how the system works and provides users with the system's contact details and access to additional resources.

## 2. Benefits

- Helps users understand the purpose and objectives of the PARA commuter system.
- Introduces PARA's identity and mascot, giving the system a recognizable personality.
- Explains how the system assists commuters through fare calculation, route navigation, and commuting updates.
- Shows how the system works through a one-minute showcase video.

## 3. Business Requirements

- **Navigation Bar**

  The navigation bar should be located at the top section of the page and provide users with quick access to the main pages and functions of the PARA commuter system. It should consist of the following elements:

  1. **PARA Logo** - Display of the system’s logo and serves as a link that redirects users to the homepage.
  2. **Home** - A navigation link that directs the users to the homepage.
  3. **Calculate** - A navigation link that directs the users to the fare calculation page, where users can calculate their estimated commuting fares.
  4. **About Us** - A navigation link that provides information about the system, its purpose, and its mascot.
  5. **Language Toggle** - A button (EN / FIL) that allows users to switch the page between English and Filipino.
  6. **Theme Toggle** - A toggle button that allows users to switch between light and dark modes.
  7. **Log In / Sign Up** - Displays the appropriate authentication option depending on the user's login status.

- **Page Header**

  The page header serves as the main introduction to the About Us page. It displays the "About Us" label and the heading "Kumusta! I'm Para" inside a speech bubble beside the mascot.

- **About PARA Section**

  This section introduces PARA and explains its purpose, mission, and contributions to the commuting experience in San Jose del Monte, Bulacan. It provides an overview of PARA as a digital commuting guide designed to improve their daily commuting experience through route navigation and commuting information. It also states and encourages community participation through contributing about local landmarks, route updates, and subject to the system’s available community features.

- **PARA Mascot Illustration**

  Presents the PARA’s mascot and explains its identity and representation within the system. Introduces PARA as a Philippine Hanging Parrot (Colasisi) that represents the system’s identity and connection to the local community.

- **What PARA Stands For Section**

  This section presents PARA’s three values as tiles in a bento grid. When a tile is hovered, it grows while the other tiles fade and shrink.

  1. **Precision** - Explains that PARA calculates the exact distance of the trip and applies the passenger discount, with a sample fare result.
  2. **Peace of Mind** - Explains that knowing the fare and route before riding makes the commute less stressful.
  3. **Community Flock** - Explains that users help the system grow by marking their own landmarks.

- **Closing Section**

  The closing section displays the line "Let's Fly Together and Master the Roads of SJDM. Para Po!" and a Start Your Commute button on a sky background with moving clouds.

- **Showcase Video Section**

  This section displays the heading "See Para in Action" and a one-minute video with narration and captions that shows how to search a place, view the road route, compute the fare with discounts, save trips, and how the admin manages the system. The "Watch Demo" button of the homepage directs the users to this section.

- **Footer Section**

  The footer provides users with the system’s contact information and access to additional resources.

  1. **PARA Logo** - Displays the system’s logo for branding and identification.
  2. **Contact Information** - Displays the available contact information.
  3. **Help & FAQs** - Provides a link that directs the users to the Frequently Asked Questions section of the homepage for assistance.
  4. **Social Media Links** - Displays Facebook and Instagram icons that open the system’s official accounts in a new tab.

## 4. User Story

As a commuter in San Jose del Monte, I want to learn about PARA's purpose and objectives so that I can understand how the system can help improve my commuting experience.

## 5. Acceptance Criteria

| No. | Acceptance Criteria |
| --- | --- |
| 1 | The About Us page must be accessible to guest users through the navigation bar. Logged-in users must be taken directly to the Calculate page. |
| 2 | The "About Us" navigation link must be marked with a green dot to indicate the user's current page. |
| 3 | The page header must display the "About Us" label and the "Kumusta! I'm Para" heading. |
| 4 | The About PARA section must display the system introduction, mission, objectives, and descriptions of its main capabilities. |
| 5 | The footer must display the PARA logo, contact number, email address, and physical address. |
| 6 | The footer must display Facebook and Instagram icons that open PARA's official Facebook page and Instagram account (para.sjdm) in a new tab. |
| 7 | The What PARA Stands For section must display the Precision, Peace of Mind, and Community Flock tiles, and the hovered tile must grow while the others fade. |
| 8 | The Start Your Commute button of the closing section must redirect users to the Calculate page. |
| 9 | The Showcase Video section must display the one-minute video below the closing section, and the video must play only when the user clicks play. |

## 6. User Interface

Image 1 - About Us Page

Image 2 - Showcase Video

## 7. Additional Considerations

- Browser Compatibility:
  1. Microsoft Edge
  2. Google Chrome
- The showcase video uses sample data from a local copy of the system, so the trips and landmarks shown are not real user data.
