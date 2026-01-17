# Design Document: Tenant Bulk Update

## Overview

The tenant bulk update feature enables administrators to efficiently update multiple tenant records by selecting tenants from the UI, downloading their data as a CSV template, editing the CSV offline, and uploading the modified file to apply changes in bulk. This feature streamlines tenant data management and reduces the time required for mass updates.

## Architecture

The feature follows a client-server architecture with three main phases:

1. **Selection & Download Phase**: Client-side tenant selection and server-side CSV generation
2. **Modification Phase**: Offline CSV editing by the administrator
3. **Upload & Update Phase**: Client-side file upload, server-side validation, preview generation, and database updates

### Component Interaction Flow

```
User Interface (Tenant List)
    ↓ (select tenants)
Selection State Manager
    ↓ (request CSV)
CSV Generation Service
    ↓ (download CSV)
Administrator (offline editing)
    ↓ (upload CSV)
CSV Validation Service
    ↓ (validate & parse)
Change Preview Generator
    ↓ (confirm changes)
Bulk Update Service
    ↓ (apply updates)
Database Transaction Manager
    ↓ (commit/rollback)
Audit Log Service
```

## Components and Interfaces

### 1. Selection State Manager (Client)

**Purpose**: Manages the selection state of tenants in the UI

**State**:
```typescript
interface SelectionState {
  selectedTenantIds: Set<string>
  selectAll: boolean
}
```

**Methods**:
- `toggleTenant(tenantId: string): void` - Toggle selection for a single tenant
- `toggleSelectAll(): void` - Toggle selection for all visible tenants
- `clearSelection(): void` - Clear all selections
- `getSelectedCount(): number` - Get count of selected tenants
- `getSelectedIds(): string[]` - Get array of selected tenant IDs

### 2. CSV Generation Service (Server)

**Purpose**: Generates CSV files containing tenant data

**Interface**:
```typescript
interface CSVGenerationService {
  generateTenantCSV(tenantIds: string[]): Promise<string>
}
```

**Input**: Array of tenant IDs
**Output**: CSV string with headers and tenant data

**CSV Column Mapping**:
- All columns from Requirement 3.1
- Boolean fields converted to "true"/"false" strings
- Null values represented as empty strings
- Special characters escaped according to CSV RFC 4180

### 3. CSV Validation Service (Server)

**Purpose**: Validates uploaded CSV files and parses data

**Interface**:
```typescript
interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  parsedData: TenantUpdateData[]
}

interface ValidationError {
  row: number
  column: string
  message: string
  value: any
}

interface TenantUpdateData {
  id: string
  updates: Partial<TenantData>
}
```

**Validation Rules**:
- Required columns present
- Data types match schema
- Enum values are valid
- Email format validation (RFC 5322 simplified)
- Tenant IDs exist in database
- Row count ≤ 1000

### 4. Change Preview Generator (Server)

**Purpose**: Generates a preview of changes to be applied

**Interface**:
```typescript
interface ChangePreview {
  totalTenants: number
  changes: TenantChange[]
}

interface TenantChange {
  tenantId: string
  tenantName: string
  bpCode: string
  fieldChanges: FieldChange[]
}

interface FieldChange {
  fieldName: string
  oldValue: any
  newValue: any
}
```

**Logic**:
- Compare CSV data with current database values
- Only include fields that have changed
- Group changes by tenant
- Format values for display

### 5. Bulk Update Service (Server)

**Purpose**: Applies bulk updates to tenant records

**Interface**:
```typescript
interface BulkUpdateService {
  applyUpdates(updates: TenantUpdateData[], userId: string): Promise<BulkUpdateResult>
}

interface BulkUpdateResult {
  success: boolean
  updatedCount: number
  errors: UpdateError[]
}
```

**Transaction Logic**:
- Begin database transaction
- For each tenant:
  - Validate tenant exists
  - Apply updates
  - Update `updatedAt` timestamp
- Create audit log entries
- Commit transaction on success
- Rollback on any failure

### 6. Audit Log Service (Server)

**Purpose**: Records bulk update operations for audit trail

