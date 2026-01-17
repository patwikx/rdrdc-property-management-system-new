"use server"

import { prisma } from "@/lib/prisma"

/**
 * Escapes a CSV field value according to RFC 4180
 * - Wraps in quotes if contains comma, quote, or newline
 * - Doubles any quotes inside the value
 */
function escapeCSVField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return ""
  }

  const stringValue = String(value)
  
  // Check if field needs quoting (contains comma, quote, or newline)
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    // Double any quotes and wrap in quotes
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  
  return stringValue
}

/**
 * Converts a boolean value to "true" or "false" string
 */
function serializeBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return ""
  }
  return value ? "true" : "false"
}

/**
 * Generates a CSV file containing tenant data for the specified tenant IDs
 * 
 * @param tenantIds - Array of tenant IDs to include in the CSV
 * @returns CSV string with headers and tenant data
 */
export async function generateTenantCSV(tenantIds: string[]): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    // Validate input
    if (!tenantIds || tenantIds.length === 0) {
      return { success: false, error: "No tenants selected" }
    }

    // Query database for selected tenants
    const tenants = await prisma.tenant.findMany({
      where: {
        id: {
          in: tenantIds
        }
      },
      orderBy: {
        bpCode: 'asc'
      }
    })

    // Check if all requested tenants were found
    if (tenants.length !== tenantIds.length) {
      return { success: false, error: "Some selected tenants were not found" }
    }

    // Define CSV headers (all required columns from Requirement 3.1)
    const headers = [
      'id',
      'bpCode',
      'status',
      'firstName',
      'lastName',
      'email',
      'phone',
      'homeAddress',
      'facebookName',
      'emergencyContactName',
      'emergencyContactPhone',
      'company',
      'businessName',
      'natureOfBusiness',
      'yearsInBusiness',
      'positionInCompany',
      'officeAddress',
      'facebookPage',
      'website',
      'authorizedSignatory',
      'isStore',
      'isOffice',
      'isFranchise',
      'bankName1',
      'bankAddress1',
      'bankName2',
      'bankAddress2',
      'otherBusinessName',
      'otherBusinessAddress'
    ]

    // Build CSV content
    const csvLines: string[] = []
    
    // Add header row
    csvLines.push(headers.join(','))

    // Add data rows
    for (const tenant of tenants) {
      const row = [
        escapeCSVField(tenant.id),
        escapeCSVField(tenant.bpCode),
        escapeCSVField(tenant.status),
        escapeCSVField(tenant.firstName),
        escapeCSVField(tenant.lastName),
        escapeCSVField(tenant.email),
        escapeCSVField(tenant.phone),
        escapeCSVField(tenant.homeAddress),
        escapeCSVField(tenant.facebookName),
        escapeCSVField(tenant.emergencyContactName),
        escapeCSVField(tenant.emergencyContactPhone),
        escapeCSVField(tenant.company),
        escapeCSVField(tenant.businessName),
        escapeCSVField(tenant.natureOfBusiness),
        escapeCSVField(tenant.yearsInBusiness),
        escapeCSVField(tenant.positionInCompany),
        escapeCSVField(tenant.officeAddress),
        escapeCSVField(tenant.facebookPage),
        escapeCSVField(tenant.website),
        escapeCSVField(tenant.authorizedSignatory),
        serializeBoolean(tenant.isStore),
        serializeBoolean(tenant.isOffice),
        serializeBoolean(tenant.isFranchise),
        escapeCSVField(tenant.bankName1),
        escapeCSVField(tenant.bankAddress1),
        escapeCSVField(tenant.bankName2),
        escapeCSVField(tenant.bankAddress2),
        escapeCSVField(tenant.otherBusinessName),
        escapeCSVField(tenant.otherBusinessAddress)
      ]
      
      csvLines.push(row.join(','))
    }

    // Join all lines with newline
    const csvContent = csvLines.join('\n')

    return { success: true, data: csvContent }
  } catch (error) {
    console.error("Error generating tenant CSV:", error)
    return { success: false, error: "Failed to generate CSV" }
  }
}

