import React, { useEffect, useState } from 'react';
import { Clock, User, FileText, Edit, Trash2, CheckCircle, XCircle, Send, Archive } from 'lucide-react';

interface AuditLog {
  id: number;
  projectId: number;
  versionId?: number;
  bizType: string;
  bizId?: number;
  action: string;
  operatorName: string;
  detailJson?: string;
  createdAt: string;
}

interface AuditLogPanelProps {
  projectId: string;
  versionId?: string;
}

export const AuditLogPanel: React.FC<AuditLogPanelProps> = ({ projectId, versionId }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'version' | 'project'>('all');

  useEffect(() => {
    loadAuditLogs();
  }, [projectId, versionId, filter]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = versionId && filter !== 'project'
        ? `/api/audit/projects/${projectId}/audit-logs?versionId=${versionId}`
        : `/api/audit/projects/${projectId}/audit-logs`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setLogs(result.data || result);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      CREATE: <FileText size={16} className="text-green-600" />,
      UPDATE: <Edit size={16} className="text-blue-600" />,
      DELETE: <Trash2 size={16} className="text-red-600" />,
      APPROVE: <CheckCircle size={16} className="text-green-600" />,
      REJECT: <XCircle size={16} className="text-red-600" />,
      SUBMIT: <Send size={16} className="text-blue-600" />,
      ARCHIVE: <Archive size={16} className="text-slate-600" />,
    };
    return iconMap[action] || <FileText size={16} className="text-slate-600" />;
  };

  const getActionText = (action: string) => {
    const textMap: Record<string, string> = {
      CREATE: '创建',
      UPDATE: '更新',
      DELETE: '删除',
      APPROVE: '审批通过',
      REJECT: '审批驳回',
      SUBMIT: '提交审批',
      ARCHIVE: '归档',
      WITHDRAW: '撤回',
      ISSUE: '签发',
    };
    return textMap[action] || action;
  };

  const getBizTypeText = (bizType: string) => {
    const textMap: Record<string, string> = {
      PROJECT: '项目',
      VERSION: '版本',
      LINE_ITEM: '明细行',
      MEMBER: '成员',
      WORKFLOW: '工作流',
    };
    return textMap[bizType] || bizType;
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleString('zh-CN');
    } else if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return '刚刚';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      {versionId && (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`ui-btn ui-btn-sm ${filter === 'all' ? 'ui-btn-primary' : 'ui-btn-default'}`}
          >
            全部日志
          </button>
          <button
            onClick={() => setFilter('version')}
            className={`ui-btn ui-btn-sm ${filter === 'version' ? 'ui-btn-primary' : 'ui-btn-default'}`}
          >
            当前版本
          </button>
          <button
            onClick={() => setFilter('project')}
            className={`ui-btn ui-btn-sm ${filter === 'project' ? 'ui-btn-primary' : 'ui-btn-default'}`}
          >
            项目日志
          </button>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-lg border border-slate-200">
        {logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            暂无操作日志
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log, index) => (
              <div
                key={log.id}
                className="p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      {getActionIcon(log.action)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-slate-900">
                          {log.operatorName}
                        </span>
                        <span className="text-sm text-slate-600">
                          {getActionText(log.action)}了
                        </span>
                        <span className="text-sm text-slate-900 font-medium">
                          {getBizTypeText(log.bizType)}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-slate-400 space-x-1">
                        <Clock size={12} />
                        <span>{formatTimeAgo(log.createdAt)}</span>
                      </div>
                    </div>

                    {/* Detail */}
                    {log.detailJson && (
                      <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded p-2 font-mono">
                        {log.detailJson}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
