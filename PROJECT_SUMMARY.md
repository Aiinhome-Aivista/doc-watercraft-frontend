# DOC Watercraft Frontend - Project Summary

## Overview
This is a React + TypeScript frontend for dock watercraft operations. It manages vessel lifecycle, vehicle gate operations, weighbridge records, dashboard KPIs, finance calculations, user administration, and party master management.

## Tech Stack
- React 19 + TypeScript
- Vite 8
- Redux Toolkit + React Redux
- React Router
- Axios (API client + interceptors)
- Lucide React icons
- date-fns

## App Architecture
The app follows a feature-first structure with centralized state and service layers:

- `src/features/*`: Page-level business modules
- `src/store/*`: Redux store, slices, async thunks
- `src/services/*`: API service methods
- `src/api/*`: Axios client + endpoint map
- `src/components/ui/*`: Shared reusable UI components
- `src/components/auth/*`: Security and guard components
- `src/types/*`: Domain and API types
- `src/layouts/*`: Main shell layout
- `src/routes/*`: Route definitions

## Main Feature Modules

### 1) Auth & Security
Files: `src/features/auth/*`, `src/components/auth/*`
- Implements the login module for user authentication.
- Login API returns `access_rights` (modules, vessel_statuses, gate_operations), `role`, and JWT `token`.
- User data including `access_rights` is stored in `localStorage` as `user_data`.
- `AuthGuard` reads `access_rights.modules` to dynamically restrict route access per user.
- Admins always get Settings access; non-admin users are blocked from `/settings` regardless of module list.

### 2) Dashboard
File: `src/features/dashboard/DashboardPage.tsx`
- Displays vessel-related KPI cards.
- Shows status counts and quantity summaries.
- Includes vessel activity table.

### 3) Vessel Operations
File: `src/features/vessel/VesselsPage.tsx`
- Handles vessel lifecycle flows.
- Supports create and status transitions (berth, moor, survey, unberth).
- Uses modal-driven forms and Redux thunks.

### 4) Vehicle Gate Operations
File: `src/features/vehicle/GatePage.tsx`
- Tracks gate-in entries for trucks.
- Records cargo operations linked to entries.
- Integrates with vessel context and status progression.

### 5) Weighbridge Terminal
File: `src/features/weighbridge/WeighbridgeTerminalPage.tsx`
- Handles WBIN and WBOUT entries.
- Computes net weight from gross/tare.
- Updates gate lifecycle through weighment events.

### 6) Finance
Files: `src/features/finance/FinancePage.tsx`, `src/features/finance/utils/calculations.ts`
- Calculates billing lines (terminal, handling, berth/moor, truck charges).
- Builds invoice-like totals from operational records.

### 7) Party Master
File: `src/features/party/PartyMasterPage.tsx`
- Allows for administration and mapping of the various parties and vendors engaged in operations.

### 8) Settings & User Administration
File: `src/features/settings/SettingsPage.tsx`
- Provides a global directory of registered dashboard accounts.
- Includes a dynamic Access Rights management UI (Modal) to bind granular permissions (Modules, Vessel Statuses, Gate Operations) directly via the API.
- **Only visible to admin users.** Sidebar link and route are both restricted by role.
- Uses `GET /access-rights/{id}` to load existing permissions and `POST /access-rights/{id}` to save updates.

## Data & Request Flow
For complex, system-wide state:
`Feature Page -> Redux Thunk -> Service -> Axios Client -> API`
For simpler features (like Settings or Party Master):
`Feature Page -> Local State -> Service -> Axios Client -> API`

## State Management
Core slices:
- `src/store/slices/vesselSlice.ts`
- `src/store/slices/vehicleSlice.ts`
- `src/store/slices/loaderSlice.ts`

`loaderSlice` tracks pending async actions and powers global loading UI.

## API Layer
- `src/api/axios.client.ts`: Base Axios instance, auth token injection, response/error handling.
- `src/api/endpoints.ts`: Central endpoint constants.
- `src/config/env.config.ts`: Environment-driven API base URL and runtime flags.

## Reusable UI Components
Folder: `src/components/ui`
- `Button`, `Input`, `Select`, `Modal`, `StatusBadge`, `GlobalLoader`

These components keep visuals consistent across all feature pages.

## Date/Time Convention
Use shared helpers in `src/utils/dateTime.ts` for IST-based values and formatting.
Avoid using raw `new Date().toISOString()` for `datetime-local` defaults to prevent UTC offset issues.

## Routing
File: `src/routes/AppRouter.tsx`
Current key routes:
- `/` -> Login/AuthPage
- `/dashboard`
- `/vessels`
- `/vehicles`
- `/weighbridge`
- `/finance`
- `/party-master`
- `/settings`

## Run & Build
From project root:

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Important Notes / Gaps to Remember
- Finance berth/moor slot values are currently hardcoded in calculation logic.
- Validation is mostly custom/manual (no schema/form library yet).
- Notification handling is basic (limited centralized toast feedback).
- Role-based access is enforced at 3 layers: `AuthGuard` (route), `MainLayout` (sidebar), and Settings page (admin-only).
- `access_rights` are stored in `localStorage` as part of `user_data` on login.

## Quick Re-entry Checklist (For Later)
When reopening this project:
1. Start with `src/routes/AppRouter.tsx` and `src/layouts/MainLayout.tsx`.
2. Review `vesselSlice` and `vehicleSlice` async thunks.
3. Inspect corresponding services and API endpoints.
4. Validate env config (`src/config/env.config.ts`) before running against backend.
5. Re-check finance calculation assumptions in `src/features/finance/utils/calculations.ts`.

## Suggested Next Improvements
1. Make berth/moor charges duration-based instead of hardcoded slot counts.
2. Implement User Role validation checks inside components, not just routing guards.
3. Introduce form validation schema (e.g., Zod/Yup + react-hook-form).
4. Add a toast/notification system for success/error feedback.
5. Add paginated tables and stronger server-side filtering for scale.
