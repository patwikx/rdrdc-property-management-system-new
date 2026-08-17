import { timingSafeEqual } from "node:crypto"

import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const MAX_PAGE_SIZE = 200

function isAuthorized(request: NextRequest): boolean {
  if (process.env.PROPERTY_COLLECTION_MIGRATION_ENABLED !== "true") return false

  const expected = process.env.PROPERTY_COLLECTION_MIGRATION_API_KEY?.trim()
  const authorization = request.headers.get("authorization")?.trim()
  const supplied = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : undefined
  if (!expected || !supplied) return false

  const expectedBuffer = Buffer.from(expected)
  const suppliedBuffer = Buffer.from(supplied)
  return (
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer)
  )
}

const responseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
}

function pageParameters(request: NextRequest) {
  const cursor = request.nextUrl.searchParams.get("cursor")?.trim() || undefined
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? 100)
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), MAX_PAGE_SIZE)
    : 100
  return { cursor, limit }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized request." },
      { status: 401, headers: responseHeaders },
    )
  }

  const resource = request.nextUrl.searchParams.get("resource")
  const { cursor, limit } = pageParameters(request)

  try {
    if (resource === "manifest") {
      const [pdcCount, noticeCount, noticeItemCount] = await Promise.all([
        prisma.pDC.count(),
        prisma.tenantNotice.count(),
        prisma.noticeItem.count(),
      ])
      return NextResponse.json(
        {
          ok: true,
          schemaVersion: 1,
          generatedAt: new Date().toISOString(),
          counts: { pdcs: pdcCount, notices: noticeCount, noticeItems: noticeItemCount },
          signatureAssets: ["DJE", "CABL"],
        },
        { headers: responseHeaders },
      )
    }

    if (resource === "pdcs") {
      const rows = await prisma.pDC.findMany({
        where: cursor ? { id: { gt: cursor } } : undefined,
        orderBy: { id: "asc" },
        take: limit + 1,
        select: {
          id: true,
          docDate: true,
          refNo: true,
          bankName: true,
          dueDate: true,
          checkNo: true,
          amount: true,
          remarks: true,
          bpCode: true,
          bpName: true,
          status: true,
          updatedAt: true,
        },
      })
      const hasMore = rows.length > limit
      const data = hasMore ? rows.slice(0, limit) : rows
      return NextResponse.json(
        {
          ok: true,
          schemaVersion: 1,
          resource,
          data,
          nextCursor: hasMore ? data.at(-1)?.id ?? null : null,
        },
        { headers: responseHeaders },
      )
    }

    if (resource === "notices") {
      const rows = await prisma.tenantNotice.findMany({
        where: cursor ? { id: { gt: cursor } } : undefined,
        orderBy: { id: "asc" },
        take: limit + 1,
        select: {
          id: true,
          noticeType: true,
          noticeNumber: true,
          escalatedFromNoticeId: true,
          totalAmount: true,
          forMonth: true,
          forYear: true,
          dateIssued: true,
          primarySignatory: true,
          primaryTitle: true,
          primaryContact: true,
          secondarySignatory: true,
          secondaryTitle: true,
          isSettled: true,
          settledDate: true,
          settledBy: true,
          createdAt: true,
          updatedAt: true,
          tenant: {
            select: { bpCode: true, businessName: true },
          },
          items: {
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            select: {
              id: true,
              description: true,
              status: true,
              customStatus: true,
              amount: true,
              months: true,
              createdAt: true,
            },
          },
        },
      })
      const hasMore = rows.length > limit
      const data = hasMore ? rows.slice(0, limit) : rows
      return NextResponse.json(
        {
          ok: true,
          schemaVersion: 1,
          resource,
          data,
          nextCursor: hasMore ? data.at(-1)?.id ?? null : null,
        },
        { headers: responseHeaders },
      )
    }

    return NextResponse.json(
      { ok: false, error: "Unsupported migration resource." },
      { status: 400, headers: responseHeaders },
    )
  } catch {
    console.error("Property collection migration export failed.")
    return NextResponse.json(
      { ok: false, error: "Migration export failed." },
      { status: 500, headers: responseHeaders },
    )
  }
}