**Interface**:
```typescript
interface AuditLogService {
  logBulkUpdate(
    tenantId: string,
    userId: string,
    changes: Record<string, { old: any, new: any }>,
    metadata: Record<string, any>
  ): Promise<void>
}
```

## Data Models

### Tenant Update DTO

```typescript
interface TenantUpdateDTO {
  // Read-only identifiers
  id: string
  bpCode: string
  
  // Editable fields
  status?: TenantStatus
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  homeAddress?: string
  facebookName?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  company?: string
  businessName?: string
  natureOfBusiness?: string
  yearsInBusiness?: string
  positionInCompany?: string
  officeAddress?: string
  facebookPage?: string
  website?: string
  authorizedSignatory?: string
  isStore?: boolean
  isOffice?: boolean
  isFranchise?: boolean
  bankName1?: string
  bankAddress1?: string
  bankName2?: string
  bankAddress2?: string
  otherBusinessName?: string
  otherBusinessAddress?: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Selection Toggle Correctness
*For any* tenant and any initial selection state, toggling the selection should result in the opposite state (selected becomes unselected, unselected becomes selected).
**Validates: Requirements 1.2**

### Property 2: Select All Completeness
*For any* set of visible tenants, clicking "select all" should result in all visible tenants being in the selected state.
**Validates: Requirements 1.3**

### Property 3: Selection Count Accuracy
*For any* selection state, the displayed count should equal the number of tenants in the selected set.
**Validates: Requirements 1.4**

### Property 4: Selection Persistence Across Filters
*For any* selection state and any filter change, the selection state should remain unchanged after the filter is applied.
**Validates: Requirements 1.5**

### Property 5: Download Button Enablement
*For any* non-empty selection, the "Download Template" button should be enabled.
**Validates: Requirements 2.1**

### Property 6: CSV Contains Selected Tenants
*For any* set of selected tenant IDs, the generated CSV should contain exactly those tenants' data (no more, no less).
**Validates: Requirements 2.2**

### Property 7: CSV Structure Completeness
*For any* generated CSV, it should contain a header row with all required columns (id, bpCode, status, firstName, lastName, email, phone, homeAddress, facebookName, emergencyContactName, emergencyContactPhone, company, businessName, natureOfBusiness, yearsInBusiness, positionInCompany, officeAddress, facebookPage, website, authorizedSignatory, isStore, isOffice, isFranchise, bankName1, bankAddress1, bankName2, bankAddress2, otherBusinessName, otherBusinessAddress).
**Validates: Requirements 2.3, 2.4, 2.7, 3.1**

### Property 8: CSV Data Round-Trip
*For any* tenant in the database, the values in the generated CSV should match the tenant's current database values.
**Validates: Requirements 2.5**

### Property 9: CSV Filename Format
*For any* generated CSV, the filename should match the pattern "tenant-bulk-update-YYYY-MM-DD.csv" where YYYY-MM-DD is the current date.
**Validates: Requirements 2.6**

### Property 10: Boolean Serialization
*For any* tenant with boolean fields (isStore, isOffice, isFranchise), the CSV should represent these fields as the strings "true" or "false".
**Validates: Requirements 3.4**

### Property 11: Status Enum Serialization
*For any* tenant, the status field in the CSV should be one of the valid enum values: "ACTIVE", "INACTIVE", or "PENDING".
**Validates: Requirements 3.5**

### Property 12: Validation Execution
*For any* uploaded CSV file, validation should be performed before any updates are applied.
**Validates: Requirements 4.3**

### Property 13: Missing Column Detection
*For any* CSV missing one or more required columns, the validation should fail and return an error listing all missing columns.
**Validates: Requirements 4.4**

### Property 14: Invalid Data Type Detection
*For any* CSV containing invalid data types, the validation should fail and return errors identifying the specific rows and columns with invalid data.
**Validates: Requirements 4.5**

### Property 15: Invalid Enum Detection
*For any* CSV containing invalid enum values, the validation should fail and return errors identifying the invalid values.
**Validates: Requirements 4.6**

### Property 16: Non-Existent ID Detection
*For any* CSV containing tenant IDs that do not exist in the database, the validation should fail and return errors listing the invalid IDs.
**Validates: Requirements 4.7**

### Property 17: Preview Generation After Validation
*For any* valid CSV, after successful validation, a preview of changes should be generated.
**Validates: Requirements 4.8**

### Property 18: Preview Completeness
*For any* valid CSV with changes, the preview should contain all changes grouped by tenant, with each change showing tenant name, field name, old value, new value, and a count of total tenants to be updated.
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 19: Cancel Preserves Database State
*For any* preview state, clicking "Cancel" should not modify any tenant records in the database.
**Validates: Requirements 5.6**

### Property 20: Confirm Applies Updates
*For any* preview with changes, clicking "Confirm" should apply all the changes shown in the preview to the database.
**Validates: Requirements 5.7**

### Property 21: Selective Field Updates
*For any* bulk update operation, only fields that have changed values should be updated in the database (unchanged fields should remain unmodified).
**Validates: Requirements 6.2**

### Property 22: Timestamp Update
*For any* tenant modified by a bulk update, the updatedAt timestamp should be updated to reflect the modification time.
**Validates: Requirements 6.3**

### Property 23: Transaction Rollback on Failure
*For any* bulk update operation where at least one update fails, all changes should be rolled back and no tenant records should be modified.
**Validates: Requirements 6.4**

### Property 24: Success Message Accuracy
*For any* successful bulk update, the success message should display the correct count of updated tenants.
**Validates: Requirements 6.5**

### Property 25: UI Refresh After Update
*For any* completed bulk update, the tenant list should refresh to display the updated data.
**Validates: Requirements 6.6**

### Property 26: Selection Cleanup
*For any* completed bulk update, the selection state should be cleared (no tenants selected).
**Validates: Requirements 6.7**

### Property 27: Invalid CSV Format Error
*For any* file that is not in valid CSV format, the validation should fail with the error message "Invalid CSV file format".
**Validates: Requirements 7.1**

### Property 28: Row Limit Validation
*For any* CSV file with more than 1000 rows, the validation should fail with the error message "CSV file exceeds maximum of 1000 tenants".
**Validates: Requirements 7.3**

### Property 29: Required Field Validation
*For any* CSV with empty required fields, the validation should fail with errors identifying the tenant and field for each empty required field.
**Validates: Requirements 7.4**

### Property 30: Email Format Validation
*For any* CSV with invalid email formats, the validation should fail with errors identifying the tenant and invalid email.
**Validates: Requirements 7.5**

### Property 31: Error Data Preservation
*For any* validation or update error, the uploaded CSV data should be preserved to allow correction and retry.
**Validates: Requirements 7.7**

### Property 32: Audit Log Completeness
*For any* bulk update operation, an audit log entry should be created for each updated tenant, containing the user ID, timestamp, old and new values for each changed field, and action type "BULK_UPDATE".
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**



## Error Handling

### Validation Errors

**CSV Format Errors**:
- Invalid CSV structure → Return "Invalid CSV file format"
- Empty file → Return "CSV file contains no data"
- Exceeds 1000 rows → Return "CSV file exceeds maximum of 1000 tenants"

**Data Validation Errors**:
- Missing required columns → Return list of missing columns
- Invalid data types → Return row and column identifiers
- Invalid enum values → Return invalid values and valid options
- Non-existent tenant IDs → Return list of invalid IDs
- Empty required fields → Return tenant and field identifiers
- Invalid email format → Return tenant and invalid email

**Error Response Format**:
```typescript
interface ValidationErrorResponse {
  success: false
  errors: Array<{
    type: 'MISSING_COLUMN' | 'INVALID_TYPE' | 'INVALID_ENUM' | 'INVALID_ID' | 'REQUIRED_FIELD' | 'INVALID_EMAIL'
    message: string
    row?: number
    column?: string
    value?: any
  }>
}
```

### Update Errors

**Database Errors**:
- Connection failure → Rollback transaction, return "Failed to update tenants. Please try again."
- Constraint violation → Rollback transaction, return specific constraint error
- Timeout → Rollback transaction, return "Update operation timed out. Please try again."

**Transaction Guarantees**:
- All updates succeed or all fail (atomic)
- No partial updates
- Database state remains consistent

### Error Recovery

**Preserved State**:
- Uploaded CSV data retained in memory
- Selection state maintained
- User can correct errors and retry without re-uploading

**User Feedback**:
- Clear error messages with actionable information
- Specific row/column references for data errors
- Suggestions for correction when applicable

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

**CSV Generation**:
- Generate CSV for single tenant
- Generate CSV for multiple tenants
- Handle tenants with null/empty fields
- Handle special characters in data
- Verify boolean serialization
- Verify enum serialization

**CSV Validation**:
- Validate well-formed CSV
- Detect missing columns
- Detect invalid data types
- Detect invalid enum values
- Detect non-existent IDs
- Detect empty required fields
- Detect invalid email formats
- Enforce 1000 row limit

**Change Preview**:
- Generate preview for single change
- Generate preview for multiple changes
- Group changes by tenant correctly
- Calculate tenant count correctly

**Bulk Update**:
- Update single tenant
- Update multiple tenants
- Handle update failures
- Verify transaction rollback
- Verify timestamp updates

**Audit Logging**:
- Create audit log for single update
- Create audit logs for bulk update
- Verify audit log content

### Property-Based Tests

Property-based tests will verify universal properties across randomized inputs. Each test should run a minimum of 100 iterations.

**Selection Management** (Properties 1-4):
- Test selection toggle with random tenants and states
- Test select all with random tenant sets
- Test count accuracy with random selections
- Test selection persistence across random filter changes

**CSV Generation** (Properties 6-11):
- Test CSV contains exactly selected tenants with random selections
- Test CSV structure with random tenant data
- Test round-trip property: generate CSV → parse → compare with original
- Test boolean serialization with random boolean values
- Test enum serialization with random status values

**CSV Validation** (Properties 12-17):
- Test validation with random valid CSVs
- Test missing column detection with random column combinations
- Test invalid data type detection with random invalid data
- Test invalid enum detection with random invalid values
- Test non-existent ID detection with random IDs

**Preview Generation** (Properties 18-20):
- Test preview completeness with random changes
- Test cancel preserves state with random previews
- Test confirm applies changes with random updates

**Bulk Updates** (Properties 21-26):
- Test selective field updates with random field changes
- Test timestamp updates with random tenants
- Test rollback with simulated failures
- Test success message with random update counts
- Test UI refresh with random updates
- Test selection cleanup with random selections

**Error Handling** (Properties 27-31):
- Test invalid CSV format with random malformed data
- Test row limit with random row counts > 1000
- Test required field validation with random empty fields
- Test email validation with random invalid emails
- Test error data preservation with random errors

**Audit Logging** (Property 32):
- Test audit log completeness with random bulk updates
- Verify all required fields present in audit logs

### Integration Tests

Integration tests will verify end-to-end workflows:

**Complete Bulk Update Flow**:
1. Select tenants
2. Download CSV
3. Modify CSV
4. Upload CSV
5. Preview changes
6. Confirm updates
7. Verify database changes
8. Verify audit logs

**Error Recovery Flow**:
1. Upload invalid CSV
2. Receive error
3. Correct CSV
4. Re-upload
5. Verify success

**Transaction Rollback Flow**:
1. Upload CSV with one invalid update
2. Verify all updates rolled back
3. Verify database unchanged

### Test Configuration

**Property-Based Testing Library**: fast-check (for TypeScript/JavaScript)

**Test Tagging Format**:
```typescript
// Feature: tenant-bulk-update, Property 1: Selection Toggle Correctness
test('selection toggle should flip state for any tenant', () => {
  // property test implementation
})
```

**Minimum Iterations**: 100 per property test

### Testing Priorities

1. **Critical**: CSV generation round-trip, validation, transaction rollback
2. **High**: Selection management, preview generation, audit logging
3. **Medium**: Error messages, UI state management
4. **Low**: Filename format, button enablement
