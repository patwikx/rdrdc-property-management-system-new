# Property CRUD Operations

This document outlines the complete CRUD (Create, Read, Update, Delete) operations implemented for the Property management system.

## Files Created/Modified

### 1. Validation Schema
- `lib/validations/property-schema.ts` - Zod validation schemas for property data

### 2. Server Actions
- `lib/actions/property-actions.ts` - Complete server-side CRUD operations

### 3. Pages
- `app/(dashboard)/properties/page.tsx` - Properties listing page with search and filtering
- `app/(dashboard)/properties/create/page.tsx` - Create new property page
- `app/(dashboard)/properties/[id]/page.tsx` - Property details and edit page

## Features Implemented

### ✅ CREATE Operation
- **Route**: `/properties/create`
- **Features**:
  - Form validation using Zod schema
  - Property code uniqueness check
  - All property fields supported (code, name, address, type, area, units)
  - Loading states and error handling
  - Success/error notifications using Sonner toast
  - Redirect to properties list after successful creation

### ✅ READ Operations
- **Route**: `/properties` (List all properties)
- **Features**:
  - Paginated property listing (12 per page)
  - Search functionality (by code, name, or address)
  - Filter by property type (Commercial, Residential, Mixed)
  - Property cards showing key information
  - Occupancy rate visualization
  - Real-time search with URL state management
  - Loading skeletons for better UX

- **Route**: `/properties/[id]` (View single property)
- **Features**:
  - Complete property details display
  - Property statistics (units, occupancy, documents, titles)
  - Comprehensive units list with area, rent, and title information
  - Property titles with tax information and encumbrance status
  - Documents list with download and view options
  - Utilities management with provider and account details
  - Title movement tracking and history
  - Property information sidebar with summary statistics
  - Creation and update timestamps
  - Created by user information

### ✅ UPDATE Operation
- **Route**: `/properties/[id]` (Edit mode)
- **Features**:
  - In-place editing on the same page
  - Form pre-populated with existing data
  - Property code uniqueness validation (excluding current property)
  - Real-time form validation
  - Loading states during save
  - Success/error notifications
  - Automatic data refresh after update

### ✅ DELETE Operation
- **Route**: `/properties/[id]` (Delete button)
- **Features**:
  - Confirmation dialog before deletion
  - Business logic validation (prevents deletion if property has units or documents)
  - Loading state during deletion
  - Redirect to properties list after successful deletion
  - Error handling for failed deletions

## Technical Implementation

### Server Actions
All CRUD operations are implemented as server actions with proper authentication:

```typescript
// Create
createProperty(data: PropertyFormData)

// Read
getProperties(page, limit, search?, propertyType?)
getPropertyById(id: string)
getPropertyByCode(propertyCode: string)

// Update
updateProperty(data: PropertyUpdateData)

// Delete
deleteProperty(id: string)
```

### Validation
- **Zod schemas** for type-safe validation
- **Client-side validation** with react-hook-form
- **Server-side validation** in all actions
- **Business logic validation** (e.g., unique property codes)

### UI/UX Features
- **Responsive design** works on all screen sizes
- **Loading states** for all async operations
- **Error handling** with user-friendly messages
- **Search and filtering** with URL state persistence
- **Pagination** for large datasets
- **Toast notifications** for user feedback
- **Form validation** with inline error messages

### Security
- **Authentication required** for all operations
- **Server-side validation** on all inputs
- **SQL injection protection** via Prisma
- **Type safety** throughout the application

## Property Model Relationships

The Property model has the following relationships in the Prisma schema:

```prisma
model Property {
  // Relations
  createdBy      User                    @relation("CreatedBy")
  units          Unit[]                  // Property units with area, rent, status
  documents      Document[]              // Property documents and files
  utilities      PropertyUtility[]       // Utility connections (water, electricity)
  titleMovements PropertyTitleMovement[] // Title tracking and movement history
  titles         PropertyTitles[]        // Property titles with tax information
}
```

### Related Data Displayed:

1. **Units**: Complete unit information including area, rent, status, and linked property titles
2. **Property Titles**: Registered titles with lot information, ownership, encumbrance status, and associated property taxes
3. **Documents**: All property-related documents with type classification and upload information
4. **Utilities**: Utility connections with provider details, account numbers, and active status
5. **Title Movements**: Complete tracking history of title movements with status, location, and purpose
6. **Property Taxes**: Tax information linked to property titles with payment status and due dates

## Usage Examples

### Creating a Property
1. Navigate to `/properties`
2. Click "Create Property" button
3. Fill in the form with property details
4. Click "Create Property" to save

### Searching Properties
1. Navigate to `/properties`
2. Use the search box to search by code, name, or address
3. Use the filter dropdown to filter by property type
4. Results update in real-time

### Editing a Property
1. Navigate to `/properties/[id]`
2. Click the "Edit" button
3. Modify the fields as needed
4. Click "Save Changes" to update

### Deleting a Property
1. Navigate to `/properties/[id]`
2. Click the "Delete" button
3. Confirm the deletion in the dialog
4. Property will be deleted if no dependencies exist

## Error Handling

The system includes comprehensive error handling:

- **Validation errors**: Displayed inline on form fields
- **Business logic errors**: Shown as toast notifications
- **Network errors**: Handled gracefully with user feedback
- **Not found errors**: Redirect to appropriate pages
- **Permission errors**: Authentication checks on all operations

## Performance Considerations

- **Pagination**: Large datasets are paginated for better performance
- **Debounced search**: Search queries are debounced to reduce API calls
- **Optimistic updates**: UI updates immediately with rollback on errors
- **Efficient queries**: Prisma queries are optimized with proper includes
- **Loading states**: Users get immediate feedback on all actions

## Future Enhancements

Potential improvements that could be added:

1. **Bulk operations**: Select multiple properties for bulk actions
2. **Advanced filtering**: More filter options (date ranges, area ranges, etc.)
3. **Export functionality**: Export property data to CSV/Excel
4. **Property images**: Upload and manage property photos
5. **Property comparison**: Side-by-side property comparison
6. **Audit trail**: Track all changes made to properties
7. **Property templates**: Create properties from templates
8. **Map integration**: Show properties on a map view