/**
 * Validation error types
 */
type ValidationErrorType = 
  | 'MISSING_COLUMN' 
  | 'INVALID_TYPE' 
  | 'INVALID_ENUM' 
  | 'INVALID_ID' 
  | 'REQUIRED_FIELD' 
  | 'INVALID_EMAIL'
  | 'INVALID_FORMAT'
  | 'ROW_LIMIT_EXCEEDED'
  | 'EMPTY_FILE'

/**
 * Validation error structure
 */
interface ValidationError {
  type: ValidationErrorType
  message: string
  row?: number
  column?: string
  value?: string | number | boolean
}

/**
 * Tenant update data structure
 */
interface TenantUpdateData {
  id: string
  updates: Partial<{
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
    firstName: string
    lastName: string
    email: string
    phone: string
    homeAddress: string
    facebookName: string
    emergencyContactName: string
    emergencyContactPhone: string
    company: string
    businessName: string
    natureOfBusiness: string
    yearsInBusiness: string
    positionInCompany: string
    officeAddress: string
    facebookPage: string
    website: string
    authorizedSignatory: string
    isStore: boolean
    isOffice: boolean
    isFranchise: boolean
    bankName1: string
    bankAddress1: string
    bankName2: string
    bankAddress2: string
    otherBusinessName: string
    otherBusinessAddress: string
  }>
}

/**
 * Validation result structure
 */
interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  parsedData: TenantUpdateData[]
}

/**
 * Required columns for CSV validation
 */
const REQUIRED_COLUMNS = [
  'id',
  'bpCode',
  'status',
  'firstName',
  'lastName',
  'email',
  'phone',
  'homeAddress',
  'facebookName',
  'emergencyContactName',
  'emergencyContactPhone',
  'company',
  'businessName',
  'natureOfBusiness',
  'yearsInBusiness',
  'positionInCompany',
  'officeAddress',
  'facebookPage',
  'website',
  'authorizedSignatory',
  'isStore',
  'isOffice',
  'isFranchise',
  'bankName1',
  'bankAddress1',
  'bankName2',
  'bankAddress2',
  'otherBusinessName',
  'otherBusinessAddress'
]

/**
 * Valid tenant status enum values
 */
const VALID_TENANT_STATUSES = ['ACTIVE', 'INACTIVE', 'PENDING']

/**
 * Required fields that cannot be empty
 */
const REQUIRED_FIELDS = ['email', 'phone', 'company', 'businessName']

/**
 * Parses a CSV string into rows and columns
 * Handles quoted fields and escaped quotes according to RFC 4180
 */
function parseCSV(csvContent: string): string[][] {
  const rows: string[][] = []
  const lines = csvContent.split(/\r?\n/)
  
  for (const line of lines) {
    if (!line.trim()) continue
    
    const row: string[] = []
    let currentField = ''
    let insideQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]
      
      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"'
          i++ // Skip next quote
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes
        }
      } else if (char === ',' && !insideQuotes) {
        // End of field
        row.push(currentField)
        currentField = ''
      } else {
        currentField += char
      }
    }
    
    // Add last field
    row.push(currentField)
    rows.push(row)
  }
  
  return rows
}

/**
 * Validates email format using a simplified RFC 5322 pattern
 */
function isValidEmail(email: string): boolean {
  if (!email || email.trim() === '') return false
  
  // Simplified email validation pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailPattern.test(email.trim())
}

/**
 * Parses a boolean string value
 */
function parseBoolean(value: string): boolean | null {
  const trimmed = value.trim().toLowerCase()
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === '') return null
  return null
}

/**
 * Validates an uploaded CSV file for tenant bulk updates
 * 
 * @param csvContent - The CSV file content as a string
 * @returns Validation result with errors and parsed data
 */
