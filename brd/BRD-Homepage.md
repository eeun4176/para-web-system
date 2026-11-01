# IT302P – System Integration and Architecture

# Business Requirement Document (BRD)

**Project Name:** Para — Fare Commuter System  
**Feature:** Homepage

## 1. Purpose

The homepage serves as the introduction page of the system, explains how it works, highlights its main features, and leads the users to the calculate page to start computing fares around San Jose del Monte, Bulacan.

## 2. Benefits

- Provide users with an immediate understanding of PARA’s purpose and intended users.
- Allows guest users to navigate between the system's main pages through the navigation bar.
- Introduces the system's key features, including the fare matrix, interactive map, and access alerts.
- Answers the common questions of commuters through a Frequently Asked Questions section.

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

  On phones, the navigation links are placed in a full-screen menu that opens from the menu button.

- **Hero Section**

  The hero section serves as the introductory area of the homepage, presenting PARA’s main purpose through a headline, brief description, route preview, and call-to-action buttons.

  1. **Main Heading** - Display the tagline to introduce the system’s purpose.
  2. **Description** - Provides a brief overview of PARA’s capabilities.
  3. **Start Your Commute Button** - Directs the users to the Calculate page to begin planning their commute and estimating fares.
  4. **Watch Demo Button** - Directs the users to the one-minute showcase video on the About Us page that demonstrates how the PARA commuter system works.
  5. **Route Preview** - Displays an animated map where PARA’s head travels a sample route (Tungko to Muzon) together with a sample fare and ETA.

- **How PARA Works Section**

  This section explains the basic process of using the PARA commuter system through three informational cards.

  1. **Pick Your Perch** - Introduces the process of selecting the starting point and destination of the user’s commute within San Jose del Monte, Bulacan.
  2. **Let Para Calculate** - Explains how the system uses its fare matrix to calculate the estimated commuting fare based on the selected route.
  3. **See Your Path** - Introduces the interactive map feature, allowing users to view their selected route and check whether their destination is within reach.

- **PARA Features Section**

  This section highlights the main functionalities and advantages of the PARA commuter system through a numbered feature list.

  1. **Live Fare Matrix** - Provides updated commuting fare information based on the implemented fare matrix, including applicable discounts.
  2. **Interactive SJDM Map** - Introduces the interactive mapping feature powered by MapLibre and OpenStreetMap, allowing the users to visualize routes and locate landmarks within San Jose del Monte.
  3. **Access Alerts** - Provides information about route accessibility, including whether a selected destination requires a tricycle ride or short walk instead of transportation options.

- **Meet PARA Section**

  This section introduces PARA’s mascot and explain its role in representing the system. Consist of the mascot introduction that is inspired by the Philippine Hanging Parrot. Explains how PARA assists commuters by providing estimated fares, calculating journey distances, and visualizing routes through an interactive map.

- **Frequently Asked Questions Section**

  This section answers the common questions of commuters through cards that open when clicked.

  1. **How does Para compute my fare?** - Explains the base fare and the added amount for every kilometer after it.
  2. **Why might the real fare be a little different?** - Explains that the driver’s road and traffic may change the actual fare and time.
  3. **Are student, senior and PWD discounts automatic?** - Explains that the 20% discount is applied once the passenger type is selected.
  4. **What does "walk" or "ride a tricycle" mean on my result?** - Explains the access alerts.
  5. **Do I need an account?** - Explains what guests can do and what a free account adds.

- **Footer Section**

  The footer provides users with the system’s contact information and access to additional resources.

  1. **PARA Logo** - Displays the system’s logo for branding and identification.
  2. **Contact Information** - Displays the contact number, email address, and physical address.
  3. **Help & FAQs** - Provides a link that directs the users to the Frequently Asked Questions section.
  4. **Social Media Links** - Displays Facebook and Instagram icons that open the system’s official accounts in a new tab.

## 4. User Story

As a commuter in San Jose del Monte, I want to learn about PARA's main features so that I can understand how the system can help me plan my commute. Additionally, I want to navigate between the Home, Calculate, and About Us pages so that I can easily access the information and services I need.

## 5. Acceptance Criteria

| No. | Acceptance Criteria |
| --- | --- |
| 1 | The homepage must be accessible to guest users (including through the "Continue as Guest" option on the authentication page). Logged-in users must be taken directly to the Calculate page. |
| 2 | The "Home" navigation link must be marked with a green dot to indicate the user's current page. |
| 3 | The authentication area must display "Log In" and "Sign Up" for guest users. |
| 4 | Clicking the "Start Your Commute" button must redirect users to the Calculate page. |
| 5 | Clicking the "Watch Demo" button must take users to the showcase video section of the About Us page. |
| 6 | The "How PARA Works" section must display three informational cards: Pick Your Perch, Let Para Calculate, and See Your Path, each with its corresponding icon and description. |
| 7 | The "PARA Features" section must display Live Fare Matrix, Interactive SJDM Map, and Access Alerts, together with their corresponding descriptions. |
| 8 | The navigation bar must show the Para logo, Home, Calculate, About Us, the language toggle, the light/dark toggle, and the authentication buttons. |
| 9 | There must be a scroll-to-top button that takes the user back to the top of the page when clicked. |
| 10 | The light/dark toggle must change the theme of the page when clicked. |
| 11 | Each question in the FAQ section must open and close when clicked, with its plus icon turning into a minus while open. |
| 12 | The footer Facebook and Instagram icons must open PARA's official Facebook page and Instagram account (para.sjdm) in a new tab. |

## 6. User Interface

Image 1 - Homepage Headline

Image 2 - How PARA Works

Image 3 - PARA Features

Image 4 - Meet PARA

Image 5 - Frequently Asked Questions

## 7. Additional Considerations

- Browser Compatibility:
  1. Microsoft Edge
  2. Google Chrome
- The system is focused on San Jose del Monte, Bulacan.
