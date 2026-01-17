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

