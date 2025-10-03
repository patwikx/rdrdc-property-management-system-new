"use client"

import { useState } from "react"
import { Plus, MoreHorizontal, Columns, Edit3, Trash2 } from "lucide-react"
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

  const handleDeleteBoard = async (boardId: string, boardName: string) => {
    if (!confirm(`Are you sure you want to delete the board "${boardName}"? This will also delete all its columns and tasks.`)) {
      return
    }

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

  const handleDeleteColumn = async (columnId: string, columnName: string) => {
    if (!confirm(`Are you sure you want to delete the column "${columnName}"?`)) {
      return
    }

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
      <div className="bg-muted/30 rounded-lg p-4">
        <h3 className="font-medium mb-3">Create New Board</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Enter board name"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateBoard()
              }
            }}
          />
          <Button 
            onClick={handleCreateBoard}
            disabled={isCreatingBoard || !newBoardName.trim()}
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
        <h3 className="font-medium">Manage Boards</h3>
        
        {project.boards.map((board) => (
          <div key={board.id} className="bg-muted/30 rounded-lg p-4">
            {/* Board Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {editingBoard === board.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editBoardName}
                      onChange={(e) => setEditBoardName(e.target.value)}
                      className="h-8"
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
                      onClick={() => handleUpdateBoard(board.id)}
                      disabled={!editBoardName.trim()}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingBoard(null)
                        setEditBoardName("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <h4 className="font-medium">{board.name}</h4>
                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-1">
                      {board.columns.length} columns
                    </span>
                  </>
                )}
              </div>
              
              {editingBoard !== board.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingBoard(board.id)
                        setEditBoardName(board.name)
                      }}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Board
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setCreatingColumnFor(board.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Column
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteBoard(board.id, board.name)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Board
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Add Column Form */}
            {creatingColumnFor === board.id && (
              <div className="mb-3 p-3 bg-background rounded-lg border border-border/50">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter column name"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    className="flex-1 h-8"
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
                    onClick={() => handleCreateColumn(board.id)}
                    disabled={!newColumnName.trim()}
                  >
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCreatingColumnFor(null)
                      setNewColumnName("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {board.columns.map((column) => (
                <div key={column.id} className="p-2 bg-background rounded border border-border/50">
                  <div className="flex items-center justify-between">
                    {editingColumn === column.id ? (
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          value={editColumnName}
                          onChange={(e) => setEditColumnName(e.target.value)}
                          className="h-6 text-xs flex-1"
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
                          className="h-6 px-2 text-xs"
                          onClick={() => handleUpdateColumn(column.id)}
                          disabled={!editColumnName.trim()}
                        >
                          ✓
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Columns className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium truncate">{column.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({column.tasks?.length || 0})
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingColumn(column.id)
                                setEditColumnName(column.name)
                              }}
                            >
                              <Edit3 className="h-3 w-3 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteColumn(column.id, column.name)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
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