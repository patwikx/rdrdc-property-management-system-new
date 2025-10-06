"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { ProjectStatus, ProjectRole, TaskPriority, TaskStatus, ActivityType } from "@prisma/client"
import { getBoardTemplate, getDefaultTemplate } from "@/lib/board-templates"

export interface ProjectWithDetails {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  startDate: Date
  endDate: Date | null
  createdAt: Date
  updatedAt: Date
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
  boards: {
    id: string
    name: string
    order: number
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
  }[]
  _count: {
    tasks: number
    members: number
  }
}

export interface ProjectListItem {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  startDate: Date
  endDate: Date | null
  createdAt: Date
  updatedAt: Date
  owner: {
    firstName: string
    lastName: string
  }
  _count: {
    tasks: number
    members: number
  }
}

export interface CreateProjectData {
  name: string
  description?: string
  startDate: Date
  endDate?: Date
  boardTemplate?: string
  customColumns?: string[]
}

export interface CreateBoardData {
  projectId: string
  name: string
}

export interface CreateColumnData {
  boardId: string
  name: string
}

export interface CreateTaskData {
  projectId: string
  columnId: string
  title: string
  description?: string
  priority: TaskPriority
  dueDate?: Date
  assignedToId?: string
}

export interface UpdateTaskData {
  id: string
  title?: string
  description?: string
  priority?: TaskPriority
  dueDate?: Date
  assignedToId?: string
  columnId?: string
  order?: number
}

export async function createProject(data: CreateProjectData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        ownerId: session.user.id,
        status: ProjectStatus.ACTIVE,
      },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Handle board creation
    let boardName = "Main Board"
    let columnsToCreate: { name: string; order: number }[] = []

    if (data.boardTemplate === 'custom' && data.customColumns) {
      // Use custom columns
      boardName = "Main Board"
      columnsToCreate = data.customColumns.map((name, index) => ({
        name: name.trim(),
        order: index,
      }))
    } else {
      // Use predefined template
      const template = data.boardTemplate 
        ? getBoardTemplate(data.boardTemplate) 
        : getDefaultTemplate()

      if (!template) {
        throw new Error("Invalid board template")
      }

      boardName = template.name
      columnsToCreate = template.columns
    }

    // Create board
    const board = await prisma.board.create({
      data: {
        projectId: project.id,
        name: boardName,
        order: 0,
      },
    })

    // Create columns
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const createdColumns = await Promise.all(
      columnsToCreate.map((column) =>
        prisma.column.create({
          data: {
            boardId: board.id,
            name: column.name,
            order: column.order,
          },
        })
      )
    )

    revalidatePath("/projects")
    return { success: "Project created successfully", project }
  } catch (error) {
    console.error("Error creating project:", error)
    return { error: "Failed to create project" }
  }
}

