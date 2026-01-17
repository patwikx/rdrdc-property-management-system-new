import { NextRequest, NextResponse } from 'next/server'
import { generateTenantCSV } from '@/lib/actions/tenant-bulk-update-actions'

/**
 * API route for downloading tenant CSV template
 * POST /api/tenant-bulk-update/download
 * 
 * Request body: { tenantIds: string[] }
 * Response: CSV file download with proper headers
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { tenantIds } = body

    // Validate input
    if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No tenant IDs provided' },
        { status: 400 }
      )
    }

    // Generate CSV
    const result = await generateTenantCSV(tenantIds)

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to generate CSV' },
        { status: 500 }
      )
    }

    // Generate filename with current date (YYYY-MM-DD format)
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const filename = `tenant-bulk-update-${year}-${month}-${day}.csv`

    // Return CSV with appropriate headers for file download
    return new NextResponse(result.data, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Error in CSV download route:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to download CSV',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
