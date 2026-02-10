
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Plus, Search, Filter, MoreVertical, ChevronRight } from 'lucide-react';
import { Project, ProjectStatus } from '../types';

const MOCK_PROJECTS: Project[] = [
  { id: '1', name: '上海中环超高层写字楼建设项目', code: 'PROJ-2024-001', manager: '张三', status: ProjectStatus.IN_PROGRESS, createDate: '2024-01-15', budget: 150000000 },
  { id: '2', name: '大湾区智能物流枢纽二期', code: 'PROJ-2023-102', manager: '李四', status: ProjectStatus.IN_PROGRESS, createDate: '2023-11-20', budget: 85000000 },
  { id: '3', name: '北京金融街地下综合管廊工程', code: 'PROJ-2024-005', manager: '王五', status: ProjectStatus.COMPLETED, createDate: '2024-02-10', budget: 42000000 },
  { id: '4', name: '成都天府国际机场配套跑道加固', code: 'PROJ-2022-088', manager: '赵六', status: ProjectStatus.ARCHIVED, createDate: '2022-06-05', budget: 120000000 },
];

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusStyle = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.IN_PROGRESS: return 'bg-blue-50 text-blue-600 border-blue-100';
      case ProjectStatus.COMPLETED: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case ProjectStatus.ARCHIVED: return 'bg-slate-50 text-slate-500 border-slate-200';
      default: return 'bg-gray-100';
    }
  };

  return (
    <Layout title="项目列表" subtitle="查看并管理您参与的所有工程项目">
      {/* Search and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="搜索项目名称或编号..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2 border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter size={18} />
          </button>
        </div>

        <button className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-100 transition-all text-sm font-medium">
          <Plus size={18} />
          <span>新建工程项目</span>
        </button>
      </div>

      {/* Project Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">项目名称 / 编号</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">项目负责人</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">预算总额 (CNY)</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">创建日期</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">状态</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_PROJECTS.map((proj) => (
              <tr 
                key={proj.id} 
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                onClick={() => navigate(`/projects/${proj.id}`)}
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{proj.name}</span>
                    <span className="text-xs text-slate-400 mt-0.5">{proj.code}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600">{proj.manager}</span>
                </td>
                <td className="px-6 py-4 font-mono text-sm text-slate-700">
                  ¥{proj.budget.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {proj.createDate}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(proj.status)}`}>
                    {proj.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all">
                      <MoreVertical size={16} />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination placeholder */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>共 {MOCK_PROJECTS.length} 条记录</span>
          <div className="flex space-x-2">
            <button className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50">上一页</button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded">1</button>
            <button className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50">下一页</button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProjectList;