export async function getProjectsWithBoards() {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        boards: {
          include: {
            columns: {
              include: {
                tasks: {
                  include: {
                    createdBy: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                    assignedTo: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                    _count: {
                      select: {
                        comments: true,
                        attachments: true,
                      },
                    },
                  },
                  orderBy: {
                    order: 'asc',
                  },
                },
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return projects
  } catch (error) {
    console.error("Error fetching projects:", error)
    throw new Error("Failed to fetch projects")
  }
}

export async function getProjects(): Promise<ProjectListItem[]> {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return projects
  } catch (error) {
    console.error("Error fetching projects:", error)
    throw new Error("Failed to fetch projects")
  }
}

export async function getProjectById(id: string): Promise<ProjectWithDetails | null> {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
        boards: {
          include: {
            columns: {
              include: {
                tasks: {
                  include: {
                    createdBy: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                    assignedTo: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                    _count: {
                      select: {
                        comments: true,
                        attachments: true,
                      },
                    },
                  },
                  orderBy: {
                    order: 'asc',
                  },
                },
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
    })

    return project
  } catch (error) {
    console.error("Error fetching project:", error)
    return null
  }
}

export async function createTask(data: CreateTaskData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Get the highest order in the column
    const lastTask = await prisma.task.findFirst({
      where: { columnId: data.columnId },
      orderBy: { order: 'desc' },
    })

    const newOrder = (lastTask?.order ?? -1) + 1

    const task = await prisma.task.create({
      data: {
        projectId: data.projectId,
        columnId: data.columnId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate,
        assignedToId: data.assignedToId,
        createdById: session.user.id,
        order: newOrder,
        status: TaskStatus.TODO,
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
    })

    // Create activity log
    await prisma.taskActivity.create({
      data: {
        taskId: task.id,
        userId: session.user.id,
        type: ActivityType.CREATED,
        content: `Created task "${task.title}"`,
      },
    })

    revalidatePath(`/projects/${data.projectId}`)
    return { success: "Task created successfully", task }
  } catch (error) {
    console.error("Error creating task:", error)
    return { error: "Failed to create task" }
  }
}

export async function updateTask(data: UpdateTaskData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: data.id },
      include: {
        column: true,
      },
    })

    if (!existingTask) {
      return { error: "Task not found" }
    }

    const updateData: Record<string, unknown> = {}
    const activities: { type: ActivityType; content: string }[] = []

    if (data.title && data.title !== existingTask.title) {
      updateData.title = data.title
      activities.push({
        type: ActivityType.UPDATED,
        content: `Changed title from "${existingTask.title}" to "${data.title}"`,
      })
    }

    if (data.description !== undefined && data.description !== existingTask.description) {
      updateData.description = data.description
      activities.push({
        type: ActivityType.UPDATED,
        content: "Updated task description",
      })
    }

    if (data.priority && data.priority !== existingTask.priority) {
      updateData.priority = data.priority
      activities.push({
        type: ActivityType.UPDATED,
        content: `Changed priority from ${existingTask.priority} to ${data.priority}`,
      })
    }

    if (data.dueDate !== undefined && data.dueDate?.getTime() !== existingTask.dueDate?.getTime()) {
      updateData.dueDate = data.dueDate
      activities.push({
        type: ActivityType.DUE_DATE_CHANGED,
        content: data.dueDate 
          ? `Set due date to ${data.dueDate.toLocaleDateString()}`
          : "Removed due date",
      })
    }

    if (data.assignedToId !== undefined && data.assignedToId !== existingTask.assignedToId) {
      updateData.assignedToId = data.assignedToId
      activities.push({
        type: data.assignedToId ? ActivityType.ASSIGNED : ActivityType.UNASSIGNED,
        content: data.assignedToId ? "Task assigned" : "Task unassigned",
      })
    }

    if (data.columnId && data.columnId !== existingTask.columnId) {
      updateData.columnId = data.columnId
      
      // Get the highest order in the new column
      const lastTask = await prisma.task.findFirst({
        where: { columnId: data.columnId },
        orderBy: { order: 'desc' },
      })
      
      updateData.order = (lastTask?.order ?? -1) + 1
      
      activities.push({
        type: ActivityType.MOVED,
        content: `Moved to different column`,
      })
    } else if (data.order !== undefined && data.order !== existingTask.order) {
      updateData.order = data.order
    }

    const task = await prisma.task.update({
      where: { id: data.id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
    })

    // Create activity logs
    await Promise.all(
      activities.map((activity) =>
        prisma.taskActivity.create({
          data: {
            taskId: task.id,
            userId: session.user.id,
            type: activity.type,
            content: activity.content,
          },
        })
      )
    )

    revalidatePath(`/projects/${existingTask.projectId}`)
    return { success: "Task updated successfully", task }
  } catch (error) {
    console.error("Error updating task:", error)
    return { error: "Failed to update task" }
  }
}

export async function deleteTask(id: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id },
    })

    if (!task) {
      return { error: "Task not found" }
    }

    await prisma.task.delete({
      where: { id },
    })

    revalidatePath(`/projects/${task.projectId}`)
    return { success: "Task deleted successfully" }
  } catch (error) {
    console.error("Error deleting task:", error)
    return { error: "Failed to delete task" }
  }
}

export async function reorderTasks(
  columnId: string,
  taskIds: string[]
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    await Promise.all(
      taskIds.map((taskId, index) =>
        prisma.task.update({
          where: { id: taskId },
          data: { order: index },
        })
      )
    )

    return { success: "Tasks reordered successfully" }
  } catch (error) {
    console.error("Error reordering tasks:", error)
    return { error: "Failed to reorder tasks" }
  }
}

