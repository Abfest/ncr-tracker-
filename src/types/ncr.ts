export type NCRStatus = 'open' | 'in-progress' | 'closed'
export type NCRPriority = 'low' | 'medium' | 'high' | 'critical'

export type ActivityType =
  | 'created'
  | 'status_changed'
  | 'priority_changed'
  | 'assignee_changed'
  | 'due_date_changed'
  | 'title_updated'
  | 'description_updated'
  | 'department_updated'
  | 'archived'
  | 'restored'
  | 'comment'

export interface ActivityEntry {
  id: string
  type: ActivityType
  timestamp: Date
  userEmail: string
  /** For status/priority/assignee changes */
  fromValue?: string
  toValue?: string
  /** For comments */
  message?: string
}

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
  activity?: ActivityEntry[]
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
