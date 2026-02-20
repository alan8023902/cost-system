
import React from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut, 
  ChevronRight,
  Plus,
  Search,
  Filter,
  MoreVertical,
  History,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileDown,
  FileUp,
  Stamp,
  CheckSquare,
  Users,
  FileBox,
  Activity,
  GitPullRequest,
  Calculator,
  Briefcase
} from 'lucide-react';

export const COLORS = {
  primary: '#2563eb', // blue-600
  secondary: '#64748b', // slate-500
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  error: '#ef4444', // red-500
  background: '#f8fafc',
  card: '#ffffff'
};

export const AppLogoMark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 40 40"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M20 3.5L33 11V29L20 36.5L7 29V11L20 3.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M20 9.5V30.5M12 14.5L20 19.5L28 14.5M12 25.5L20 20.5L28 25.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="20" cy="9.5" r="1.7" fill="currentColor" />
    <circle cx="12" cy="14.5" r="1.4" fill="currentColor" />
    <circle cx="28" cy="14.5" r="1.4" fill="currentColor" />
    <circle cx="12" cy="25.5" r="1.4" fill="currentColor" />
    <circle cx="28" cy="25.5" r="1.4" fill="currentColor" />
    <circle cx="20" cy="30.5" r="1.7" fill="currentColor" />
  </svg>
);

// Level 1: Global Navigation (Simplified)
export const GLOBAL_NAV_ITEMS = [
  { id: 'overview', label: '概览', icon: <LayoutDashboard size={20} />, path: '/overview', tone: 'text-blue-600' },
  { id: 'workbench', label: '项目工作台', icon: <Calculator size={20} />, path: '/workbench', tone: 'text-indigo-600' },
  { id: 'projects', label: '项目管理', icon: <Briefcase size={20} />, path: '/projects', tone: 'text-cyan-600' },
  { id: 'templates', label: '模板管理', icon: <FileText size={20} />, path: '/templates', tone: 'text-emerald-600' },
  { id: 'my-tasks', label: '审批中心', icon: <CheckSquare size={20} />, path: '/my-tasks', tone: 'text-amber-600' },
  { id: 'files', label: '文件中心', icon: <FileBox size={20} />, path: '/files', tone: 'text-purple-600' },
  { id: 'settings', label: '系统设置', icon: <Settings size={20} />, path: '/settings', tone: 'text-slate-600' },
];

// Level 2: Project Navigation
export const PROJECT_NAV_ITEMS = (projectId: string) => [
  { id: 'overview', label: '项目概览', icon: <LayoutDashboard size={20} />, path: `/projects/${projectId}`, tone: 'text-blue-600' },
  { id: 'versions', label: '版本列表', icon: <History size={20} />, path: `/projects/${projectId}`, tone: 'text-indigo-600' }, // Currently same page
  { id: 'members', label: '成员管理', icon: <Users size={20} />, path: `/projects/${projectId}?tab=members`, tone: 'text-emerald-600' },
  { id: 'files', label: '文件中心', icon: <FileBox size={20} />, path: `/projects/${projectId}?tab=files`, tone: 'text-purple-600' },
  { id: 'audit', label: '审计日志', icon: <Activity size={20} />, path: `/projects/${projectId}?tab=audit`, tone: 'text-amber-600' },
];

// Level 3: Version Navigation
export const VERSION_NAV_ITEMS = (versionId: string) => [
  { id: 'details', label: '明细清单', icon: <FileText size={20} />, path: `/versions/${versionId}/workbench`, tone: 'text-blue-600' },
  { id: 'indicators', label: '指标看板', icon: <BarChart3 size={20} />, path: `/versions/${versionId}/workbench?tab=indicators`, tone: 'text-indigo-600' },
  { id: 'workflow', label: '审批流', icon: <GitPullRequest size={20} />, path: `/versions/${versionId}/workbench?tab=workflow`, tone: 'text-amber-600' },
  { id: 'reports', label: '报表输出', icon: <FileDown size={20} />, path: `/versions/${versionId}/workbench?tab=reports`, tone: 'text-emerald-600' },
  { id: 'io', label: '导入导出', icon: <FileUp size={20} />, path: `/versions/${versionId}/workbench?tab=import-export`, tone: 'text-cyan-600' },
  { id: 'files', label: '文件中心', icon: <FileBox size={20} />, path: `/versions/${versionId}/files`, tone: 'text-purple-600' },
  { id: 'audit', label: '审计追溯', icon: <ShieldCheck size={20} />, path: `/versions/${versionId}/workbench?tab=audit`, tone: 'text-red-600' },
];

