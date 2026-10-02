# Pet Adoption System - System Requirements Document

## 1. Project Title
**Pet Adoption & Rescue Management System**

## 2. Project Description
The **Pet Adoption & Rescue Management System** is a modern, full-stack web platform designed to connect potential pet adopters with animal shelters, rescues, and pets in need of a home. 

The application implements a multi-portal architecture serving **three distinct user roles**, each with its own layout structure, routing hierarchy, and dedicated features:
1. **Public Users / Adopters**: Navigated via a **Top Navigation Bar** (`PublicLayout`).
2. **Shelter Staff / Managers**: Navigated via a dedicated **Shelter Sidebar** (`ShelterLayout`).
3. **Platform Admins / Developers**: Navigated via a dedicated **Admin Sidebar** (`AdminLayout`).

---

## 3. Technology Stack

### Frontend
- **Framework / Core:** React 19 (powered by Vite)
- **Routing & Layouts:** React Router DOM (Separate Layout routes per user role)
- **Styling & Components:** Tailwind CSS v4, Shadcn UI (`class-variance-authority`, `cn`, `tw-animate-css`)
- **Charts & Data Visualization:** Recharts (React 19 compatible) for portal dashboard charts
- **Iconography:** Lucide React (`lucide-react`)
- **Language:** TypeScript

### Backend & API
- **Local Development:** Node.js with Express.js REST API
- **Cloud / Production Deployment:** Supabase (BaaS with Auth, Storage, and Managed Database)

### Database
- **Local Environment:** PostgreSQL Database
- **Cloud / Production Environment:** Supabase Managed PostgreSQL Database

---

## 4. Navigation Architecture & User Role Breakdown

```
                         ┌─────────────────────────────────────────┐
                         │       Pet Adoption System Portal        │
                         └────────────────────┬────────────────────┘
                                              │
         ┌────────────────────────────────────┼────────────────────────────────────┐
         │                                    │                                    │
┌────────┴────────┐                  ┌────────┴────────┐                  ┌────────┴────────┐
│  Public Portal  │                  │ Shelter Portal  │                  │  Admin Portal   │
│  (Top Navbar)   │                  │ (Side Navbar)   │                  │  (Side Navbar)   │
└────────┬────────┘                  └────────┬────────┘                  └────────┬────────┘
         │                                    │                                    │
 ├── / (Home)                         ├── /shelter (Overview)              ├── /admin (Overview)
  ├── /pets (Catalog)                  ├── /shelter/listings               ├── /admin/shelters
  ├── /pets/:id (Details)              ├── /shelter/applications           ├── /admin/pets
  ├── /shelters (Directory)            ├── /shelter/inquiries              └── /admin/users
  ├── /favorites                       └── /shelter/profile
  ├── /apply/:petId
 ├── /applications
 ├── /login
 └── /signup
```

---

## 5. Detailed User Roles & Feature Requirements

### 5.1 Public / Adopter Portal (`PublicLayout` - Top Navigation Bar)
*Used by general site visitors and registered adopters. Clean, responsive top navbar for effortless navigation.*

* **Layout Header:** Top Navigation Bar with Logo, Links (*Pets*, *Shelters*, *Favorites* badge counter, *My Applications*), and Auth state (Login / Sign Up or Profile Dropdown).
* **Routes & Key Pages:**
  - `GET /` (`HomePage`): Hero section, featured pets carousel, recent rescue stories, shelter partner highlights, call-to-action banner.
  - `GET /pets` (`BrowsePetsPage`): Interactive public catalog with advanced search and filters (species, breed, age, gender, size, location). *Note: Displays ONLY pets marked as Public visibility.*
  - `GET /pets/:id` (`PetDetailsPage`): Detailed pet view with photo galleries, medical history, personality traits, shelter contact info, and "Apply to Adopt" trigger.
  - `GET /shelters` (`SheltersPage`): Directory of verified partner shelters with location maps, operating hours, and active pet listing counts.
  - `GET /favorites` (`FavoritesPage`): Personal saved watchlist for logged-in users to bookmark pets of interest.
  - `GET /apply/:petId` (`AdoptionFormPage`): Multi-step adoption questionnaire (housing info, yard/fence details, pet experience, references).
  - `GET /applications` (`ApplicationsPage`): User dashboard tracking submitted adoption applications and their current processing status (*Submitted*, *Under Review*, *Approved*, *Rejected*).
  - `GET /login` & `/signup` (`AuthPages`): User authentication and account registration.

---

### 5.2 Shelter Portal (`ShelterLayout` - Shelter Sidebar Navigation)
*Used by animal shelter managers and rescue staff. Dedicated dashboard layout with a collapsible sidebar for inventory and applicant management.*

