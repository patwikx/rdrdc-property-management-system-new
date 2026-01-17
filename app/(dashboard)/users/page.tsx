"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { User, Plus, Search, X, Shield, Mail, Phone, Building, Settings, Filter, Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getUsers, getUserStats, type UserWithDetails } from "@/lib/actions/user-actions"
import { UserRole } from "@prisma/client"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

function getUserRoleStyle(role: UserRole) {
  switch (role) {
    case 'ADMIN': return 'border-red-500 text-red-600 bg-red-500/10'
    case 'MANAGER': return 'border-blue-500 text-blue-600 bg-blue-500/10'
    case 'STAFF': return 'border-green-500 text-green-600 bg-green-500/10'
    case 'TENANT': return 'border-purple-500 text-purple-600 bg-purple-500/10'
    case 'TREASURY': return 'border-yellow-500 text-yellow-600 bg-yellow-500/10'
    case 'PURCHASER': return 'border-indigo-500 text-indigo-600 bg-indigo-500/10'
    case 'ACCTG': return 'border-pink-500 text-pink-600 bg-pink-500/10'
    case 'MAINTENANCE': return 'border-cyan-500 text-cyan-600 bg-cyan-500/10'
    default: return 'border-muted text-muted-foreground bg-muted/10'
  }
}

