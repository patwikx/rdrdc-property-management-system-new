"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { User, Plus, Search, X, Shield, Mail, Phone, Calendar, Building, Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getUsers, getUserStats, type UserWithDetails } from "@/lib/actions/user-actions"
import { UserRole } from "@prisma/client"
import { format } from "date-fns"



function getUserRoleColor(role: UserRole) {
  switch (role) {
    case 'ADMIN': return 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
    case 'MANAGER': return 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
    case 'STAFF': return 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
    case 'TENANT': return 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600'
    case 'TREASURY': return 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600'
    case 'PURCHASER': return 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
    case 'ACCTG': return 'bg-pink-600 hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600'
    case 'VIEWER': return 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600'
    case 'OWNER': return 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600'
    case 'STOCKROOM': return 'bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600'
    case 'MAINTENANCE': return 'bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600'
    default: return 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600'
  }
}

function UserCard({ user }: { user: UserWithDetails }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {user.firstName} {user.lastName}
              </CardTitle>
              <CardDescription className="text-sm">
                {user.email}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getUserRoleColor(user.role)}>
              {user.role}
            </Badge>
            {user.emailVerified && (
              <Badge variant="outline" className="text-green-600 border-green-600 dark:text-green-400 dark:border-green-400">
                Verified
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Contact Info */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm truncate">{user.email}</span>
          </div>
          {user.contactNo && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user.contactNo}</span>
            </div>
          )}
        </div>

        {/* Tenant Info */}
        {user.tenant && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tenant Account</span>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">{user.tenant.businessName}</p>
              <p className="text-xs text-muted-foreground">
                {user.tenant.bpCode} • {user.tenant.status}
              </p>
            </div>
          </div>
        )}

        {/* Activity Stats */}
        <div className="pt-3 border-t">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {user._count.createdProperties}
              </div>
              <div className="text-xs text-muted-foreground">Properties</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {user._count.assignedTasks}
              </div>
              <div className="text-xs text-muted-foreground">Tasks</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                {user._count.uploadedDocuments}
              </div>
              <div className="text-xs text-muted-foreground">Documents</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                {user._count.ownedProjects}
              </div>
              <div className="text-xs text-muted-foreground">Projects</div>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Joined {format(new Date(user.createdAt), 'MMM dd, yyyy')}</span>
            </div>
            <span>Updated {format(new Date(user.updatedAt), 'MMM dd')}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3">
          <Link href={`/users/${user.id}`}>
            <Button variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Manage User
            </Button>
          </Link>
        </div>
      </CardContent>
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
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No users found</h3>
        <p className="mt-2 text-muted-foreground">
          {search || role ? 'Try adjusting your search criteria.' : 'Get started by creating your first user.'}
        </p>
        <Link href="/users/create">
          <Button className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

      <div className="text-center text-sm text-muted-foreground">
        Showing {users.length} of {totalCount} users
      </div>
    </div>
  )
}

function UsersLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-4 gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
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
    <div className="flex items-center gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
        {search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => onSearchChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Select
        value={role || 'all'}
        onValueChange={(value) => onRoleChange(value === 'all' ? undefined : value as UserRole)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="User role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
          <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
          <SelectItem value={UserRole.STAFF}>Staff</SelectItem>
          <SelectItem value={UserRole.TENANT}>Tenant</SelectItem>
          <SelectItem value={UserRole.TREASURY}>Treasury</SelectItem>
          <SelectItem value={UserRole.PURCHASER}>Purchaser</SelectItem>
          <SelectItem value={UserRole.ACCTG}>Accounting</SelectItem>
          <SelectItem value={UserRole.VIEWER}>Viewer</SelectItem>
          <SelectItem value={UserRole.OWNER}>Owner</SelectItem>
          <SelectItem value={UserRole.STOCKROOM}>Stockroom</SelectItem>
          <SelectItem value={UserRole.MAINTENANCE}>Maintenance</SelectItem>
        </SelectContent>
      </Select>

      {(search || role) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onSearchChange('')
            onRoleChange(undefined)
          }}
        >
          <X className="h-4 w-4 mr-2" />
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
    <div className="flex items-center justify-center space-x-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
        <Button
          key={pageNum}
          variant={pageNum === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(pageNum)}
        >
          {pageNum}
        </Button>
      ))}
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            All system users
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</div>
          <p className="text-xs text-muted-foreground">
            Recently active
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Verified</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.verified}</div>
          <p className="text-xs text-muted-foreground">
            Email verified
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Admins</CardTitle>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.admins}</div>
          <p className="text-xs text-muted-foreground">
            System administrators
          </p>
        </CardContent>
      </Card>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage system users, roles, and permissions
          </p>
        </div>
        <Link href="/users/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
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