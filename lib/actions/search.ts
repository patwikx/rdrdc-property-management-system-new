"use server"

import { prisma } from "@/lib/prisma"

// Types for search results
export interface BaseSearchResult {
  id: string
  title: string
  subtitle?: string
  type: SearchResultType
  url: string
}

export interface PropertySearchResult extends BaseSearchResult {
  type: 'property'
  propertyCode: string
  address: string
  propertyType: string
}

export interface TenantSearchResult extends BaseSearchResult {
  type: 'tenant'
  bpCode: string
  company: string
  email: string
}

export interface UnitSearchResult extends BaseSearchResult {
  type: 'unit'
  unitNumber: string
  propertyName: string
  status: string
  propertyId: string
}

export interface PropertyTitleSearchResult extends BaseSearchResult {
  type: 'property-title'
  titleNo: string
  lotNo: string
  propertyName: string
  propertyId: string
}

export interface DocumentSearchResult extends BaseSearchResult {
  type: 'document'
  documentType: string
  description?: string
}

export type SearchResult = 
  | PropertySearchResult 
  | TenantSearchResult 
  | UnitSearchResult 
  | PropertyTitleSearchResult 
  | DocumentSearchResult

export type SearchResultType = 'property' | 'tenant' | 'unit' | 'property-title' | 'document'

export async function searchAllRecords(query: string): Promise<SearchResult[]> {
  if (!query.trim() || query.length < 2) {
    return []
  }

  const searchTerm = query.toLowerCase()
  const results: SearchResult[] = []

  try {
    // Search Properties
    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { propertyName: { contains: searchTerm, mode: 'insensitive' } },
          { propertyCode: { contains: searchTerm, mode: 'insensitive' } },
          { address: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 10,
      select: {
        id: true,
        propertyCode: true,
        propertyName: true,
        address: true,
        propertyType: true
      }
    })

    properties.forEach(property => {
      results.push({
        id: property.id,
        type: 'property',
        title: property.propertyName,
        subtitle: `${property.propertyType} Property`,
        url: `/properties/${property.id}`,
        propertyCode: property.propertyCode,
        address: property.address,
        propertyType: property.propertyType
      })
    })

    // Search Tenants
    const tenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { company: { contains: searchTerm, mode: 'insensitive' } },
          { businessName: { contains: searchTerm, mode: 'insensitive' } },
          { bpCode: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        businessName: true,
        bpCode: true,
        email: true,
        status: true
      }
    })

    tenants.forEach(tenant => {
      const name = tenant.firstName && tenant.lastName 
        ? `${tenant.firstName} ${tenant.lastName}`
        : tenant.businessName || tenant.company
      
      results.push({
        id: tenant.id,
        type: 'tenant',
        title: name,
        subtitle: `${tenant.status} Tenant - ${tenant.company}`,
        url: `/tenants/${tenant.id}`,
        bpCode: tenant.bpCode,
        company: tenant.company,
        email: tenant.email
      })
    })

    // Search Units
    const units = await prisma.unit.findMany({
      where: {
        unitNumber: { contains: searchTerm, mode: 'insensitive' }
      },
      take: 10,
      include: {
        property: {
          select: {
            id: true,
            propertyName: true
          }
        }
      }
    })

    units.forEach(unit => {
      results.push({
        id: unit.id,
        type: 'unit',
        title: `Unit ${unit.unitNumber}`,
        subtitle: `${unit.status} - ${unit.property.propertyName}`,
        url: `/properties/${unit.propertyId}/units/${unit.id}`,
        unitNumber: unit.unitNumber,
        propertyName: unit.property.propertyName,
        status: unit.status,
        propertyId: unit.property.id
      })
    })

    // Search Property Titles
    const propertyTitles = await prisma.propertyTitles.findMany({
      where: {
        OR: [
          { titleNo: { contains: searchTerm, mode: 'insensitive' } },
          { lotNo: { contains: searchTerm, mode: 'insensitive' } },
          { registeredOwner: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 10,
      include: {
        property: {
          select: {
            id: true,
            propertyName: true
          }
        }
      }
    })

    propertyTitles.forEach(title => {
      results.push({
        id: title.id,
        type: 'property-title',
        title: title.titleNo,
        subtitle: `${title.lotNo} - ${title.property.propertyName}`,
        url: `/properties/${title.propertyId}?tab=titles`,
        titleNo: title.titleNo,
        lotNo: title.lotNo,
        propertyName: title.property.propertyName,
        propertyId: title.property.id
      })
    })

    // Search Documents - include relations to determine proper URL
    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 10,
      select: {
        id: true,
        name: true,
        description: true,
        documentType: true,
        propertyId: true,
        unitId: true,
        tenantId: true
      }
    })

    documents.forEach(document => {
      // Determine the appropriate URL based on document associations
      let url = '/documents' // fallback if no specific route exists
      
      if (document.propertyId) {
        url = `/properties/${document.propertyId}?tab=documents`
      } else if (document.tenantId) {
        url = `/tenants/${document.tenantId}?tab=documents`
      }
      
      results.push({
        id: document.id,
        type: 'document',
        title: document.name,
        subtitle: `${document.documentType} Document`,
        url,
        documentType: document.documentType,
        description: document.description || undefined
      })
    })

    // Sort results by relevance (exact matches first, then partial matches)
    return results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(searchTerm)
      const bExact = b.title.toLowerCase().includes(searchTerm)
      
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      
      return a.title.localeCompare(b.title)
    })

  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}