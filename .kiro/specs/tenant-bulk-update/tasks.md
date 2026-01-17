# Implementation Plan: Tenant Bulk Update

## Overview

This implementation plan breaks down the tenant bulk update feature into discrete coding tasks. The feature will be built incrementally, starting with the selection UI, then CSV generation, validation, preview, and finally the bulk update execution with audit logging.

## Tasks

- [x] 1. Set up selection state management
  - Create a React hook for managing tenant selection state
  - Implement toggleTenant, toggleSelectAll, clearSelection, getSelectedCount, and getSelectedIds methods
  - Add state for tracking selected tenant IDs and selectAll flag
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 1.1 Write property tests for selection state management
  - **Property 1: Selection Toggle Correctness**
  - **Property 2: Select All Completeness**
  - **Property 3: Selection Count Accuracy**
  - **Property 4: Selection Persistence Across Filters**
  - **Validates: Requirements 1.2, 1.3, 1.4, 1.5**

- [x] 2. Update tenant list UI with selection controls
  - Add checkboxes to each tenant card in the grid
  - Add "select all" checkbox to the toolbar
  - Display selected count in the toolbar
  - Wire up selection state to UI controls
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 2.1 Write unit tests for selection UI
  - Test checkbox rendering for each tenant
  - Test select all checkbox rendering
  - Test selected count display
  - _Requirements: 1.1, 1.4_

- [x] 3. Add bulk action buttons to tenant list
  - Add "Download Template" button (disabled when no selection)
  - Add "Import Updates" button
  - Style buttons to match existing UI design
  - _Requirements: 2.1, 4.1_

- [ ]* 3.1 Write property test for download button enablement
  - **Property 5: Download Button Enablement**
  - **Validates: Requirements 2.1**

- [x] 4. Implement CSV generation service
  - Create server action for generating tenant CSV
  - Accept array of tenant IDs as input
  - Query database for selected tenants
  - Map tenant data to CSV format with all required columns
  - Handle null values and special characters
  - Return CSV string
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.7, 3.1, 3.4, 3.5_

- [ ]* 4.1 Write property tests for CSV generation
  - **Property 6: CSV Contains Selected Tenants**
  - **Property 7: CSV Structure Completeness**
  - **Property 8: CSV Data Round-Trip**
  - **Property 10: Boolean Serialization**
  - **Property 11: Status Enum Serialization**
  - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.7, 3.1, 3.4, 3.5**

- [x] 5. Implement CSV download functionality
  - Create API route for CSV download
  - Generate CSV with proper filename format (tenant-bulk-update-YYYY-MM-DD.csv)
  - Set appropriate headers for file download
  - Wire up "Download Template" button to API route
  - _Requirements: 2.6_

- [ ]* 5.1 Write property test for CSV filename format
  - **Property 9: CSV Filename Format**
  - **Validates: Requirements 2.6**

- [ ] 6. Checkpoint - Ensure CSV generation works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement CSV validation service
  - Create server action for validating uploaded CSV
  - Parse CSV file and validate structure
  - Check for required columns
  - Validate data types for each field
  - Validate enum values (status)
  - Validate email format
  - Check for non-existent tenant IDs
  - Check for empty required fields
  - Enforce 1000 row limit
  - Return validation result with errors
  - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 7.1 Write property tests for CSV validation
  - **Property 12: Validation Execution**
  - **Property 13: Missing Column Detection**
  - **Property 14: Invalid Data Type Detection**
  - **Property 15: Invalid Enum Detection**
  - **Property 16: Non-Existent ID Detection**
  - **Property 27: Invalid CSV Format Error**
  - **Property 28: Row Limit Validation**
  - **Property 29: Required Field Validation**
  - **Property 30: Email Format Validation**
  - **Validates: Requirements 4.3, 4.4, 4.5, 4.6, 4.7, 7.1, 7.3, 7.4, 7.5**