* **Layout Sidebar:** Collapsible Sidebar with links (*Dashboard Overview*, *Pet Listings*, *Adoption Applications*, *Inquiries Inbox*, *Shelter Profile*, *Logout*). Both portals (shelter + platform admin) share one sidebar design component with role-specific links.
* **Routing (parent + children):** `ShelterLayout` is the parent route rendering the sidebar + `<Outlet />`; each page below is a child route (dedicated page component, not tabs inside one page).
* **Routes & Key Pages:**
  - `GET /shelter` (`ShelterOverviewPage`): At-a-glance dashboard for the shelter, built with summary stats cards, Recharts charts, and data tables:
    - **Summary stat cards (KPI row):** Total pets, public listings, private inventory count, pending applications, and successful adoptions (with adoption rate).
    - **Charts (Recharts):** Applications over time (area chart — received vs. approved/adopted by month), pets by species (donut), applications by status (bar), and listings by status (bar).
    - **Tables:** Recent applications (pet, applicant, status, submitted date) and the full pet inventory (pet, species, visibility, status, date added).
  - `GET /shelter/listings` (`ShelterListingsPage`):
    - **Pet Inventory Management (CRUD):** Create, update, view, and archive pet records.
    - **Visibility Control (Public vs. Private/Inventory):**
      - *Public*: Pet is listed on the public adopter catalog and open for applications.
      - *Private / Inventory*: Pet is kept in internal shelter records (e.g., under medical treatment, quarantine, or onboarding) and hidden from the public site.
  - `GET /shelter/applications` (`ShelterApplicationsPage`):
    - Centralized table of incoming adoption applications for the shelter's pets.
    - Detailed applicant review modal, status workflow updating (*Approve*, *Reject*, *Hold*), and internal staff notes.
  - `GET /shelter/inquiries` (`ShelterInquiriesPage`):
    - Inbox of direct adopter inquiries about the shelter's pets, with reply and mark-resolved actions.
  - `GET /shelter/profile` (`ShelterProfilePage`):
    - Manage shelter organization details, logo uploads, address, contact phone/email, operating hours, and adoption policy descriptions.

---

### 5.3 Platform Admin / Developer Portal (`AdminLayout` - Admin Sidebar Navigation)
*Used by system administrators and platform developers for system-wide governance, data oversight, and operational health monitoring.*

* **Layout Sidebar:** Dedicated Admin Sidebar with links (*Platform Overview*, *Shelters Directory*, *Pets Directory*, *Users Directory*, *System Logs*, *Logout*).
* **Routes & Key Pages:**
  - `GET /admin` (`PlatformAdminPage` -> `overview` section):
    - System-wide metrics across all registered shelters (Total Shelters, Total Users, Total Pets System-wide, Public vs Private pet breakdown, Active adoption stats).
  - `GET /admin/shelters` (`PlatformAdminPage` -> `shelters` section):
    - Complete directory of all shelters on the platform.
    - Features to add/register new shelters, verify shelter status, edit shelter details, or suspend shelter access.
  - `GET /admin/pets` (`PlatformAdminPage` -> `pets` section):
    - Platform-wide directory of every pet showing which shelter posted it.
    - Search plus per-shelter filter, status/visibility columns, and read-only detail view (pet management stays with the owning shelter).
  - `GET /admin/users` (`PlatformAdminPage` -> `users` section):
    - User management table listing all registered accounts (Adopters, Shelter Staff, Platform Admins).
    - Capabilities to assign user roles (`adopter`, `shelter_staff`, `platform_admin`), assign staff to specific shelters, and toggle account activation status.

---

## 6. Security & Route Protection (RBAC)

The system enforces **Role-Based Access Control (RBAC)** via `ProtectedRoute` wrappers:
- **Public Routes:** Accessible to all visitors (`/`, `/pets`, `/pets/:id`, `/shelters`, `/login`, `/signup`).
- **Adopter Protected Routes:** Requires authenticated `adopter` role (`/apply/:petId`, `/applications`, `/favorites`).
- **Shelter Staff Protected Routes:** Requires authenticated `shelter_staff` role (`/shelter/*`).
- **Platform Admin Protected Routes:** Requires authenticated `platform_admin` role (`/admin/*`).

---

## 7. Deployment & Data Architecture Strategy
- **Local Development Workflow:**
  - Frontend running on Vite local server (`http://localhost:5173`).
  - Backend running on Express.js server connecting to a local PostgreSQL instance.
- **Cloud & Production Workflow:**
  - Frontend hosted on modern web hosting (e.g., Vercel / Netlify / Cloudflare Pages).
  - Database, authentication, and file storage seamlessly migrated to Supabase Cloud PostgreSQL.
