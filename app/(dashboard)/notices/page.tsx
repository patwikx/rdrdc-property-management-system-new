"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Plus, 
  Eye, 
  CheckCircle, 
  Trash2, 
  Check, 
  ChevronsUpDown,
  FileText,
  Clock,
  DollarSign,
  AlertTriangle,
  Building2,
  Calendar,
  Activity,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { getTenantNotices, getTenants, settleNotice, deleteNotice } from "@/lib/actions/tenant-notice";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface Notice {
  id: string;
  noticeType: string;
  noticeNumber: number;
  totalAmount: number;
  forMonth: string;
  forYear: number;
  dateIssued: Date;
  isSettled: boolean;
  settledDate: Date | null;
  tenant: {
    id: string;
    bpCode: string;
    businessName: string;
    company: string;
  };
  createdBy: {
    firstName: string;
    lastName: string;
  };
  items?: Array<{
    id: string;
    description: string;
    status: string;
    amount: number;
  }>;
}

interface Tenant {
  id: string;
  bpCode: string;
  businessName: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="h-4 w-4 text-muted-foreground">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TenantNoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantComboboxOpen, setTenantComboboxOpen] = useState(false);
  const [filters, setFilters] = useState({
    tenantId: "all",
    status: "all",
    isSettled: "all"
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [noticesData, tenantsData] = await Promise.all([
        getTenantNotices({
          tenantId: filters.tenantId === "all" ? undefined : filters.tenantId,
          status: filters.status === "all" ? undefined : filters.status,
          isSettled: filters.isSettled === "all" ? undefined : filters.isSettled === "true"
        }),
        getTenants()
      ]);
      
      setNotices(noticesData as Notice[]);
      setTenants(tenantsData);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const totalNotices = notices.length;
    const activeNotices = notices.filter(notice => !notice.isSettled).length;
    const settledNotices = notices.filter(notice => notice.isSettled).length;
    const totalAmount = notices.reduce((sum, notice) => sum + notice.totalAmount, 0);
    const criticalNotices = notices.filter(notice => 
      notice.items?.some(item => item.status === "CRITICAL") && !notice.isSettled
    ).length;

    return {
      total: totalNotices,
      active: activeNotices,
      settled: settledNotices,
      totalAmount,
      critical: criticalNotices,
    };
  }, [notices]);

  const handleSettleNotice = async (noticeId: string) => {
    try {
      await settleNotice(noticeId, "Manual Settlement");
      toast.success("Notice settled successfully!");
      loadData();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to settle notice");
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    try {
      await deleteNotice(noticeId);
      toast.success("Notice deleted successfully!");
      loadData();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to delete notice");
    }
  };

  const getNoticeTypeBadge = (type: string, number: number) => {
    const noticeText = number === 1 ? "1st" : number === 2 ? "2nd" : "Final";
    
    if (type === "FINAL_NOTICE") {
      return (
        <Badge variant="destructive">
          {noticeText} Notice
        </Badge>
      );
    } else if (type === "SECOND_NOTICE") {
      return (
        <Badge variant="secondary" className="text-orange-600 dark:text-orange-400">
          {noticeText} Notice
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          {noticeText} Notice
        </Badge>
      );
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return <Badge variant="outline">N/A</Badge>;
    
    if (status === "CRITICAL") {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {status.replace("_", " ")}
        </Badge>
      );
    } else if (status === "OVERDUE") {
      return (
        <Badge variant="secondary" className="text-orange-600 dark:text-orange-400">
          <Clock className="w-3 h-3 mr-1" />
          {status.replace("_", " ")}
        </Badge>
      );
    } else if (status === "PAST_DUE") {
      return (
        <Badge variant="outline" className="text-yellow-600 dark:text-yellow-400">
          <Clock className="w-3 h-3 mr-1" />
          {status.replace("_", " ")}
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          {status.replace("_", " ")}
        </Badge>
      );
    }
  };

  const selectedTenant = tenants.find(tenant => tenant.id === filters.tenantId);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tenant Notices</h2>
          <p className="text-muted-foreground">
            Manage and track tenant payment notices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {(filters.tenantId !== "all" || filters.status !== "all" || filters.isSettled !== "all") && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {[filters.tenantId !== "all", filters.status !== "all", filters.isSettled !== "all"].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Notices</SheetTitle>
                <SheetDescription>
                  Filter notices by tenant, status, and settlement state
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-6 mr-4 ml-4">
                {/* Tenant Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Tenant
                  </label>
                  <Popover open={tenantComboboxOpen} onOpenChange={setTenantComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={tenantComboboxOpen}
                        className="w-full justify-between"
                      >
                        {selectedTenant
                          ? `${selectedTenant.businessName}`
                          : "All Tenants"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search tenants..." className="h-9" />
                        <CommandEmpty>No tenant found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                          <CommandItem
                            value="all"
                            onSelect={() => {
                              setFilters({ ...filters, tenantId: "all" });
                              setTenantComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filters.tenantId === "all" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            All Tenants
                          </CommandItem>
                          {tenants.map((tenant) => (
                            <CommandItem
                              key={tenant.id}
                              value={`${tenant.businessName} ${tenant.bpCode}`}
                              onSelect={() => {
                                setFilters({ ...filters, tenantId: tenant.id });
                                setTenantComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filters.tenantId === tenant.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div>
                                <div className="font-medium">{tenant.businessName}</div>
                                <div className="text-xs text-muted-foreground">{tenant.bpCode}</div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Status
                  </label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="PAST_DUE">Past Due</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Settlement Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Settlement
                  </label>
                  <Select
                    value={filters.isSettled}
                    onValueChange={(value) => setFilters({ ...filters, isSettled: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Notices" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Notices</SelectItem>
                      <SelectItem value="false">Active Notices</SelectItem>
                      <SelectItem value="true">Settled Notices</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick Actions */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => setFilters({ ...filters, isSettled: "false", status: "CRITICAL" })}
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Critical Notices
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => setFilters({ tenantId: "all", status: "all", isSettled: "false" })}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      All Active
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => setFilters({ tenantId: "all", status: "all", isSettled: "true" })}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      All Settled
                    </Button>
                  </div>
                </div>

                {/* Clear Filters */}
                {(filters.tenantId !== "all" || filters.status !== "all" || filters.isSettled !== "all") && (
                  <div className="border-t pt-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setFilters({ tenantId: "all", status: "all", isSettled: "all" })}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
          
          <Button 
            onClick={() => router.push("/notices/create")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Notice
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div>
        <div className="grid grid-cols-5 gap-4">
          <StatCard
            title="Total Notices"
            value={stats.total}
            description="All notices issued"
            icon={<FileText className="h-4 w-4" />}
          />
          <StatCard
            title="Active Notices"
            value={stats.active}
            description="Pending settlement"
            icon={<Clock className="h-4 w-4" />}
          />
          <StatCard
            title="Settled Notices"
            value={stats.settled}
            description="Successfully resolved"
            icon={<CheckCircle className="h-4 w-4" />}
          />
          <StatCard
            title="Total Amount"
            value={`₱${stats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            description="Outstanding amount"
            icon={<DollarSign className="h-4 w-4" />}
          />
          <StatCard
            title="Critical Notices"
            value={stats.critical}
            description="Require attention"
            icon={<AlertTriangle className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Main Content - Table */}
      <Card>
        <CardContent className="p-0">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Tenant
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notice Type
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Amount
                    </div>
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Status
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Period
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Issued
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Settlement
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-muted-foreground">Loading notices...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : notices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <FileText className="mx-auto h-8 w-8 mb-2" />
                        <p className="text-sm">No notices found</p>
                        <p className="text-xs mt-1">Try adjusting your filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  notices.map((notice) => (
                    <TableRow key={notice.id}>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-sm">{notice.tenant.businessName}</div>
                            <div className="text-xs text-muted-foreground">{notice.tenant.bpCode}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getNoticeTypeBadge(notice.noticeType, notice.noticeNumber)}
                      </TableCell>
                      <TableCell className="font-medium">
                        ₱{notice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate text-sm" title={notice.items?.map(item => item.description).join(', ') || 'N/A'}>
                          {notice.items?.map(item => item.description).join(', ') || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {notice.items && notice.items.length > 0 
                          ? getStatusBadge(notice.items[0].status)
                          : getStatusBadge(undefined)
                        }
                      </TableCell>
                      <TableCell className="text-sm">{notice.forMonth} {notice.forYear}</TableCell>
                      <TableCell className="text-sm">{new Date(notice.dateIssued).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {notice.isSettled ? (
                          <Badge variant="secondary" className="text-green-600 dark:text-green-400">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Settled
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/notices/${notice.id}`)}
                            className="h-8 w-8 p-0"
                            title="View notice"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          
                          {!notice.isSettled && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0"
                                  title="Settle notice"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Settle Notice</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to mark this notice as settled? This will reset the notice count for this tenant.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleSettleNotice(notice.id)}
                                  >
                                    Settle Notice
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                title="Delete notice"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Notice</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this notice? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteNotice(notice.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Notice
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              </Table>
        </CardContent>
      </Card>
    </div>
  );
}