function UserCard({ user }: { user: UserWithDetails }) {
  const roleStyle = getUserRoleStyle(user.role)

  return (
    <Card className="group relative border border-border bg-background rounded-none hover:shadow-none transition-all hover:border-primary/50 flex flex-col h-full">
      <div className="p-4 flex-1 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="font-mono text-sm font-bold uppercase tracking-tight truncate max-w-[180px]">
              {user.firstName} {user.lastName}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <span className="truncate">{user.email}</span>
              {user.emailVerified && (
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-none" title="Verified" />
              )}
            </div>
          </div>
          <Badge variant="outline" className={cn("rounded-none text-[10px] uppercase tracking-widest px-2 py-0.5 border", roleStyle)}>
            {user.role}
          </Badge>
        </div>

        {/* Contact Details */}
        <div className="space-y-2 pt-2 border-t border-dashed border-border/50">
          {user.contactNo ? (
            <div className="flex items-center gap-2 text-xs">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono">{user.contactNo}</span>
            </div>
          ) : (
             <div className="text-[10px] text-muted-foreground italic font-mono pl-5">No contact info</div>
          )}
        </div>

        {/* Tenant Context */}
        {user.tenant && (
          <div className="bg-muted/5 border border-border p-2 space-y-1">
            <div className="flex items-center gap-1.5">
              <Building className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Tenant Profile</span>
            </div>
            <p className="font-mono text-xs font-medium truncate">{user.tenant.businessName}</p>
            <p className="text-[10px] font-mono text-muted-foreground">{user.tenant.bpCode}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-px bg-border border border-border mt-auto">
          <div className="bg-background p-2 text-center">
            <div className="text-lg font-mono font-bold leading-none">{user._count.createdProperties}</div>
            <div className="text-[9px] uppercase text-muted-foreground mt-1">Props</div>
          </div>
          <div className="bg-background p-2 text-center">
            <div className="text-lg font-mono font-bold leading-none">{user._count.assignedTasks}</div>
            <div className="text-[9px] uppercase text-muted-foreground mt-1">Tasks</div>
          </div>
          <div className="bg-background p-2 text-center">
            <div className="text-lg font-mono font-bold leading-none">{user._count.uploadedDocuments}</div>
            <div className="text-[9px] uppercase text-muted-foreground mt-1">Docs</div>
          </div>
          <div className="bg-background p-2 text-center">
            <div className="text-lg font-mono font-bold leading-none">{user._count.ownedProjects}</div>
            <div className="text-[9px] uppercase text-muted-foreground mt-1">Projs</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[10px] text-muted-foreground font-mono">
            JOINED {format(new Date(user.createdAt), 'MM/dd/yy')}
          </div>
          <Link href={`/users/${user.id}`} className="w-full ml-4">
            <Button variant="outline" size="sm" className="w-full h-7 rounded-none text-[10px] uppercase tracking-wider font-semibold border-border hover:bg-muted">
              Manage <Settings className="ml-1.5 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}

function UsersList({ 
  page, 
  search, 
  role 
}: { 
  page: number
  search: string
  role: UserRole | undefined
}) {
  const [users, setUsers] = useState<UserWithDetails[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUsers() {
      setIsLoading(true)
      try {
        const result = await getUsers(page, 12, search || undefined, role)
        setUsers(result.users)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
      } catch (error) {
        console.error('Failed to load users:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [page, search, role])

  if (isLoading) {
    return <UsersLoading />
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border bg-muted/5">
        <User className="h-10 w-10 text-muted-foreground/30 mb-4" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No Users Found</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-6 font-mono">
          Adjust criteria or create new user
        </p>
        <Link href="/users/create">
          <Button className="rounded-none h-9 text-xs font-mono uppercase tracking-wider">
            <Plus className="h-3 w-3 mr-2" />
            Create User
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination 
          currentPage={page}
          totalPages={totalPages}
          search={search}
          role={role}
        />
      )}

      <div className="flex justify-between items-center border-t border-border pt-4 text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
        <span>Showing {users.length} of {totalCount} users</span>
        <span>Directory</span>
      </div>
    </div>
  )
}

function UsersLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="border border-border bg-background h-[300px] p-4">
          <Skeleton className="h-6 w-3/4 mb-4 rounded-none" />
          <Skeleton className="h-4 w-1/2 mb-8 rounded-none" />
          <div className="grid grid-cols-4 gap-2 mt-auto">
            <Skeleton className="h-12 w-full rounded-none" />
            <Skeleton className="h-12 w-full rounded-none" />
            <Skeleton className="h-12 w-full rounded-none" />
            <Skeleton className="h-12 w-full rounded-none" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SearchAndFilter({ 
  search, 
  role, 
  onSearchChange, 
  onRoleChange 
}: {
  search: string
  role: UserRole | undefined
  onSearchChange: (value: string) => void
  onRoleChange: (value: UserRole | undefined) => void
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-1 border border-border bg-muted/5 items-start sm:items-center">
      <div className="flex items-center px-3 py-2 text-muted-foreground border-r border-border/50">
        <Filter className="h-4 w-4" />
      </div>
      
      <div className="relative flex-1 w-full border-r border-border/50">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="SEARCH USERS..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 rounded-none border-none shadow-none bg-transparent h-9 font-mono text-xs uppercase focus-visible:ring-0 placeholder:text-muted-foreground/50"
        />
        {search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
            onClick={() => onSearchChange('')}
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </Button>
        )}
      </div>

      <div className="w-full sm:w-[200px]">
        <Select
          value={role || 'all'}
          onValueChange={(value) => onRoleChange(value === 'all' ? undefined : value as UserRole)}
        >
          <SelectTrigger className="w-full rounded-none border-none shadow-none bg-transparent h-9 font-mono text-xs uppercase focus:ring-0">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-border">
            <SelectItem value="all" className="font-mono text-xs uppercase">All Roles</SelectItem>
            <SelectItem value={UserRole.ADMIN} className="font-mono text-xs uppercase">Admin</SelectItem>
            <SelectItem value={UserRole.MANAGER} className="font-mono text-xs uppercase">Manager</SelectItem>
            <SelectItem value={UserRole.STAFF} className="font-mono text-xs uppercase">Staff</SelectItem>
            <SelectItem value={UserRole.TENANT} className="font-mono text-xs uppercase">Tenant</SelectItem>
            <SelectItem value={UserRole.MAINTENANCE} className="font-mono text-xs uppercase">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(search || role) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onSearchChange('')
            onRoleChange(undefined)
          }}
          className="h-9 rounded-none px-3 text-xs font-mono uppercase hover:text-destructive hover:bg-destructive/10 ml-auto"
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  )
}

function Pagination({ 
  currentPage, 
  totalPages, 
  search, 
  role 
}: {
  currentPage: number
  totalPages: number
  search: string
  role: UserRole | undefined
}) {
  const router = useRouter()

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (search) params.set('search', search)
    if (role) params.set('role', role)
    
    const queryString = params.toString()
    return `/users${queryString ? `?${queryString}` : ''}`
  }

  const handlePageChange = (page: number) => {
    router.push(createPageUrl(page))
  }

  return (
    <div className="flex items-center justify-center space-x-1 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="rounded-none h-8 px-2 font-mono text-xs border-border disabled:opacity-30"
      >
        PREV
      </Button>
      
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
        <Button
          key={pageNum}
          variant={pageNum === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(pageNum)}
          className={cn(
            "rounded-none h-8 w-8 p-0 font-mono text-xs",
            pageNum === currentPage ? "bg-primary text-primary-foreground" : "border-border hover:bg-muted"
          )}
        >
          {pageNum}
        </Button>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="rounded-none h-8 px-2 font-mono text-xs border-border disabled:opacity-30"
      >
        NEXT
      </Button>
    </div>
  )
}

function StatsCards() {
  const [stats, setStats] = useState<{
    total: number
    admins: number
    managers: number
    staff: number
    tenants: number
    active: number
    verified: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const result = await getUserStats()
        setStats(result)
      } catch (error) {
        console.error('Failed to load stats:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadStats()
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 border-r border-border h-24">
            <Skeleton className="h-4 w-1/3 mb-2 rounded-none" />
            <Skeleton className="h-8 w-1/2 rounded-none" />
          </div>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
      <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Total Users</span>
          <Users className="h-4 w-4 text-muted-foreground/50" />
        </div>
        <div>
          <span className="text-3xl font-mono font-medium tracking-tighter text-foreground">{stats.total}</span>
          <span className="text-[10px] text-muted-foreground ml-2 uppercase tracking-wide">Accounts</span>
        </div>
      </div>

      <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Active</span>
          <Shield className="h-4 w-4 text-emerald-600/50" />
        </div>
        <div>
          <span className="text-3xl font-mono font-medium tracking-tighter text-emerald-600">{stats.active}</span>
          <span className="text-[10px] text-muted-foreground ml-2 uppercase tracking-wide">Online</span>
        </div>
      </div>

      <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Verified</span>
          <Mail className="h-4 w-4 text-blue-600/50" />
        </div>
        <div>
          <span className="text-3xl font-mono font-medium tracking-tighter text-blue-600">{stats.verified}</span>
          <span className="text-[10px] text-muted-foreground ml-2 uppercase tracking-wide">Confirmed</span>
        </div>
      </div>

      <div className="p-4 flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Admins</span>
          <Settings className="h-4 w-4 text-red-600/50" />
        </div>
        <div>
          <span className="text-3xl font-mono font-medium tracking-tighter text-red-600">{stats.admins}</span>
          <span className="text-[10px] text-muted-foreground ml-2 uppercase tracking-wide">System</span>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [role, setRole] = useState<UserRole | undefined>(
    (searchParams.get('role') as UserRole) || undefined
  )

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (search) params.set('search', search)
    if (role) params.set('role', role)
    
    const queryString = params.toString()
    const newUrl = `/users${queryString ? `?${queryString}` : ''}`
    
    router.replace(newUrl, { scroll: false })
  }, [page, search, role, router])

  // Reset page when search or role changes
  useEffect(() => {
    if (page !== 1) {
      setPage(1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, role])

  const handleSearchChange = (value: string) => {
    setSearch(value)
  }

  const handleRoleChange = (value: UserRole | undefined) => {
    setRole(value)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-mono uppercase">User Management</h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            System users, roles, and access control
          </p>
        </div>
        <Link href="/users/create">
          <Button className="rounded-none h-9 text-xs font-mono uppercase tracking-wider">
            <Plus className="h-3 w-3 mr-2" />
            Create User
          </Button>
        </Link>
      </div>

      <StatsCards />

      <SearchAndFilter
        search={search}
        role={role}
        onSearchChange={handleSearchChange}
        onRoleChange={handleRoleChange}
      />

      <UsersList 
        page={page}
        search={search}
        role={role}
      />
    </div>
  )
}