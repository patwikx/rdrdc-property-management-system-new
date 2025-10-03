declare module "jspdf-autotable" {
  import { jsPDF } from "jspdf"

  interface AutoTableColumn {
    header: string
    dataKey: string
  }

  interface AutoTableOptions {
    columns: AutoTableColumn[]
    body: Record<string, string>[]
    startY?: number
    styles?: {
      fontSize?: number
      cellPadding?: number
    }
    headStyles?: {
      fillColor?: number[]
      textColor?: number
      fontStyle?: string
    }
    alternateRowStyles?: {
      fillColor?: number[]
    }
    margin?: {
      top?: number
      right?: number
      bottom?: number
      left?: number
    }
  }

  function autoTable(doc: jsPDF, options: AutoTableOptions): void

  export default autoTable
}