/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";

import { ArrowLeft, Printer, Download, Edit3, Save, X, Plus, Trash2, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import { getTenantNoticeById, updateTenantNotice } from "@/lib/actions/tenant-notice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NoticeDetail {
  id: string;
  noticeType: string;
  noticeNumber: number;
  totalAmount: number;
  forMonth: string;
  forYear: number;
  dateIssued: Date;
  isSettled: boolean;
  settledDate: Date | null;
  primarySignatory: string;
  primaryTitle: string;
  primaryContact: string;
  secondarySignatory: string;
  secondaryTitle: string;
  tenant: {
    id: string;
    bpCode: string;
    businessName: string;
    company: string;
    firstName: string | null;
    lastName: string | null;
  };
  createdBy: {
    firstName: string;
    lastName: string;
  };
  items: {
    id: string;
    description: string;
    status: string;
    customStatus: string | null;
    amount: number;
    months: string | null;
  }[];
}

export default function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [noticeId, setNoticeId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [formData, setFormData] = useState({
    primarySignatory: "",
    primaryTitle: "",
    primaryContact: "",
    secondarySignatory: "",
    secondaryTitle: ""
  });

  const [items, setItems] = useState<Array<{
    id?: string;
    description: string;
    status: string;
    customStatus: string;
    amount: string;
    months: string;
    year: string;
  }>>([]);

  useEffect(() => {
    async function initializeParams() {
      const resolvedParams = await params;
      setNoticeId(resolvedParams.id);
    }
    
    initializeParams();
  }, [params]);

  useEffect(() => {
    if (!noticeId) return;

    const loadNotice = async () => {
      try {
        const noticeData = await getTenantNoticeById(noticeId);
        setNotice(noticeData as NoticeDetail);
      } catch (error) {
        toast.error("Failed to load notice");
        router.push("/notices");
      } finally {
        setLoading(false);
      }
    };
    loadNotice();
  }, [noticeId, router]);

  // Populate form data when notice is loaded
  useEffect(() => {
    if (notice) {
      setFormData({
        primarySignatory: notice.primarySignatory,
        primaryTitle: notice.primaryTitle,
        primaryContact: notice.primaryContact,
        secondarySignatory: notice.secondarySignatory,
        secondaryTitle: notice.secondaryTitle
      });

      setItems(notice.items.map(item => ({
        id: item.id,
        description: item.description,
        status: item.customStatus || item.status,
        customStatus: item.customStatus || "",
        amount: item.amount.toString(),
        months: item.months || "",
        year: notice.forYear.toString()
      })));
    }
  }, [notice]);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveAsPDF = () => {
    try {
      // Hide non-print elements temporarily
      const nonPrintElements = document.querySelectorAll('.print\\:hidden');
      nonPrintElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });

      // Set document title for PDF filename
      const originalTitle = document.title;
      document.title = `Notice-${notice?.tenant.businessName}-${notice?.noticeNumber}`;

      // Trigger print dialog (user can choose "Save as PDF")
      window.print();

      // Restore elements and title after print dialog
      setTimeout(() => {
        nonPrintElements.forEach(el => {
          (el as HTMLElement).style.display = '';
        });
        document.title = originalTitle;
      }, 1000);

      toast.success("Print dialog opened - Choose 'Save as PDF' as your printer");
    } catch (error) {
      console.error("Error opening print dialog:", error);
      toast.error("Failed to open print dialog");
    }
  };

  const getNoticeTitle = (type: string, number: number) => {
    if (number >= 3 || type === "FINAL_NOTICE") {
      return "FINAL NOTICE AND WARNING";
    }
    return number === 1 ? "FIRST NOTICE OF COLLECTION" : "SECOND NOTICE OF COLLECTION";
  };

  const getNoticeContent = (type: string, number: number) => {
    const formattedAmount = `₱${notice?.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    if (number >= 3 || type === "FINAL_NOTICE") {
      return {
        beforeAmount: "Our records show that to date, we have not yet received the full payment of your outstanding balance amounting to ",
        amount: formattedAmount,
        afterAmount: ", despite repeated demands. Below listed are the details of your unsettled account:"
      };
    }
    
    return {
      beforeAmount: "This is to remind you of your unsettled accounts with RD Realty Development Corporation amounting to ",
      amount: formattedAmount,
      afterAmount: ". Below listed are the details to wit:"
    };
  };

  const getFinalNoticeWarning = () => {
    return {
      beforeWarning: "This is a ",
      warning: "WARNING",
      afterWarning: " for you to settle your balance immediately from the receipt of this notice. We are letting you know that this is your last and final opportunity to negotiate with the company concerning your outstanding obligations. We hope that this time, you will settle to avoid any inconvenience in the future."
    };
  };

  // Function to get signature image based on signatory name
  const getSignatureImage = (signatoryName: string) => {
    const normalizedName = signatoryName.toLowerCase().replace(/\s+/g, '');
    
    // Check for common variations of the names
    if (normalizedName.includes('daryll') || normalizedName.includes('daryl')) {
      return '/DJE.png'; // Adjust filename as needed
    } else if (normalizedName.includes('laguindam') || normalizedName.includes('cab') || normalizedName.includes('c.a.b')) {
      return '/CABL.png'; // Adjust filename as needed
    }
    
    return null; // No signature found
  };

  // Constants for edit form
  const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
  
  const NOTICE_STATUSES = [
    { value: "PAST_DUE", label: "PAST DUE" },
    { value: "OVERDUE", label: "OVERDUE" },
    { value: "CRITICAL", label: "CRITICAL" },
    { value: "PENDING", label: "PENDING" },
    { value: "UNPAID", label: "UNPAID" },
    { value: "CUSTOM", label: "Custom (Enter manually)" }
  ];

  // Edit functions
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const addItem = () => {
    setItems([...items, {
      description: "",
      status: "PAST_DUE",
      customStatus: "",
      amount: "",
      months: "",
      year: notice?.forYear.toString() || new Date().getFullYear().toString()
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: string) => {
    console.log('updateItem called:', { index, field, value });
    const updatedItems = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    console.log('Updated items:', updatedItems);
    setItems(updatedItems);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = items.filter(item => {
      const hasDescription = item.description.trim();
      const hasAmount = item.amount && parseFloat(item.amount) > 0;
      const hasValidStatus = item.status !== "CUSTOM" || (item.status === "CUSTOM" && item.customStatus.trim());
      return hasDescription && hasAmount && hasValidStatus;
    });

    if (validItems.length === 0) {
      toast.error("Please add at least one valid item with description, amount, and status");
      return;
    }

    const invalidCustomItems = items.filter(item =>
      item.status === "CUSTOM" && !item.customStatus.trim()
    );

    if (invalidCustomItems.length > 0) {
      toast.error("Please enter custom status for all items marked as 'Custom'");
      return;
    }

    setIsUpdating(true);
    try {
      await updateTenantNotice(noticeId, {
        ...formData,
        items: validItems.map(item => ({
          id: item.id,
          description: item.description,
          status: item.status === "CUSTOM" ? item.customStatus : item.status,
          amount: parseFloat(item.amount),
          months: item.months,
          year: parseInt(item.year)
        }))
      });

      toast.success("Notice updated successfully!");
      
      // Reload the notice data
      const updatedNotice = await getTenantNoticeById(noticeId);
      setNotice(updatedNotice as NoticeDetail);
      setIsEditing(false);
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update notice");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading notice...</div>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Notice not found</div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 0.25in;
            size: 8.5in 11in;
          }
          /* Print spacing adjustments */
          .print-area {
            padding: 0.1in 0.15in !important;
          }
          /* Force colors to print */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Ensure yellow background prints */
          .print-yellow {
            background-color: #fef08a !important;
            -webkit-print-color-adjust: exact !important;
          }
          /* Ensure red text prints */
          .print-red {
            color: #dc2626 !important;
            -webkit-print-color-adjust: exact !important;
          }
          /* Ensure blue text prints */
          .print-blue {
            color: #2563eb !important;
            -webkit-print-color-adjust: exact !important;
          }
          /* Ensure light blue text prints */
          .print-light-blue {
            color: #60a5fa !important;
            -webkit-print-color-adjust: exact !important;
          }
          /* Ensure navy blue text prints */
          .print-navy-blue {
            color: #1e3a8a !important;
            -webkit-print-color-adjust: exact !important;
          }
          /* Signature styling for print */
          .signature-container {
            position: relative;
          }
          .signature-image {
            position: absolute;
            top: -25px;
            left: 0;
            z-index: 1;
          }
          .signatory-name {
            position: relative;
            z-index: 2;
          }
        }
        
        /* Custom text justification styles */
        .text-justify-full {
          text-align: justify;
          text-justify: inter-word;
          hyphens: auto;
          -webkit-hyphens: auto;
          -ms-hyphens: auto;
        }
        
        .text-justify-full:after {
          content: "";
          display: inline-block;
          width: 100%;
        }

        /* Signature styling for screen */
        .signature-container {
          position: relative;
        }
        .signature-image {
          position: absolute;
          top: -25px;
          left: 0;
          z-index: 1;
        }
        .signatory-name {
          position: relative;
          z-index: 2;
        }
      `}</style>
      
      <div className="container mx-auto py-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Notices
          </Button>
          <div className="space-x-2">
            {!isEditing && (
              <>
                <Button variant="outline" onClick={handleEditToggle}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" onClick={handleSaveAsPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Save as PDF
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </>
            )}
            {isEditing && (
              <>
                <Button variant="outline" onClick={handleEditToggle} disabled={isUpdating}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleUpdateSubmit} disabled={isUpdating}>
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="mb-6 print:hidden">
            <Card>
              <CardHeader>
                <CardTitle>Edit Notice</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateSubmit} className="space-y-6">
                  {/* Signatory Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-l-4 border-primary pl-4">Signatory Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="primarySignatory">Primary Signatory</Label>
                        <Input
                          id="primarySignatory"
                          value={formData.primarySignatory}
                          onChange={(e) => setFormData({...formData, primarySignatory: e.target.value})}
                          placeholder="Enter primary signatory name"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label htmlFor="primaryTitle">Primary Title</Label>
                        <Input
                          id="primaryTitle"
                          value={formData.primaryTitle}
                          onChange={(e) => setFormData({...formData, primaryTitle: e.target.value})}
                          placeholder="Enter primary title"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label htmlFor="primaryContact">Primary Contact</Label>
                        <Input
                          id="primaryContact"
                          value={formData.primaryContact}
                          onChange={(e) => setFormData({...formData, primaryContact: e.target.value})}
                          placeholder="Enter primary contact"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label htmlFor="secondarySignatory">Secondary Signatory</Label>
                        <Input
                          id="secondarySignatory"
                          value={formData.secondarySignatory}
                          onChange={(e) => setFormData({...formData, secondarySignatory: e.target.value})}
                          placeholder="Enter secondary signatory name"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label htmlFor="secondaryTitle">Secondary Title</Label>
                        <Input
                          id="secondaryTitle"
                          value={formData.secondaryTitle}
                          onChange={(e) => setFormData({...formData, secondaryTitle: e.target.value})}
                          placeholder="Enter secondary title"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notice Items */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold border-l-4 border-primary pl-4">Notice Items</h3>
                      <Button
                        type="button"
                        onClick={addItem}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Item
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {items.map((item, index) => (
                        <div key={index} className="bg-muted/50 rounded-lg p-4 border">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium">Item {index + 1}</h4>
                            {items.length > 1 && (
                              <Button
                                type="button"
                                onClick={() => removeItem(index)}
                                variant="outline"
                                size="sm"
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="space-y-3">
                            {/* First Row: Description */}
                            <div className="space-y-1.5">
                              <Label className="flex items-center gap-2 text-sm font-medium">
                                <Edit3 className="h-4 w-4" />
                                Description <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                className="h-11"
                                value={item.description}
                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                placeholder="Enter item description..."
                              />
                            </div>

                            {/* Second Row: Status and Custom Status */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="flex items-center gap-2 text-sm font-medium">
                                  <FileText className="h-4 w-4" />
                                  Status <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                  value={item.status}
                                  onValueChange={(value) => updateItem(index, 'status', value)}
                                >
                                  <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {NOTICE_STATUSES.map((status) => (
                                      <SelectItem key={status.value} value={status.value}>
                                        {status.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {item.status === "CUSTOM" && (
                                <div className="space-y-1.5">
                                  <Label className="flex items-center gap-2 text-sm font-medium">
                                    <Edit3 className="h-4 w-4" />
                                    Custom Status <span className="text-destructive">*</span>
                                  </Label>
                                  <Input
                                    className="h-11"
                                    value={item.customStatus}
                                    onChange={(e) => updateItem(index, 'customStatus', e.target.value)}
                                    placeholder="Enter custom status..."
                                  />
                                </div>
                              )}
                            </div>

                            {/* Third Row: Months, Year, and Amount */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1.5">
                                <Label className="flex items-center gap-2 text-sm font-medium">
                                  <Calendar className="h-4 w-4" />
                                  Month(s) <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  className="h-11"
                                  value={item.months}
                                  onChange={(e) => updateItem(index, 'months', e.target.value)}
                                  placeholder="e.g., January - March"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <Label className="flex items-center gap-2 text-sm font-medium">
                                  <Calendar className="h-4 w-4" />
                                  Year <span className="text-destructive">*</span>
                                  <span className="text-xs text-muted-foreground ml-2">Current: {item.year}</span>
                                </Label>
                                <Select
                                  key={`year-${index}-${item.year}`}
                                  value={item.year}
                                  onValueChange={(value) => {
                                    console.log('Year changing from', item.year, 'to', value);
                                    updateItem(index, 'year', value);
                                  }}
                                >
                                  <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Select year..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {YEARS.map((year) => (
                                      <SelectItem key={year} value={year.toString()}>
                                        {year}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-1.5">
                                <Label className="flex items-center gap-2 text-sm font-medium">
                                  <FileText className="h-4 w-4" />
                                  Amount <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  className="h-11"
                                  type="number"
                                  step="0.01"
                                  value={item.amount}
                                  onChange={(e) => updateItem(index, 'amount', e.target.value)}
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Notice Document */}
        <div className="print-area max-w-4xl mx-auto print:shadow-none print:max-w-none print:mx-0">
          <div className="p-8 print:p-1 print:pt-6">
            {/* Header with embedded content */}
            <div className="flex justify-between items-start">
              {/* Left side - Date, Company, and Content */}
              <div className="flex-1 print:pl-0">
                {/* Date and Company Info */}
                <div className="text-sm mb-3">{new Date(notice.dateIssued).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: '2-digit' 
                })}</div>
                <div className="font-bold text-lg mb-1">{notice.tenant.businessName.toUpperCase()}</div>
                <div className="text-sm mb-6">General Santos City</div>
                
                {/* Title - now positioned at the same level as Philippines */}
                <div className="text-center mb-4 mt-16">
                  <h2 className="text-base font-bold underline ml-48">
                    {getNoticeTitle(notice.noticeType, notice.noticeNumber)}
                  </h2>
                </div>
                
                {/* Salutation */}
                <div className="mt-6">
                  <p className="text-sm">Dear Sir/Ma&apos;am:</p>
                </div>
              </div>
              
              {/* Right side - Company Header */}
              <div className="text-right mr-[-20px] mt-[-30px] print:pr-1">
                <div className="mb-1 flex items-center justify-center">
                  <Image 
                    src='/rdrdc-logo.png' 
                    alt="RD Realty Development Corporation Logo" 
                    width={80}
                    height={80}
                    className="object-contain"
                    unoptimized={true}
                    onError={(e) => {
                      console.error('Logo failed to load:', e);
                    }}
                  />
                </div>
                <div className="text-sm font-bold mb-1 text-center">RD Realty Development Corporation</div>
                <div className="border-b border-gray-400 mb-1"></div>
                <div className="text-xs text-gray-500 leading-tight text-left">
                  Cagampang Ext., Santiago Subdivision<br />
                  Brgy. Bula, General Santos City 9500<br />
                  Philippines<br />
                  Tel +6383 552 4435<br />
                  Fax +6383 301 2386<br />
                  www.rdrealty.ph
                </div>
                <div className="border-b border-gray-400 mt-1"></div>
              </div>
            </div>

            {/* Content - Full Width Outside Flex Container */}
            <div className="leading-normal text-sm mb-[-20px]" style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
              <p style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
                {getNoticeContent(notice.noticeType, notice.noticeNumber).beforeAmount}
                <span className="font-bold underline">
                  {getNoticeContent(notice.noticeType, notice.noticeNumber).amount}
                </span>
                {getNoticeContent(notice.noticeType, notice.noticeNumber).afterAmount}
              </p>
            </div>

            {/* Amount Table */}
            <div className="mb-6 mt-6">
              <table className="w-full border-collapse">
                <tbody>
                  {isEditing 
                    ? items.map((item, index) => {
                        const displayStatus = item.status === "CUSTOM" && item.customStatus 
                          ? item.customStatus 
                          : item.status.replace('_', ' ');
                        
                        const displayMonths = item.months ? `${item.months} ${item.year}` : `${item.year}`;
                        const itemAmount = parseFloat(item.amount) || 0;
                        
                        return (
                          <tr key={index} className="border-b border-black">
                            <td className="px-2 py-2 font-semibold text-sm">{item.description}</td>
                            <td className="px-2 py-2 font-semibold text-center text-sm">{displayStatus}</td>
                            <td className="px-2 py-2 font-semibold text-center text-sm">{displayMonths}</td>
                            <td className="px-2 py-2 font-semibold text-right text-sm">₱{itemAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })
                    : notice.items?.map((item, index) => {
                        const displayStatus = item.status === "CUSTOM" && item.customStatus 
                          ? item.customStatus 
                          : item.status.replace('_', ' ');
                        
                        const displayMonths = item.months ? `${item.months} ${notice.forYear}` : `${notice.forMonth} ${notice.forYear}`;
                        
                        return (
                          <tr key={item.id} className="border-b border-black">
                            <td className="px-2 py-2 font-semibold text-sm">{item.description}</td>
                            <td className="px-2 py-2 font-semibold text-center text-sm">{displayStatus}</td>
                            <td className="px-2 py-2 font-semibold text-center text-sm">{displayMonths}</td>
                            <td className="px-2 py-2 font-semibold text-right text-sm">₱{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })
                  }

                  <tr className="bg-yellow-200 print-yellow border-b border-black">
                    <td className="px-2 py-2 font-bold text-sm" colSpan={3}>Total Outstanding Balance</td>
                    <td className="px-2 py-2 font-bold text-right text-sm">₱{
                      isEditing 
                        ? items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : notice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    }</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Second paragraph for first/second notices */}
            {(notice.noticeNumber < 3 && notice.noticeType !== "FINAL_NOTICE") && (
              <div className="mb-6 text-justify-full leading-normal text-sm" style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
                <p style={{ textAlign: 'justify', textJustify: 'inter-word' }}>We kindly request that you make immediate payment to prevent the imposition of interest and penalty charges. If you have any questions or concerns about your account, please don&apos;t hesitate to reach out to us. Your prompt attention to this matter is greatly appreciated. Thank you.</p>
              </div>
            )}

            {/* Final notice warning - appears after table */}
            {(notice.noticeNumber >= 3 || notice.noticeType === "FINAL_NOTICE") && (
              <div className="mb-6 text-justify-full leading-normal text-sm" style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
                <p style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
                  {getFinalNoticeWarning().beforeWarning}
                  <span className="font-bold">
                    {getFinalNoticeWarning().warning}
                  </span>
                  {getFinalNoticeWarning().afterWarning}
                </p>
              </div>
            )}

            {/* Closing */}
            <div className="mb-12">
              <p className="text-sm">Very truly yours,</p>
            </div>

            {/* Signatories */}
            <div className="mb-8">
              {/* Primary Signatory */}
              <div className="mb-8 signature-container">
                {getSignatureImage(notice.primarySignatory) && (
                  <Image 
                    src={getSignatureImage(notice.primarySignatory)!}
                    alt={`${notice.primarySignatory} signature`}
                    width={120}
                    height={40}
                    className="signature-image mt-[-75px] ml-4 object-contain"
                    unoptimized={true}
                    onError={(e) => {
                      console.error('Primary signature failed to load:', e);
                    }}
                  />
                )}
                <div className="font-bold underline text-sm signatory-name">{notice.primarySignatory}</div>
                <div className="text-sm">{notice.primaryTitle}</div>
                <div className="text-sm">Mobile: {notice.primaryContact}</div>
              </div>
              
              <div className="mb-2">
                <div className="text-sm">Noted By:</div>
              </div>
              
              {/* Secondary Signatory */}
              <div className="mt-8 signature-container">
                {getSignatureImage(notice.secondarySignatory) && (
                  <Image 
                    src={getSignatureImage(notice.secondarySignatory)!}
                    alt={`${notice.secondarySignatory} signature`}
                    width={150}
                    height={60}
                    className="signature-image mt-[-20px] mr-6 object-contain"
                    unoptimized={true}
                    onError={(e) => {
                      console.error('Secondary signature failed to load:', e);
                    }}
                  />
                )}
                <div className="font-bold underline text-sm signatory-name">{notice.secondarySignatory}</div>
                <div className="text-sm">{notice.secondaryTitle}</div>
              </div>
            </div>

            {/* Received Section */}
            <div className="mb-6">
              <div className="flex justify-between items-end">
                <div className="flex-1 mr-8">
                  <div className="text-sm">Received by: ________________________________</div>
                  <div className="text-center text-xs mt-1">Printed Name/ Signature/ CP No.</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-sm">________________________________</div>
                  <div className="text-xs mt-1">Date/Time</div>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-20 text-xs text-red-500 print-red leading-tight">
              <p className="font-semibold">NOTE: PLEASE SUBMIT BIR FORM 2307 SO WE CAN DEDUCT IT FROM YOUR ACCOUNT.</p>
              <p className="text-blue-400 print-light-blue">Should payment have been made thru the bank, kindly send proof of payment to <span className="underline text-blue-900 print-navy-blue">collectiongroup@rdrealty.com.ph</span></p>
              <p className="italic text-blue-900 print-navy-blue">Thank you!</p>
            </div>

            {/* Status Badge - Only show on screen, not in print */}
            {notice.isSettled && (
              <div className="mt-4 text-center print:hidden">
                <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
                  SETTLED - {notice.settledDate ? new Date(notice.settledDate).toLocaleDateString() : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}