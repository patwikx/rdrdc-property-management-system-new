export interface BoardTemplate {
  id: string
  name: string
  description: string
  columns: { name: string; order: number }[]
}

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: "kanban",
    name: "Kanban Board",
    description: "Classic kanban workflow for general project management",
    columns: [
      { name: "To Do", order: 0 },
      { name: "In Progress", order: 1 },
      { name: "Review", order: 2 },
      { name: "Done", order: 3 },
    ],
  },
  {
    id: "scrum",
    name: "Scrum Board",
    description: "Agile development workflow with sprint planning",
    columns: [
      { name: "Backlog", order: 0 },
      { name: "Sprint Planning", order: 1 },
      { name: "In Development", order: 2 },
      { name: "Testing", order: 3 },
      { name: "Done", order: 4 },
    ],
  },
  {
    id: "simple",
    name: "Simple Workflow",
    description: "Basic three-column workflow for simple projects",
    columns: [
      { name: "To Do", order: 0 },
      { name: "Doing", order: 1 },
      { name: "Done", order: 2 },
    ],
  },
  {
    id: "design",
    name: "Design Process",
    description: "Design workflow from concept to delivery",
    columns: [
      { name: "Ideas", order: 0 },
      { name: "Wireframes", order: 1 },
      { name: "Design", order: 2 },
      { name: "Review", order: 3 },
      { name: "Approved", order: 4 },
    ],
  },
  {
    id: "marketing",
    name: "Marketing Campaign",
    description: "Marketing workflow from planning to execution",
    columns: [
      { name: "Planning", order: 0 },
      { name: "Content Creation", order: 1 },
      { name: "Review & Approval", order: 2 },
      { name: "Scheduled", order: 3 },
      { name: "Published", order: 4 },
    ],
  },
  {
    id: "bug-tracking",
    name: "Bug Tracking",
    description: "Software bug tracking and resolution workflow",
    columns: [
      { name: "Reported", order: 0 },
      { name: "Confirmed", order: 1 },
      { name: "In Progress", order: 2 },
      { name: "Testing", order: 3 },
      { name: "Resolved", order: 4 },
    ],
  },
  {
    id: "custom",
    name: "Custom Template",
    description: "Create your own custom workflow with personalized columns",
    columns: [
      { name: "To Do", order: 0 },
      { name: "In Progress", order: 1 },
      { name: "Done", order: 2 },
    ],
  },
]

export function getBoardTemplate(templateId: string): BoardTemplate | undefined {
  return BOARD_TEMPLATES.find(template => template.id === templateId)
}

export function getDefaultTemplate(): BoardTemplate {
  return BOARD_TEMPLATES[0] // Kanban board as default
}