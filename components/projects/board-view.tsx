"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Edit3, 
  Save, 
  X, 
  Plus, 
  MoreHorizontal, 
  Trash2,
  Settings,
  Users
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
} from "@/components/ui/alert-dialog"
import { KanbanBoard } from "./kanban-board"
import { 
  updateBoard, 
  deleteBoard, 
  createColumn, 
  updateColumn, 
  deleteColumn 
} from "@/lib/actions/project-actions"
import { TaskPriority, TaskStatus, ProjectRole, ProjectStatus } from "@prisma/client"

interface BoardData {
  id: string
  name: string
  order: number
  createdAt: Date
  updatedAt: Date
  project: {
    id: string
    name: string
    owner: {
      id: string
      firstName: string
      lastName: string
    }
    members: {
      id: string
      role: ProjectRole
      joinedAt: Date
      user: {
        id: string
        firstName: string
        lastName: string
      }
    }[]
  }
  columns: {
    id: string
    name: string
    order: number
    tasks: {
      id: string
      title: string
      description: string | null
      priority: TaskPriority
      status: TaskStatus
      dueDate: Date | null
      order: number
      createdBy: {
        firstName: string
        lastName: string
      }
      assignedTo: {
        firstName: string
        lastName: string
      } | null
      _count: {
        comments: number
        attachments: number
      }
    }[]
  }[]
}

interface BoardViewProps {
  board: BoardData
}

export function BoardView({ board }: BoardViewProps) {
  const router = useRouter()
  const [isEditingBoard, setIsEditingBoard] = useState(false)
  const [boardName, setBoardName] = useState(board.name)
  const [isEditingColumn, setIsEditingColumn] = useState<string | null>(null)
  const [editColumnName, setEditColumnName] = useState("")
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdateBoardName = async () => {
    if (!boardName.trim() || boardName === board.name) {
      setIsEditingBoard(false)
      setBoardName(board.name)
      return
    }

    setIsLoading(true)
    try {
      const result = await updateBoard(board.id, boardName.trim())
      
      if (result.error) {
        toast.error(result.error)
        setBoardName(board.name)
      } else {
        toast.success("Board name updated successfully")
        setIsEditingBoard(false)
        router.refresh()
      }
    } catch (error) {
      console.error("Update board error:", error)
      toast.error("Failed to update board name")
      setBoardName(board.name)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteBoard = async () => {
    setIsLoading(true)
    try {
      const result = await deleteBoard(board.id)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Board deleted successfully")
        router.push(`/projects/${board.project.id}`)
      }
    } catch (error) {
      console.error("Delete board error:", error)
      toast.error("Failed to delete board")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return

    setIsLoading(true)
    try {
      const result = await createColumn(board.id, newColumnName.trim())
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Column added successfully")
        setNewColumnName("")
        setIsAddingColumn(false)
        // Redirect to same page to trigger fresh data fetch
        router.push(`/projects/boards/${board.id}`)
      }
    } catch (error) {
      console.error("Add column error:", error)
      toast.error("Failed to add column")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateColumn = async (columnId: string) => {
    if (!editColumnName.trim()) return

    setIsLoading(true)
    try {
      const result = await updateColumn(columnId, editColumnName.trim())
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Column updated successfully")
        setIsEditingColumn(null)
        setEditColumnName("")
        // Redirect to same page to trigger fresh data fetch
        router.push(`/projects/boards/${board.id}`)
      }
    } catch (error) {
      console.error("Update column error:", error)
      toast.error("Failed to update column")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteColumn = async (columnId: string) => {
    setIsLoading(true)
    try {
      const result = await deleteColumn(columnId)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Column deleted successfully")
        // Redirect to same page to trigger fresh data fetch
        router.push(`/projects/boards/${board.id}`)
      }
    } catch (error) {
      console.error("Delete column error:", error)
      toast.error("Failed to delete column")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isEditingBoard ? (
              <div className="flex items-center gap-2">
                <Input
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  className="text-xl font-semibold h-auto py-1 px-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateBoardName()
                    } else if (e.key === 'Escape') {
                      setIsEditingBoard(false)
                      setBoardName(board.name)
                    }
                  }}
                  autoFocus
                  disabled={isLoading}
                />
                <Button
                  size="sm"
                  onClick={handleUpdateBoardName}
                  disabled={isLoading || !boardName.trim()}
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditingBoard(false)
                    setBoardName(board.name)
                  }}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-semibold">{board.name}</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingBoard(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            in <Link href={`/projects/${board.project.id}`} className="hover:text-foreground transition-colors">
              {board.project.name}
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/projects/${board.project.id}/settings`}>
              <Settings className="h-4 w-4 mr-2" />
              Project Settings
            </Link>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsAddingColumn(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Column
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditingBoard(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Board Name
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Board
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Board</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &apos;{board.name}&apos;? This action cannot be undone and will permanently delete all columns and tasks in this board.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteBoard}
                      disabled={isLoading}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isLoading ? "Deleting..." : "Delete Board"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Column Management Bar */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 border-b border-border/50">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{board.columns.length} columns</span>
          <span>•</span>
          <span>{board.columns.reduce((total, col) => total + col.tasks.length, 0)} tasks</span>
        </div>

        {isAddingColumn && (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter column name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddColumn()
                } else if (e.key === 'Escape') {
                  setIsAddingColumn(false)
                  setNewColumnName("")
                }
              }}
              autoFocus
              disabled={isLoading}
            />
            <Button
              size="sm"
              onClick={handleAddColumn}
              disabled={isLoading || !newColumnName.trim()}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsAddingColumn(false)
                setNewColumnName("")
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        )}

        {!isAddingColumn && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingColumn(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Column
          </Button>
        )}

        <div className="flex items-center gap-1 ml-auto">
          {board.columns.map((column) => (
            <div key={column.id} className="flex items-center gap-1">
              {isEditingColumn === column.id ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={editColumnName}
                    onChange={(e) => setEditColumnName(e.target.value)}
                    className="h-6 text-xs w-24"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateColumn(column.id)
                      } else if (e.key === 'Escape') {
                        setIsEditingColumn(null)
                        setEditColumnName("")
                      }
                    }}
                    autoFocus
                    disabled={isLoading}
                  />
                  <Button
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => handleUpdateColumn(column.id)}
                    disabled={isLoading || !editColumnName.trim()}
                  >
                    ✓
                  </Button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      {column.name} ({column.tasks.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setIsEditingColumn(column.id)
                        setEditColumnName(column.name)
                      }}
                    >
                      <Edit3 className="h-3 w-3 mr-2" />
                      Edit Name
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          className="text-destructive"
                          disabled={isLoading}
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Column</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the &apos;{column.name}&apos; column? This action cannot be undone and will permanently delete all tasks in this column.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteColumn(column.id)}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isLoading ? "Deleting..." : "Delete Column"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 min-h-0">
        <KanbanBoard 
          project={{
            id: board.project.id,
            name: board.project.name,
            description: null,
            status: ProjectStatus.ACTIVE,
            startDate: new Date(),
            endDate: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            owner: board.project.owner,
            members: board.project.members,
            boards: [{
              id: board.id,
              name: board.name,
              order: board.order,
              columns: board.columns
            }],
            _count: {
              tasks: board.columns.reduce((total, col) => total + col.tasks.length, 0),
              members: board.project.members.length
            }
          }} 
        />
      </div>
    </div>
  )
}