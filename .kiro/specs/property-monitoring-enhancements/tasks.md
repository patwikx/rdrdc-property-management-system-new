# Implementation Plan: Property Monitoring Enhancements

## Overview

This implementation plan covers three major features: Utilities Billing Monitoring page, RWO Kanban Board, and Advanced Filters for spaces/tenants. Tasks are organized to build incrementally with testing integrated throughout.

## Tasks

- [x] 1. Set up project structure and shared utilities
  - [x] 1.1 Create utility helper functions for date calculations
    - Create `lib/utils/date-helpers.ts` with `getDaysElapsed`, `isOverdue`, `isUpcoming` functions
    - Create `lib/utils/tenure-helpers.ts` with `calculateTenure`, `formatTenure` functions
    - Create `lib/utils/bill-status.ts` with `getBillStatus` function
    - _Requirements: 1.4, 1.5, 2.12, 4.2, 4.3_
  - [ ]* 1.2 Write property tests for date and tenure helper functions
    - **Property 1: Bill status indicator correctness**
    - **Property 12: Tenure calculation accuracy**
    - **Validates: Requirements 1.4, 1.5, 4.2, 4.3**

- [x] 2. Implement Utilities Billing Monitoring feature
  - [x] 2.1 Create utility billing server actions
    - Create `lib/actions/utility-billing-actions.ts`
    - Implement `getUtilityBills` with filtering and sorting
    - Implement `getUtilityBillingSummary` for summary calculations
    - _Requirements: 1.2, 1.3, 1.6, 1.7, 1.9, 1.10_
  - [ ]* 2.2 Write property tests for utility billing actions
    - **Property 3: Summary calculations correctness**
    - **Property 4: Filtering correctness**
    - **Property 5: Sorting correctness**
    - **Validates: Requirements 1.6, 1.7, 1.9**
  - [x] 2.3 Create UtilityBillingSummary component
    - Create `components/utilities/utility-billing-summary.tsx`
    - Display total bills, overdue count, upcoming count, total amount due
    - _Requirements: 1.7_
  - [x] 2.4 Create UtilityBillingFilters component
    - Create `components/utilities/utility-billing-filters.tsx`
    - Add property, utility type, and payment status filters
    - Add sort options (due date, amount, space)
    - _Requirements: 1.6, 1.9_
  - [x] 2.5 Create UtilityBillingTable component
    - Create `components/utilities/utility-billing-table.tsx`
    - Display bills with status indicators (overdue/warning/paid)
    - Show due date, billing period, amount, space, tenant
    - Make rows clickable for navigation
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.8, 1.10_
  - [ ]* 2.6 Write property tests for bill status indicators
    - **Property 2: Bill content and grouping**
    - **Validates: Requirements 1.2, 1.3, 1.10**
  - [x] 2.7 Create Utilities Billing page
    - Create `app/(dashboard)/utilities/billing/page.tsx`
    - Integrate summary, filters, and table components
    - Implement URL filter persistence
    - _Requirements: 1.1, 5.1, 5.2, 5.3, 5.4_
  - [x] 2.8 Add utilities billing to navigation
    - Update `components/sidebar/app-sidebar.tsx` to include utilities billing link
    - _Requirements: 1.1_

