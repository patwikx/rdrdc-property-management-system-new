import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/database';

/**
 * Public AR Aging API for Google Sheets Integration
 * 
 * Returns simplified data: BP Code, Tenant Name, Total Balance
 * No authentication required.
 * 
 * Usage in Google Apps Script:
 * ```javascript
 * function fetchARData() {
 *   const url = "https://your-domain.com/api/ar-aging/simple";
 *   const response = UrlFetchApp.fetch(url);
 *   const data = JSON.parse(response.getContentText());
 *   // data = [{ bpCode, tenantName, totalBalance }, ...]
 * }
 * ```
 */

export interface SimpleARAgingItem {
  bpCode: string;
  tenantName: string;
  totalBalance: number;
}

export interface SimpleARAgingResponse {
  success: boolean;
  data: SimpleARAgingItem[];
  count: number;
  lastUpdated: string;
  error?: string;
}

export async function GET() {
  try {
    const pool = await getConnection();

    // Simplified AR Aging Query - only essential fields
    const arAgingQuery = `
      SELECT
          OCRD.CardCode,
          OCRD.CardName,
          SUM(JDT1.Debit - JDT1.Credit) AS Total_Balance
      FROM JDT1
      INNER JOIN OACT
          ON JDT1.Account = OACT.AcctCode
      INNER JOIN OCRD
          ON JDT1.ShortName = OCRD.CardCode
      WHERE OACT.Segment_0 LIKE '1%'
          AND OCRD.CardCode LIKE '%CTAL%'
      GROUP BY OCRD.CardCode, OCRD.CardName
      HAVING SUM(JDT1.Debit - JDT1.Credit) <> 0
      ORDER BY OCRD.CardName
    `;

    const result = await pool.request().query(arAgingQuery);

    const transformedData: SimpleARAgingItem[] = result.recordset.map((row: {
      CardCode: string;
      CardName: string;
      Total_Balance: number;
    }) => ({
      bpCode: row.CardCode,
      tenantName: row.CardName,
      totalBalance: row.Total_Balance,
    }));

    // Add CORS headers for cross-origin access from Google Sheets
    const response = NextResponse.json({
      success: true,
      data: transformedData,
      count: transformedData.length,
      lastUpdated: new Date().toISOString(),
    });

    // Allow cross-origin requests (for Google Apps Script)
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET');
    response.headers.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes

    return response;
  } catch (error) {
    console.error('Simple AR Aging query error:', error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        count: 0,
        lastUpdated: new Date().toISOString(),
        error: 'Failed to fetch AR Aging data',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
