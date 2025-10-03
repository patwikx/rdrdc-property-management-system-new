import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { BoardView } from "@/components/projects/board-view"

interface BoardPageProps {
  params: {
    id: string
  }
}

async function getBoardWithDetails(boardId: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return null
  }

  try {
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        project: {
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
      },
      include: {
        project: {
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
          },
        },
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
    })

    return board
  } catch (error) {
    console.error("Error fetching board:", error)
    return null
  }
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { id } = await params
  const board = await getBoardWithDetails(id)
  
  if (!board) {
    return notFound()
  }

  return (
    <div className="h-full">
      <BoardView board={board} />
    </div>
  )
}