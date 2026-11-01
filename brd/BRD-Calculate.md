# IT302P – System Integration and Architecture

# Business Requirement Document (BRD)

**Project Name:** Para — Fare Commuter System  
**Feature:** Calculate Page

## 1. Purpose

The Calculate page is the main feature of Para. It lets the user enter an origin and a destination within San Jose del Monte (SJDM), Bulacan, choose a mode of transportation and a passenger type, and see the distance, estimated travel time, fare, and discount together with the route on an interactive map.

Guests can use the page for fare computation only. Saving a trip and adding a destination to favorites require the user to be logged in.

## 2. Benefits

- Commuters no longer have to guess their fare before riding.
- The correct passenger discount (e.g., PWD 20% off) is applied automatically.
- Users can see the route, distance, and estimated travel time on the map.
- Users are told if a location needs a tricycle or short walk.
- Logged-in users can save trips, keep favorite destinations, and mark their own landmarks.

## 3. Business Requirements

- **Navigation Bar**

  The navigation bar should be located at the top section of the page and provide users with quick access to the main pages and functions of the PARA commuter system. It should consist of the following elements:

  1. **PARA Logo** - Display of the system’s logo and serves as a link that redirects users to the homepage. For logged-in users, it redirects to the Calculate page.
  2. **Home** - A navigation link that directs the users to the homepage.
  3. **Calculate** - A navigation link that directs the users to the fare calculation page, where users can calculate their estimated commuting fares.
  4. **About Us** - A navigation link that provides information about the system, its purpose, and its mascot.
  5. **Language Toggle** - A button (EN / FIL) that allows users to switch the page between English and Filipino.
  6. **Theme Toggle** - A toggle button that allows users to switch between light and dark modes.
  7. **Log In / Sign Up / Profile Menu** - Displays the appropriate authentication option depending on the user's login status. Logged-in users see their profile picture, which opens a menu with Account Settings, their saved items, and Log Out.

  The Home, Calculate, and About Us links are only shown to guest users. For logged-in users, the Calculate page is the main page, so the PARA logo serves as their way back to it.

- **Trip Panel**

  The trip panel holds the inputs and the result on top of the map. It has two tabs, Trip and Saved, and a collapse button that shrinks the panel into a small pill showing the route and fare. On phones, the panel becomes a bottom sheet.

- **Origin and Destination Selection**

  This section allows users to specify the starting point and intended destination of their commute.

  1. **Origin Field** - Allows users to search for and select their starting location.
  2. **Destination Field** - Allows users to search for and select their intended destination within the supported service area.
  3. **Location Search** - Provides location suggestions based on the user’s search input to help identify available locations. Suggestions include saved landmarks and places in SJDM, and the matched words are shown in bold.
  4. **Current Location and Recent Places** - When an empty field is selected, the system offers "Use My Current Location" and the places the user picked lately.
  5. **Swap Locations Button** - Allows users to exchange their selected origin and destination without manually entering them again.

- **Transportation Selection**

  This section allows users to choose their preferred mode of transportation for their commute. The selected transportation type should be considered when determining the applicable fare and route information.

  1. **Vehicle Buttons** - Shows the available transportation options supported by the system as buttons (Bus (Aircon), Bus (Ordinary), Modern Jeepney, Traditional Jeepney).

- **Passenger Classification**

  This section allows the users to select their passenger classification for the appropriate fare computation. The selected passenger classification should be considered when applying the corresponding fare rate or applicable discount.

  1. **Passenger Buttons** - Shows the available passenger classifications as buttons (Regular, Student, Senior Citizen, PWD), each with its discount tag.

- **Fare Information and Calculation**

  This section is responsible for processing the user’s selected commuting details and presenting the estimated fare.

  1. **Fare Calculation** - Computes the estimated commuting fare based on the selected origin, destination, transportation type, and passenger classification. The distance follows the road route shown on the map.
  2. **Fare Information Display** - Present the calculated fare to the user once the required commuting details have been provided.
  3. **Initial Instruction Message** - Displays a message from PARA that prompts users to select their commuting locations before viewing the fare price.
  4. **Validation** - Ensures that the required origin and destination fields are selected before performing the fare calculation, and that the origin and destination are not the same place.

