Welcome to the SearchNEU documentation!

### What is SearchNEU?

Banner — the site Northeastern uses for its course catalog — is .... less than ideal. It's tedious, requires a login, works poorly on mobile, can be difficult to search with, and has not the best UI/UX.

SearchNEU, created by a student, was designed to help resolve some of these issues. It is a search engine built for easier navigation of class and professor information to help students with course registration. Users can search for and explore all class offerings within a semester, all faculty of the University, sections for each class, and other important information. Additionally, SearchNEU allows students to subscribe to notifications for a class with no remaining seats, to get notified when an opening appears in the class. All of our data is public information we scrape from Northeastern, so you can access any info with a quick search on searchneu.com.

### Tech Overview

**"SearchNEU"**, as a complete application, exists in two parts:

- Backend: The backend is our API server, which does all of the heavy lifting. This stores all of the course data - names, IDs, sections, descriptions, etc. It also handles notifications. The user can interact with this data using the frontend.
  - The backend is also used by other applications (like GraduateNU).
- Frontend: The frontend is what a user sees when they go to [searchneu.com](https://searchneu.com). It does not have any data on its own - whenever a user searches for a course, the frontend sends a request to the backend, which returns the data. The frontend handles display; the backend handles data processing.

This is the documentation for the **frontend**.
