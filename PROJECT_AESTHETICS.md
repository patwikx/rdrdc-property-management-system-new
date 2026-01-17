# Project Aesthetics & Recent Updates

## Summary of Changes

We have systematically updated the application to follow a unified "Brutalist / Tech" design language.

### Key Pages Updated
- **Tenants Index** (`/tenants`): Redesigned list view, stats strip, and filter bar.
- **Create Tenant** (`/tenants/create`): Multi-step form with sharp styling, sidebar guide, and technical inputs.
- **Tenant Details** (`/tenants/[id]`): Spec-sheet overview, custom technical tabs, and data-dense sub-sections.
- **Leases Index** (`/tenants/leases`): Grid-based card layout for leases with status color coding.
- **Create Lease** (`/tenants/leases/create`): Comprehensive form with unit selection grid and financial breakdown.
- **Lease Details** (`/tenants/leases/[id]`): Detailed contract view with rate history and unit management.
- **Properties Index** (`/properties`): Added real-time stats cards and applied the unified grid layout.
- **Property Details** (`/properties/[id]`): Updated delete action to use Alert Dialog.
- **App Sidebar**: Improved collapsed state transition and alignment.

### Components Refactored
- `TenantPDCSection`: Removed internal fetching skeleton; now accepts props.
- `TenantNoticesSection`: Removed internal fetching skeleton; now accepts props.
- `UnitCard`: Standardized "Technical Card" look for unit selection.
- `UnitConfiguration`: Standardized list view for selected units.

---

## Design System: "Brutalist Tech"

The application follows a strict, high-density, technical aesthetic inspired by brutalism and utility-first dashboards.

### 1. Typography
*   **Headers**: `font-bold uppercase tracking-tight` (e.g., "LEASE MANAGEMENT").
*   **Sub-headers/Labels**: `text-[10px] uppercase tracking-widest font-semibold text-muted-foreground` (e.g., "MONTHLY RENT", "TENANT NAME").
*   **Data Values**: `font-mono` (e.g., `₱15,000`, `BP-001`, `123 sqm`).
*   **Text Size**: 
    *   Standard body: `text-sm`.
    *   Small labels: `text-xs` or `text-[10px]`.

### 2. Containers & Cards
*   **Borders**: Sharp, visible borders are primary. `border border-border`.
*   **Radius**: **Strictly `rounded-none`** for almost all elements (Buttons, Inputs, Cards, Badges).
*   **Backgrounds**:
    *   Cards: `bg-background`.
    *   Headers/Strips: `bg-muted/5` or `bg-muted/10` to distinguish sections.
*   **Grid**: Preference for `grid-cols-4` for high-density data display.

### 3. Interactive Elements
*   **Buttons**: `rounded-none h-9 text-xs uppercase tracking-wider`.
*   **Inputs**: `rounded-none font-mono text-sm`.
*   **Tabs**: Custom `nav` style with `border-b` container and `border-b-2` active state (no pill shape).
*   **Badges**: `rounded-none uppercase tracking-widest px-1.5 py-0.5`.

### 4. Color Coding
Used sparingly but meaningfully for status indication:
*   **Active/Success**: `emerald-600` (Text) / `bg-emerald-500/10` (Background).
*   **Pending/Warning**: `amber-600` / `bg-amber-500/10`.
*   **Error/Overdue**: `rose-600` / `bg-rose-500/10`.
*   **Info/Financial**: `blue-600` or `purple-600`.

### 5. Layout Patterns
*   **Page Header**: Row layout with Title (Left) and Action Buttons (Right).
*   **Stats Strip**: A row of 4 metrics immediately below the header, separated by borders.
*   **Filter Bar**: `bg-muted/5` strip containing Search, Selects, and Clear button.
*   **Spec Sheet**: 2-column or 4-column definition lists for detailed object views.

---

## Implementation Rules

1.  **No Hidden Fetching**: Dashboard widgets (PDC, Notices) should accept data as props from the parent Server Component to avoid layout shift/skeletons.
2.  **Explicit Type**: Buttons inside forms must have `type="button"` unless they are the primary submit action.
3.  **Delete Actions**: Always use `AlertDialog` for destructive actions, never `window.confirm`.
4.  **Placeholders**: Use human-readable examples (e.g., "e.g. John Doe") instead of technical keys (`FIRST_NAME`).

---

## Session Context (Latest Updates)

**Last Session Goal**: Unify the UI/UX for Tenants, Leases, and Properties modules.

**Accomplishments**:
1.  **Properties Index**: Implemented `getPropertyStats` server action and connected it to `PropertyStatsCards`. Redesigned `PropertyCard` to include occupancy bar and metrics.
2.  **Property Details**: Replaced native delete confirmation with Shadcn `AlertDialog`.
3.  **Tenant Details**: Restored full profile data in Overview tab (Bank, Operations, etc.), removed icons from contact details, and synced Tabs styling with Properties module.
4.  **Create Lease**: Fully redesigned the form, including the "Space Assignment" section (Unit Card/Configuration) to match the Brutalist aesthetic.
5.  **Documentation**: Created this file (`PROJECT_AESTHETICS.md`) to serve as the single source of truth for design patterns.

**Immediate Next Steps**:
*   Continue applying the "Brutalist Tech" aesthetic to the remaining modules (Financial, Taxes, Utilities, Maintenance, Projects).
*   Verify that all "Delete" actions across the system use `AlertDialog`.