export async function validateTenantCSV(csvContent: string): Promise<ValidationResult> {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  const parsedData: TenantUpdateData[] = []

  try {
    // Check if CSV is empty
    if (!csvContent || csvContent.trim() === '') {
      errors.push({
        type: 'EMPTY_FILE',
        message: 'CSV file contains no data'
      })
      return { isValid: false, errors, warnings, parsedData }
    }

    // Parse CSV content
    let rows: string[][]
    try {
      rows = parseCSV(csvContent)
    } catch {
      errors.push({
        type: 'INVALID_FORMAT',
        message: 'Invalid CSV file format'
      })
      return { isValid: false, errors, warnings, parsedData }
    }

    // Check if CSV has at least header row
    if (rows.length === 0) {
      errors.push({
        type: 'EMPTY_FILE',
        message: 'CSV file contains no data'
      })
      return { isValid: false, errors, warnings, parsedData }
    }

    // Check row limit (1000 rows + 1 header = 1001 max)
    if (rows.length > 1001) {
      errors.push({
        type: 'ROW_LIMIT_EXCEEDED',
        message: 'CSV file exceeds maximum of 1000 tenants'
      })
      return { isValid: false, errors, warnings, parsedData }
    }

    // Extract headers
    const headers = rows[0].map(h => h.trim())
    
    // Check for required columns
    const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col))
    if (missingColumns.length > 0) {
      errors.push({
        type: 'MISSING_COLUMN',
        message: `Missing required columns: ${missingColumns.join(', ')}`
      })
      return { isValid: false, errors, warnings, parsedData }
    }

    // Create column index map
    const columnIndexMap: Record<string, number> = {}
    headers.forEach((header, index) => {
      columnIndexMap[header] = index
    })

    // Collect all tenant IDs to check existence
    const tenantIds: string[] = []
    const dataRows = rows.slice(1) // Skip header row

    // Validate each data row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const rowNumber = i + 2 // +2 because: +1 for header, +1 for 1-based indexing

      // Skip empty rows
      if (row.every(cell => !cell || cell.trim() === '')) {
        continue
      }

      // Get tenant ID
      const tenantId = row[columnIndexMap['id']]?.trim()
      if (!tenantId) {
        errors.push({
          type: 'REQUIRED_FIELD',
          message: 'Tenant ID is required',
          row: rowNumber,
          column: 'id'
        })
        continue
      }

      tenantIds.push(tenantId)

      // Validate status enum
      const status = row[columnIndexMap['status']]?.trim()
      if (status && !VALID_TENANT_STATUSES.includes(status)) {
        errors.push({
          type: 'INVALID_ENUM',
          message: `Invalid status value. Must be one of: ${VALID_TENANT_STATUSES.join(', ')}`,
          row: rowNumber,
          column: 'status',
          value: status
        })
      }

      // Validate required fields
      for (const field of REQUIRED_FIELDS) {
        const value = row[columnIndexMap[field]]?.trim()
        if (!value || value === '') {
          errors.push({
            type: 'REQUIRED_FIELD',
            message: `${field} is required`,
            row: rowNumber,
            column: field
          })
        }
      }

      // Validate email format
      const email = row[columnIndexMap['email']]?.trim()
      if (email && !isValidEmail(email)) {
        errors.push({
          type: 'INVALID_EMAIL',
          message: 'Invalid email format',
          row: rowNumber,
          column: 'email',
          value: email
        })
      }

      // Validate boolean fields
      const booleanFields = ['isStore', 'isOffice', 'isFranchise']
      for (const field of booleanFields) {
        const value = row[columnIndexMap[field]]?.trim()
        if (value && value !== '') {
          const parsed = parseBoolean(value)
          if (parsed === null && value.toLowerCase() !== 'true' && value.toLowerCase() !== 'false') {
            errors.push({
              type: 'INVALID_TYPE',
              message: `${field} must be "true" or "false"`,
              row: rowNumber,
              column: field,
              value: value
            })
          }
        }
      }

      // Build update data for this tenant
      const updates: TenantUpdateData['updates'] = {}
      
      // Only include fields that are present and not empty (except booleans which can be false)
      if (status) updates.status = status as 'ACTIVE' | 'INACTIVE' | 'PENDING'
      
      const firstName = row[columnIndexMap['firstName']]?.trim()
      if (firstName !== undefined) updates.firstName = firstName
      
      const lastName = row[columnIndexMap['lastName']]?.trim()
      if (lastName !== undefined) updates.lastName = lastName
      
      if (email) updates.email = email
      
      const phone = row[columnIndexMap['phone']]?.trim()
      if (phone) updates.phone = phone
      
      const homeAddress = row[columnIndexMap['homeAddress']]?.trim()
      if (homeAddress !== undefined) updates.homeAddress = homeAddress
      
      const facebookName = row[columnIndexMap['facebookName']]?.trim()
      if (facebookName !== undefined) updates.facebookName = facebookName
      
      const emergencyContactName = row[columnIndexMap['emergencyContactName']]?.trim()
      if (emergencyContactName !== undefined) updates.emergencyContactName = emergencyContactName
      
      const emergencyContactPhone = row[columnIndexMap['emergencyContactPhone']]?.trim()
      if (emergencyContactPhone !== undefined) updates.emergencyContactPhone = emergencyContactPhone
      
      const company = row[columnIndexMap['company']]?.trim()
      if (company) updates.company = company
      
      const businessName = row[columnIndexMap['businessName']]?.trim()
      if (businessName) updates.businessName = businessName
      
      const natureOfBusiness = row[columnIndexMap['natureOfBusiness']]?.trim()
      if (natureOfBusiness !== undefined) updates.natureOfBusiness = natureOfBusiness
      
      const yearsInBusiness = row[columnIndexMap['yearsInBusiness']]?.trim()
      if (yearsInBusiness !== undefined) updates.yearsInBusiness = yearsInBusiness
      
      const positionInCompany = row[columnIndexMap['positionInCompany']]?.trim()
      if (positionInCompany !== undefined) updates.positionInCompany = positionInCompany
      
      const officeAddress = row[columnIndexMap['officeAddress']]?.trim()
      if (officeAddress !== undefined) updates.officeAddress = officeAddress
      
      const facebookPage = row[columnIndexMap['facebookPage']]?.trim()
      if (facebookPage !== undefined) updates.facebookPage = facebookPage
      
      const website = row[columnIndexMap['website']]?.trim()
      if (website !== undefined) updates.website = website
      
      const authorizedSignatory = row[columnIndexMap['authorizedSignatory']]?.trim()
      if (authorizedSignatory !== undefined) updates.authorizedSignatory = authorizedSignatory
      
      const isStore = parseBoolean(row[columnIndexMap['isStore']]?.trim())
      if (isStore !== null) updates.isStore = isStore
      
      const isOffice = parseBoolean(row[columnIndexMap['isOffice']]?.trim())
      if (isOffice !== null) updates.isOffice = isOffice
      
      const isFranchise = parseBoolean(row[columnIndexMap['isFranchise']]?.trim())
      if (isFranchise !== null) updates.isFranchise = isFranchise
      
      const bankName1 = row[columnIndexMap['bankName1']]?.trim()
      if (bankName1 !== undefined) updates.bankName1 = bankName1
      
      const bankAddress1 = row[columnIndexMap['bankAddress1']]?.trim()
      if (bankAddress1 !== undefined) updates.bankAddress1 = bankAddress1
      
      const bankName2 = row[columnIndexMap['bankName2']]?.trim()
      if (bankName2 !== undefined) updates.bankName2 = bankName2
      
      const bankAddress2 = row[columnIndexMap['bankAddress2']]?.trim()
      if (bankAddress2 !== undefined) updates.bankAddress2 = bankAddress2
      
      const otherBusinessName = row[columnIndexMap['otherBusinessName']]?.trim()
      if (otherBusinessName !== undefined) updates.otherBusinessName = otherBusinessName
      
      const otherBusinessAddress = row[columnIndexMap['otherBusinessAddress']]?.trim()
      if (otherBusinessAddress !== undefined) updates.otherBusinessAddress = otherBusinessAddress

      parsedData.push({
        id: tenantId,
        updates
      })
    }

    // Check if tenant IDs exist in database
    if (tenantIds.length > 0) {
      const existingTenants = await prisma.tenant.findMany({
        where: {
          id: {
            in: tenantIds
          }
        },
        select: {
          id: true
        }
      })

      const existingIds = new Set(existingTenants.map(t => t.id))
      const nonExistentIds = tenantIds.filter(id => !existingIds.has(id))

      if (nonExistentIds.length > 0) {
        errors.push({
          type: 'INVALID_ID',
          message: `Tenant IDs not found: ${nonExistentIds.join(', ')}`
        })
      }
    }

    // Return validation result
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      parsedData
    }

  } catch (error) {
    console.error("Error validating tenant CSV:", error)
    errors.push({
      type: 'INVALID_FORMAT',
      message: 'Invalid CSV file format'
    })
    return { isValid: false, errors, warnings, parsedData }
  }
}

