# Requirements Document

## Introduction

This feature adds dedicated monitoring interfaces for utilities billing and Repair Work Orders (RWO) in the property management system. Staff can easily track utility due dates across all spaces and manage maintenance requests through a Kanban-style board, plus advanced filtering options for analyzing tenants and spaces.

## Glossary

- **System**: The Property Management System application
- **Space**: A leasable unit within a property (also referred to as Unit)
- **RWO**: Repair Work Order - a maintenance request for a space
- **Utility_Account**: A utility service account (electricity, water, others) associated with a space
- **Utility_Bill**: A billing record for a utility account with billing period and due date
- **Tenant**: A business or individual leasing one or more spaces
- **Lease**: A contract between a tenant and the property owner for space rental
- **Lease_Duration**: The length of time a tenant has been leasing a space, calculated from lease start date
- **Staff**: Users with roles that allow them to manage properties, utilities, and maintenance

## Requirements

### Requirement 1: Dedicated Utilities Billing Monitoring Page

**User Story:** As a staff member, I want a dedicated page to monitor all utilities billing dates across spaces, so that I can easily track payment deadlines and avoid service interruptions.

#### Acceptance Criteria

1. THE System SHALL provide a dedicated utilities billing page accessible from the main navigation
2. WHEN viewing the utilities billing page, THE System SHALL display a list of all utility bills grouped by space
3. WHEN viewing the utilities billing page, THE System SHALL show the due date, billing period, amount, and payment status for each bill
4. WHEN a utility bill due date is within 7 days, THE System SHALL highlight it with a warning indicator (yellow/orange)
5. WHEN a utility bill due date has passed and is unpaid, THE System SHALL display it with an overdue indicator (red)
6. THE System SHALL provide filter options by property, utility type (electricity, water, others), and payment status
7. THE System SHALL provide a summary card showing total bills due, overdue count, and total amount due
8. WHEN clicking on a utility bill row, THE System SHALL navigate to the space's utility details
9. THE System SHALL allow sorting by due date, amount, or space name
10. THE System SHALL display the tenant name associated with each space for context

### Requirement 2: RWO Kanban Board for Maintenance Monitoring

**User Story:** As a staff member, I want a Kanban-style board to create and monitor Repair Work Orders per space, so that I can track maintenance progress and prioritize repairs effectively.

#### Acceptance Criteria

1. THE System SHALL provide a dedicated RWO monitoring page accessible from the main navigation
2. WHEN viewing the RWO page, THE System SHALL display a Kanban board with columns for each maintenance status (Pending, Assigned, In Progress, Completed, Cancelled)
3. THE System SHALL display each RWO as a card showing space number, property name, category, priority, and description
4. WHEN a RWO has emergency or high priority, THE System SHALL display a prominent priority indicator on the card
5. THE System SHALL allow staff to create new RWO requests via an "Add RWO" button
6. WHEN creating a new RWO, THE System SHALL require selection of space, category, priority, and description
7. THE System SHALL allow drag-and-drop to move RWO cards between status columns
8. WHEN a RWO card is moved to a different column, THE System SHALL update the maintenance request status
9. THE System SHALL provide filter options by property, priority level, and category
10. WHEN clicking on a RWO card, THE System SHALL display a detail dialog with full information and history
11. THE System SHALL display the assigned staff member on each RWO card if assigned
12. THE System SHALL show the creation date and days elapsed on each RWO card
13. THE System SHALL provide a summary showing counts per status and priority breakdown

### Requirement 3: Advanced Filters for Spaces by Rate

**User Story:** As a property manager, I want to filter and sort spaces by rental rate, so that I can analyze revenue distribution and identify high-value spaces.

#### Acceptance Criteria

1. WHEN filtering spaces, THE System SHALL provide a "Sort by Rate" option with ascending and descending choices
2. WHEN filtering spaces, THE System SHALL provide a "Rate Range" filter with minimum and maximum rent inputs
3. THE System SHALL display the rate range (min-max) in the filter summary when active
4. WHEN clearing filters, THE System SHALL reset rate filters to default (no filter)
5. THE System SHALL highlight the highest-rate space when sorting by rate descending

### Requirement 4: Advanced Filters for Tenants by Tenure

**User Story:** As a property manager, I want to filter and sort tenants by lease duration, so that I can identify long-term tenants and analyze tenant retention.

#### Acceptance Criteria

1. WHEN filtering tenants, THE System SHALL provide a "Sort by Tenure" option to sort by lease duration
2. WHEN filtering tenants, THE System SHALL calculate tenure from the earliest active lease start date
3. THE System SHALL display the calculated tenure (years, months) for each tenant in the list
4. WHEN filtering tenants, THE System SHALL provide tenure range options (e.g., "Less than 1 year", "1-3 years", "3-5 years", "5+ years")
5. THE System SHALL show the longest-tenured tenant indicator when sorting by tenure descending

### Requirement 5: Filter Persistence and URL State

**User Story:** As a property manager, I want my filter selections to persist in the URL, so that I can share filtered views with colleagues and bookmark specific views.

#### Acceptance Criteria

1. WHEN applying any filter on utilities, RWO, spaces, or tenants pages, THE System SHALL update the URL query parameters
2. WHEN loading a page with filter query parameters, THE System SHALL apply those filters automatically
3. WHEN clearing all filters, THE System SHALL remove filter query parameters from the URL
4. THE System SHALL support combining multiple filters simultaneously
