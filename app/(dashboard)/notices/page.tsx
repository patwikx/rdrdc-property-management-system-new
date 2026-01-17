"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Plus, 
  Eye, 
  CheckCircle, 
  Trash2,
  FileText,
  Clock,
  DollarSign,
  AlertTriangle,
  Filter,
  Search,
  X
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
import { format } from "date-fns";

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

export default function TenantNoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    noticeType: "all", // 'all', 'first', 'second', 'final'
    status: "all",
    isSettled: "all"
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [noticesData, tenantsData] = await Promise.all([
        getTenantNotices({}),
        getTenants()
      ]);
      
      setNotices(noticesData as Notice[]);
      setFilteredNotices(noticesData as Notice[]);
      setTenants(tenantsData);
    } catch (error) {
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply filters
  useEffect(() => {
    let filtered = [...notices];

    // Search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        notice =>
          notice.tenant.businessName.toLowerCase().includes(query) ||
          notice.tenant.bpCode.toLowerCase().includes(query)
      );
    }

    // Notice type filter
    if (filters.noticeType !== "all") {
      filtered = filtered.filter(notice => {
        if (filters.noticeType === "first") return notice.noticeNumber === 1;
        if (filters.noticeType === "second") return notice.noticeNumber === 2;
        if (filters.noticeType === "final") return notice.noticeNumber >= 3;
        return true;
      });
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(notice =>
        notice.items?.some(item => item.status === filters.status)
      );
    }

    // Settlement filter
    if (filters.isSettled !== "all") {
      const isSettled = filters.isSettled === "true";
      filtered = filtered.filter(notice => notice.isSettled === isSettled);
    }

    setFilteredNotices(filtered);
  }, [notices, searchQuery, filters]);

  const stats = useMemo(() => {
    const totalNotices = filteredNotices.length;
    const activeNotices = filteredNotices.filter(notice => !notice.isSettled).length;
    const settledNotices = filteredNotices.filter(notice => notice.isSettled).length;
    const totalAmount = filteredNotices.reduce((sum, notice) => sum + notice.totalAmount, 0);
    const criticalNotices = filteredNotices.filter(notice => 
      notice.items?.some(item => item.status === "CRITICAL") && !notice.isSettled
    ).length;

    return {
      total: totalNotices,
      active: activeNotices,
      settled: settledNotices,
      totalAmount,
      critical: criticalNotices,
    };
  }, [filteredNotices]);

  const clearFilters = () => {
    setFilters({
      noticeType: "all",
      status: "all",
      isSettled: "all"
    });
    setSearchQuery("");
  };

  const hasActiveFilters = 
    filters.noticeType !== "all" ||
    filters.status !== "all" ||
    filters.isSettled !== "all" ||
    searchQuery !== "";

  const handleSettleNotice = async (noticeId: string) => {
    try {
      await settleNotice(noticeId, "Manual Settlement");
      toast.success("Notice settled successfully!");
      loadData();
    } catch (error) {
      toast.error("Failed to settle notice");
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    try {
      await deleteNotice(noticeId);
      toast.success("Notice deleted successfully!");
      loadData();
    } catch (error) {
      toast.error("Failed to delete notice");
    }
  };

  const getNoticeTypeBadge = (type: string, number: number) => {
    const noticeText = number === 1 ? "1ST" : number === 2 ? "2ND" : "FINAL";
    
    if (type === "FINAL_NOTICE") {
      return (
        <Badge variant="outline" className="rounded-none border-rose-500 text-rose-600 bg-rose-50/10 font-mono uppercase tracking-wider text-[10px]">
          {noticeText} Notice
        </Badge>
      );
    } else if (type === "SECOND_NOTICE") {
      return (
        <Badge variant="outline" className="rounded-none border-orange-500 text-orange-600 bg-orange-50/10 font-mono uppercase tracking-wider text-[10px]">
          {noticeText} Notice
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="rounded-none border-blue-500 text-blue-600 bg-blue-50/10 font-mono uppercase tracking-wider text-[10px]">
          {noticeText} Notice
        </Badge>
      );
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return <Badge variant="outline" className="rounded-none font-mono text-[10px]">N/A</Badge>;
    
    const label = status.replace("_", " ");
    
    if (status === "CRITICAL") {
      return (
        <Badge variant="outline" className="rounded-none border-rose-600 text-rose-600 font-mono text-[10px] uppercase gap-1">
          <AlertTriangle className="w-3 h-3" />
          {label}
        </Badge>
      );
    } else if (status === "OVERDUE") {
      return (
        <Badge variant="outline" className="rounded-none border-orange-600 text-orange-600 font-mono text-[10px] uppercase gap-1">
          <Clock className="w-3 h-3" />
          {label}
        </Badge>
      );
    } else if (status === "PAST_DUE") {
      return (
        <Badge variant="outline" className="rounded-none border-yellow-600 text-yellow-600 font-mono text-[10px] uppercase gap-1">
          <Clock className="w-3 h-3" />
          {label}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="rounded-none border-muted-foreground text-muted-foreground font-mono text-[10px] uppercase">
          {label}
        </Badge>
      );
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-mono uppercase">Notices Management</h2>
          <p className="text-xs text-muted-foreground font-mono mt-1 uppercase tracking-wide">
            Track & settle tenant payment notices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => router.push("/notices/create")}
            className="rounded-none h-9 text-xs font-mono uppercase tracking-wider font-bold"
          >
            <Plus className="h-3 w-3 mr-2" />
            Issue Notice
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 border border-border bg-background">
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Total Notices</span>
            <FileText className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <span className="text-2xl font-mono font-bold tracking-tighter">{stats.total}</span>
        </div>
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Active</span>
            <Clock className="h-4 w-4 text-blue-600/50" />
          </div>
          <span className="text-2xl font-mono font-bold tracking-tighter text-blue-600">{stats.active}</span>
        </div>
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Settled</span>
            <CheckCircle className="h-4 w-4 text-emerald-600/50" />
          </div>
          <span className="text-2xl font-mono font-bold tracking-tighter text-emerald-600">{stats.settled}</span>
        </div>
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Outstanding</span>
            <DollarSign className="h-4 w-4 text-foreground/50" />
          </div>
          <span className="text-lg font-mono font-bold tracking-tighter truncate">
            ₱{stats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="p-4 flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Critical</span>
            <AlertTriangle className="h-4 w-4 text-rose-600/50" />
          </div>
          <span className="text-2xl font-mono font-bold tracking-tighter text-rose-600">{stats.critical}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="border border-border bg-muted/5">
        {/* Search Row */}
        <div className="flex items-center gap-4 p-1 border-b border-border/50">
          <div className="flex items-center px-3 py-2 text-muted-foreground border-r border-border/50">
            <Search className="h-4 w-4" />
          </div>
          <Input
            placeholder="SEARCH TENANT NAME OR BP CODE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-none border-none shadow-none bg-transparent h-9 font-mono text-xs uppercase focus-visible:ring-0 placeholder:text-muted-foreground/50 flex-1"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-transparent rounded-none mr-2"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </Button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-3 p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-3 w-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Filters:</span>
          </div>

          {/* Status Filter */}
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="rounded-none font-mono text-xs border-border h-8 w-[140px]">
              <SelectValue placeholder="ALL STATUSES" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border">
              <SelectItem value="all" className="font-mono text-xs">ALL STATUSES</SelectItem>
              <SelectItem value="PAST_DUE" className="font-mono text-xs">PAST DUE</SelectItem>
              <SelectItem value="OVERDUE" className="font-mono text-xs">OVERDUE</SelectItem>
              <SelectItem value="CRITICAL" className="font-mono text-xs">CRITICAL</SelectItem>
            </SelectContent>
          </Select>

          {/* Settlement Filter */}
          <Select
            value={filters.isSettled}
            onValueChange={(value) => setFilters(prev => ({ ...prev, isSettled: value }))}
          >
            <SelectTrigger className="rounded-none font-mono text-xs border-border h-8 w-[120px]">
              <SelectValue placeholder="ALL" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border">
              <SelectItem value="all" className="font-mono text-xs">ALL</SelectItem>
              <SelectItem value="false" className="font-mono text-xs">ACTIVE</SelectItem>
              <SelectItem value="true" className="font-mono text-xs">SETTLED</SelectItem>
            </SelectContent>
          </Select>

          {/* Notice Type Quick Filters */}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant={filters.noticeType === "first" ? "default" : "outline"}
              size="sm"
              className="h-8 rounded-none text-[10px] font-mono uppercase border-border"
              onClick={() => setFilters(prev => ({ ...prev, noticeType: prev.noticeType === "first" ? "all" : "first" }))}
            >
              <FileText className="h-3 w-3 mr-1 text-blue-600" />
              1st Notice
            </Button>
            <Button
              variant={filters.noticeType === "second" ? "default" : "outline"}
              size="sm"
              className="h-8 rounded-none text-[10px] font-mono uppercase border-border"
              onClick={() => setFilters(prev => ({ ...prev, noticeType: prev.noticeType === "second" ? "all" : "second" }))}
            >
              <FileText className="h-3 w-3 mr-1 text-orange-600" />
              2nd Notice
            </Button>
            <Button
              variant={filters.noticeType === "final" ? "default" : "outline"}
              size="sm"
              className="h-8 rounded-none text-[10px] font-mono uppercase border-border"
              onClick={() => setFilters(prev => ({ ...prev, noticeType: prev.noticeType === "final" ? "all" : "final" }))}
            >
              <AlertTriangle className="h-3 w-3 mr-1 text-red-600" />
              Final Notice
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-8 rounded-none text-[10px] font-mono uppercase border-border hover:text-destructive hover:bg-destructive/10 hover:border-destructive/50"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Table */}
      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="h-10 bg-muted/5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground border-b border-border">Tenant</TableHead>
              <TableHead className="h-10 bg-muted/5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground border-b border-border">Type</TableHead>
              <TableHead className="h-10 bg-muted/5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground border-b border-border">Amount</TableHead>
              <TableHead className="h-10 bg-muted/5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground border-b border-border">Description</TableHead>
              <TableHead className="h-10 bg-muted/5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground border-b border-border">Status</TableHead>
              <TableHead className="h-10 bg-muted/5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground border-b border-border">Period</TableHead>
              <TableHead className="h-10 bg-muted/5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground border-b border-border">Issued</TableHead>
              <TableHead className="h-10 bg-muted/5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground border-b border-border">State</TableHead>
              <TableHead className="h-10 bg-muted/5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground border-b border-border text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span className="text-xs font-mono uppercase text-muted-foreground">Loading notices...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredNotices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <FileText className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-xs font-mono uppercase">No notices found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredNotices.map((notice) => (
                <TableRow key={notice.id} className="group border-border hover:bg-muted/5 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs uppercase truncate max-w-[150px]">{notice.tenant.businessName}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{notice.tenant.bpCode}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getNoticeTypeBadge(notice.noticeType, notice.noticeNumber)}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-medium">
                    ₱{notice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="truncate text-xs font-mono text-muted-foreground" title={notice.items?.map(item => item.description).join(', ') || 'N/A'}>
                      {notice.items?.map(item => item.description).join(', ') || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {notice.items && notice.items.length > 0 
                      ? getStatusBadge(notice.items[0].status)
                      : getStatusBadge(undefined)
                    }
                  </TableCell>
                  <TableCell className="text-xs font-mono uppercase">{notice.forMonth} {notice.forYear}</TableCell>
                  <TableCell className="text-xs font-mono">{format(new Date(notice.dateIssued), 'MM/dd/yy')}</TableCell>
                  <TableCell>
                    {notice.isSettled ? (
                      <Badge variant="outline" className="rounded-none border-emerald-500 text-emerald-600 bg-emerald-50/10 font-mono text-[10px] uppercase gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Settled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-none border-blue-500 text-blue-600 bg-blue-50/10 font-mono text-[10px] uppercase gap-1">
                        <Clock className="w-3 h-3" />
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/notices/${notice.id}`)}
                        className="h-7 w-7 p-0 rounded-none hover:bg-muted border border-transparent hover:border-border"
                        title="View notice"
                      >
                        <Eye className="h-3 w-3 text-muted-foreground" />
                      </Button>
                      
                      {!notice.isSettled && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 w-7 p-0 rounded-none hover:bg-muted border border-transparent hover:border-border"
                              title="Settle notice"
                            >
                              <CheckCircle className="h-3 w-3 text-emerald-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-none border-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="uppercase font-bold tracking-widest text-sm">Settle Notice</AlertDialogTitle>
                              <AlertDialogDescription className="font-mono text-xs">
                                Confirm settlement for {notice.tenant.businessName}. This action logs the settlement date.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-none uppercase text-xs font-bold">Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleSettleNotice(notice.id)}
                                className="rounded-none uppercase text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
                              >
                                Confirm Settlement
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
                            className="h-7 w-7 p-0 rounded-none hover:bg-muted border border-transparent hover:border-border"
                            title="Delete notice"
                          >
                            <Trash2 className="h-3 w-3 text-rose-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-none border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="uppercase font-bold tracking-widest text-sm text-rose-600">Delete Notice</AlertDialogTitle>
                            <AlertDialogDescription className="font-mono text-xs">
                              This action cannot be undone. Permanently delete notice #{notice.noticeNumber}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-none uppercase text-xs font-bold">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteNotice(notice.id)}
                              className="bg-destructive hover:bg-destructive/90 rounded-none uppercase text-xs font-bold"
                            >
                              Delete
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
      </div>
    </div>
  );
}