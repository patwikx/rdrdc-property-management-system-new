import { LeaseStatus } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
}

const toIsoString = (value: Date | null): string | null => value?.toISOString() ?? null

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

export async function GET(_request: NextRequest) {
  try {
    const [tenants, properties] = await Promise.all([
      prisma.tenant.findMany({
        select: {
          id: true,
          bpCode: true,
          businessName: true,
          company: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          natureOfBusiness: true,
          createdAt: true,
          updatedAt: true,
          leases: {
            select: {
              id: true,
              status: true,
              startDate: true,
              endDate: true,
              totalRentAmount: true,
              securityDeposit: true,
              leaseUnits: {
                select: {
                  id: true,
                  rentAmount: true,
                  unit: {
                    select: {
                      id: true,
                      unitNumber: true,
                      totalArea: true,
                      totalRent: true,
                      status: true,
                      property: {
                        select: {
                          id: true,
                          propertyCode: true,
                          propertyName: true,
                        },
                      },
                    },
                  },
                },
                orderBy: {
                  unit: {
                    unitNumber: "asc",
                  },
                },
              },
            },
            orderBy: {
              startDate: "desc",
            },
          },
        },
        orderBy: [
          { businessName: "asc" },
          { bpCode: "asc" },
        ],
      }),
      prisma.property.findMany({
        select: {
          id: true,
          propertyCode: true,
          propertyName: true,
          address: true,
          propertyType: true,
          leasableArea: true,
          totalUnits: true,
          createdAt: true,
          updatedAt: true,
          units: {
            select: {
              id: true,
              unitNumber: true,
              totalArea: true,
              totalRent: true,
              status: true,
              createdAt: true,
              updatedAt: true,
              unitFloors: {
                select: {
                  id: true,
                  floorType: true,
                  area: true,
                  rate: true,
                  rent: true,
                },
                orderBy: {
                  floorType: "asc",
                },
              },
              leaseUnits: {
                where: {
                  lease: {
                    status: LeaseStatus.ACTIVE,
                  },
                },
                select: {
                  id: true,
                  rentAmount: true,
                  lease: {
                    select: {
                      id: true,
                      startDate: true,
                      endDate: true,
                      status: true,
                      tenant: {
                        select: {
                          id: true,
                          bpCode: true,
                          businessName: true,
                          company: true,
                          status: true,
                          email: true,
                          phone: true,
                        },
                      },
                    },
                  },
                },
                orderBy: {
                  lease: {
                    startDate: "desc",
                  },
                },
              },
            },
            orderBy: {
              unitNumber: "asc",
            },
          },
        },
        orderBy: [
          { propertyName: "asc" },
          { propertyCode: "asc" },
        ],
      }),
    ])

    return NextResponse.json(
      {
        success: true,
        generatedAt: new Date().toISOString(),
        tenants: tenants.map((tenant) => ({
          id: tenant.id,
          bpCode: tenant.bpCode,
          businessName: tenant.businessName,
          company: tenant.company,
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          email: tenant.email,
          phone: tenant.phone,
          status: tenant.status,
          natureOfBusiness: tenant.natureOfBusiness,
          createdAt: toIsoString(tenant.createdAt),
          updatedAt: toIsoString(tenant.updatedAt),
          leases: tenant.leases.map((lease) => ({
            id: lease.id,
            status: lease.status,
            startDate: toIsoString(lease.startDate),
            endDate: toIsoString(lease.endDate),
            totalRentAmount: lease.totalRentAmount,
            securityDeposit: lease.securityDeposit,
            units: lease.leaseUnits.map((leaseUnit) => ({
              id: leaseUnit.unit.id,
              unitNumber: leaseUnit.unit.unitNumber,
              totalArea: leaseUnit.unit.totalArea,
              totalRent: leaseUnit.unit.totalRent,
              status: leaseUnit.unit.status,
              rentAmount: leaseUnit.rentAmount,
              property: leaseUnit.unit.property,
            })),
          })),
        })),
        properties: properties.map((property) => ({
          id: property.id,
          propertyCode: property.propertyCode,
          propertyName: property.propertyName,
          address: property.address,
          propertyType: property.propertyType,
          leasableArea: property.leasableArea,
          totalUnits: property.totalUnits,
          createdAt: toIsoString(property.createdAt),
          updatedAt: toIsoString(property.updatedAt),
          units: property.units.map((unit) => ({
            id: unit.id,
            unitNumber: unit.unitNumber,
            totalArea: unit.totalArea,
            totalRent: unit.totalRent,
            status: unit.status,
            createdAt: toIsoString(unit.createdAt),
            updatedAt: toIsoString(unit.updatedAt),
            floors: unit.unitFloors,
            activeTenants: unit.leaseUnits.map((leaseUnit) => ({
              leaseUnitId: leaseUnit.id,
              rentAmount: leaseUnit.rentAmount,
              lease: {
                id: leaseUnit.lease.id,
                status: leaseUnit.lease.status,
                startDate: toIsoString(leaseUnit.lease.startDate),
                endDate: toIsoString(leaseUnit.lease.endDate),
              },
              tenant: leaseUnit.lease.tenant,
            })),
          })),
        })),
      },
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Cache-Control": "no-store",
        },
      }
    )
  } catch (error) {
    console.error("Error fetching LMS property data:", error)

    return NextResponse.json(
      { success: false, error: "Failed to fetch property data." },
      {
        status: 500,
        headers: corsHeaders,
      }
    )
  }
}
