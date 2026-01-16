// Dashboard types - shared between server actions and client components

export interface DashboardStats {
  properties: {
    total: number
    totalLeasableArea: number
    byType: {
      RESIDENTIAL: number
      COMMERCIAL: number
      MIXED: number
    }
  }
  units: {
    total: number
    occupied: number
    vacant: number
    maintenance: number
    reserved: number
    occupancyRate: number
    totalArea: number
    occupiedArea: number
  }
  occupancy: {
    overallRate: number
    unitBasedRate: number
    areaBasedRate: number
  }
  tenants: {
    total: number
    active: number
    inactive: number
    pending: number
  }
  leases: {
    active: number
    expiringSoon: number
    expired: number
  }
  financial: {
    totalRentCollected: number
    pendingPayments: number
    overduePayments: number
    pdcOpen: number
    pdcDeposited: number
  }
  maintenance: {
    pending: number
    inProgress: number
    completed: number
    emergency: number
  }
  taxes: {
    propertyTaxesDue: number
    unitTaxesDue: number
    propertyTaxesOverdue: number
    unitTaxesOverdue: number
  }
}

export interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: Date
  user: string
}

export interface UpcomingTask {
  id: string
  title: string
  dueDate: Date
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: string
}

export interface Lease {
  id: string
  endDate: Date
  tenant: {
    firstName: string | null
    lastName: string | null
    company: string
    bpCode: string
  }
  leaseUnits: Array<{
    unit: {
      unitNumber: string
      property: {
        propertyName: string
      }
    }
  }>
}

export interface Anniversary {
  id: string
  tenant: {
    firstName: string | null
    lastName: string | null
    company: string
    bpCode: string
  }
  unit: {
    unitNumber: string
    property: {
      propertyName: string
    }
  } | undefined
  years: number
  date: Date
}