export const WORKBENCH_TABS = [
  { id: 'material', label: '物资明细' },
  { id: 'subcontract', label: '分包明细' },
  { id: 'expense', label: '费用明细' },
  { id: 'indicators', label: '指标看板' },
  { id: 'workflow', label: '审批流' },
  { id: 'reports', label: '报表输出' },
  { id: 'import-export', label: '导入导出' },
  { id: 'seal', label: '签章归档' },
  { id: 'audit', label: '审计日志' }
];

export const ROLE_LABELS: Record<string, string> = {
  PROJECT_ADMIN: '项目管理员',
  APPROVER: '审批人',
  REVIEWER: '复核人',
  EDITOR: '编辑',
  VIEWER: '只读',
  SEAL_ADMIN: '签章管理员',
};

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: '进行中',
  IN_PROGRESS: '进行中',
  ARCHIVED: '已归档',
  DRAFT: '草稿',
  IN_APPROVAL: '审批中',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  ISSUED: '已签发',
  PENDING: '待处理',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  RUNNING: '进行中',
  SUSPENDED: '已挂起',
  TERMINATED: '已终止',
};

export const INDICATOR_KEY_LABELS: Record<string, string> = {
  'PLAN.MATERIAL_TOTAL': '计划 · 物资总计',
  'PLAN.SUBCONTRACT_TOTAL': '计划 · 分包总计',
  'PLAN.EXPENSE_TOTAL': '计划 · 费用总计',
  'PLAN.COST_TOTAL': '计划 · 成本总计',
  'PLAN.CONTRACT_AMOUNT': '计划 · 合同金额',
  'TAX.INPUT_TOTAL': '税务 · 进项税',
  'TAX.OUTPUT_TOTAL': '税务 · 销项税',
  'PROFIT.GROSS_RATE': '利润 · 毛利率',
  'PROFIT.NET_RATE': '利润 · 净利率',
  TOTAL_MATERIAL: '汇总 · 物资合计',
  TOTAL_SUBCONTRACT: '汇总 · 分包合计',
  TOTAL_EXPENSE: '汇总 · 费用合计',
  TOTAL_COST: '汇总 · 成本合计',
};

const INDICATOR_SEGMENT_LABELS: Record<string, string> = {
  PLAN: '计划',
  TAX: '税务',
  PROFIT: '利润',
  MATERIAL: '物资',
  SUBCONTRACT: '分包',
  EXPENSE: '费用',
  TOTAL: '总计',
  AMOUNT: '金额',
  RATE: '率',
  COST: '成本',
  CONTRACT: '合同',
  INPUT: '进项',
  OUTPUT: '销项',
  GROSS: '毛利',
  NET: '净利',
};

export const formatRoleLabel = (role?: string) => {
  if (!role) return '-';
  return ROLE_LABELS[role] || role;
};

export const formatStatusLabel = (status?: string) => {
  if (!status) return '-';
  return STATUS_LABELS[status] || status;
};

export const formatIndicatorLabel = (indicatorKey?: string, indicatorName?: string) => {
  const name = indicatorName?.trim();
  if (name) return name;
  if (!indicatorKey) return '-';
  if (INDICATOR_KEY_LABELS[indicatorKey]) return INDICATOR_KEY_LABELS[indicatorKey];
  const segments = indicatorKey.split('.');
  const translated = segments.map((segment) => {
    const words = segment.split('_');
    return words.map((word) => INDICATOR_SEGMENT_LABELS[word] || word).join('');
  });
  return translated.join(' · ');
};
