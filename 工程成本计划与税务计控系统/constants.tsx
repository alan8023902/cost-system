
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
  Stamp
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

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: '工作台', icon: <LayoutDashboard size={20} />, path: '/projects' },
  { id: 'projects', label: '项目管理', icon: <FolderKanban size={20} />, path: '/projects' },
  { id: 'templates', label: '定额模板', icon: <FileText size={20} />, path: '#' },
  { id: 'analysis', label: '数据分析', icon: <BarChart3 size={20} />, path: '#' },
  { id: 'settings', label: '系统设置', icon: <Settings size={20} />, path: '#' },
];

export const WORKBENCH_TABS = [
  { id: 'material', label: '物资明细' },
  { id: 'subcontract', label: '分包明细' },
  { id: 'expense', label: '费用明细' },
  { id: 'indicators', label: '指标看板' },
  { id: 'workflow', label: '审批流' },
  { id: 'import-export', label: '导入导出' },
  { id: 'seal', label: '签章归档' },
  { id: 'audit', label: '审计日志' }
];
