# Requirements Document

## Introduction

This feature adds comprehensive rate management capabilities to the lease system, including automatic rate increases after configurable intervals (default 3 years), long-term rate overrides, and a two-step approval workflow for rate changes.

## Glossary

- **Lease**: A rental agreement between a tenant and property owner for one or more units
- **LeaseUnit**: Junction record linking a lease to a specific unit with its rent amount
- **Rate_Increase**: An adjustment to the rent amount, either automatic or manual
- **Rate_Override**: A special agreement that modifies or freezes standard rate increases
- **Rate_Change_Request**: A formal request to change rates requiring approval
- **Recommending_Approver**: First-level approver who reviews and recommends rate changes
- **Final_Approver**: Second-level approver who gives final approval for rate changes
- **Base_Rent**: The original rent amount when a lease was created
- **Current_Rent**: The active rent amount after any increases

## Requirements

### Requirement 1: Automatic Rate Increase Scheduling

**User Story:** As a property manager, I want the system to automatically schedule rate increases based on configurable intervals, so that rent adjustments happen systematically without manual tracking.

#### Acceptance Criteria

1. WHEN a new lease is created, THE System SHALL set `baseRentAmount` equal to the initial `rentAmount` for each LeaseUnit
2. WHEN a new lease is created, THE System SHALL calculate `nextScheduledIncrease` as `startDate + increaseIntervalYears`
3. THE Lease SHALL store `standardIncreasePercentage` (default 10%) and `increaseIntervalYears` (default 3 years)
4. WHEN `autoIncreaseEnabled` is true AND current date reaches `nextScheduledIncrease`, THE System SHALL flag the lease for rate increase
5. WHEN a rate increase is flagged, THE System SHALL automatically apply the increase AND create a RateChangeRequest record with `isFlagged = true`

### Requirement 2: Rate Change Request Management

**User Story:** As a property manager, I want to create and track rate change requests, so that all rent adjustments are documented and auditable.

#### Acceptance Criteria

1. WHEN a rate change is requested, THE System SHALL create a RateChangeRequest with `currentRate`, `proposedRate`, `changeType`, and `effectiveDate`
2. THE RateChangeRequest SHALL support change types: STANDARD_INCREASE, MANUAL_ADJUSTMENT, RENEWAL_INCREASE, OVERRIDE_REQUEST
3. WHEN a RateChangeRequest is created, THE System SHALL set status to PENDING
4. THE System SHALL track `requestedById` and `requestedAt` for all requests

### Requirement 3: Two-Step Approval Workflow

**User Story:** As a property owner, I want rate changes to go through a two-step approval process (recommending → final), so that there is proper oversight on rent adjustments.

#### Acceptance Criteria

1. WHEN a RateChangeRequest has status PENDING, THE Recommending_Approver SHALL be able to recommend or reject it
2. WHEN a Recommending_Approver approves, THE System SHALL set status to RECOMMENDED and record `recommendedById`, `recommendedAt`, and `recommendedRemarks`
3. WHEN a RateChangeRequest has status RECOMMENDED, THE Final_Approver SHALL be able to approve or reject it
4. WHEN a Final_Approver approves, THE System SHALL set status to APPROVED and record `approvedById`, `approvedAt`, and `approvalRemarks`
5. IF a request is rejected at any step, THE System SHALL set status to REJECTED and record `rejectedById`, `rejectedAt`, `rejectedReason`, and `rejectedAtStep`
6. THE User model SHALL have `isRecommendingApprover` and `isFinalApprover` boolean fields to determine approval permissions

### Requirement 4: Rate Override for Long-Term Agreements

**User Story:** As a property manager, I want to create rate overrides for long-term tenants, so that I can offer special rate agreements that bypass standard increases.

#### Acceptance Criteria

1. THE RateOverride SHALL support override types: FIXED_RATE, PERCENTAGE_CAP, NO_INCREASE
2. WHEN override type is FIXED_RATE, THE System SHALL lock the rate at the specified `fixedRate` amount
3. WHEN override type is PERCENTAGE_CAP, THE System SHALL limit increases to the specified `percentageCap` percentage
4. WHEN override type is NO_INCREASE, THE System SHALL prevent any rate increases during the override period
5. THE RateOverride SHALL have `effectiveFrom` and optional `effectiveTo` dates
6. THE RateOverride SHALL follow the same two-step approval workflow as RateChangeRequest

### Requirement 5: Rate History Tracking

**User Story:** As a property manager, I want to view the complete rate history for any lease unit, so that I can track all rent changes over time.

#### Acceptance Criteria

1. WHEN a rate change is applied, THE System SHALL create a RateHistory record with `previousRate`, `newRate`, `changeType`, and `effectiveDate`
2. THE RateHistory SHALL indicate if the change was `isAutoApplied` (automatic increase)
3. THE RateHistory SHALL optionally link to the `requestId` if the change came from a RateChangeRequest
4. THE System SHALL display rate history in chronological order for any LeaseUnit

### Requirement 6: Approval Permissions

**User Story:** As an administrator, I want to assign recommending and final approval permissions to users, so that the right people can approve rate changes.

#### Acceptance Criteria

1. THE User model SHALL have `isRecommendingApprover` boolean field (default false)
2. THE User model SHALL have `isFinalApprover` boolean field (default false)
3. WHEN a user has `isRecommendingApprover = true`, THE System SHALL allow them to recommend rate changes
4. WHEN a user has `isFinalApprover = true`, THE System SHALL allow them to give final approval
5. A user MAY have both permissions simultaneously

### Requirement 7: Rate Management UI

**User Story:** As a property manager, I want a user interface to manage rate changes and overrides, so that I can efficiently handle rent adjustments.

#### Acceptance Criteria

1. THE System SHALL provide a rate change request form with fields for proposed rate, effective date, and reason
2. THE System SHALL provide a rate override request form with override type, parameters, and duration
3. THE System SHALL display pending approvals for recommending approvers
4. THE System SHALL display recommended items awaiting final approval for final approvers
5. THE System SHALL display rate history on the lease/unit detail pages
