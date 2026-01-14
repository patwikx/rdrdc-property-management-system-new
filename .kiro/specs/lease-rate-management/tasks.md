 # Implementation Plan: Lease Rate Management

## Overview

This implementation plan covers the rate management feature including automatic rate increases, rate overrides, two-step approval workflow, and rate history tracking. The schema changes have already been applied to `prisma/schema.prisma`.

## Tasks

- [x] 1. Run database migration for new schema
  - Run `npx prisma migrate dev --name add-rate-management`
  - Run `npx prisma generate` to update client
  - Verify migration applied successfully
  - _Requirements: 1.1, 1.2, 1.3, 3.6, 4.1, 4.5, 6.1, 6.2_

- [x] 2. Update lease creation to initialize rate fields
  - [x] 2.1 Update `createLease` in `lib/actions/lease-actions.ts`
    - Set `baseRentAmount` equal to `rentAmount` for each LeaseUnit
    - Calculate and set `nextScheduledIncrease` based on `startDate + increaseIntervalYears`
    - Accept `standardIncreasePercentage`, `increaseIntervalYears`, and `autoIncreaseEnabled` as required input parameters (no hardcoded defaults)
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ]* 2.2 Write property test for base rent initialization
    - **Property 1: Base Rent Initialization**
    - **Validates: Requirements 1.1**
  - [ ]* 2.3 Write property test for next scheduled increase calculation
    - **Property 2: Next Scheduled Increase Calculation**
    - **Validates: Requirements 1.2**

- [-] 3. Create rate management server actions
  - [x] 3.1 Create `lib/actions/rate-actions.ts` with core functions
    - `createRateChangeRequest()` - create new rate change request
    - `createRateOverride()` - create new rate override request
    - `getRateHistory()` - get rate history for a lease unit
    - `getActiveOverride()` - get active override for a lease unit
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 5.3, 5.4_
  - [ ]* 3.2 Write property test for rate change request initial state
    - **Property 3: Rate Change Request Initial State**
    - **Validates: Requirements 2.3, 2.4**

- [-] 4. Implement two-step approval workflow
  - [x] 4.1 Add approval functions to `lib/actions/rate-actions.ts`
    - `recommendRateChange()` - first approval step
    - `approveRateChange()` - final approval step
    - `rejectRateChange()` - reject at any step
    - `getPendingApprovals()` - get pending items for approver
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [ ]* 4.2 Write property test for approval state transitions
    - **Property 4: Approval State Transitions**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
  - [ ]* 4.3 Write property test for recommending approval records
    - **Property 5: Recommending Approval Records**
    - **Validates: Requirements 3.2**
  - [ ]* 4.4 Write property test for final approval records
    - **Property 6: Final Approval Records**
    - **Validates: Requirements 3.4**
  - [ ]* 4.5 Write property test for rejection records
    - **Property 7: Rejection Records**
    - **Validates: Requirements 3.5**

- [x] 5. Implement rate override logic
  - [x] 5.1 Add override calculation functions to `lib/actions/rate-actions.ts`
    - `calculateNewRate()` - calculate rate considering overrides
    - `applyRateChange()` - apply approved rate change to LeaseUnit
    - _Requirements: 4.2, 4.3, 4.4_
  - [ ]* 5.2 Write property test for fixed rate override
    - **Property 8: Fixed Rate Override**
    - **Validates: Requirements 4.2**
  - [ ]* 5.3 Write property test for percentage cap override
    - **Property 9: Percentage Cap Override**
    - **Validates: Requirements 4.3**
  - [ ]* 5.4 Write property test for no increase override
    - **Property 10: No Increase Override**
    - **Validates: Requirements 4.4**

- [x] 6. Implement rate history tracking
  - [x] 6.1 Add rate history functions to `lib/actions/rate-actions.ts`
    - `createRateHistory()` - create history record when rate changes
    - Update `applyRateChange()` to create history record
    - _Requirements: 5.1, 5.2, 5.3_
  - [ ]* 6.2 Write property test for rate history creation
    - **Property 11: Rate History Creation**
    - **Validates: Requirements 5.1**
  - [ ]* 6.3 Write property test for rate history ordering
    - **Property 12: Rate History Ordering**
    - **Validates: Requirements 5.4**
  - [ ]* 6.4 Write property test for auto-applied flag
    - **Property 13: Auto-Applied Flag**
    - **Validates: Requirements 5.2**

- [x] 7. Implement scheduled rate increase processing
  - [x] 7.1 Add scheduled increase function to `lib/actions/rate-actions.ts`
    - `processScheduledRateIncreases()` - find and process due increases
    - Flag leases, apply increases, create history records
    - Update `nextScheduledIncrease` for processed leases
    - _Requirements: 1.4, 1.5_

- [ ] 8. Checkpoint - Ensure all server actions work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Create rate management UI components
  - [x] 9.1 Create `components/rate-management/rate-change-form.tsx`
    - Form for requesting rate changes
    - Fields: proposedRate, effectiveDate, changeType, reason
    - _Requirements: 7.1_
  - [x] 9.2 Create `components/rate-management/rate-override-form.tsx`
    - Form for requesting rate overrides
    - Fields: overrideType, fixedRate/percentageCap, effectiveFrom, effectiveTo, reason
    - _Requirements: 7.2_
  - [x] 9.3 Create `components/rate-management/pending-approvals.tsx`
    - List of pending approvals for recommending/final approvers
    - Approve/reject actions with remarks
    - _Requirements: 7.3, 7.4_
  - [x] 9.4 Create `components/rate-management/rate-history.tsx`
    - Display rate history for a lease unit
    - Chronological order with change details
    - _Requirements: 7.5_

- [x] 10. Integrate rate management into existing pages
  - [x] 10.1 Add rate history to lease detail page
    - Display rate history in lease/unit details
    - _Requirements: 5.4, 7.5_
  - [x] 10.2 Add rate change/override buttons to lease unit configuration
    - Allow requesting rate changes from unit configuration
    - _Requirements: 7.1, 7.2_
  - [x] 10.3 Create approvals dashboard page
    - Page for approvers to view and process pending approvals
    - Filter by recommending vs final approval
    - _Requirements: 7.3, 7.4_
  - [x] 10.4 Update lease creation form to include rate increase settings
    - Add fields for `standardIncreasePercentage`, `increaseIntervalYears`, `autoIncreaseEnabled`
    - These are required fields - no defaults, full user control
    - _Requirements: 1.2, 1.3_

- [x] 11. Add user approval permission management
  - [x] 11.1 Update user edit form to include approval permissions
    - Add checkboxes for `isRecommendingApprover` and `isFinalApprover`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 12. Final checkpoint - Full integration testing
  - Ensure all tests pass, ask the user if questions arise.
  - Test complete workflow: create lease → request rate change → recommend → approve → apply
  - Test override scenarios: fixed rate, percentage cap, no increase
  - Test scheduled rate increase processing

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The schema changes have already been applied - Task 1 just runs the migration
