"use client"

import { useState } from "react"
import { Plus, MoreHorizontal, Columns, Edit3, Trash2, Save, X } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  createBoard, 
  updateBoard, 
  deleteBoard, 
  createColumn, 
  updateColumn, 
  deleteColumn 
} from "@/lib/actions/project-actions"
import { ProjectWithDetails } from "@/lib/actions/project-actions"
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

interface BoardManagementProps {
  project: ProjectWithDetails
}

export function BoardManagement({ project }: BoardManagementProps) {
  const router = useRouter()
  const [newBoardName, setNewBoardName] = useState("")
  const [isCreatingBoard, setIsCreatingBoard] = useState(false)
  const [editingBoard, setEditingBoard] = useState<string | null>(null)
  const [editingColumn, setEditingColumn] = useState<string | null>(null)
  const [editBoardName, setEditBoardName] = useState("")
  const [editColumnName, setEditColumnName] = useState("")
  const [newColumnName, setNewColumnName] = useState("")
  const [creatingColumnFor, setCreatingColumnFor] = useState<string | null>(null)

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return

    setIsCreatingBoard(true)
    try {
      const result = await createBoard(project.id, newBoardName.trim())
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Board created successfully")
        setNewBoardName("")
        router.refresh()
      }
    } catch (error) {
      console.error("Create board error:", error)
      toast.error("Failed to create board")
    } finally {
      setIsCreatingBoard(false)
    }
  }

  const handleUpdateBoard = async (boardId: string) => {
    if (!editBoardName.trim()) return

    try {
      const result = await updateBoard(boardId, editBoardName.trim())
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Board updated successfully")
        setEditingBoard(null)
        setEditBoardName("")
        router.refresh()
      }
    } catch (error) {
      console.error("Update board error:", error)
      toast.error("Failed to update board")
    }
  }

  const handleDeleteBoard = async (boardId: string) => {
    try {
      const result = await deleteBoard(boardId)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Board deleted successfully")
        router.refresh()
      }
    } catch (error) {
      console.error("Delete board error:", error)
      toast.error("Failed to delete board")
    }
  }

  const handleCreateColumn = async (boardId: string) => {
    if (!newColumnName.trim()) return

    try {
      const result = await createColumn(boardId, newColumnName.trim())
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Column created successfully")
        setNewColumnName("")
        setCreatingColumnFor(null)
        router.refresh()
      }
    } catch (error) {
      console.error("Create column error:", error)
      toast.error("Failed to create column")
    }
  }

  const handleUpdateColumn = async (columnId: string) => {
    if (!editColumnName.trim()) return

    try {
      const result = await updateColumn(columnId, editColumnName.trim())
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Column updated successfully")
        setEditingColumn(null)
        setEditColumnName("")
        router.refresh()
      }
    } catch (error) {
      console.error("Update column error:", error)
      toast.error("Failed to update column")
    }
  }

  const handleDeleteColumn = async (columnId: string) => {
    try {
      const result = await deleteColumn(columnId)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Column deleted successfully")
        router.refresh()
      }
    } catch (error) {
      console.error("Delete column error:", error)
      toast.error("Failed to delete column")
    }
  }

  return (
    <div className="space-y-6">
      {/* Create New Board */}
      <div className="border border-border bg-background p-4">
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3 text-muted-foreground">Create New Board</h3>
        <div className="flex gap-2">
          <Input
            placeholder="ENTER BOARD NAME"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            className="flex-1 rounded-none border-border font-mono text-xs uppercase"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateBoard()
              }
            }}
          />
          <Button 
            onClick={handleCreateBoard}
            disabled={isCreatingBoard || !newBoardName.trim()}
            className="rounded-none h-10 w-10 p-0"
          >
            {isCreatingBoard ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Existing Boards */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Existing Boards</h3>
        
        {project.boards.map((board) => (
          <div key={board.id} className="border border-border bg-background p-4 group">
            {/* Board Header */}
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div className="flex items-center gap-2 flex-1">
                {editingBoard === board.id ? (
                  <div className="flex items-center gap-2 flex-1 max-w-md">
                    <Input
                      value={editBoardName}
                      onChange={(e) => setEditBoardName(e.target.value)}
                      className="h-8 rounded-none font-mono text-xs uppercase border-primary"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateBoard(board.id)
                        } else if (e.key === 'Escape') {
                          setEditingBoard(null)
                          setEditBoardName("")
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      className="rounded-none h-8 w-8 p-0"
                      onClick={() => handleUpdateBoard(board.id)}
                      disabled={!editBoardName.trim()}
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-none h-8 w-8 p-0"
                      onClick={() => {
                        setEditingBoard(null)
                        setEditBoardName("")
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h4 className="font-bold text-sm uppercase tracking-tight">{board.name}</h4>
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted/20 px-1.5 py-0.5 border border-border">
                      {board.columns.length} COLS
                    </span>
                  </>
                )}
              </div>
              
              {editingBoard !== board.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-none hover:bg-muted">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-none border-border">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingBoard(board.id)
                        setEditBoardName(board.name)
                      }}
                      className="rounded-none font-mono text-xs uppercase"
                    >
                      <Edit3 className="h-3 w-3 mr-2" />
                      Rename Board
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setCreatingColumnFor(board.id)}
                      className="rounded-none font-mono text-xs uppercase"
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Add Column
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          className="text-destructive rounded-none font-mono text-xs uppercase"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete Board
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-none border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-bold uppercase tracking-widest text-sm">Delete Board</AlertDialogTitle>
                          <AlertDialogDescription className="font-mono text-xs">
                            Are you sure you want to delete &apos;{board.name}&apos;? This will also delete all its columns and tasks.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-none border-border font-mono text-xs uppercase">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteBoard(board.id)}
                            className="bg-destructive hover:bg-destructive/90 rounded-none font-mono text-xs uppercase"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Add Column Form */}
            {creatingColumnFor === board.id && (
              <div className="mb-4 p-3 bg-muted/5 border border-dashed border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="ENTER COLUMN NAME"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    className="flex-1 h-8 rounded-none font-mono text-xs uppercase bg-background"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateColumn(board.id)
                      } else if (e.key === 'Escape') {
                        setCreatingColumnFor(null)
                        setNewColumnName("")
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    className="rounded-none h-8 px-3 text-xs uppercase font-mono"
                    onClick={() => handleCreateColumn(board.id)}
                    disabled={!newColumnName.trim()}
                  >
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-none h-8 px-2"
                    onClick={() => {
                      setCreatingColumnFor(null)
                      setNewColumnName("")
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {board.columns.map((column) => (
                <div key={column.id} className="p-3 bg-muted/5 border border-border group/col hover:border-primary/20 transition-colors">
                  <div className="flex items-center justify-between">
                    {editingColumn === column.id ? (
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          value={editColumnName}
                          onChange={(e) => setEditColumnName(e.target.value)}
                          className="h-7 text-xs flex-1 rounded-none font-mono uppercase bg-background"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateColumn(column.id)
                            } else if (e.key === 'Escape') {
                              setEditingColumn(null)
                              setEditColumnName("")
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          className="h-7 w-7 p-0 rounded-none"
                          onClick={() => handleUpdateColumn(column.id)}
                          disabled={!editColumnName.trim()}
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Columns className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs font-bold uppercase tracking-wide truncate">{column.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            ({column.tasks?.length || 0})
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-none hover:bg-muted opacity-0 group-hover/col:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-none border-border">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingColumn(column.id)
                                setEditColumnName(column.name)
                              }}
                              className="rounded-none font-mono text-xs uppercase"
                            >
                              <Edit3 className="h-3 w-3 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive rounded-none font-mono text-xs uppercase"
                                >
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-none border-border">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="font-bold uppercase tracking-widest text-sm">Delete Column</AlertDialogTitle>
                                  <AlertDialogDescription className="font-mono text-xs">
                                    Are you sure you want to delete &apos;{column.name}&apos;?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-none border-border font-mono text-xs uppercase">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteColumn(column.id)}
                                    className="bg-destructive hover:bg-destructive/90 rounded-none font-mono text-xs uppercase"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}