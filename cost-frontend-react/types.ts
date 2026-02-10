
export enum ProjectStatus {
  IN_PROGRESS = '进行中',
  COMPLETED = '已完成',
  ARCHIVED = '已归档'
}

export interface Project {
  id: string;
  name: string;
  code: string;
  manager: string;
  status: ProjectStatus;
  createDate: string;
  budget: number;
}

export interface ProjectVersion {
  id: string;
  projectId: string;
  versionName: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Sealed';
  creator: string;
  updateTime: string;
}

export interface Indicator {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'neutral';
  category: string;
}

export interface LineItem {
  id: string;
  name: string;
  spec: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
  taxRate: number;
  category: 'Material' | 'Subcontract' | 'Expense';
}

export interface AuditLog {
  id: string;
  content: string;
  operator: string;
  timestamp: string;
  type: 'Edit' | 'StatusChange' | 'Auth';
}
