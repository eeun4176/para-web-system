# IT302P – System Integration and Architecture

# Business Requirement Document (BRD)

**Project Name:** Para — Fare Commuter System  
**Feature:** Admin Dashboard

## 1. Purpose

The Admin Dashboard gives the administrator an overview of how PARA is being used. It shows the system’s totals, the trips saved per day and per vehicle, where commuters usually go, and a calendar of saved trips. It also holds the admin navigation used by all admin pages.

## 2. Benefits

- Gives the administrator a quick summary of the system’s users and saved data.
- Shows trends in trips, so the administrator can see how often PARA is used.
- Shows the most common destinations through a heat map and a ranked list.
- Allows the administrator to move between the admin pages from one sidebar.

## 3. Business Requirements

- **Admin Sidebar**

  The sidebar is located at the left side of every admin page.

  1. **PARA Logo** - Displays the system’s logo and links to the Admin Dashboard.
  2. **Dashboard** - Directs the administrator to the Admin Dashboard.
  3. **Fare Management** - Directs the administrator to the Fare Management page.
  4. **Public Landmarks** - Directs the administrator to the Public Landmarks page.
  5. **Users** - Directs the administrator to the Users page.
  6. **Audit Log** - Directs the administrator to the Audit Log page.
  7. **Settings** - Directs the administrator to the Admin Settings page.
  8. **Log Out** - Logs the administrator out (see the Log Out BRD).
  9. **Collapse Button** - Shrinks the sidebar to icons only. When collapsed, clicking the logo expands it again. On phones, the sidebar opens as a drawer from the menu button.

- **Page Header**

  1. **Date and Greeting** - Displays today’s date (Philippine time) above the greeting "Welcome, Administrator".
  2. **Calendar Button** - Opens a small calendar of the trips saved each day.
  3. **Theme Toggle** - Allows the administrator to switch between light and dark modes.
  4. **Profile Menu** - Displays the administrator’s profile picture, which opens a menu with Settings and Log Out.

- **Summary Cards**

  The dashboard shows six cards with the system’s totals.

  1. **Users** - The number of registered users.
  2. **Saved Trips** - The number of saved trips, with the change compared to last week.
  3. **Total Fare of Saved Trips** - The total fare of all saved trips.
  4. **Public Landmarks** - The number of public landmarks.
  5. **User Landmarks** - The number of landmarks saved by users.
  6. **Favorite Routes** - The number of favorite routes.

- **Charts**

  1. **Trips per Day** - A bar chart of the trips saved in the last 14 days.
  2. **Trips by Vehicle** - The share of trips for each vehicle type.
  3. **Most Common Destinations** - A ranked list of the destinations saved most often.

- **Where People Go (Heat Map)**

  1. **Heat Map** - Displays the trip destinations of the last 90 days on the map of San Jose del Monte, with busier places shown in warmer colors.
  2. **Map Limits** - The map cannot be zoomed out or moved outside San Jose del Monte.
  3. **Place Details** - When zoomed in, each destination is shown as a dot that displays its name and number of trips.
  4. **Legend** - Explains the colors from fewer trips to more trips.

- **Calendar**

  1. **Month View** - Displays the days of the month with today highlighted in green.
  2. **Trip Count** - Each day shows the number of trips saved on that day.
  3. **Month Navigation** - Previous, Today, and Next buttons move between months.
  4. **Day Details** - Clicking a day shows its date and number of saved trips.

## 4. User Story

As the administrator of PARA, I want to see the system’s totals, trip trends, and common destinations in one page, so that I can understand how commuters use the system.

## 5. Acceptance Criteria

| No. | Acceptance Criteria |
| --- | --- |
| 1 | The Admin Dashboard must only be accessible to signed-in administrators. |
| 2 | The dashboard must show today’s date, the greeting, and the six summary cards. |
| 3 | The Trips per Day, Trips by Vehicle, and Most Common Destinations charts must show the saved trip data. |
| 4 | The heat map must show the destinations of the last 90 days and must not move outside San Jose del Monte. |
| 5 | The calendar button must open a calendar that shows the number of trips saved each day, and it must close when clicking outside it. |
| 6 | The sidebar must link to every admin page, and the collapse button must shrink and expand it. |
| 7 | Grey placeholders must be shown while the dashboard data is loading. |

## 6. User Interface

Image 1 - Admin Dashboard

Image 2 - Calendar

Image 3 - Where People Go (Heat Map)

Image 4 - Collapsed Sidebar

## 7. Additional Considerations

- Browser Compatibility:
  1. Microsoft Edge
  2. Google Chrome
- The dashboard only counts trips saved by logged-in users. Fares calculated by guests are not saved.
- The admin pages are in English only.