export async function moveTask(
  taskId: string,
  sourceColumnId: string,
  destinationColumnId: string,
  destinationIndex: number
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  console.log('=== MOVE TASK DEBUG ===')
  console.log('Task ID:', taskId)
  console.log('Source Column:', sourceColumnId)
  console.log('Destination Column:', destinationColumnId)
  console.log('Destination Index:', destinationIndex)

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    })

    if (!task) {
      return { error: "Task not found" }
    }

    console.log('Current task column:', task.columnId)
    console.log('Current task order:', task.order)

    // Get all tasks in the destination column (excluding the task being moved)
    const destinationTasks = await prisma.task.findMany({
      where: { 
        columnId: destinationColumnId,
        id: { not: taskId },
      },
      orderBy: { order: 'asc' },
    })

    console.log('Destination tasks count:', destinationTasks.length)
    console.log('Destination tasks before move:', destinationTasks.map(t => ({ id: t.id, order: t.order, title: t.title })))

    // Create array with all tasks in their final positions
    const finalTaskOrder: string[] = []
    
    // Build final order: insert moved task at destinationIndex
    for (let i = 0; i < destinationTasks.length; i++) {
      if (i === destinationIndex) {
        finalTaskOrder.push(taskId)
      }
      finalTaskOrder.push(destinationTasks[i].id)
    }
    
    // If destinationIndex is at the end
    if (destinationIndex >= destinationTasks.length) {
      finalTaskOrder.push(taskId)
    }

    console.log('Final task order:', finalTaskOrder)

    // Update all tasks with their new sequential order
    await Promise.all(
      finalTaskOrder.map((id, index) =>
        prisma.task.update({
          where: { id },
          data: {
            columnId: destinationColumnId,
            order: index,
          },
        })
      )
    )

    console.log('Updated destination column tasks')

    // If moving between different columns, reorder the source column
    if (sourceColumnId !== destinationColumnId) {
      const sourceTasks = await prisma.task.findMany({
        where: { 
          columnId: sourceColumnId,
          id: { not: taskId },
        },
        orderBy: { order: 'asc' },
      })

      console.log('Source tasks to reorder:', sourceTasks.length)

      await Promise.all(
        sourceTasks.map((t, index) =>
          prisma.task.update({
            where: { id: t.id },
            data: { order: index },
          })
        )
      )

      console.log('Reordered source column tasks')
    }

    // Create activity log
    await prisma.taskActivity.create({
      data: {
        taskId: task.id,
        userId: session.user.id,
        type: ActivityType.MOVED,
        content: `Moved task between columns`,
      },
    })

    revalidatePath(`/projects/${task.projectId}`)
 
    return { success: "Task moved successfully" }
  } catch (error) {
    console.error("Error moving task:", error)
    return { error: "Failed to move task" }
  }
}

export async function getTaskWithDetails(taskId: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        attachments: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        activities: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        labels: true,
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
    })

    return task
  } catch (error) {
    console.error("Error fetching task details:", error)
    return null
  }
}

export async function addTaskComment(taskId: string, content: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId: session.user.id,
        content,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Create activity log
    await prisma.taskActivity.create({
      data: {
        taskId,
        userId: session.user.id,
        type: ActivityType.COMMENTED,
        content: `Added a comment`,
      },
    })

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    })

    if (task) {
      revalidatePath(`/projects/${task.projectId}`)
    }

    return { success: "Comment added successfully", comment }
  } catch (error) {
    console.error("Error adding comment:", error)
    return { error: "Failed to add comment" }
  }
}

export async function getTaskComments(taskId: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return comments
  } catch (error) {
    console.error("Error fetching comments:", error)
    return []
  }
}

export async function updateTaskDetails(
  taskId: string, 
  updates: {
    assignedToId?: string | null
    dueDate?: Date | null
    priority?: TaskPriority
    description?: string
  }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    })

    if (!existingTask) {
      return { error: "Task not found" }
    }

    const updateData: Record<string, unknown> = {}
    const activities: { type: ActivityType; content: string }[] = []

    if (updates.assignedToId !== undefined && updates.assignedToId !== existingTask.assignedToId) {
      updateData.assignedToId = updates.assignedToId
      activities.push({
        type: updates.assignedToId ? ActivityType.ASSIGNED : ActivityType.UNASSIGNED,
        content: updates.assignedToId ? "Task assigned" : "Task unassigned",
      })
    }

    if (updates.dueDate !== undefined && updates.dueDate?.getTime() !== existingTask.dueDate?.getTime()) {
      updateData.dueDate = updates.dueDate
      activities.push({
        type: ActivityType.DUE_DATE_CHANGED,
        content: updates.dueDate 
          ? `Set due date to ${updates.dueDate.toLocaleDateString()}`
          : "Removed due date",
      })
    }

    if (updates.priority && updates.priority !== existingTask.priority) {
      updateData.priority = updates.priority
      activities.push({
        type: ActivityType.UPDATED,
        content: `Changed priority from ${existingTask.priority} to ${updates.priority}`,
      })
    }

    if (updates.description !== undefined && updates.description !== existingTask.description) {
      updateData.description = updates.description
      activities.push({
        type: ActivityType.UPDATED,
        content: "Updated task description",
      })
    }

    if (Object.keys(updateData).length === 0) {
      return { success: "No changes to save" }
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
    })

    // Create activity logs
    await Promise.all(
      activities.map((activity) =>
        prisma.taskActivity.create({
          data: {
            taskId,
            userId: session.user.id,
            type: activity.type,
            content: activity.content,
          },
        })
      )
    )

    revalidatePath(`/projects/${existingTask.projectId}`)
    return { success: "Task updated successfully", task: updatedTask }
  } catch (error) {
    console.error("Error updating task:", error)
    return { error: "Failed to update task" }
  }
}

