"use server"

import { createTenant } from "./tenant-actions"

interface ImportTenantData {
  bpCode: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  businessName: string
  status: "ACTIVE" | "INACTIVE" | "PENDING"
  homeAddress?: string
  facebookName?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  natureOfBusiness?: string
  yearsInBusiness?: string
  positionInCompany?: string
  officeAddress?: string
  facebookPage?: string
  website?: string
  authorizedSignatory?: string
  isStore?: boolean
  isOffice?: boolean
  isFranchise?: boolean
  bankName1?: string
  bankAddress1?: string
  bankName2?: string
  bankAddress2?: string
  otherBusinessName?: string
  otherBusinessAddress?: string
}

export async function importTenantsAction(data: ImportTenantData) {
  try {
    const result = await createTenant({
      bpCode: data.bpCode,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      company: data.company,
      businessName: data.businessName,
      status: data.status,
      homeAddress: data.homeAddress,
      facebookName: data.facebookName,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      natureOfBusiness: data.natureOfBusiness,
      yearsInBusiness: data.yearsInBusiness,
      positionInCompany: data.positionInCompany,
      officeAddress: data.officeAddress,
      facebookPage: data.facebookPage,
      website: data.website,
      authorizedSignatory: data.authorizedSignatory,
      isStore: data.isStore ?? false,
      isOffice: data.isOffice ?? false,
      isFranchise: data.isFranchise ?? false,
      bankName1: data.bankName1,
      bankAddress1: data.bankAddress1,
      bankName2: data.bankName2,
      bankAddress2: data.bankAddress2,
      otherBusinessName: data.otherBusinessName,
      otherBusinessAddress: data.otherBusinessAddress,
    })

    return result
  } catch (error) {
    console.error("Error importing tenant:", error)
    return {
      error: error instanceof Error ? error.message : "Failed to import tenant"
    }
  }
}