- [ ]* 7.2 Write unit tests for CSV validation edge cases
  - Test empty CSV file
  - Test CSV with special characters
  - Test CSV with various invalid formats
  - _Requirements: 7.2_

- [x] 8. Implement change preview generator
  - Create server action for generating change preview
  - Compare CSV data with current database values
  - Identify changed fields for each tenant
  - Group changes by tenant
  - Calculate total tenant count
  - Return preview data structure
  - _Requirements: 4.8, 5.1, 5.2, 5.3, 5.4_

- [ ]* 8.1 Write property tests for change preview
  - **Property 17: Preview Generation After Validation**
  - **Property 18: Preview Completeness**
  - **Validates: Requirements 4.8, 5.1, 5.2, 5.3, 5.4**

- [x] 9. Create CSV upload and preview UI
  - Create file upload dialog component
  - Add file input for CSV upload
  - Show validation errors if validation fails
  - Display change preview dialog after successful validation
  - Show tenant name, field changes (old → new) grouped by tenant
  - Display total tenant count
  - Add "Confirm" and "Cancel" buttons
  - Preserve uploaded CSV data on error for retry
  - _Requirements: 4.2, 5.1, 5.2, 5.3, 5.4, 5.5, 7.7_

- [ ]* 9.1 Write unit tests for preview UI
  - Test preview dialog rendering
  - Test change grouping display
  - Test confirm and cancel buttons
  - _Requirements: 5.5_

- [ ]* 9.2 Write property tests for preview behavior
  - **Property 19: Cancel Preserves Database State**
  - **Property 31: Error Data Preservation**
  - **Validates: Requirements 5.6, 7.7**

- [ ] 10. Checkpoint - Ensure validation and preview work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement bulk update service
  - Create server action for applying bulk updates
  - Begin database transaction
  - For each tenant in the update list:
    - Validate tenant exists
    - Update only changed fields
    - Update updatedAt timestamp
  - Commit transaction on success
  - Rollback transaction on any failure
  - Return update result with success status and count
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 11.1 Write property tests for bulk update
  - **Property 20: Confirm Applies Updates**
  - **Property 21: Selective Field Updates**
  - **Property 22: Timestamp Update**
  - **Property 23: Transaction Rollback on Failure**
  - **Property 24: Success Message Accuracy**
  - **Validates: Requirements 5.7, 6.2, 6.3, 6.4, 6.5**

- [x] 12. Implement audit logging for bulk updates
  - Create audit log entries for each updated tenant
  - Record user ID, timestamp, action type "BULK_UPDATE"
  - Record old and new values for each changed field
  - Store audit logs in database within the same transaction
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 12.1 Write property tests for audit logging
  - **Property 32: Audit Log Completeness**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [x] 13. Wire up bulk update execution to UI
  - Connect "Confirm" button to bulk update service
  - Show loading state during update
  - Display success message with updated count
  - Display error message on failure
  - Refresh tenant list after successful update
  - Clear selection after successful update
  - _Requirements: 6.5, 6.6, 6.7, 7.6_

- [ ]* 13.1 Write property tests for post-update UI behavior
  - **Property 25: UI Refresh After Update**
  - **Property 26: Selection Cleanup**
  - **Validates: Requirements 6.6, 6.7**

- [ ]* 13.2 Write unit tests for error handling
  - Test database error message display
  - Test error recovery flow
  - _Requirements: 7.6_

- [ ] 14. Final checkpoint - End-to-end testing
  - Test complete flow: select → download → edit → upload → preview → confirm
  - Test error recovery: upload invalid CSV → fix → retry
  - Test transaction rollback: simulate failure → verify no changes
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 15. Write integration tests
  - Test complete bulk update flow
  - Test error recovery flow
  - Test transaction rollback flow

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows the existing Next.js App Router patterns
- Server actions are used for all backend operations
- The UI follows the existing design system (shadcn/ui components)