export async function updateProject(
  projectId: string,
  data: {
    name?: string
    description?: string
    status?: ProjectStatus
    startDate?: Date
    endDate?: Date | null
  }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if user is project owner
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id,
      },
    })

    if (!project) {
      return { error: "Project not found or you don't have permission to update it" }
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
    })

    revalidatePath(`/projects/${projectId}`)
    revalidatePath(`/projects/${projectId}/settings`)
    return { success: "Project updated successfully", project: updatedProject }
  } catch (error) {
    console.error("Error updating project:", error)
    return { error: "Failed to update project" }
  }
}

export async function deleteProject(projectId: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if user is project owner
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id,
      },
    })

    if (!project) {
      return { error: "Project not found or you don't have permission to delete it" }
    }

    await prisma.project.delete({
      where: { id: projectId },
    })

    revalidatePath("/projects")
    return { success: "Project deleted successfully" }
  } catch (error) {
    console.error("Error deleting project:", error)
    return { error: "Failed to delete project" }
  }
}

export async function addProjectMember(
  projectId: string,
  email: string,
  role: ProjectRole = ProjectRole.PURCHASER
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if user is project owner
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id,
      },
    })

    if (!project) {
      return { error: "Project not found or you don't have permission to add members" }
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return { error: "User not found with this email address" }
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
    })

    if (existingMember) {
      return { error: "User is already a member of this project" }
    }

    // Check if user is the project owner
    if (user.id === project.ownerId) {
      return { error: "Project owner cannot be added as a member" }
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    revalidatePath(`/projects/${projectId}`)
    revalidatePath(`/projects/${projectId}/settings`)
    return { success: "Member added successfully", member }
  } catch (error) {
    console.error("Error adding project member:", error)
    return { error: "Failed to add member" }
  }
}

export async function removeProjectMember(projectId: string, memberId: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if user is project owner
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id,
      },
    })

    if (!project) {
      return { error: "Project not found or you don't have permission to remove members" }
    }

    const member = await prisma.projectMember.findUnique({
      where: { id: memberId },
    })

    if (!member || member.projectId !== projectId) {
      return { error: "Member not found" }
    }

    await prisma.projectMember.delete({
      where: { id: memberId },
    })

    revalidatePath(`/projects/${projectId}`)
    revalidatePath(`/projects/${projectId}/settings`)
    return { success: "Member removed successfully" }
  } catch (error) {
    console.error("Error removing project member:", error)
    return { error: "Failed to remove member" }
  }
}

export async function updateProjectMemberRole(
  projectId: string,
  memberId: string,
  role: ProjectRole
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if user is project owner
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id,
      },
    })

    if (!project) {
      return { error: "Project not found or you don't have permission to update member roles" }
    }

    const member = await prisma.projectMember.findUnique({
      where: { id: memberId },
    })

    if (!member || member.projectId !== projectId) {
      return { error: "Member not found" }
    }

    const updatedMember = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    revalidatePath(`/projects/${projectId}`)
    revalidatePath(`/projects/${projectId}/settings`)
    return { success: "Member role updated successfully", member: updatedMember }
  } catch (error) {
    console.error("Error updating member role:", error)
    return { error: "Failed to update member role" }
  }
}

// Board Management Actions
export async function createBoard(projectId: string, name: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
    })

    if (!project) {
      return { error: "Project not found or you don't have permission" }
    }

    // Get the highest order for boards in this project
    const lastBoard = await prisma.board.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
    })

    const newOrder = (lastBoard?.order ?? -1) + 1

    const board = await prisma.board.create({
      data: {
        projectId,
        name,
        order: newOrder,
      },
    })

    // Create default columns for the new board
    const defaultColumns = [
      { name: "To Do", order: 0 },
      { name: "In Progress", order: 1 },
      { name: "Review", order: 2 },
      { name: "Done", order: 3 },
    ]

    await Promise.all(
      defaultColumns.map((column) =>
        prisma.column.create({
          data: {
            boardId: board.id,
            name: column.name,
            order: column.order,
          },
        })
      )
    )

    revalidatePath(`/projects/${projectId}`)
    revalidatePath("/projects/boards")
    return { success: "Board created successfully", board }
  } catch (error) {
    console.error("Error creating board:", error)
    return { error: "Failed to create board" }
  }
}

