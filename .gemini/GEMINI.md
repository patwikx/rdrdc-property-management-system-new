# Gemini Agent Context

## Project Overview
**Name**: New PMS v3
**Type**: Property Management System (Next.js, Prisma, Tailwind, Shadcn UI)
**Design System**: "Brutalist Tech" (High density, sharp borders, mono fonts, uppercase headers).

## Current Session Status
**Last Updated**: January 17, 2026
**Focus**: UI/UX Unification (Tenants, Leases, Properties)

## Key Guidelines (The "Brutalist Tech" Standard)
1.  **Radius**: `rounded-none` everywhere (Inputs, Buttons, Cards, Badges).
2.  **Typography**:
    *   Headers: `font-bold uppercase tracking-tight`.
    *   Labels: `text-[10px] uppercase tracking-widest font-semibold text-muted-foreground`.
    *   Data: `font-mono`.
3.  **Layout**: `grid-cols-4` preferred for cards. `border-border` usage is heavy.
4.  **Actions**: 
    *   Delete -> `AlertDialog` (No `window.confirm`).
    *   Forms -> Explicit `type="button"` for non-submit actions.

## Recent Accomplishments
*   **Properties**: Added Stats Cards, Redesigned Index/Details pages.
*   **Tenants**: Redesigned Create Form (Multi-step), Details Page (Spec sheet), and Index.
*   **Leases**: Redesigned Create Form (Unit grid), Index, and Details.
*   **Sidebar**: Improved collapsed state.

## Pending Tasks (Roadmap)
1.  **Financial Module**: Apply Brutalist aesthetics to Notices, PDC, AR Aging.
2.  **Taxes Module**: Update Property/Space tax indexes.
3.  **Maintenance**: Update RWO Board and Request Index.
4.  **Utilities**: Update Billing Monitoring.

## Reference Files
*   `PROJECT_AESTHETICS.md`: Detailed design system documentation.