- **Save Trip, Add to Favorite, and Save Landmarks Feature**

  These features are available after the fare calculation summary but can only be used by logged-in users.

  1. **Automatic Trip Saving** - Every fare calculated by a logged-in user is saved automatically to Recent Trips.
  2. **Save as Favorite Button** - Allows logged-in users to add their trip to favorites and stores it in the Favorites list.
  3. **Save Landmarks** - Allows logged-in users to save their own landmark.

- **Interactive Map**

  The interactive map serves as the visual representation of the user’s selected locations and commuting route.

  1. **Map Display** - Displays the geographical map of San Jose del Monte, Bulacan, including roads, landmarks, and surrounding areas.
  2. **Zoom Controls** - Allows the users to zoom in and out of the map to view locations at different levels of details.
  3. **Route Visualization** - Displays the road route between the selected origin and destination as a green line when valid information is available.
  4. **Alternative Routes** - When there is more than one road route, the other routes are shown in gray, and the user can switch to them through the Route buttons or by clicking the gray line. The fare is recalculated for the chosen route.
  5. **Location Markers** - Identifies the selected origin and destination on the map, with the estimated travel time shown above the destination.
  6. **Vehicle Animation** - The selected vehicle travels along the route once the fare is shown.
  7. **Map Navigation** - Allows the users to explore the map by dragging and adjusting its viewing area.

- **Saved Tab**

  The Saved tab of the trip panel provides additional tools to help users access and manage frequently used locations and commuting information.

  1. **Favorites** - Provides access to locations or routes saved by the users for easier retrieval.
  2. **Recent Trips** - Allows users to view their previously calculated trips.
  3. **Landmarks** - Provides access to the user’s own landmarks and the public landmarks, with a search box.

## 4. User Story

As a commuter in San Jose del Monte, I want to enter my origin and destination, choose my transportation and passenger type, and see my fare and route on the map, so that I know how much to pay and where I am going before I ride. As a registered user, I also want to save my trips and favorite destinations so that I can check them again later.

## 5. Acceptance Criteria

| No. | Acceptance Criteria |
| --- | --- |
| 1 | The Calculate page must be accessible to both guest users and logged-in users through the navigation bar or the Start Your Commute button on the homepage. |
| 2 | The "Calculate" navigation link must be marked with a green dot to indicate the user's current page. |
| 3 | The Calculate page must have Origin and Destination fields, a swap button, Vehicle buttons, Passenger buttons, and an interactive map. |
| 4 | The swap button must exchange the values of the Origin and Destination fields. |
| 5 | The origin and destination must only be searchable within San Jose del Monte, Bulacan. |
| 6 | Until all required fields are filled in, the fare result must not appear and PARA’s message "Select an origin and destination to see the fare!" must be shown. |
| 7 | Once all fields are filled in, the map must show the origin marker, the destination marker, and the route line between them. |
| 8 | The Fare Calculation Result must show the origin, destination, distance, estimated travel time and arrival time, base fare, excess fare, passenger type, discount, and total fare. |
| 9 | The discount must match the selected passenger type (e.g., PWD 20% off) and must be subtracted from the total fare. |
| 10 | The system must tell the user if the destination needs a tricycle "Special Trip" or a short walk. |
| 11 | When a guest clicks "Save as favorite", the system must prompt the user to log in first. |
| 12 | The Favorites, Recent Trips, and Landmarks lists must show the logged-in user's own saved items. |
| 13 | When more than one road route is found, the user must be able to pick another route and see its fare. |
| 14 | The collapse button must shrink the trip panel into a pill with the route and fare, and clicking the pill must open the panel again. |

## 6. User Interface

Image 1 - Blank Calculate Page

Image 2 - Entered Information in Calculation Page, Fare Calculation Result, Map Overview

Image 3 - Saved Tab: Favorites

Image 4 - Saved Tab: Recent Trips

Image 5 - Saved Tab: Landmarks

## 7. Additional Considerations

- Browser Compatibility:
  1. Microsoft Edge
  2. Google Chrome
- The map and searchable locations are limited to San Jose del Monte, Bulacan.
- The fare matrix is updated by the administrator through the Fare Management page and is not connected to the LTFRB website.
- Distance follows the road route on the map and travel time uses an average speed, so actual fare and time may vary. If the road route cannot be loaded, the system uses a straight line instead.
- The road route, alternative routes, and place search use free public map services (OSRM, Photon, and Nominatim), which have usage limits.
