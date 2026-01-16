/**
 * Tenure calculation utilities for tenant filtering
 * Requirements: 4.2, 4.3
 */

export interface Tenure {
  years: number
  months: number
}

/**
 * Calculate tenure from a lease start date to now
 * @param leaseStartDate - The date the lease started
 * @returns Tenure object with years and months
 */
export function calculateTenure(leaseStartDate: Date): Tenure {
  const now = new Date()
  const start = new Date(leaseStartDate)
  
  // Calculate total months difference
  let years = now.getFullYear() - start.getFullYear()
  let months = now.getMonth() - start.getMonth()
  
  // Adjust for day of month
  if (now.getDate() < start.getDate()) {
    months--
  }
  
  // Handle negative months
  if (months < 0) {
    years--
    months += 12
  }
  
  // Ensure non-negative values
  if (years < 0) {
    return { years: 0, months: 0 }
  }
  
  return { years, months }
}

/**
 * Get total months from a tenure object
 * @param tenure - The tenure object
 * @returns Total number of months
 */
export function getTotalMonths(tenure: Tenure): number {
  return tenure.years * 12 + tenure.months
}

/**
 * Format tenure as a human-readable string
 * @param tenure - The tenure object with years and months
 * @returns Formatted string like "2y 3m", "5 months", or "1 year"
 */
export function formatTenure(tenure: Tenure): string {
  const { years, months } = tenure
  
  if (years === 0 && months === 0) {
    return '0 months'
  }
  
  if (years === 0) {
    return `${months} month${months !== 1 ? 's' : ''}`
  }
  
  if (months === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`
  }
  
  return `${years}y ${months}m`
}