export async function updateBoard(boardId: string, name: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if user has access to the board's project
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        project: {
          include: {
            members: true,
          },
        },
      },
    })

    if (!board) {
      return { error: "Board not found" }
    }

    const hasAccess = board.project.ownerId === session.user.id || 
      board.project.members.some(member => member.userId === session.user.id)

    if (!hasAccess) {
      return { error: "You don't have permission to update this board" }
    }

    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data: { name },
    })

    revalidatePath(`/projects/${board.projectId}`)
    revalidatePath("/projects/boards")
    return { success: "Board updated successfully", board: updatedBoard }
  } catch (error) {
    console.error("Error updating board:", error)
    return { error: "Failed to update board" }
  }
}

export async function deleteBoard(boardId: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if user is project owner (only owners can delete boards)
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        project: true,
      },
    })

    if (!board) {
      return { error: "Board not found" }
    }

    if (board.project.ownerId !== session.user.id) {
      return { error: "Only project owners can delete boards" }
    }

    // Check if this is the last board in the project
    const boardCount = await prisma.board.count({
      where: { projectId: board.projectId },
    })

    if (boardCount <= 1) {
      return { error: "Cannot delete the last board in a project" }
    }

    await prisma.board.delete({
      where: { id: boardId },
    })

    revalidatePath(`/projects/${board.projectId}`)
    revalidatePath("/projects/boards")
    return { success: "Board deleted successfully" }
  } catch (error) {
    console.error("Error deleting board:", error)
    return { error: "Failed to delete board" }
  }
}

export async function createColumn(boardId: string, name: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if user has access to the board's project
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        project: {
          include: {
            members: true,
          },
        },
      },
    })

    if (!board) {
      return { error: "Board not found" }
    }

    const hasAccess = board.project.ownerId === session.user.id || 
      board.project.members.some(member => member.userId === session.user.id)

    if (!hasAccess) {
      return { error: "You don't have permission to modify this board" }
    }

    // Get the highest order for columns in this board
    const lastColumn = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { order: 'desc' },
    })

    const newOrder = (lastColumn?.order ?? -1) + 1

    const column = await prisma.column.create({
      data: {
        boardId,
        name,
        order: newOrder,
      },
    })

    revalidatePath(`/projects/${board.projectId}`)
    revalidatePath(`/projects/boards/${boardId}`)
    revalidatePath("/projects/boards")
    return { success: "Column created successfully", column }
  } catch (error) {
    console.error("Error creating column:", error)
    return { error: "Failed to create column" }
  }
}

export async function updateColumn(columnId: string, name: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if user has access to the column's project
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      include: {
        board: {
          include: {
            project: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    })

    if (!column) {
      return { error: "Column not found" }
    }

    const hasAccess = column.board.project.ownerId === session.user.id || 
      column.board.project.members.some(member => member.userId === session.user.id)

    if (!hasAccess) {
      return { error: "You don't have permission to update this column" }
    }

    const updatedColumn = await prisma.column.update({
      where: { id: columnId },
      data: { name },
    })

    revalidatePath(`/projects/${column.board.projectId}`)
    revalidatePath(`/projects/boards/${column.boardId}`)
    revalidatePath("/projects/boards")
    return { success: "Column updated successfully", column: updatedColumn }
  } catch (error) {
    console.error("Error updating column:", error)
    return { error: "Failed to update column" }
  }
}

export async function deleteColumn(columnId: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if user has access to the column's project
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      include: {
        board: {
          include: {
            project: {
              include: {
                members: true,
              },
            },
          },
        },
        tasks: true,
      },
    })

    if (!column) {
      return { error: "Column not found" }
    }

    const hasAccess = column.board.project.ownerId === session.user.id || 
      column.board.project.members.some(member => member.userId === session.user.id)

    if (!hasAccess) {
      return { error: "You don't have permission to delete this column" }
    }

    // Check if column has tasks
    if (column.tasks.length > 0) {
      return { error: "Cannot delete column with tasks. Move or delete tasks first." }
    }

    // Check if this is the last column in the board
    const columnCount = await prisma.column.count({
      where: { boardId: column.boardId },
    })

    if (columnCount <= 1) {
      return { error: "Cannot delete the last column in a board" }
    }

    await prisma.column.delete({
      where: { id: columnId },
    })

    revalidatePath(`/projects/${column.board.projectId}`)
    revalidatePath(`/projects/boards/${column.boardId}`)
    revalidatePath("/projects/boards")
    return { success: "Column deleted successfully" }
  } catch (error) {
    console.error("Error deleting column:", error)
    return { error: "Failed to delete column" }
  }
}