/**
 * Field change structure for preview
 */
interface FieldChange {
  fieldName: string
  oldValue: string
  newValue: string
}

/**
 * Tenant change structure for preview
 */
interface TenantChange {
  tenantId: string
  tenantName: string
  bpCode: string
  fieldChanges: FieldChange[]
}

/**
 * Change preview structure
 */
interface ChangePreview {
  totalTenants: number
  changes: TenantChange[]
}

/**
 * Formats a value for display in the preview
 */
function formatValueForDisplay(value: string | number | boolean | Date | null | undefined): string {
  if (value === null || value === undefined) {
    return '(empty)'
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (value === '') {
    return '(empty)'
  }
  return String(value)
}

/**
 * Generates a preview of changes to be applied from validated CSV data
 * 
 * @param parsedData - Validated tenant update data from CSV
 * @returns Change preview with all changes grouped by tenant
 */
export async function generateChangePreview(parsedData: TenantUpdateData[]): Promise<{ success: boolean; data?: ChangePreview; error?: string }> {
  try {
    // Validate input
    if (!parsedData || parsedData.length === 0) {
      return { success: false, error: "No tenant data provided" }
    }

    // Get all tenant IDs
    const tenantIds = parsedData.map(t => t.id)

    // Fetch current tenant data from database
    const currentTenants = await prisma.tenant.findMany({
      where: {
        id: {
          in: tenantIds
        }
      }
    })

    // Create a map for quick lookup
    const currentTenantMap = new Map(currentTenants.map(t => [t.id, t]))

    // Build change preview
    const changes: TenantChange[] = []

    for (const updateData of parsedData) {
      const currentTenant = currentTenantMap.get(updateData.id)
      
      if (!currentTenant) {
        // This should have been caught by validation, but handle it gracefully
        continue
      }

      const fieldChanges: FieldChange[] = []

      // Compare each field in updates with current database value
      for (const [fieldName, newValue] of Object.entries(updateData.updates)) {
        const oldValue = currentTenant[fieldName as keyof typeof currentTenant]
        
        // Check if value has actually changed
        // Normalize values for comparison: treat null, undefined, and empty string as equivalent
        const normalizeValue = (val: string | number | boolean | Date | null | undefined): string | number | boolean | Date | null => {
          if (val === null || val === undefined || val === '') return null
          // For booleans, ensure they're actual booleans
          if (typeof val === 'boolean') return val
          // For dates, convert to ISO string for comparison
          if (val instanceof Date) return val
          // For strings, trim whitespace
          if (typeof val === 'string') return val.trim()
          return val
        }
        
        const normalizedOldValue = normalizeValue(oldValue)
        const normalizedNewValue = normalizeValue(newValue)
        
        // Only include if values are actually different
        if (normalizedOldValue !== normalizedNewValue) {
          // Additional check: if both are null/empty, skip
          if (normalizedOldValue === null && normalizedNewValue === null) {
            continue
          }
          
          fieldChanges.push({
            fieldName,
            oldValue: formatValueForDisplay(oldValue),
            newValue: formatValueForDisplay(newValue)
          })
        }
      }

      // Only include tenants that have actual changes
      if (fieldChanges.length > 0) {
        changes.push({
          tenantId: currentTenant.id,
          tenantName: `${currentTenant.firstName || ''} ${currentTenant.lastName || ''}`.trim() || currentTenant.businessName || 'Unknown',
          bpCode: currentTenant.bpCode,
          fieldChanges
        })
      }
    }

    // Calculate total tenants to be updated
    const totalTenants = changes.length

    return {
      success: true,
      data: {
        totalTenants,
        changes
      }
    }

  } catch (error) {
    console.error("Error generating change preview:", error)
    return { success: false, error: "Failed to generate change preview" }
  }
}

/**
 * Bulk update result structure
 */
interface BulkUpdateResult {
  success: boolean
  updatedCount: number
  errors: string[]
}

/**
 * Applies bulk updates to tenant records in a single database transaction
 * 
 * @param updates - Array of tenant update data from validated CSV
 * @param userId - ID of the user performing the bulk update
 * @param ipAddress - IP address of the user (optional)
 * @param userAgent - User agent string (optional)
 * @returns Bulk update result with success status and count
 */
export async function applyBulkUpdates(
  updates: TenantUpdateData[],
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<BulkUpdateResult> {
  try {
    // Validate input
    if (!updates || updates.length === 0) {
      return {
        success: false,
        updatedCount: 0,
        errors: ["No tenant updates provided"]
      }
    }

    if (!userId) {
      return {
        success: false,
        updatedCount: 0,
        errors: ["User ID is required"]
      }
    }

    // Use a transaction to ensure all updates succeed or all fail
    const result = await prisma.$transaction(async (tx) => {
      let updatedCount = 0
      const errors: string[] = []

      for (const updateData of updates) {
        try {
          // Validate tenant exists and get current values
          const existingTenant = await tx.tenant.findUnique({
            where: { id: updateData.id }
          })

          if (!existingTenant) {
            errors.push(`Tenant with ID ${updateData.id} not found`)
            continue
          }

          // Only update if there are actual changes
          if (Object.keys(updateData.updates).length === 0) {
            continue
          }

          // Build changes object for audit log (old and new values)
          const changes: Record<string, { old: string | number | boolean | Date | null | undefined; new: string | number | boolean | Date | null | undefined }> = {}
          for (const [fieldName, newValue] of Object.entries(updateData.updates)) {
            const oldValue = existingTenant[fieldName as keyof typeof existingTenant]
            changes[fieldName] = {
              old: oldValue,
              new: newValue
            }
          }

          // Apply updates - Prisma will automatically update the updatedAt timestamp
          await tx.tenant.update({
            where: { id: updateData.id },
            data: updateData.updates
          })

          // Create audit log entry within the same transaction
          await tx.auditLog.create({
            data: {
              entityId: updateData.id,
              entityType: 'TENANT',
              action: 'UPDATE',
              userId: userId,
              changes: changes,
              ipAddress: ipAddress || null,
              userAgent: userAgent || null,
              metadata: {
                bulkUpdate: true,
                updateType: 'BULK_UPDATE',
                fieldsUpdated: Object.keys(updateData.updates)
              }
            }
          })

          updatedCount++
        } catch (error) {
          console.error(`Error updating tenant ${updateData.id}:`, error)
          errors.push(`Failed to update tenant ${updateData.id}`)
          // Throw to trigger transaction rollback
          throw error
        }
      }

      // If any errors occurred, throw to rollback
      if (errors.length > 0) {
        throw new Error(errors.join("; "))
      }

      return { updatedCount, errors }
    })

    return {
      success: true,
      updatedCount: result.updatedCount,
      errors: []
    }

  } catch (error) {
    console.error("Error applying bulk updates:", error)
    
    // Return a user-friendly error message
    return {
      success: false,
      updatedCount: 0,
      errors: ["Failed to update tenants. Please try again."]
    }
  }
}