- [x] 3. Checkpoint - Utilities Billing feature complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement RWO Kanban Board feature
  - [x] 4.1 Create RWO server actions
    - Create `lib/actions/rwo-actions.ts`
    - Implement `getRWOs` with filtering
    - Implement `updateRWOStatus` with better-result error handling
    - Implement `createRWO` with validation
    - Implement `getRWOSummary` for status/priority counts
    - _Requirements: 2.2, 2.6, 2.7, 2.8, 2.9, 2.13_
  - [ ]* 4.2 Write property tests for RWO actions
    - **Property 7: Status update correctness**
    - **Property 8: Creation validation**
    - **Property 9: Filtering correctness**
    - **Property 10: Summary calculations**
    - **Validates: Requirements 2.6, 2.8, 2.9, 2.13**
  - [x] 4.3 Create RWOSummary component
    - Create `components/rwo/rwo-summary.tsx`
    - Display status counts and priority breakdown
    - _Requirements: 2.13_
  - [x] 4.4 Create RWOCard component
    - Create `components/rwo/rwo-card.tsx`
    - Display space, property, category, priority indicator, description
    - Show assigned staff, creation date, days elapsed
    - Make card draggable with dnd-kit
    - _Requirements: 2.3, 2.4, 2.11, 2.12_
  - [ ]* 4.5 Write property tests for RWO card content
    - **Property 6: RWO card content correctness**
    - **Validates: Requirements 2.3, 2.4, 2.11, 2.12**
  - [x] 4.6 Create RWODetailDialog component
    - Create `components/rwo/rwo-detail-dialog.tsx`
    - Display full RWO information and history
    - Allow status changes from dialog
    - _Requirements: 2.10_
  - [x] 4.7 Create CreateRWODialog component
    - Create `components/rwo/create-rwo-dialog.tsx`
    - Form with space selection, category, priority, description
    - Validate required fields
    - _Requirements: 2.5, 2.6_
  - [x] 4.8 Create RWOColumn component
    - Create `components/rwo/rwo-column.tsx`
    - Droppable column for each status
    - Display column header with count
    - _Requirements: 2.2_
  - [x] 4.9 Create RWOKanbanBoard component
    - Create `components/rwo/rwo-kanban-board.tsx`
    - Implement drag-and-drop with dnd-kit
    - Handle status updates on drop
    - _Requirements: 2.2, 2.7, 2.8_
  - [x] 4.10 Create RWOFilters component
    - Create `components/rwo/rwo-filters.tsx`
    - Add property, priority, and category filters
    - _Requirements: 2.9_
  - [x] 4.11 Create RWO Kanban page
    - Create `app/(dashboard)/maintenance/rwo/page.tsx`
    - Integrate all RWO components
    - Implement URL filter persistence
    - _Requirements: 2.1, 5.1, 5.2, 5.3, 5.4_
  - [x] 4.12 Add RWO page to navigation
    - Update `components/sidebar/app-sidebar.tsx` to include RWO link under maintenance
    - _Requirements: 2.1_

- [ ] 5. Checkpoint - RWO Kanban feature complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Advanced Filters for Spaces
  - [x] 6.1 Enhance units-actions with rate filtering
    - Update `lib/actions/units-actions.ts` to support minRate, maxRate, sortBy rate
    - _Requirements: 3.1, 3.2_
  - [ ]* 6.2 Write property tests for space rate filtering
    - **Property 11: Rate filtering and sorting correctness**
    - **Validates: Requirements 3.1, 3.2, 3.5**
  - [x] 6.3 Create SpaceRateFilter component
    - Create `components/filters/space-rate-filter.tsx`
    - Add min/max rate inputs and sort options
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 6.4 Integrate rate filters into spaces page
    - Update `app/(dashboard)/properties/units/page.tsx`
    - Add rate filter component
    - Highlight highest-rate space when sorted descending
    - Update URL with filter state
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3, 5.4_

- [ ] 7. Implement Advanced Filters for Tenants
  - [ ] 7.1 Enhance tenant-actions with tenure filtering
    - Update `lib/actions/tenant-actions.ts` to calculate and filter by tenure
    - Add tenure to tenant response type
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 7.2 Write property tests for tenant tenure filtering
    - **Property 12: Tenure calculation and filtering correctness**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
  - [ ] 7.3 Create TenantTenureFilter component
    - Create `components/filters/tenant-tenure-filter.tsx`
    - Add tenure range options and sort options
    - _Requirements: 4.1, 4.4_
  - [ ] 7.4 Integrate tenure filters into tenants page
    - Update `app/(dashboard)/tenants/page.tsx`
    - Add tenure filter component
    - Display tenure for each tenant
    - Highlight longest-tenured tenant when sorted descending
    - Update URL with filter state
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4_

- [ ] 8. Implement URL Filter Persistence
  - [ ] 8.1 Create useFilterState hook
    - Create `hooks/use-filter-state.ts`
    - Handle URL query parameter synchronization
    - Support multiple filter types
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ]* 8.2 Write property tests for URL filter state
    - **Property 13: URL filter state synchronization**
    - **Validates: Requirements 5.1, 5.2, 5.4**
  - [ ] 8.3 Apply useFilterState to all filter pages
    - Update utilities billing, RWO, spaces, and tenants pages
    - Ensure consistent filter behavior across pages
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 9. Final checkpoint - All features complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify navigation links work correctly
  - Test filter combinations across all pages

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation uses existing Prisma models - no schema changes required
- Follow Vercel React best practices for performance (parallel fetching, Suspense boundaries)
- Use better-result pattern for error handling in server actions
