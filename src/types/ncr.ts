export type NCRStatus = 'open' | 'in-progress' | 'closed'
export type NCRPriority = 'low' | 'medium' | 'high' | 'critical'

export interface NCR {
  id: string
  ncrNumber: string
  title: string
  description: string
  status: NCRStatus
  priority: NCRPriority
  department: string
  assignee: string
  reportedBy: string
  createdAt: Date
  updatedAt: Date
  dueDate?: Date
  closedAt?: Date
  isArchived?: boolean
  archivedAt?: Date
}

export interface CreateNCRInput {
  title: string
  description: string
  priority: NCRPriority
  department: string
  assignee: string
  dueDate?: string
}

export interface UpdateNCRInput {
  title?: string
  description?: string
  status?: NCRStatus
  priority?: NCRPriority
  department?: string
  assignee?: string
  dueDate?: string
}
