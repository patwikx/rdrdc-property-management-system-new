/* eslint-disable @next/next/no-img-element */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DocumentListItem } from "@/lib/actions/document-actions"
import { Download, ExternalLink, FileText } from "lucide-react"

interface DocumentViewerProps {
  document: DocumentListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DocumentViewer({ document, open, onOpenChange }: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true)

  if (!document) return null

  const handleDownload = () => {
    window.open(document.fileUrl, '_blank')
  }

  const handleOpenExternal = () => {
    window.open(document.fileUrl, '_blank')
  }

  const getFileExtension = (url: string) => {
    return url.split('.').pop()?.toLowerCase() || ''
  }

  const isViewableInBrowser = (url: string) => {
    const extension = getFileExtension(url)
    return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'txt'].includes(extension)
  }

  const isPDF = (url: string) => {
    return getFileExtension(url) === 'pdf'
  }

  const isImage = (url: string) => {
    const extension = getFileExtension(url)
    return ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{document.name}</span>
          </DialogTitle>
          <DialogDescription>
            {document.description || "Document preview"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end space-x-2 mb-4">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenExternal}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
        </div>

        <div className="flex-1 min-h-[500px] border rounded-lg overflow-hidden">
          {isViewableInBrowser(document.fileUrl) ? (
            <>
              {isPDF(document.fileUrl) ? (
                <iframe
                  src={`${document.fileUrl}#toolbar=1`}
                  className="w-full h-[500px]"
                  title={document.name}
                  onLoad={() => setIsLoading(false)}
                />
              ) : isImage(document.fileUrl) ? (
                <div className="flex items-center justify-center h-[500px] bg-muted/50">
                  <img
                    src={document.fileUrl}
                    alt={document.name}
                    className="max-w-full max-h-full object-contain"
                    onLoad={() => setIsLoading(false)}
                  />
                </div>
              ) : (
                <iframe
                  src={document.fileUrl}
                  className="w-full h-[500px]"
                  title={document.name}
                  onLoad={() => setIsLoading(false)}
                />
              )}
              
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[500px] bg-muted/50">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Preview not available</h3>
              <p className="text-muted-foreground text-center mb-4">
                This file type cannot be previewed in the browser.
                <br />
                Please download the file to view it.
              </p>
              <div className="flex items-center space-x-2">
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
                <Button variant="outline" onClick={handleOpenExternal}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}