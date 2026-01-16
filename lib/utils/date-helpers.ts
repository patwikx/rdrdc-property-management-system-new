/**
 * Date helper utilities for property monitoring features
 * Requirements: 1.4, 1.5, 2.12
 */

/**
 * Calculate the number of days elapsed since a given date
 * Used for RWO cards to show days since creation
 * @param date - The starting date
 * @returns Number of days elapsed (always >= 0)
 */
export function getDaysElapsed(date: Date): number {
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
}

/**
 * Check if a date is overdue (in the past)
 * Used for utility bills to determine overdue status
 * @param dueDate - The due date to check
 * @returns true if the date is before today
 */
export function isOverdue(dueDate: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return due < today
}

/**
 * Check if a date is upcoming within a specified number of days
 * Used for utility bills to show warning indicators
 * @param dueDate - The due date to check
 * @param withinDays - Number of days to consider as "upcoming" (default: 7)
 * @returns true if the date is within the specified days from today (inclusive)
 */
export function isUpcoming(dueDate: Date, withinDays: number = 7): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + withinDays)
  
  return due >= today && due <= futureDate
}
