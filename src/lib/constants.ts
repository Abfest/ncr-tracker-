// Shared dropdown options for NCR forms
// Edit these lists to match your organization's structure

export const DEPARTMENTS = [
  'Production',
  'Quality Assurance',
  'Warehouse',
  'Maintenance',
  'Packaging',
  'Engineering',
  'Procurement',
  'Logistics',
  'Health & Safety',
  'Other',
] as const;

export const ASSIGNEES = [
  'QA Operator',
  'QA Inspector',
  'QA Manager',
  'Production Lead',
  'Maintenance Lead',
  'Warehouse Manager',
  'Line Supervisor',
  'Engineering Lead',
  'Procurement Officer',
  'Other',
] as const;

export type Department = typeof DEPARTMENTS[number];
export type Assignee = typeof ASSIGNEES[number];

// Priority sort order (Critical = highest urgency = lowest number)
export const PRIORITY_ORDER = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
} as const;

// Status sort order (Open first, Closed last)
export const STATUS_ORDER = {
  open: 0,
  'in-progress': 1,
  closed: 2,
} as const;
