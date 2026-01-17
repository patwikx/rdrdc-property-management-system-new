"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  FileText,
  Calendar,
  Plus,
  Trash2,
  Building,
  UserCheck,
  DollarSign,
  AlertTriangle,
  Eye,
  Receipt,
  CreditCard,
  FileCheck,
  AlertCircle,
  Clock,
  XCircle,
  Edit3,
  User2,
  Check,
  ChevronsUpDown,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { createTenantNotice, getTenants, getTenantNoticeCount } from "@/lib/actions/tenant-notice";
import { cn } from "@/lib/utils";

interface Tenant {
  id: string;
  bpCode: string;
  firstName: string | null;
  lastName: string | null;
  company: string;
  businessName: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

const NOTICE_STATUSES = [
  { value: "PAST_DUE", label: "PAST DUE", icon: AlertCircle, color: "text-destructive" },
  { value: "OVERDUE", label: "OVERDUE", icon: XCircle, color: "text-destructive" },
  { value: "CRITICAL", label: "CRITICAL", icon: AlertTriangle, color: "text-destructive" },
  { value: "PENDING", label: "PENDING", icon: Clock, color: "text-muted-foreground" },
  { value: "UNPAID", label: "UNPAID", icon: CreditCard, color: "text-muted-foreground" },
  { value: "CUSTOM", label: "CUSTOM", icon: Edit3, color: "text-primary" }
];

const ITEM_TYPES = [
  { value: "space_rental", label: "SPACE RENTAL", icon: Building },
  { value: "bir_forms", label: "BIR 2307 FORMS", icon: FileCheck },
  { value: "utilities", label: "UTILITIES", icon: Receipt },
  { value: "other", label: "OTHER CHARGES", icon: DollarSign}
];

export default function CreateNoticePage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSignatories, setShowSignatories] = useState(false);
  const [openTenantCombobox, setOpenTenantCombobox] = useState(false);
  const [tenantNoticeCount, setTenantNoticeCount] = useState<number>(0);
  const [loadingNoticeCount, setLoadingNoticeCount] = useState(false);

  const [formData, setFormData] = useState({
    tenantId: "",
    noticeType: "FIRST_NOTICE",
    primarySignatory: "DARYLL JOY ENRIQUEZ",
    primaryTitle: "Credit and Collection Officer",
    primaryContact: "+63998 585 0879",
    secondarySignatory: "C.A.B. LAGUINDAM",
    secondaryTitle: "AVP - Finance/Controller"
  });

  const [items, setItems] = useState<Array<{
    description: string;
    itemType: string;
    status: string;
    customStatus: string;
    amount: string;
    months: string[];
    year: string;
  }>>([
    {
      description: "",
      itemType: "",
      status: "PAST_DUE",
      customStatus: "",
      amount: "",
      months: [MONTHS[new Date().getMonth()]],
      year: new Date().getFullYear().toString()
    }
  ]);

  const checkTenantNoticeCount = useCallback(async () => {
    if (!formData.tenantId) return;

    setLoadingNoticeCount(true);
    try {
      const count = await getTenantNoticeCount(formData.tenantId);
      setTenantNoticeCount(count);

      let noticeType = "FIRST_NOTICE";
      if (count === 1) noticeType = "SECOND_NOTICE";
      else if (count >= 2) noticeType = "FINAL_NOTICE";

      setFormData(prev => ({ ...prev, noticeType }));
    } catch (error) {
      console.error("Error checking notice count:", error);
      toast.error("Failed to check existing notices");
    } finally {
      setLoadingNoticeCount(false);
    }
  }, [formData.tenantId]);

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (formData.tenantId) {
      checkTenantNoticeCount();
    } else {
      setTenantNoticeCount(0);
      setFormData(prev => ({ ...prev, noticeType: "FIRST_NOTICE" }));
    }
  }, [formData.tenantId, checkTenantNoticeCount]);

  const loadTenants = async () => {
    try {
      const tenantsData = await getTenants();
      setTenants(tenantsData);
    } catch (error) {
      toast.error("Failed to load tenants");
    }
  };

  const getNoticeTypeInfo = (type: string, count: number) => {
    switch (type) {
      case "FIRST_NOTICE":
        return {
          label: "FIRST NOTICE",
          color: "border-l-4 border-primary bg-primary/5",
          icon: <div className="w-2 h-2 bg-primary rounded-none"></div>,
          description: count === 0 ? "INITIAL NOTICE ISSUANCE" : "NO PENDING NOTICES"
        };
      case "SECOND_NOTICE":
        return {
          label: "SECOND NOTICE",
          color: "border-l-4 border-orange-500 bg-orange-500/5",
          icon: <div className="w-2 h-2 bg-orange-500 rounded-none"></div>,
          description: `${count} PENDING NOTICES DETECTED`
        };
      case "FINAL_NOTICE":
        return {
          label: "FINAL NOTICE",
          color: "border-l-4 border-destructive bg-destructive/5",
          icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
          description: `${count} PENDING NOTICES - FINAL WARNING`
        };
      default:
        return {
          label: "UNKNOWN",
          color: "border-l-4 border-muted",
          icon: <div className="w-2 h-2 bg-muted-foreground rounded-none"></div>,
          description: ""
        };
    }
  };

  const addItem = () => {
    setItems([...items, {
      description: "",
      itemType: "",
      status: "PAST_DUE",
      customStatus: "",
      amount: "",
      months: [MONTHS[new Date().getMonth()]],
      year: new Date().getFullYear().toString()
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: string | string[] | boolean) => {
    const updatedItems = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setItems(updatedItems);
  };

  const formatMonthRange = (months: string[]) => {
    if (months.length <= 1) return months[0] || MONTHS[new Date().getMonth()];

    const sortedMonths = months.sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));

    const monthIndices = sortedMonths.map(month => MONTHS.indexOf(month));
    const isConsecutive = monthIndices.every((index, i) =>
      i === 0 || index === monthIndices[i - 1] + 1
    );

    if (isConsecutive && months.length > 2) {
      return `${sortedMonths[0]} — ${sortedMonths[sortedMonths.length - 1]}`;
    } else if (months.length === 2) {
      return `${sortedMonths[0]} — ${sortedMonths[1]}`;
    } else {
      return sortedMonths.join(', ');
    }
  };

  const getSignatureImage = (signatoryName: string) => {
    const normalizedName = signatoryName.toLowerCase().replace(/\s+/g, '');

    if (normalizedName.includes('daryll') || normalizedName.includes('daryl')) {
      return '/DJE.png';
    } else if (normalizedName.includes('laguindam') || normalizedName.includes('cab') || normalizedName.includes('c.a.b')) {
      return '/CABL.png';
    }

    return null;
  };

  const selectedTenant = tenants.find(t => t.id === formData.tenantId);

  const totalAmount = items.reduce((sum, item) => {
    const amount = parseFloat(item.amount) || 0;
    return sum + amount;
  }, 0);

  const getNoticeTitle = (type: string) => {
    if (type === "FINAL_NOTICE") {
      return "FINAL NOTICE AND WARNING";
    }
    return type === "FIRST_NOTICE" ? "First Notice of Collection" : "Second Notice of Collection";
  };

  const getNoticeContent = (type: string) => {
    const formattedAmount = `₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (type === "FINAL_NOTICE") {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tenantId) {
      toast.error("Please select a tenant");
      return;
    }

    const validItems = items.filter(item => {
      const hasDescription = item.description.trim();
      const hasAmount = item.amount && parseFloat(item.amount) > 0;
      const hasValidStatus = item.status !== "CUSTOM" || (item.status === "CUSTOM" && item.customStatus.trim());
      const hasItemType = item.itemType.trim(); 
      return hasDescription && hasAmount && hasValidStatus && hasItemType;
    });

    if (validItems.length === 0) {
      toast.error("Please add at least one valid item with description, type, amount, and status");
      return;
    }

    const invalidCustomItems = items.filter(item =>
      item.status === "CUSTOM" && !item.customStatus.trim()
    );

    if (invalidCustomItems.length > 0) {
      toast.error("Please enter custom status for all items marked as 'Custom'");
      return;
    }

    setLoading(true);
    try {
      const newNotice = await createTenantNotice({
        ...formData,
        items: validItems.map(item => ({
          description: item.description,
          status: item.status === "CUSTOM" ? item.customStatus : item.status,
          amount: parseFloat(item.amount),
          months: formatMonthRange(item.months),
          year: parseInt(item.year)
        })),
        forYear: parseInt(validItems[0]?.year || new Date().getFullYear().toString())
      });

      toast.success("Notice created successfully!");

      if (newNotice && newNotice.id) {
        router.push(`/notices/${newNotice.id}`);
      } else {
        router.push("/notices");
      }
    } catch (error) {
      toast.error("Failed to create notice");
    } finally {
      setLoading(false);
    }
  };

  const noticeTypeInfo = getNoticeTypeInfo(formData.noticeType, tenantNoticeCount);

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
          .print-area {
            padding: 0.1in 0.15in !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-yellow {
            background-color: #fef08a !important;
            -webkit-print-color-adjust: exact !important;
          }
          .print-red {
            color: #dc2626 !important;
            -webkit-print-color-adjust: exact !important;
          }
          .print-blue {
            color: #2563eb !important;
            -webkit-print-color-adjust: exact !important;
          }
          .print-light-blue {
            color: #60a5fa !important;
            -webkit-print-color-adjust: exact !important;
          }
          .print-navy-blue {
            color: #1e3a8a !important;
            -webkit-print-color-adjust: exact !important;
          }
          .signature-container {
            position: relative;
          }
          .signature-image {
            position: absolute;
            top: -20px;
            left: 0;
            z-index: 1;
          }
          .signature-image-secondary {
            position: absolute;
            top: -22px;
            left: 0;
            z-index: 1;
          }
          .signatory-name {
            position: relative;
            z-index: 2;
          }
        }

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

        .signature-container {
          position: relative;
        }
        .signature-image {
          position: absolute;
          top: -20px;
          left: 0;
          z-index: 1;
        }
        .signature-image-secondary {
          position: absolute;
          top: -22px;
          left: 0;
          z-index: 1;
        }
        .signatory-name {
          position: relative;
          z-index: 2;
        }
      `}</style>

      <div className="container mx-auto py-6">
        <div className="flex gap-6">
          {/* Form Section - Left Side */}
          <div className="w-1/2 space-y-6">
            <Card className="rounded-none border border-border shadow-none">
              <CardHeader className="pb-4 border-b border-border bg-muted/5">
                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                  <FileText className="h-4 w-4" />
                  Generate Notice
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* Basic Information Section */}
                  <div className="space-y-4">
                    <div className="border border-border p-4 bg-background">
                      <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-muted-foreground border-b border-border pb-2">Tenant Details</h3>

                      <div className="grid grid-cols-1 gap-4">
                        {/* Tenant Selection with Combobox */}
                        <div className="space-y-1.5">
                          <Label htmlFor="tenant" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
                            <User2 className="h-3 w-3" />
                            Target Tenant <span className="text-destructive">*</span>
                          </Label>
                          <Popover open={openTenantCombobox} onOpenChange={setOpenTenantCombobox}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openTenantCombobox}
                                className="w-full justify-between h-9 rounded-none border-border font-mono text-xs uppercase"
                              >
                                {formData.tenantId
                                  ? (() => {
                                    const tenant = tenants.find((t) => t.id === formData.tenantId);
                                    return tenant ? `${tenant.bpCode} — ${tenant.businessName}` : "SELECT TENANT...";
                                  })()
                                  : "SELECT TENANT..."}
                                <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0 rounded-none border-border">
                              <Command className="rounded-none">
                                <CommandInput
                                  placeholder="SEARCH TENANT..."
                                  className="h-9 rounded-none font-mono text-xs uppercase"
                                />
                                <CommandEmpty className="p-2 font-mono text-xs">NO TENANT FOUND.</CommandEmpty>
                                <CommandGroup className="max-h-64 overflow-y-auto">
                                  {tenants.map((tenant) => (
                                    <CommandItem
                                      key={tenant.id}
                                      value={`${tenant.bpCode} ${tenant.businessName} ${tenant.firstName || ''} ${tenant.lastName || ''} ${tenant.company}`}
                                      onSelect={() => {
                                        setFormData({ ...formData, tenantId: tenant.id });
                                        setOpenTenantCombobox(false);
                                      }}
                                      className="cursor-pointer rounded-none font-mono text-xs"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-3 w-3",
                                          formData.tenantId === tenant.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-bold">{tenant.bpCode} — {tenant.businessName}</span>
                                        {(tenant.firstName || tenant.lastName) && (
                                          <span className="text-[10px] text-muted-foreground uppercase">
                                            {[tenant.firstName, tenant.lastName].filter(Boolean).join(' ')}
                                          </span>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Notice Type - Auto-determined with status info */}
                        <div className="space-y-1.5">
                          <Label htmlFor="noticeType" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
                            <FileText className="h-3 w-3" />
                            Notice Class {loadingNoticeCount && <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-primary"></div>}
                          </Label>
                          <div className={`p-3 rounded-none border border-border ${noticeTypeInfo.color}`}>
                            <div className="flex items-center gap-2 mb-1">
                              {noticeTypeInfo.icon}
                              <span className="font-mono text-sm font-bold uppercase">{noticeTypeInfo.label}</span>
                            </div>
                            {formData.tenantId && (
                              <div className="flex items-start gap-1 text-[10px] font-mono text-muted-foreground uppercase">
                                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>{noticeTypeInfo.description}</span>
                              </div>
                            )}
                            {!formData.tenantId && (
                              <div className="text-[10px] font-mono text-muted-foreground uppercase opacity-75">
                                TENANT SELECTION REQUIRED
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notice Items Section */}
                  <div className="space-y-4">
                    <div className="border border-border p-4 bg-background">
                      <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Notice Items</h3>
                        <Button
                          type="button"
                          onClick={addItem}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 rounded-none h-7 text-[10px] font-mono uppercase border-border"
                        >
                          <Plus className="h-3 w-3" />
                          Add Item
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {items.map((item, index) => (
                          <div key={index} className="bg-muted/5 border border-border p-4 rounded-none">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-mono text-xs font-bold uppercase flex items-center gap-2">
                                {(() => {
                                  const itemType = ITEM_TYPES.find(type => type.value === item.itemType);
                                  const IconComponent = itemType?.icon;
                                  return IconComponent ? <IconComponent className="h-3 w-3" /> : null;
                                })()}
                                LINE ITEM {index + 1}
                              </h4>
                              {items.length > 1 && (
                                <Button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive h-7 w-7 p-0 rounded-none hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>

                            <div className="space-y-3">
                              {/* First Row: Item Type and Description */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
                                    <FileText className="h-3 w-3" />
                                    Type <span className="text-destructive">*</span>
                                  </Label>
                                  <Select
                                    value={item.itemType}
                                    onValueChange={(value) => {
                                      const selectedType = ITEM_TYPES.find(type => type.value === value);
                                      const updatedItems = items.map((i, idx) => {
                                        if (idx === index) {
                                          return {
                                            ...i,
                                            itemType: value,
                                            description: selectedType ? selectedType.label : i.description,
                                          };
                                        }
                                        return i;
                                      });
                                      setItems(updatedItems);
                                    }}
                                  >
                                    <SelectTrigger className="h-9 rounded-none font-mono text-xs uppercase border-border">
                                      {/* Use a placeholder when the value is an empty string */}
                                      <SelectValue placeholder="SELECT TYPE" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-none border-border">
                                      {ITEM_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value} className="font-mono text-xs rounded-none cursor-pointer uppercase">
                                          <div className="flex items-center gap-2">
                                            <type.icon className="h-3 w-3" />
                                            {type.label}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-1">
                                  <Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
                                    <Edit3 className="h-3 w-3" />
                                    Desc <span className="text-destructive">*</span>
                                  </Label>
                                  <Input
                                    className="h-9 rounded-none font-mono text-xs uppercase border-border"
                                    value={item.description}
                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                    placeholder="DESCRIPTION"
                                  />
                                </div>
                              </div>

                              {/* Second Row: Months, Year, and Amount */}
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
                                    <Calendar className="h-3 w-3" />
                                    Month(s) <span className="text-destructive">*</span>
                                  </Label>
                                  <Select>
                                    <SelectTrigger className="h-9 rounded-none font-mono text-xs uppercase border-border">
                                      <SelectValue placeholder={
                                        item.months.length === 0
                                          ? "SELECT MONTHS"
                                          : `${item.months.length} SELECTED`
                                      } />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-none border-border">
                                      {MONTHS.map((month) => (
                                        <div
                                          key={month}
                                          className="flex items-center space-x-2 px-2 py-1.5 cursor-pointer hover:bg-muted/10 rounded-none"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            const currentMonths = item.months || [];
                                            if (currentMonths.includes(month)) {
                                              updateItem(index, 'months', currentMonths.filter(m => m !== month));
                                            } else {
                                              updateItem(index, 'months', [...currentMonths, month]);
                                            }
                                          }}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={item.months.includes(month)}
                                            onChange={() => {}}
                                            className="rounded-none accent-primary"
                                          />
                                          <span className="text-xs font-mono uppercase">{month}</span>
                                        </div>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-1">
                                  <Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
                                    <Calendar className="h-3 w-3" />
                                    Year <span className="text-destructive">*</span>
                                  </Label>
                                  <Select
                                    key={`year-${index}-${item.year}`}
                                    value={item.year}
                                    onValueChange={(value) => {
                                      updateItem(index, 'year', value);
                                    }}
                                  >
                                    <SelectTrigger className="h-9 rounded-none font-mono text-xs uppercase border-border">
                                      <SelectValue placeholder="YEAR" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-none border-border">
                                      {YEARS.map((year) => (
                                        <SelectItem key={year} value={year.toString()} className="font-mono text-xs rounded-none cursor-pointer">
                                          {year}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-1">
                                  <Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
                                    <span className="font-bold text-[10px]">₱</span>
                                    Amount <span className="text-destructive">*</span>
                                  </Label>
                                  <div className="relative">
                                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground text-xs font-mono">₱</span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      className="h-9 pl-6 rounded-none font-mono text-xs border-border"
                                      value={item.amount}
                                      onChange={(e) => updateItem(index, 'amount', e.target.value)}
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Third Row: Status */}
                              <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1">
                                  <Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
                                    <AlertCircle className="h-3 w-3" />
                                    Status
                                  </Label>
                                  <div className="grid grid-cols-2 gap-4">
                                    <Select
                                      value={item.status}
                                      onValueChange={(value) => updateItem(index, 'status', value)}
                                    >
                                      <SelectTrigger className="h-9 rounded-none font-mono text-xs uppercase border-border">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="rounded-none border-border">
                                        {NOTICE_STATUSES.map((status) => {
                                          const IconComponent = status.icon;
                                          return (
                                            <SelectItem key={status.value} value={status.value} className="font-mono text-xs rounded-none cursor-pointer uppercase">
                                              <div className="flex items-center gap-2">
                                                <IconComponent className={`h-3 w-3 ${status.color}`} />
                                                {status.label}
                                              </div>
                                            </SelectItem>
                                          );
                                        })}
                                      </SelectContent>
                                    </Select>

                                    {/* Custom Status Input */}
                                    {item.status === "CUSTOM" && (
                                      <Input
                                        className="h-9 rounded-none font-mono text-xs uppercase border-border"
                                        value={item.customStatus}
                                        onChange={(e) => updateItem(index, 'customStatus', e.target.value)}
                                        placeholder="ENTER CUSTOM STATUS"
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Signatories Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Signatories
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSignatories(!showSignatories)}
                        className="rounded-none h-7 text-[10px] font-mono uppercase border-border"
                      >
                        {showSignatories ? 'HIDE' : 'EDIT'}
                      </Button>
                    </div>

                    {showSignatories && (
                      <div className="border border-border p-4 bg-muted/5">
                        <div className="grid grid-cols-2 gap-8">
                          {/* Primary Signatory */}
                          <div className="bg-blue-50/10 border border-blue-200 p-4 space-y-4 rounded-none">
                            <h4 className="font-bold text-xs uppercase tracking-wide text-blue-900 flex items-center gap-2">
                              <UserCheck className="h-3 w-3" />
                              Credit & Collection Officer
                            </h4>

                            <div className="grid grid-cols-1 gap-3">
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase tracking-wide text-gray-700">Full Name</Label>
                                <Input
                                  className="h-8 rounded-none font-mono text-xs uppercase border-blue-200"
                                  value={formData.primarySignatory}
                                  onChange={(e) => setFormData({ ...formData, primarySignatory: e.target.value })}
                                  placeholder="ENTER FULL NAME"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold uppercase tracking-wide text-gray-700">Job Title</Label>
                                  <Input
                                    className="h-8 rounded-none font-mono text-xs uppercase border-blue-200"
                                    value={formData.primaryTitle}
                                    onChange={(e) => setFormData({ ...formData, primaryTitle: e.target.value })}
                                    placeholder="ENTER TITLE"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold uppercase tracking-wide text-gray-700">Contact</Label>
                                  <Input
                                    className="h-8 rounded-none font-mono text-xs uppercase border-blue-200"
                                    value={formData.primaryContact}
                                    onChange={(e) => setFormData({ ...formData, primaryContact: e.target.value })}
                                    placeholder="ENTER CONTACT"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Secondary Signatory */}
                          <div className="bg-green-50/10 border border-green-200 p-4 space-y-4 rounded-none">
                            <h4 className="font-bold text-xs uppercase tracking-wide text-green-900 flex items-center gap-2">
                              <User className="h-3 w-3" />
                              AVP - Finance/Controller
                            </h4>

                            <div className="grid grid-cols-1 gap-3">
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase tracking-wide text-gray-700">Full Name</Label>
                                <Input
                                  className="h-8 rounded-none font-mono text-xs uppercase border-green-200"
                                  value={formData.secondarySignatory}
                                  onChange={(e) => setFormData({ ...formData, secondarySignatory: e.target.value })}
                                  placeholder="ENTER FULL NAME"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase tracking-wide text-gray-700">Job Title</Label>
                                <Input
                                  className="h-8 rounded-none font-mono text-xs uppercase border-green-200"
                                  value={formData.secondaryTitle}
                                  onChange={(e) => setFormData({ ...formData, secondaryTitle: e.target.value })}
                                  placeholder="ENTER TITLE"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      className="px-6 rounded-none uppercase text-xs font-bold tracking-wider border-border"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !formData.tenantId}
                      className="px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-none uppercase text-xs font-bold tracking-wider disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                          PROCESSING...
                        </>
                      ) : (
                        "GENERATE NOTICE"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section - Right Side */}
          <div className="w-[1000px]">
            <Card className="rounded-none border border-border shadow-none h-full">
              <CardHeader className="border-b border-border bg-muted/5 py-3">
                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                  <Eye className="h-4 w-4" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                <div className="print-area max-w-4xl mx-auto print:shadow-none print:max-w-none print:mx-0">
                  <div className="p-8 print:p-1 print:pt-6">
                    {/* Header with embedded content */}
                    <div className="flex justify-between items-start mb-6">
                      {/* Left side - Date, Company, and Content */}
                      <div className="flex-1 print:pl-0">
                        {/* Date and Company Info */}
                        <div className="text-sm mb-3 font-mono">{new Date().toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: '2-digit'
                        })}</div>
                        <div className="font-bold text-lg mb-1 uppercase tracking-tight">
                          {selectedTenant ? selectedTenant.businessName : 'SELECT TENANT'}
                        </div>
                        <div className="text-sm mb-6 font-mono text-muted-foreground">General Santos City</div>

                        {/* Title - now positioned at the same level as Philippines */}
                        <div className="text-center mb-4 mt-16">
                          <h2 className="text-base font-bold underline ml-48 uppercase tracking-widest">
                            {getNoticeTitle(formData.noticeType)}
                          </h2>
                        </div>

                        {/* Salutation */}
                        <div className="mt-6">
                          <p className="text-sm font-mono">Dear Sir/Ma&apos;am:</p>
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
                            className="object-contain grayscale contrast-125"
                            unoptimized={true}
                            onError={(e) => {
                              console.error('Logo failed to load:', e);
                            }}
                          />
                        </div>
                        <div className="text-sm font-bold mb-1 text-center uppercase tracking-tight">RD Realty Development Corporation</div>
                        <div className="border-b border-black mb-1"></div>
                        <div className="text-[10px] text-gray-500 leading-tight text-left font-mono">
                          Cagampang Ext., Santiago Subdivision<br />
                          Brgy. Bula, General Santos City 9500<br />
                          Philippines<br />
                          Tel +6383 552 4435<br />
                          Fax +6383 301 2386<br />
                          www.rdrealty.ph
                        </div>
                        <div className="border-b border-black mt-1"></div>
                      </div>
                    </div>

                    {/* Content - Full Width Outside Flex Container */}
                    <div className="leading-normal text-sm font-serif" style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
                      <p style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
                        {getNoticeContent(formData.noticeType).beforeAmount}
                        <span className="font-bold underline font-mono">
                          {getNoticeContent(formData.noticeType).amount}
                        </span>
                        {getNoticeContent(formData.noticeType).afterAmount}
                      </p>
                    </div>

                    {/* Amount Table */}
                    <div className="mb-3 mt-3">
                      <table className="w-full border-collapse border border-black">
                        <thead className="bg-gray-100">
                          <tr className="border-b border-black">
                            <th className="px-2 py-1 text-left text-xs font-bold uppercase border-r border-black">Description</th>
                            <th className="px-2 py-1 text-center text-xs font-bold uppercase border-r border-black">Status</th>
                            <th className="px-2 py-1 text-center text-xs font-bold uppercase border-r border-black">Period</th>
                            <th className="px-2 py-1 text-right text-xs font-bold uppercase">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.filter(item => item.description || item.amount).map((item, index) => {
                            const displayStatus = item.status === "CUSTOM" ? item.customStatus : item.status.replace('_', ' ');
                            const displayMonths = formatMonthRange(item.months);

                            return (
                              <tr key={index} className="border-b border-black">
                                <td className="px-2 py-1 text-xs font-mono border-r border-black">{item.description || 'Description'}</td>
                                <td className="px-2 py-1 text-center text-xs font-mono uppercase border-r border-black">{displayStatus}</td>
                                <td className="px-2 py-1 text-center text-xs font-mono uppercase border-r border-black">{displayMonths} {item.year}</td>
                                <td className="px-2 py-1 text-right text-xs font-mono">₱{(parseFloat(item.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              </tr>
                            );
                          })}
                          <tr className="bg-yellow-200 print-yellow border-t-2 border-black">
                            <td className="px-2 py-1 font-bold text-xs uppercase border-r border-black" colSpan={3}>Total Outstanding Balance</td>
                            <td className="px-2 py-1 font-bold text-right text-xs font-mono">₱{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Second paragraph for first/second notices */}
                    {formData.noticeType !== "FINAL_NOTICE" && (
                      <div className="mb-3 text-justify-full leading-normal text-sm font-serif" style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
                        <p style={{ textAlign: 'justify', textJustify: 'inter-word' }}>We kindly request that you make immediate payment to prevent the imposition of interest and penalty charges. If you have any questions or concerns about your account, please don&apos;t hesitate to reach out to us. Your prompt attention to this matter is greatly appreciated. Thank you.</p>
                      </div>
                    )}

                    {/* Final notice warning - appears after table */}
                    {formData.noticeType === "FINAL_NOTICE" && (
                      <div className="mb-3 text-justify-full leading-normal text-xs font-serif" style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
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
                    <div className="mb-6">
                      <p className="text-sm font-mono">Very truly yours,</p>
                    </div>

                    {/* Signatories with E-Signatures */}
                    <div className="mb-4">
                      {/* Primary Signatory */}
                      <div className="mb-4 signature-container">
                        {getSignatureImage(formData.primarySignatory) && (
                          <Image
                            src={getSignatureImage(formData.primarySignatory)!}
                            alt={`${formData.primarySignatory} signature`}
                            width={80}
                            height={25}
                            className="signature-image mt-[-50px] ml-6 object-contain"
                            unoptimized={true}
                            onError={(e) => {
                              console.error('Primary signature failed to load:', e);
                            }}
                          />
                        )}
                        <div className="font-bold underline text-xs signatory-name uppercase">{formData.primarySignatory}</div>
                        <div className="text-xs font-mono">{formData.primaryTitle}</div>
                        <div className="text-xs font-mono">Mobile: {formData.primaryContact}</div>
                      </div>

                      <div className="mb-1">
                        <div className="text-xs font-mono">Noted By:</div>
                      </div>

                      {/* Secondary Signatory */}
                      <div className="mt-4 signature-container">
                        {getSignatureImage(formData.secondarySignatory) && (
                          <Image
                            src={getSignatureImage(formData.secondarySignatory)!}
                            alt={`${formData.secondarySignatory} signature`}
                            width={150}
                            height={70}
                            className="signature-image-secondary mt-[-20px] ml-[-15px] object-contain"
                            unoptimized={true}
                            onError={(e) => {
                              console.error('Secondary signature failed to load:', e);
                            }}
                          />
                        )}
                        <div className="font-bold underline text-xs signatory-name uppercase">{formData.secondarySignatory}</div>
                        <div className="text-xs font-mono">{formData.secondaryTitle}</div>
                      </div>
                    </div>

                    {/* Received Section */}
                    <div className="mb-3 border-t border-black pt-2">
                      <div className="flex justify-between items-end">
                        <div className="flex-1 mr-4">
                          <div className="text-xs font-mono">Received by: ____________________</div>
                          <div className="text-center text-[10px] mt-1 font-mono uppercase">Printed Name/ Signature/ CP No.</div>
                        </div>
                        <div className="flex-1 text-center">
                          <div className="text-xs font-mono">____________________</div>
                          <div className="text-[10px] mt-1 font-mono uppercase">Date/Time</div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-10 text-[10px] text-destructive print-red leading-tight font-mono border-t border-dashed border-gray-300 pt-2">
                      <p className="font-semibold uppercase">NOTE: PLEASE SUBMIT BIR FORM 2307 SO WE CAN DEDUCT IT FROM YOUR ACCOUNT.</p>
                      <p className="text-primary print-light-blue">Should payment have been made thru the bank, kindly send proof of payment to <span className="underline text-primary print-navy-blue">collectiongroup@rdrealty.com.ph</span></p>
                      <p className="italic text-blue-900 print-navy-blue">Thank you!</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}