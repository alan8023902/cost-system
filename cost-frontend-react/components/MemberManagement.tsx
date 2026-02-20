import React, { useState } from 'react';
import { X, UserPlus, Edit, Trash2 } from 'lucide-react';
import { projectApi } from '../services/apiService';
import { useToast } from './ToastProvider';



interface Member {
  userId: number;
  username: string;
  realName: string;
  permissions: string[];
  joinTime: string;
}

interface MemberManagementProps {
  projectId: string;
  members: Member[];
  onRefresh: () => void;
}

const PERMISSION_OPTIONS = [
  { key: 'PROJ_READ', label: '项目只读', description: '查看项目信息' },
  { key: 'PROJ_WRITE', label: '项目编辑', description: '修改项目信息' },
  { key: 'ITEM_READ', label: '明细只读', description: '查看成本明细' },
  { key: 'ITEM_WRITE', label: '明细编辑', description: '编辑成本明细' },
  { key: 'VERSION_REVIEW', label: '版本审批', description: '审批版本' },
  { key: 'VERSION_ISSUE', label: '版本签发', description: '签发版本' },
  { key: 'SEAL', label: '签章权限', description: '盖章操作' },
];

export const MemberManagement: React.FC<MemberManagementProps> = ({
  projectId,
  members,
  onRefresh,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();


  const handleAddMember = async () => {
    if (!newMemberUsername || selectedPermissions.length === 0) {
      toast.warning('请输入用户名并至少选择一个权限');
      return;
    }

    setLoading(true);
    try {
      await projectApi.addMember(projectId, {
        username: newMemberUsername,
        permissions: selectedPermissions,
      });
      setShowAddModal(false);
      setNewMemberUsername('');
      setSelectedPermissions([]);
      onRefresh();
      toast.success('成员添加成功');
    } catch (error: any) {
      console.error('Failed to add member:', error);
      toast.error(error?.message || '添加失败');
    } finally {
      setLoading(false);
    }

  };


  const handleUpdatePermissions = async () => {
    if (!selectedMember || selectedPermissions.length === 0) {
      toast.warning('请至少选择一个权限');
      return;
    }

    setLoading(true);
    try {
      await projectApi.updateMemberPermissions(projectId, selectedMember.userId, {
        permissions: selectedPermissions,
      });
      setShowEditModal(false);
      setSelectedMember(null);
      setSelectedPermissions([]);
      onRefresh();
      toast.success('权限更新成功');
    } catch (error: any) {
      console.error('Failed to update permissions:', error);
      toast.error(error?.message || '更新失败');
    } finally {
      setLoading(false);
    }

  };


  const handleRemoveMember = async (userId: number, username: string) => {
    if (!confirm(`确定要移除成员 ${username} 吗？`)) {
      return;
    }

    setLoading(true);
    try {
      await projectApi.removeMember(projectId, userId);
      onRefresh();
      toast.success('成员移除成功');
    } catch (error: any) {
      console.error('Failed to remove member:', error);
      toast.error(error?.message || '移除失败');
    } finally {
      setLoading(false);
    }

  };


  const openEditModal = (member: Member) => {
    setSelectedMember(member);
    setSelectedPermissions(member.permissions || []);
    setShowEditModal(true);
  };

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key)
        ? prev.filter((p) => p !== key)
        : [...prev, key]
    );
  };

  const getPermissionBadges = (permissions: string[]) => {
    if (!permissions || permissions.length === 0) {
      return <span className="text-xs text-slate-400">无权限</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {permissions.map((perm) => {
          const option = PERMISSION_OPTIONS.find((o) => o.key === perm);
          return (
            <span
              key={perm}
              className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
            >
              {option?.label || perm}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">项目成员管理</h3>
        <button
          onClick={() => {
            setSelectedPermissions(['PROJ_READ', 'ITEM_READ']);
            setShowAddModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus size={16} />
          <span>添加成员</span>
        </button>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg border border-slate-200">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                用户名
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                姓名
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                权限
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                加入时间
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  暂无成员
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr
                  key={member.userId}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {member.username}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {member.realName || '-'}
                  </td>
                  <td className="px-4 py-3">
                    {getPermissionBadges(member.permissions)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(member.joinTime).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(member)}
                        className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        title="编辑权限"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.userId, member.username)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="移除成员"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">添加成员</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  用户名
                </label>
                <input
                  type="text"
                  value={newMemberUsername}
                  onChange={(e) => setNewMemberUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  权限配置
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {PERMISSION_OPTIONS.map((option) => (
                    <label
                      key={option.key}
                      className="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(option.key)}
                        onChange={() => togglePermission(option.key)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">
                          {option.label}
                        </div>
                        <div className="text-xs text-slate-500">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 p-4 border-t border-slate-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddMember}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? '添加中...' : '确认添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                编辑权限 - {selectedMember.username}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {PERMISSION_OPTIONS.map((option) => (
                  <label
                    key={option.key}
                    className="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(option.key)}
                      onChange={() => togglePermission(option.key)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">
                        {option.label}
                      </div>
                      <div className="text-xs text-slate-500">
                        {option.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 p-4 border-t border-slate-200">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdatePermissions}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? '更新中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
