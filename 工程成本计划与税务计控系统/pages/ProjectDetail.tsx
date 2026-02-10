
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  History, 
  FileEdit, 
  Trash2, 
  ArrowLeft, 
  ShieldCheck, 
  Clock, 
  ExternalLink,
  Plus
} from 'lucide-react';
import { ProjectVersion } from '../types';

const MOCK_VERSIONS: ProjectVersion[] = [
  { id: 'v1', projectId: '1', versionName: '2024 Q1 初版计划', status: 'Sealed', creator: '张三', updateTime: '2024-01-20 14:30' },
  { id: 'v2', projectId: '1', versionName: '年中成本调整方案 (修正版)', status: 'Approved', creator: '李四', updateTime: '2024-06-15 09:12' },
  { id: 'v3', projectId: '1', versionName: '三季度税务筹划专项计划', status: 'Pending', creator: '张三', updateTime: '2024-09-05 16:45' },
  { id: 'v4', projectId: '1', versionName: '当前工作草案', status: 'Draft', creator: '张三', updateTime: '2024-10-12 11:20' },
];

const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'Sealed': return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">已封存</span>;
      case 'Approved': return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold">已签发</span>;
      case 'Pending': return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 text-[10px] font-bold">审批中</span>;
      case 'Draft': return <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold">草案</span>;
      default: return null;
    }
  };

  return (
    <Layout title="项目详情" subtitle="上海中环超高层写字楼建设项目">
      <div className="space-y-6">
        {/* Back and Title */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/projects')}
            className="flex items-center text-slate-500 hover:text-slate-800 transition-colors text-sm"
          >
            <ArrowLeft size={16} className="mr-2" />
            返回项目列表
          </button>
          
          <div className="flex space-x-3">
             <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">编辑项目信息</button>
             <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">项目报表导出</button>
          </div>
        </div>

        {/* Project Info Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center">
              <ShieldCheck size={18} className="mr-2 text-blue-600" />
              项目核心参数
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-xs text-slate-400">项目编号</p>
                <p className="text-sm font-semibold mt-1">PROJ-2024-001</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">项目负责人</p>
                <p className="text-sm font-semibold mt-1 text-blue-600">张大为</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">合同工期</p>
                <p className="text-sm font-semibold mt-1">730 天 (2024-2026)</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">合同总价 (不含税)</p>
                <p className="text-sm font-semibold mt-1">¥137,614,678.90</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">预缴增值税率</p>
                <p className="text-sm font-semibold mt-1">9.00%</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">目标成本总额</p>
                <p className="text-sm font-semibold mt-1 text-emerald-600">¥112,400,000.00</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-xl shadow-lg text-white">
            <h3 className="text-sm font-bold opacity-80 mb-4">税务风险评级</h3>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold">A+</p>
                <p className="text-xs opacity-80 mt-2">合规度极高，风险可控</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-60">最近一次审计</p>
                <p className="text-sm font-medium">2024-09-30</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-white/10 flex justify-between">
              <div className="text-center">
                <p className="text-lg font-bold">12</p>
                <p className="text-[10px] opacity-70">风险红点</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">100%</p>
                <p className="text-[10px] opacity-70">抵扣链闭环</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">0</p>
                <p className="text-[10px] opacity-70">异常发票</p>
              </div>
            </div>
          </div>
        </div>

        {/* Version Management Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center">
              <History size={18} className="mr-2 text-blue-600" />
              计划版本管理
            </h3>
            <button className="flex items-center text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
              <Plus size={14} className="mr-1" />
              新建版本
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {MOCK_VERSIONS.map((v) => (
              <div 
                key={v.id} 
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer"
                onClick={() => navigate(`/versions/${v.id}/workbench`)}
              >
                <div className="flex items-center justify-between mb-3">
                  {getStatusTag(v.status)}
                  <button className="text-slate-300 hover:text-slate-500">
                    <ExternalLink size={14} />
                  </button>
                </div>
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{v.versionName}</h4>
                <div className="mt-4 flex items-center text-xs text-slate-400 space-x-4">
                  <div className="flex items-center">
                    <Clock size={12} className="mr-1" />
                    {v.updateTime}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Creator: {v.creator}</span>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"><FileEdit size={14} /></button>
                    <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProjectDetail;
