// Starter taxonomies per industry. These are just sensible defaults an
// organization can apply from the Settings page and then further edit —
// nothing here is hardcoded into the app logic itself.

export interface IndustryPreset {
  id: string
  label: string
  description: string
  issueTypeLabel: string // what "Defect Type" is called in this industry
  vendorLabel: string // what "Supplier" is called in this industry
  departments: string[]
  issueTypes: string[]
  vendors: string[]
  assignees: string[]
}

export const INDUSTRY_PRESETS: IndustryPreset[] = [
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    description: 'Injection moulding, electronics, and general production lines.',
    issueTypeLabel: 'Defect Type',
    vendorLabel: 'Supplier',
    departments: ['Production', 'Quality Assurance', 'Warehouse', 'Maintenance', 'Packaging', 'Engineering', 'Procurement', 'Logistics', 'Health & Safety', 'Other'],
    issueTypes: ['Dented', 'Short Mould', 'Surface / Cosmetic', 'Bubble', 'White Contamination', 'Dirty', 'Crack / Flashes', 'Scratch', 'High Gating', 'Reaction', 'Dimensional / Measurement', 'Process / Workmanship', 'Documentation / Labelling', 'Equipment / Calibration', 'Other'],
    vendors: ['Chain-Ray', 'CICOR', 'PRONTOPLAST', 'SONOVA', 'STAMM', 'TOOLCRAFT', 'WIDEX', 'Other'],
    assignees: ['QA Operator', 'QA Inspector', 'QA Manager', 'Production Lead', 'Maintenance Lead', 'Warehouse Manager', 'Line Supervisor', 'Engineering Lead', 'Procurement Officer', 'Other'],
  },
  {
    id: 'construction',
    label: 'Construction',
    description: 'Site inspections, subcontractor work, and building defects.',
    issueTypeLabel: 'Defect Type',
    vendorLabel: 'Subcontractor',
    departments: ['Site Operations', 'Quality Assurance', 'Safety', 'Structural', 'MEP', 'Procurement', 'Design / Architecture', 'Project Management', 'Other'],
    issueTypes: ['Structural Crack', 'Water Ingress', 'Incorrect Material', 'Poor Finishing', 'Dimensional / Out of Tolerance', 'Non-Compliant Installation', 'Missing Documentation', 'Safety Hazard', 'Delay-Related', 'Other'],
    vendors: ['Main Contractor', 'Electrical Subcontractor', 'Plumbing Subcontractor', 'Structural Subcontractor', 'Finishing Subcontractor', 'Materials Supplier', 'Other'],
    assignees: ['Site Supervisor', 'QA Inspector', 'Safety Officer', 'Project Manager', 'Structural Engineer', 'Architect', 'Other'],
  },
  {
    id: 'food-safety',
    label: 'Food Safety',
    description: 'HACCP-aligned tracking for food production and handling.',
    issueTypeLabel: 'Issue Type',
    vendorLabel: 'Supplier',
    departments: ['Production', 'Quality Assurance', 'Hygiene / Sanitation', 'Warehouse & Cold Chain', 'Procurement', 'Packaging', 'Health & Safety', 'Other'],
    issueTypes: ['Temperature Deviation', 'Foreign Object', 'Contamination', 'Labelling Error', 'Expired / Near-Expiry', 'Packaging Defect', 'Allergen Cross-Contact', 'Pest Sighting', 'Documentation Gap', 'Other'],
    vendors: ['Raw Material Supplier', 'Packaging Supplier', 'Cold Chain Logistics', 'Co-Packer', 'Other'],
    assignees: ['QA Officer', 'HACCP Coordinator', 'Production Supervisor', 'Hygiene Officer', 'Warehouse Manager', 'Other'],
  },
  {
    id: 'healthcare-lab',
    label: 'Healthcare / Lab',
    description: 'Non-conformances in labs, clinics, and clinical support processes.',
    issueTypeLabel: 'Issue Type',
    vendorLabel: 'Vendor',
    departments: ['Laboratory', 'Quality Assurance', 'Clinical Support', 'Sterile Processing', 'Procurement', 'Biomedical Engineering', 'Health & Safety', 'Other'],
    issueTypes: ['Sample Mislabelling', 'Equipment Calibration', 'Result Discrepancy', 'Documentation Error', 'Storage Condition Deviation', 'Contamination Risk', 'Process Deviation', 'Consumable Defect', 'Other'],
    vendors: ['Reagent Supplier', 'Equipment Vendor', 'Consumables Supplier', 'Calibration Service', 'Other'],
    assignees: ['Lab Technician', 'QA Officer', 'Lab Manager', 'Biomedical Engineer', 'Clinical Supervisor', 'Other'],
  },
  {
    id: 'professional-services',
    label: 'Professional Services',
    description: 'Client deliverable issues and internal process non-conformances.',
    issueTypeLabel: 'Issue Type',
    vendorLabel: 'Vendor',
    departments: ['Delivery', 'Quality Assurance', 'Client Services', 'Operations', 'Procurement', 'Compliance', 'Other'],
    issueTypes: ['Deliverable Error', 'Missed Deadline', 'Scope Deviation', 'Documentation Gap', 'Client Complaint', 'Process Non-Compliance', 'Data / Confidentiality Issue', 'Other'],
    vendors: ['Subcontracted Consultant', 'Software Vendor', 'Outsourced Service Provider', 'Other'],
    assignees: ['Delivery Lead', 'QA Reviewer', 'Account Manager', 'Operations Manager', 'Compliance Officer', 'Other'],
  },
]

export const DEFAULT_PRESET_ID = 'manufacturing'
