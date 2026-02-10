import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  FileText,
  User,
  CheckCircle,
  XCircle,
  Send,
  AlertCircle,
  Calendar,
  ChevronRight,
} from 'lucide-react';

interface Task {
  taskId: number;
  versionId: number;
  versionName: string;
  projectName: string;
  assignee: string;
  submitter: string;
  submitTime: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
}

export const MyTasks: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [activeTab]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/workflow/my-tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const allTasks = result.data || result;
        
        // Filter by status
        const filtered = activeTab === 'pending'
          ? allTasks.filter((t: Task) => t.status === 'PENDING')
          : allTasks.filter((t: Task) => t.status !== 'PENDING');
        
        setTasks(filtered);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedTask) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = approvalAction === 'approve' ? 'approve' : 'reject';
      
      const response = await fetch(
        `/api/workflow/versions/${selectedTask.versionId}/tasks/${selectedTask.taskId}/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ comment }),
        }
      );

      if (response.ok) {
        alert(approvalAction === 'approve' ? '审批通过' : '已驳回');
        setShowApprovalModal(false);
        setSelectedTask(null);
        setComment('');
        loadTasks();
      } else {
        const error = await response.json();
        alert(error.message || '操作失败');
      }
    } catch (error) {
      console.error('Failed to process approval:', error);
      alert('操作失败');
    } finally {
      setProcessing(false);
    }
  };

  const openApprovalModal = (task: Task, action: 'approve' | 'reject') => {
    setSelectedTask(task);
    setApprovalAction(action);
    setComment('');
    setShowApprovalModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string; icon: React.ReactNode }> = {
      PENDING: {
        text: '待审批',
        className: 'bg-yellow-100 text-yellow-700',
        icon: <Clock size={14} />,
      },
      APPROVED: {
        text: '已通过',
        className: 'bg-green-100 text-green-700',
        icon: <CheckCircle size={14} />,
      },
      REJECTED: {
        text: '已驳回',
        className: 'bg-red-100 text-red-700',
        icon: <XCircle size={14} />,
      },
    };
    const config = statusMap[status] || statusMap.PENDING;
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium ${config.className}`}>
        {config.icon}
        <span>{config.text}</span>
      </span>
    );
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else {
      return '刚刚';
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">我的待办</h1>
                <p className="mt-1 text-sm text-slate-500">
                  审批任务与工作流管理
                </p>
              </div>
              {activeTab === 'pending' && tasks.length > 0 && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg">
                  <AlertCircle size={16} />
                  <span className="text-sm font-medium">{tasks.length} 个待处理</span>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="mt-6 flex space-x-1 border-b border-slate-200">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'pending'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock size={16} className="inline mr-2" />
                待审批
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'completed'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle size={16} className="inline mr-2" />
                已处理
              </button>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="max-w-5xl mx-auto px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-400">加载中...</div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-400">
                {activeTab === 'pending' ? '暂无待审批任务' : '暂无已处理任务'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.taskId}
                  className="bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {task.versionName}
                          </h3>
                          {getStatusBadge(task.status)}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-slate-600 space-x-4">
                            <span className="flex items-center space-x-1">
                              <FileText size={14} />
                              <span>{task.projectName}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <User size={14} />
                              <span>提交人: {task.submitter}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar size={14} />
                              <span>{formatTimeAgo(task.submitTime)}</span>
                            </span>
                          </div>

                          {task.comment && (
                            <div className="text-sm text-slate-500 bg-slate-50 rounded p-2">
                              备注: {task.comment}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {task.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => navigate(`/versions/${task.versionId}/workbench`)}
                              className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              查看详情
                            </button>
                            <button
                              onClick={() => openApprovalModal(task, 'approve')}
                              className="px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                            >
                              <CheckCircle size={14} className="inline mr-1" />
                              通过
                            </button>
                            <button
                              onClick={() => openApprovalModal(task, 'reject')}
                              className="px-3 py-1.5 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                            >
                              <XCircle size={14} className="inline mr-1" />
                              驳回
                            </button>
                          </>
                        )}
                        {task.status !== 'PENDING' && (
                          <button
                            onClick={() => navigate(`/versions/${task.versionId}/workbench`)}
                            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            查看
                            <ChevronRight size={14} className="inline ml-1" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {approvalAction === 'approve' ? '审批通过' : '审批驳回'}
              </h3>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                <div className="text-sm text-slate-600">版本: {selectedTask.versionName}</div>
                <div className="text-sm text-slate-600">项目: {selectedTask.projectName}</div>
                <div className="text-sm text-slate-600">提交人: {selectedTask.submitter}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {approvalAction === 'approve' ? '审批意见（可选）' : '驳回原因'}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={approvalAction === 'approve' ? '请输入审批意见...' : '请输入驳回原因...'}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 p-4 border-t border-slate-200">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                  approvalAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing ? '处理中...' : approvalAction === 'approve' ? '确认通过' : '确认驳回'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MyTasks;
