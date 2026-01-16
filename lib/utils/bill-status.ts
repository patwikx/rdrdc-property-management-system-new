/**
 * Bill status utilities for utility billing monitoring
 * Requirements: 1.4, 1.5
 */

import { isOverdue, isUpcoming } from './date-helpers'

export type BillStatus = 'paid' | 'overdue' | 'warning' | 'normal'

/**
 * Determine the status of a utility bill based on due date and payment status
 * 
 * Status logic:
 * - "paid" (green): Bill has been paid
 * - "overdue" (red): Due date has passed and bill is unpaid
 * - "warning" (yellow/orange): Due within 7 days and unpaid
 * - "normal" (default): Due date is more than 7 days away and unpaid
 * 
 * @param dueDate - The bill's due date
 * @param isPaid - Whether the bill has been paid
 * @returns The bill status
 */
export function getBillStatus(dueDate: Date, isPaid: boolean): BillStatus {
  if (isPaid) {
    return 'paid'
  }
  
  if (isOverdue(dueDate)) {
    return 'overdue'
  }
  
  if (isUpcoming(dueDate, 7)) {
    return 'warning'
  }
  
  return 'normal'
}

/**
 * Get the display color class for a bill status
 * @param status - The bill status
 * @returns Tailwind CSS color class
 */
export function getBillStatusColor(status: BillStatus): string {
  switch (status) {
    case 'paid':
      return 'text-green-600 bg-green-50'
    case 'overdue':
      return 'text-red-600 bg-red-50'
    case 'warning':
      return 'text-yellow-600 bg-yellow-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

/**
 * Get the display label for a bill status
 * @param status - The bill status
 * @returns Human-readable status label
 */
export function getBillStatusLabel(status: BillStatus): string {
  switch (status) {
    case 'paid':
      return 'Paid'
    case 'overdue':
      return 'Overdue'
    case 'warning':
      return 'Due Soon'
    default:
      return 'Pending'
  }
}
