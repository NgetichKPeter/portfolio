# Portfolio and Content Engine

A full-stack portfolio and technical publishing engine for Ngetich K. Peter.

This system utilizes the GitHub REST API to manage structured JSON data stored directly within the repository (`data/*.json`). The application is designed to be fully manageable from mobile environments via Termux and Git.

---

## Architecture Overview

- **Frontend:** Static HTML, JavaScript (ES6 Modules), Tailwind CSS.
- **Data Engine:** Asynchronous client-side fetching using the GitHub REST API and Raw Content CDN.
- **Admin Management:** Embedded administration panel (`admin.html`) providing direct Base64-encoded commits using GitHub Personal Access Tokens (PAT).

---

## Directory Layout

```text
portfolio/
├── index.html         # Public facing interface
├── admin.html         # Content administration panel
├── js/
│   ├── app.js         # Client-side data fetching module
│   └── admin.js       # Repository commit management module
└── data/
    ├── profile.json   # Biographical information
    ├── socials.json   # Professional and platform handles
    ├── projects.json  # Software projects and technical specifications
    └── updates.json   # Logs and announcements
