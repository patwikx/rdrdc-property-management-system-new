import { Button } from "@/components/ui/button"
import { Download, FileDown } from "lucide-react"

interface ReportHeaderProps {
  title: string
  description: string
  onExportCsv?: () => void
  onExportPdf?: () => void
  children?: React.ReactNode
}

export function ReportHeader({
  title,
  description,
  onExportCsv,
  onExportPdf,
  children
}: ReportHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">{title}</h1>
          <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-wide">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {children}
          {(onExportCsv || onExportPdf) && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
              {onExportCsv && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onExportCsv}
                  className="rounded-none h-8 text-xs font-mono uppercase"
                >
                  <FileDown className="mr-2 h-3.5 w-3.5" />
                  CSV
                </Button>
              )}
              {onExportPdf && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onExportPdf}
                  className="rounded-none h-8 text-xs font-mono uppercase"
                >
                  <Download className="mr-2 h-3.5 w-3.5" />
                  PDF
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}