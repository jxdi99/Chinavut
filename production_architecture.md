# RAZR LED Solution - Production Architecture Structure

This document outlines the transition from a client-side demo to a professional-grade production system using a clear **Separation of Concerns (SoC)** between the Frontend and Backend.

## 1. Core Technology Stack

- **Frontend**: [Vite](https://vitejs.dev/) + Vanilla Javascript (Lightweight, extremely fast, professional build tooling).
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Real-time sync, REST API).
- **State Management**: Reactive state pattern (No heavy frameworks needed, keeps performance high).
- **Hosting**: 
  - **Frontend**: GitHub Pages or Vercel.
  - **Backend**: Supabase Cloud.

---

## 2. Directory Structure (Proposed)

```text
/calculator-led-pro
├── /supabase                # Database configuration & migrations
│   ├── /migrations          # Versioned SQL schemas
│   └── seed.sql             # initial data upload script
├── /src                     # Main application source
│   ├── /api                 # Supabase client & DB interface
│   │   ├── client.js        # Supabase initialization
│   │   └── models.js        # DB fetch/update logic
│   ├── /assets              # Images, icons, and logos
│   ├── /core                # Core calculation engine (Pure Logic)
│   │   └── led-engine.js    # The mathematical logic for calculations
│   ├── /styles              # Global and component-specific CSS
│   │   ├── main.css         # Base styles & variables
│   │   └── components.css   # Component-specific styles
│   ├── /ui                  # UI Rendering & Components
│   │   ├── banner.js        # Specialized welcome banner
│   │   └── calculator.js    # UI logic for the calculator
│   └── main.js              # Application entry point & router
├── index.html               # Main entry HTML
├── package.json             # NPM dependencies & build scripts
└── vite.config.js           # Build configuration
```

---

## 3. Database Schema (PostgreSQL)

### Table: `staff_profiles`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | uuid (PK) | Unique ID |
| `emp_id` | text (unique) | Employee ID (e.g., HR-SP-7-009) |
| `full_name`| text | Display first name |
| `department`| text | LED / Sale / Store |
| `role` | text | user / admin |

### Table: `led_models`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | uuid (PK) | Unique ID |
| `group_id` | text | UIR / UOS / CIH |
| `name` | text | Model name (e.g., UIRx 2.5) |
| `res_w` | integer| Horizontal resolution |
| `res_h` | integer| Vertical resolution |
| `max_w` | float | Peak power consumption |
| `avg_w` | float | Typical power consumption |
| `price` | double | Unit cost |

---

## 4. Production Data Flow

### A. Initialization & Auth
1. **Load**: App initializes `supabase-js` client.
2. **Auth Check**: Checks Supabase Auth session.
3. **Fetch Data**: Single parallel request to fetch all `led_models`, `controllers`, and `staff` data.
4. **Cache**: Store data in a local `App.state` for instant calculation response.

### B. Dynamic Management (Admin)
1. **Update**: Admin edits a price in the UI -> Calls `supabase.from('led_models').update()`.
2. **Real-time Sync**: Calculator pages use `Supabase Realtime` to listen for `UPDATE` events. 
3. **Auto-Refresh**: If an admin changes a price, the salesperson's calculation updates immediately without refreshing the page.

### C. Security & Integrity
- **RLS (Row Level Security)**: Policies in PostgreSQL prevent unauthorized users from modifying model data.
- **Validation**: Server-side checks ensure prices and specifications remain within valid ranges.

---

## 5. Deployment Workflow
1. **GitHub Action**: On push to `main`, automatically build with `npm run build`.
2. **CDN Deployment**: Deploy the minified `/dist` folder to GitHub Pages.
3. **Environment**: Use `.env` files to manage Supabase keys securely.
