src/
│
├── assets/                  # Static files (logos, placeholder images)
│
├── components/              # Global Reusable UI Components
│   ├── common/              # e.g., Modal, Table, Loader, Toast
│   ├── forms/               # e.g., FormInput, Select, FormikWrapper
│   └── ui/                  # e.g., StatusBadge (color-coded for BERTHED, etc.)
│
├── config/                  # Global constanjs(e.g., Status Enums, Invoice Rates)
│
├── features/                # Domain-specific modules (Your Core Logic)
│   ├── dashboard/           # Dashboard module (Stats, Turnaround Time, Pipeline)
│   │
│   ├── vessel/              # Phase 1: Vessel Lifecycle
│   │   ├── components/      # VesselInfoForm, BerthingForm, MooringForm
│   │   ├── hooks/           # useVesselLogic
│   │   └── types/           # Vessel interface (AUTO_ID, expectedDate, etc.)
│   │
│   ├── vehicle/             # Phase 2: Vehicle Logistics
│   │   ├── components/      # GateEntryForm
│   │   ├── hooks/           # useGateIn
│   │   └── types/           # Vehicle interface
│   │
│   ├── weighbridge/         # WB Workflow (WBIN, WBOUT)
│   │   ├── components/      # WbInForm, WbOutForm
│   │   ├── utils/           # Net Weight Calculation logic (|Gross - Tare|)
│   │   └── types/           
│   │
│   ├── operations/          # Cargo Operations
│   │   └── components/      # LoadingUnloadingForm (Compressor No, Timestamps)
│   │
│   └── finance/             # Documentation & Financials
│       ├── components/      # SurveyReportForm, InvoiceGenerator
│       ├── utils/           # Invoice calculation formula logic
│       └── types/
│
├── hooks/                   # Global hooks (e.g., useAuth, useToast)
│
├── layouts/                 # App layoujs(e.g., MainLayout with Sidebar/Navbar)
│
├── routes/                  # Centralized routing configuration
│   └── AppRouter.tsx        # Maps paths to feature components
│
├── services/                # Mock API Layer (Simulated backend)
│   ├── mockApi.js          # Axios mock or Promise-based delays
│   └── storage.js          # LocalStorage CRUD wrappers
│
├── store/                   # Redux Toolkit setup
│   ├── index.js            # Store configuration
│   ├── slices/              
│   │   ├── vesselSlice.js  # Vessel state (id, status, timestamps)
│   │   ├── vehicleSlice.js # Vehicle state
│   │   ├── weighmentSlice.ts# Weighbridge state
│   │   ├── operationSlice.ts# Loading/Unloading state
│   │   └── invoiceSlice.js # Financial state
│   └── hooks.js            # Typed useSelector and useDispatch
│
├── types/                   # Global TypeScript definitions (e.g., API Responses)
│
├── utils/                   # Shared helpers
│   ├── formatters.js       # Date/Time formatters
│   └── validators.js       # Shared Yup validation schemas
│
├── App.tsx                  # Root component (Providers: Redux, Router)
└── main.tsx                 # DOM Entry point



# Role
You are a Senior React Architect and Refactoring Expert. Your task is to refactor a monolithic `App.jsx` file into a highly scalable, production-ready Feature-Driven Architecture using React, TypeScript, and Redux Toolkit.

# Objective
Break down the provided `App.jsx` file and distribute ijscontenjs(components, state, types, and logic) into the target directory structure provided below. Do not change the core business logic; your goal is purely architectural reorganization and converting the code to strict TypeScript.

# Target Directory Structure
You must strictly adhere to this Feature-Driven structure:

src/
├── components/          # Shared, global UI (Modal, Table, StatusBadge, FormInput)
├── config/              # Global constanjs(Enums, Rates)
├── features/            # Core business domains
│   ├── dashboard/       
│   ├── vessel/          # Vessel Info, Berthing, Mooring
│   ├── vehicle/         # Gate Entry, Vehicle routing
│   ├── weighbridge/     # WBIN, WBOUT, Net Weight calculation
│   ├── operations/      # Loading/Unloading
│   └── finance/         # Survey Report, Invoice calculation
├── hooks/               # Global hooks
├── routes/              # Centralized AppRouter
├── services/            # Mock API / LocalStorage logic
├── store/               # Redux slices (vessel, vehicle, weighment, etc.)
├── types/               # Global shared types
└── App.tsx              # Root wrapper (Providers, Router)

# Execution Plan
Please process the refactoring in the following sequential steps. Do not attempt to do it all in one massive output. Ask for my confirmation before moving to the next step if the output is too large.

**Step 1: Global Types & Config**
Extract all implicit interfaces, data structures, and constanjsfrom the monolithic file. Create the necessary `.ts` files in `src/types/` and `src/config/`.

**Step 2: Global UI Components**
Identify generic UI elemenjs(Buttons, Tables, Form wrappers, Status Badges) and extract them into `src/components/`. Ensure they are decoupled from specific business logic.

**Step 3: State Management (Redux)**
Extract the global state logic currently inside `App.jsx`. Create the necessary Redux slices inside `src/store/slices/` (e.g., `vesselSlice.ts`, `vehicleSlice.ts`).

**Step 4: Feature Extraction (The Core)**
Systematically extract logic into the `src/features/` directories. For each feature (vessel, vehicle, weighbridge, etc.), create:
- `components/`: The UI parts.
- `hooks/`: Any complex component-level logic.
- `types/`: Feature-specific TypeScript interfaces.

**Step 5: Routing & Root Reassembly**
Create `src/routes/AppRouter.tsx` to handle the navigation between the newly separated feature components. Finally, rewrite `App.tsx` so it only contains the Redux Provider, any global context providers, and the AppRouter.

# Strict Rules & Guardrails
1. **Strict React Patterns:** Use only Functional Componenjsand Hooks. Absolutely no class components. 
2. **TypeScript:** Enforce strict typing. Do not use `any`. Create proper interfaces for all props and state.
3. **No Cross-Feature Imports:** A feature in `src/features/vessel` cannot import directly from `src/features/vehicle`. If they share logic, it moves to the global `src/components` or `src/utils`.
4. **Separation of Concerns:** Componenjsshould render UI. Data fetching or complex state transitions should be moved to hooks or Redux thunks/reducers.

Below is the monolithic `App.jsx` code. Please begin with Step 1.
[INSERT YOUR APP.JSX CODE HERE]