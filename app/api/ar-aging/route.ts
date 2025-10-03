import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/database';

export interface ARAgingTenant {
  cardCode: string;
  cardName: string;
  totalBalance: number;
  currentAmount: number;
  days1To30: number;
  days31To60: number;
  days61To90: number;
  over90Days: number;
  monthlyRent: number;
  securityDeposit: number;
}

export interface ARAgingResponse {
  success: boolean;
  data: ARAgingTenant[];
  error?: string;
  details?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cardCodeFilter = searchParams.get('cardCode') || '';
    const pool = await getConnection();

    // Main AR Aging Query
    let arAgingQuery = `
      SELECT
          OCRD.CardCode,
          OCRD.CardName,
          SUM(JDT1.Debit - JDT1.Credit) AS Total_Balance,
          SUM(CASE WHEN DATEDIFF(day, JDT1.DueDate, GETDATE()) <= 0 THEN (JDT1.Debit - JDT1.Credit) ELSE 0 END) AS Current_Amount,
          SUM(CASE WHEN DATEDIFF(day, JDT1.DueDate, GETDATE()) BETWEEN 1 AND 30 THEN (JDT1.Debit - JDT1.Credit) ELSE 0 END) AS Days_1_30,
          SUM(CASE WHEN DATEDIFF(day, JDT1.DueDate, GETDATE()) BETWEEN 31 AND 60 THEN (JDT1.Debit - JDT1.Credit) ELSE 0 END) AS Days_31_60,
          SUM(CASE WHEN DATEDIFF(day, JDT1.DueDate, GETDATE()) BETWEEN 61 AND 90 THEN (JDT1.Debit - JDT1.Credit) ELSE 0 END) AS Days_61_90,
          SUM(CASE WHEN DATEDIFF(day, JDT1.DueDate, GETDATE()) > 90 THEN (JDT1.Debit - JDT1.Credit) ELSE 0 END) AS Over_90_Days
      FROM JDT1
      INNER JOIN OACT
          ON JDT1.Account = OACT.AcctCode
      INNER JOIN OCRD
          ON JDT1.ShortName = OCRD.CardCode
      WHERE OACT.Segment_0 LIKE '1%'
          AND OCRD.CardCode LIKE '%CTAL%'
    `;

    if (cardCodeFilter) {
      arAgingQuery += ` AND OCRD.CardCode LIKE '%${cardCodeFilter}%'`;
    }

    arAgingQuery += `
      GROUP BY OCRD.CardCode, OCRD.CardName
      HAVING SUM(JDT1.Debit - JDT1.Credit) <> 0
      ORDER BY OCRD.CardName
    `;

    // Security Deposit Query - linked by CardName
    const securityDepositQuery = `
      SELECT 
          T0.CardName,
          SUM(T1.Debit - T1.Credit) AS Security_Deposit
      FROM JDT1 T1
      INNER JOIN OACT T2 ON T1.Account = T2.AcctCode
      INNER JOIN OCRD T0 ON T1.ShortName = T0.CardCode
      WHERE T2.Segment_0 LIKE '2%'
        AND T0.CardCode LIKE '%VALT%'
      GROUP BY T0.CardName
    `;

    // Monthly Rental Query - gets all payments from the current month per tenant
    // Includes both regular payments and CUSA payments
    let monthlyRentalQuery = `
      SELECT 
          T0.CardCode,
          SUM(T0.DocTotal + ABS(T0.OpenBal)) AS Monthly_Rental
      FROM ORCT T0
      INNER JOIN OCRD T1 ON T0.CardCode = T1.CardCode
      WHERE T1.CardCode LIKE '%CTAL%'
        AND T0.Canceled = 'N'
        AND MONTH(T0.DocDate) = MONTH(GETDATE())
        AND YEAR(T0.DocDate) = YEAR(GETDATE())
    `;

    if (cardCodeFilter) {
      monthlyRentalQuery += ` AND T0.CardCode LIKE '%${cardCodeFilter}%'`;
    }

    monthlyRentalQuery += `
      GROUP BY T0.CardCode
    `;

    // Execute all queries
    const [arAgingResult, securityDepositResult, monthlyRentalResult] = await Promise.all([
      pool.request().query(arAgingQuery),
      pool.request().query(securityDepositQuery),
      pool.request().query(monthlyRentalQuery)
    ]);

    // Create a map of security deposits by CardName
    const securityDepositMap = new Map<string, number>();
    securityDepositResult.recordset.forEach((row: { CardName: string; Security_Deposit: number }) => {
      securityDepositMap.set(row.CardName, row.Security_Deposit);
    });

    // Create a map of monthly rentals by CardCode
    const monthlyRentalMap = new Map<string, number>();
    monthlyRentalResult.recordset.forEach((row: { CardCode: string; Monthly_Rental: number }) => {
      monthlyRentalMap.set(row.CardCode, row.Monthly_Rental);
    });

    // Mock monthly rent data - in production, this should come from a contract table
    const mockMonthlyRents: Record<string, number> = {
      'CTAL0479': 10042.32,
      'CTAL0693': 9856.00,
      // Add more mock data as needed
    };

    const transformedData: ARAgingTenant[] = arAgingResult.recordset.map((row: {
      CardCode: string;
      CardName: string;
      Total_Balance: number;
      Current_Amount: number;
      Days_1_30: number;
      Days_31_60: number;
      Days_61_90: number;
      Over_90_Days: number;
    }) => {
      // Get security deposit from database by CardName, default to 0 if not found
      const securityDeposit = securityDepositMap.get(row.CardName) || 0;
      
      // Get monthly rental from database by CardCode, default to mock data or 0
      const monthlyRental = monthlyRentalMap.get(row.CardCode) || mockMonthlyRents[row.CardCode] || 0;

      return {
        cardCode: row.CardCode,
        cardName: row.CardName,
        totalBalance: row.Total_Balance,
        currentAmount: row.Current_Amount,
        days1To30: row.Days_1_30,
        days31To60: row.Days_31_60,
        days61To90: row.Days_61_90,
        over90Days: row.Over_90_Days,
        monthlyRent: monthlyRental,
        securityDeposit: securityDeposit,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedData,
    });
  } catch (error) {
    console.error('AR Aging query error:', error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: 'Failed to fetch AR Aging data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}