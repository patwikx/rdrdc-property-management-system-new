"use server"

import { getUnitByIdInternal, updateUnit, updateUnitWithFloors, deleteUnit, UnitWithDetails } from "./unit-actions"
import { createUnitTax } from "./unit-tax-actions"
import { createMaintenanceRequest } from "./unit-maintenance-actions"
import { createUnitUtility } from "./unit-utility-actions"
import { UnitFormData } from "@/lib/validations/unit-schema"

interface FloorConfigData {
  id?: string
  floorType: string
  area: number
  ratePerSqm: number
  floorRent: number
}

interface UnitTaxFormData {
  unitId: string
  taxYear: number
  taxDecNo: string
  taxAmount: number
  dueDate: Date
  isPaid: boolean
  paidDate?: Date
  isAnnual: boolean
  isQuarterly: boolean
  whatQuarter?: string
  remarks?: string
}

interface MaintenanceRequestFormData {
  unitId: string
  tenantId?: string
  category: "PLUMBING" | "ELECTRICAL" | "HVAC" | "APPLIANCE" | "STRUCTURAL" | "OTHER"
  priority: "EMERGENCY" | "HIGH" | "MEDIUM" | "LOW"
  description: string
}

interface UnitUtilityFormData {
  unitId: string
  utilityType: "ELECTRICITY" | "WATER" | "OTHERS"
  accountNumber: string
  meterNumber?: string
  providerName?: string
  billingDueDay?: number
  billingId?: string
  isActive: boolean
  remarks?: string
}

export async function getUnitById(id: string): Promise<UnitWithDetails | null> {
  return await getUnitByIdInternal(id)
}

export async function updateUnitAction(id: string, data: Partial<UnitFormData>) {
  return await updateUnit(id, data)
}

export async function updateUnitWithFloorsAction(
  id: string, 
  unitData: Partial<UnitFormData>, 
  floorsData: FloorConfigData[]
) {
  return await updateUnitWithFloors(id, unitData, floorsData)
}

export async function createUnitTaxAction(data: UnitTaxFormData) {
  return await createUnitTax(data)
}

export async function createMaintenanceRequestAction(data: MaintenanceRequestFormData) {
  return await createMaintenanceRequest(data)
}

export async function createUnitUtilityAction(data: UnitUtilityFormData) {
  return await createUnitUtility(data)
}

export async function deleteUnitAction(id: string) {
  return await deleteUnit(id)
}