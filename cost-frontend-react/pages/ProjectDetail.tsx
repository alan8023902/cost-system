import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { AuditLogPanel } from '../components/AuditLogPanel';
import { MemberManagement } from '../components/MemberManagement';
import { projectApi } from '../services/apiService';
import { FileText, Users, Settings, Plus, Calendar, Clock, User, History } from 'lucide-react';

interface Version {
  id: number;
  versionName: string;
  status: string;
  createTime: string;
  creator: string;
}

interface Project {
  id: number;
  projectName: string;
  projectCode: string;
  projectManager: string;
  status: string;
  createTime: string;
}

interface Member {
  userId: number;
  username: string;
  realName: string;
  role: string;
  joinTime: string;
}

export const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'versions' | 'members' | 'audit' | 'settings'>('versions');

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const [projectData, versionsData, membersData] = await Promise.all([
        projectApi.get(projectId),
        projectApi.getVersions(projectId),
        projectApi.getMembers(projectId),
      ]);
      
      setProject(projectData);
      setVersions(versionsData);
      setMembers(membersData);
    } catch (error) {
      console.error('Failed to load project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVersion = (versionId: number) => {
    navigate(`/workbench/${versionId}`);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      DRAFT: { text: '草稿', className: 'bg-gray-100 text-gray-700' },
      PENDING: { text: '审批中', className: 'bg-blue-100 text-blue-700' },
      APPROVED: { text: '已通过', className: 'bg-green-100 text-green-700' },
      REJECTED: { text: '已驳回', className: 'bg-red-100 text-red-700' },
      ISSUED: { text: '已签发', className: 'bg-purple-100 text-purple-700' },
      ARCHIVED: { text: '已归档', className: 'bg-slate-100 text-slate-700' },
    };
    const config = statusMap[status] || statusMap.DRAFT;
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-slate-400">加载中...</div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-slate-400">项目不存在</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">{project.projectName}</h1>
                <div className="mt-2 flex items-center space-x-4 text-sm text-slate-500">
                  <span className="flex items-center space-x-1">
                    <FileText size={16} />
                    <span>{project.projectCode}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <User size={16} />
                    <span>项目经理: {project.projectManager}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar size={16} />
                    <span>{new Date(project.createTime).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>
              {getStatusBadge(project.status)}
            </div>

            {/* Tabs */}
            <div className="mt-6 flex space-x-1 border-b border-slate-200">
              <button
                onClick={() => setActiveTab('versions')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'versions'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText size={16} className="inline mr-2" />
                版本列表
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'members'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users size={16} className="inline mr-2" />
                项目成员
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'audit'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History size={16} className="inline mr-2" />
                操作日志
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Settings size={16} className="inline mr-2" />
                项目设置
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          {activeTab === 'versions' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">版本列表</h2>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus size={16} />
                  <span>新建版本</span>
                </button>
              </div>

              <div className="bg-white rounded-lg border border-slate-200">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">版本名称</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">创建人</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">创建时间</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {versions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                          暂无版本数据
                        </td>
                      </tr>
                    ) : (
                      versions.map((version) => (
                        <tr key={version.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{version.versionName}</td>
                          <td className="px-6 py-4">{getStatusBadge(version.status)}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{version.creator}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {new Date(version.createTime).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleOpenVersion(version.id)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              打开
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <MemberManagement
              projectId={projectId!}
              members={members}
              onRefresh={loadProjectData}
            />
          )}

          {activeTab === 'audit' && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">操作日志</h2>
              <AuditLogPanel projectId={projectId!} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">项目设置</h2>
              <p className="text-slate-500">项目设置功能开发中...</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
