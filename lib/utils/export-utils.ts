import { format } from "date-fns"

export interface ExportColumn {
  key: string
  label: string
  type?: "string" | "number" | "date" | "currency" | "percentage"
}

export function formatCellValue(value: unknown, type: ExportColumn["type"] = "string"): string {
  if (value === null || value === undefined) return ""
  
  switch (type) {
    case "date":
      return value instanceof Date ? format(value, "MMM dd, yyyy") : String(value)
    case "currency":
case "currency":
      return typeof value === "number" 
        ? new Intl.NumberFormat("en-PH", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
        : String(value)
    case "percentage":
      return typeof value === "number" ? `${value.toFixed(2)}%` : String(value)
    case "number":
      return typeof value === "number" ? value.toLocaleString() : String(value)
    default:
      return String(value)
  }
}

export function exportToCSV<T extends object>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  if (data.length === 0) {
    console.warn("No data to export")
    return
  }

  // Create CSV header
  const headers = columns.map(col => col.label).join(",")
  
  // Create CSV rows
  const rows = data.map(item => {
    return columns.map(col => {
      const value = getNestedValue(item, col.key)
      const formattedValue = formatCellValue(value, col.type)
      // Escape commas and quotes in CSV
      return `"${formattedValue.replace(/"/g, '""')}"`
    }).join(",")
  })

  // Combine header and rows
  const csvContent = [headers, ...rows].join("\n")
  
  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export async function exportToPDF<T extends object>(
  data: T[],
  columns: ExportColumn[],
  title: string,
  filename: string
): Promise<void> {
  // Dynamic import to avoid SSR issues
  const { jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  const doc = new jsPDF({
    orientation: columns.length > 6 ? "landscape" : "portrait",
    unit: "mm",
    format: "a4"
  })

  // Add title
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(title, 14, 20)
  
  // Add generation date
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Generated on: ${format(new Date(), "MMM dd, yyyy 'at' HH:mm")}`, 14, 28)

  // Prepare table data
  const tableColumns = columns.map(col => ({
    header: col.label,
    dataKey: col.key,
  }))

  const tableRows = data.map(item => {
    const row: Record<string, string> = {}
    columns.forEach(col => {
      const value = getNestedValue(item, col.key)
      row[col.key] = formatCellValue(value, col.type)
    })
    return row
  })

  // Add table
  autoTable(doc, {
    columns: tableColumns,
    body: tableRows,
    startY: 35,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue color
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Light gray
    },
    margin: { top: 35, right: 14, bottom: 20, left: 14 },
  })

  // Save the PDF
  doc.save(`${filename}_${format(new Date(), "yyyy-MM-dd")}.pdf`)
}

// Helper function to get nested object values using dot notation
function getNestedValue(obj: object, path: string): unknown {
  return path.split(".").reduce((current: unknown, key) => {
    if (current && typeof current === "object" && current !== null && key in current) {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj as unknown)
}

// Utility function to generate report summary
export function generateReportSummary<T extends object>(
  data: T[],
  title: string,
  additionalInfo?: Record<string, string | number>
): string {
  const summary = [
    `${title}`,
    `Total Records: ${data.length}`,
    `Generated: ${format(new Date(), "MMM dd, yyyy 'at' HH:mm")}`,
  ]

  if (additionalInfo) {
    Object.entries(additionalInfo).forEach(([key, value]) => {
      summary.push(`${key}: ${value}`)
    })
  }

  return summary.join("\n")
}