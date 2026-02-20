import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { formatIndicatorLabel, formatRoleLabel, formatStatusLabel } from '../constants';
import { useToast } from '../components/ToastProvider';
import { indicatorApi, projectApi, versionApi } from '../services/apiService';
import { History, Users, FileBox, Activity, Plus, Filter, ArrowRight, ArrowLeft, Clock, User, X, LayoutDashboard, FileText, CheckCircle, XCircle, ShieldCheck, Archive } from 'lucide-react';

const Tabs = ({ active, onChange }: { active: string; onChange: (val: string) => void }) => {
  const tabs = [
    { id: 'overview', label: '项目概览', icon: <LayoutDashboard size={16} />, tone: 'text-blue-600' },
    { id: 'versions', label: '版本列表', icon: <History size={16} />, tone: 'text-indigo-600' },
    { id: 'members', label: '成员管理', icon: <Users size={16} />, tone: 'text-emerald-600' },
    { id: 'files', label: '文件中心', icon: <FileBox size={16} />, tone: 'text-purple-600' },
    { id: 'audit', label: '审计日志', icon: <Activity size={16} />, tone: 'text-amber-600' },
  ];

  return (
    <div className="flex flex-wrap gap-1 border-b border-slate-200 mb-4 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            whitespace-nowrap flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
            ${active === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
          `}
        >
          <span className={active === tab.id ? 'text-blue-600' : tab.tone}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
};

const ROLE_OPTIONS = ['PROJECT_ADMIN', 'EDITOR', 'REVIEWER', 'APPROVER', 'SEAL_ADMIN', 'VIEWER'];

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'overview';
  const activeTab = rawTab === 'dashboard' ? 'overview' : rawTab;

  const [project, setProject] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingVersion, setCreatingVersion] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState({ username: '', projectRole: 'EDITOR' });
  const [versionKeyword, setVersionKeyword] = useState('');
  const [fileCenterVersionId, setFileCenterVersionId] = useState('');
  const [dashboardVersionId, setDashboardVersionId] = useState('');
  const [versionIndicators, setVersionIndicators] = useState<Record<string, any[]>>({});
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId && activeTab === 'audit') {
      loadAudit();
    }
  }, [projectId, activeTab]);

  useEffect(() => {
    if (activeTab === 'overview') {
      loadDashboardIndicators();
    }
  }, [activeTab, versions, dashboardVersionId, versionIndicators]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, vData, mData] = await Promise.all([
        projectApi.get(projectId!),
        projectApi.getVersions(projectId!),
        projectApi.getMembers(projectId!),
      ]);
      setProject(pData);
      setVersions(Array.isArray(vData) ? vData : []);
      setMembers(Array.isArray(mData) ? mData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadAudit = async () => {
    try {
      const data = await projectApi.getAuditLogs(projectId!);
      setAuditLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadIndicatorsForVersion = async (versionId: string) => {
    if (!versionId) return;
    const data = await indicatorApi.list(versionId);
    setVersionIndicators((prev) => ({
      ...prev,
      [versionId]: Array.isArray(data) ? data : [],
    }));
  };

  const loadDashboardIndicators = async () => {
    if (versions.length === 0) return;
    setDashboardLoading(true);
    try {
      const versionIds = versions.map((v) => String(v.id)).filter(Boolean);
      const targetId = dashboardVersionId || (latestVersion?.id ? String(latestVersion.id) : versionIds[0]);
      if (targetId && !dashboardVersionId) {
        setDashboardVersionId(targetId);
      }
      const missing = versionIds.filter((id) => !versionIndicators[id]);
      await Promise.all(missing.map((id) => loadIndicatorsForVersion(id)));
    } catch (e) {
      console.error(e);
    } finally {
      setDashboardLoading(false);
    }
  };

  const normalizedProject = useMemo(() => {
    if (!project) return null;
    return {
      name: project.name || project.projectName || '-',
      code: project.code || project.projectCode || '-',
      manager: project.manager || project.projectManager || '管理员',
      status: project.status || 'ACTIVE',
      createTime: project.createdAt || project.createTime,
      budget: Number(project.budget || 0),
    };
  }, [project]);

  const latestVersion = useMemo(() => {
    if (versions.length === 0) return null;
    return [...versions].sort((a, b) => {
      const versionNoDiff = Number(b.versionNo || 0) - Number(a.versionNo || 0);
      if (versionNoDiff !== 0) return versionNoDiff;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    })[0];
  }, [versions]);

  const findIndicatorValue = (list: any[], keywords: string[]) => {
    const normalized = (list || []).map((item) => ({
      ...item,
      key: String(item?.indicatorKey || '').toLowerCase(),
      name: String(item?.indicatorName || '').toLowerCase(),
    }));
    const match = normalized.find((item) =>
      keywords.some((keyword) => item.key.includes(keyword) || item.name.includes(keyword))
    );
    return match?.value;
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null || Number.isNaN(Number(value))) return '-';
    return `¥${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (value?: number) => {
    if (value === undefined || value === null || Number.isNaN(Number(value))) return '-';
    const ratio = Number(value);
    const percent = ratio > 1 ? ratio : ratio * 100;
    return `${percent.toFixed(2)}%`;
  };

  useEffect(() => {
    if (!fileCenterVersionId && latestVersion?.id) {
      setFileCenterVersionId(String(latestVersion.id));
    }
  }, [latestVersion, fileCenterVersionId]);

  const filteredVersions = useMemo(() => {
    const keyword = versionKeyword.trim().toLowerCase();
    if (!keyword) return versions;
    return versions.filter((v) => {
      const content = [
        v.versionNo,
        v.versionName,
        v.name,
        v.status,
        v.creator,
        v.createdBy,
        v.updatedBy,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return content.includes(keyword);
    });
  }, [versions, versionKeyword]);

  const getStatusMeta = (status?: string) => {
    const map: Record<string, { label: string; cls: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
      DRAFT: { label: '草稿', cls: 'ui-badge-gray', icon: FileText },
      IN_APPROVAL: { label: '审批中', cls: 'ui-badge-blue', icon: Clock },
      APPROVED: { label: '已通过', cls: 'ui-badge-green', icon: CheckCircle },
      REJECTED: { label: '已驳回', cls: 'ui-badge-red', icon: XCircle },
      ISSUED: { label: '已签发', cls: 'ui-badge-amber', icon: ShieldCheck },
      ARCHIVED: { label: '已归档', cls: 'ui-badge-gray', icon: Archive },
      ACTIVE: { label: '进行中', cls: 'ui-badge-blue', icon: Activity },
    };
    return map[status || ''] || map.DRAFT;
  };

  const getStatusBadge = (status: string) => {
    const conf = getStatusMeta(status);
    const Icon = conf.icon;
    return (
      <span className={`ui-badge ${conf.cls} gap-1`}>
        <Icon size={12} />
        {conf.label}
      </span>
    );
  };

  const getRoleBadge = (role?: string) => {
    const map: Record<string, string> = {
      PROJECT_ADMIN: 'ui-badge-red',
      APPROVER: 'ui-badge-amber',
      REVIEWER: 'ui-badge-blue',
      EDITOR: 'ui-badge-green',
      SEAL_ADMIN: 'ui-badge-blue',
      VIEWER: 'ui-badge-gray',
    };
    const cls = map[role || ''] || 'ui-badge-gray';
    return <span className={`ui-badge ${cls}`}>{formatRoleLabel(role || '')}</span>;
  };

  const getAuditActionBadge = (action?: string) => {
    const map: Record<string, string> = {
      CREATE: 'ui-badge-green',
      UPDATE: 'ui-badge-blue',
      DELETE: 'ui-badge-red',
      APPROVE: 'ui-badge-green',
      REJECT: 'ui-badge-red',
      SUBMIT: 'ui-badge-blue',
      ISSUE: 'ui-badge-amber',
      ARCHIVE: 'ui-badge-gray',
    };
    const cls = map[action || ''] || 'ui-badge-gray';
    return <span className={`ui-badge ${cls}`}>{action || '-'}</span>;
  };

  const handleCreateVersion = async () => {
    if (!projectId) return;
    setCreatingVersion(true);
    try {
      const created = await versionApi.create(projectId, {});
      await loadData();
      if (created?.id) {
        toast.success('版本创建成功');
        navigate(`/versions/${created.id}/workbench`);
      }
    } catch (e: any) {
      toast.error(e?.message || '创建版本失败');
    } finally {
      setCreatingVersion(false);
    }
  };

  const handleAddMember = async () => {
    if (!projectId) return;
    if (!memberForm.username.trim()) {
      toast.warning('请输入用户名');
      return;
    }
    setAddingMember(true);
    try {
      await projectApi.addMember(projectId, {
        username: memberForm.username.trim(),
        projectRole: memberForm.projectRole,
        dataScope: 'ALL',
      });
      setShowMemberModal(false);
      setMemberForm({ username: '', projectRole: 'EDITOR' });
      await loadData();
      toast.success('成员添加成功');
    } catch (e: any) {
      toast.error(e?.message || '添加成员失败');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: number, username: string) => {
    if (!projectId) return;
    if (!confirm(`确认移除成员 ${username} ?`)) return;
    try {
      await projectApi.removeMember(projectId, userId);
      await loadData();
      toast.success('成员已移除');
    } catch (e: any) {
      toast.error(e?.message || '移除成员失败');
    }
  };

  const handleDashboardVersionChange = async (id: string) => {
    setDashboardVersionId(id);
    if (id && !versionIndicators[id]) {
      try {
        await loadIndicatorsForVersion(id);
      } catch (e: any) {
        toast.error(e?.message || '加载指标失败');
      }
    }
  };

  const handleBackToProjects = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/projects');
  };

  const renderDashboard = () => {
    const versionList = [...versions].sort((a, b) => Number(b.versionNo || 0) - Number(a.versionNo || 0));
    const currentId = dashboardVersionId || (latestVersion?.id ? String(latestVersion.id) : '');
    const currentIndicators = currentId ? versionIndicators[currentId] || [] : [];
    const totalCost = findIndicatorValue(currentIndicators, ['total', 'amount', '合计', '总计', '总成本', '总金额']);
    const planAmount = findIndicatorValue(currentIndicators, ['plan', '预算', '计划']);
    const grossRate = findIndicatorValue(currentIndicators, ['gross', 'margin', '毛利率']);
    const grossAmount = findIndicatorValue(currentIndicators, ['gross_profit', '毛利额', '毛利']);

    const statusCount = versions.reduce(
      (acc, v) => {
        const key = v.status || 'DRAFT';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const summaryRows = versionList.map((v) => {
      const id = String(v.id);
      const indicators = versionIndicators[id] || [];
      return {
        id,
        versionNo: v.versionNo ? `V${v.versionNo}` : v.versionName || `版本${v.id}`,
        status: v.status || '-',
        createdAt: v.createdAt,
        planAmount: findIndicatorValue(indicators, ['plan', '预算', '计划']),
        grossRate: findIndicatorValue(indicators, ['gross', 'margin', '毛利率']),
        grossAmount: findIndicatorValue(indicators, ['gross_profit', '毛利额', '毛利']),
      };
    });

    return (
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">项目概览</div>
              <div className="text-xs text-slate-500 mt-1">汇总项目版本状态与关键指标</div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {['ACTIVE', 'DRAFT', 'IN_APPROVAL', 'APPROVED', 'ISSUED', 'ARCHIVED'].map((code) => {
                const meta = getStatusMeta(code);
                const Icon = meta.icon;
                return (
                  <span key={code} className={`ui-badge ${meta.cls} gap-1`}>
                    <Icon size={12} />
                    {meta.label} {statusCount[code] || 0}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="text-sm font-semibold text-slate-900">计划单与毛利率汇总</div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>版本</span>
              <select
                value={currentId}
                onChange={(e) => handleDashboardVersionChange(e.target.value)}
                className="ui-input w-full sm:w-48"
              >
                <option value="">请选择版本</option>
                {versionList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.versionNo ? `V${v.versionNo}` : v.versionName || v.id} · {formatStatusLabel(String(v.status || '').toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 text-sm">
            <div className="border border-slate-200 rounded p-3">
              <div className="text-xs text-slate-500">计划金额</div>
              <div className="mt-1 font-semibold text-slate-900">{formatCurrency(planAmount)}</div>
            </div>
            <div className="border border-slate-200 rounded p-3">
              <div className="text-xs text-slate-500">总成本</div>
              <div className="mt-1 font-semibold text-slate-900">{formatCurrency(totalCost)}</div>
            </div>
            <div className="border border-slate-200 rounded p-3">
              <div className="text-xs text-slate-500">毛利额</div>
              <div className="mt-1 font-semibold text-slate-900">{formatCurrency(grossAmount)}</div>
            </div>
            <div className="border border-slate-200 rounded p-3">
              <div className="text-xs text-slate-500">毛利率</div>
              <div className="mt-1 font-semibold text-slate-900">{formatPercent(grossRate)}</div>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            指标来源：版本指标表，若值为空请在版本工作台重算指标。
          </div>
        </div>

        <div className="sm:hidden space-y-2">
          {summaryRows.map((row) => (
            <div key={row.id} className="bg-white border border-slate-200 rounded px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-slate-900">{row.versionNo}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'}
                  </div>
                </div>
                {getStatusBadge(row.status)}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-y-1 text-xs text-slate-500">
                <div>计划金额：{formatCurrency(row.planAmount)}</div>
                <div>毛利率：{formatPercent(row.grossRate)}</div>
                <div className="col-span-2">毛利额：{formatCurrency(row.grossAmount)}</div>
              </div>
              <div className="mt-2">
                <button
                  className="ui-btn ui-btn-sm ui-btn-default"
                  onClick={() => navigate(`/versions/${row.id}/workbench`)}
                >
                  查看
                </button>
              </div>
            </div>
          ))}
          {summaryRows.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-sm">暂无版本</div>
          )}
          {dashboardLoading && (
            <div className="text-center py-4 text-slate-400 text-sm">指标加载中...</div>
          )}
        </div>

        <div className="hidden sm:block ui-table-container">
          <table className="ui-table">
            <thead>
              <tr>
                <th className="w-24">版本</th>
                <th className="w-24">状态</th>
                <th className="w-40">计划金额</th>
                <th className="w-28">毛利率</th>
                <th className="w-40">毛利额</th>
                <th className="w-40">创建时间</th>
                <th className="w-24 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="font-medium text-slate-900">{row.versionNo}</td>
                  <td>{getStatusBadge(row.status)}</td>
                  <td>{formatCurrency(row.planAmount)}</td>
                  <td>{formatPercent(row.grossRate)}</td>
                  <td>{formatCurrency(row.grossAmount)}</td>
                  <td className="text-xs text-slate-500">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'}
                  </td>
                  <td className="text-center">
                    <button
                      className="ui-btn ui-btn-sm ui-btn-default"
                      onClick={() => navigate(`/versions/${row.id}/workbench`)}
                    >
                      查看
                    </button>
                  </td>
                </tr>
              ))}
              {summaryRows.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">暂无版本</td></tr>
              )}
              {dashboardLoading && (
                <tr><td colSpan={7} className="text-center py-6 text-slate-400">指标加载中...</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {currentIndicators.length > 0 && (
          <div className="bg-white border border-slate-200 rounded p-4">
            <div className="text-sm font-semibold text-slate-900">关键指标</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              {currentIndicators.slice(0, 6).map((ind) => (
                <div key={ind.indicatorKey} className="border border-slate-200 rounded p-3">
                  <div className="text-xs text-slate-500">{formatIndicatorLabel(ind.indicatorKey, ind.indicatorName)}</div>
                  <div className="mt-1 font-semibold text-slate-900">{ind.value ?? '-'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderVersions = () => {
    const versionStatusCount = filteredVersions.reduce((acc, item) => {
      const key = String(item?.status || 'DRAFT');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusStats = ['DRAFT', 'IN_APPROVAL', 'APPROVED', 'ISSUED', 'ARCHIVED'].map((code) => ({
      code,
      count: versionStatusCount[code] || 0,
      meta: getStatusMeta(code),
    }));

    return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded p-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {statusStats.map((item) => {
            const Icon = item.meta.icon;
            return (
              <span key={item.code} className={`ui-badge ${item.meta.cls} gap-1`}>
                <Icon size={12} />
                {item.meta.label} {item.count}
              </span>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full">
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="搜索版本号/名称/状态"
              className="ui-input w-full sm:w-72 pr-8"
              value={versionKeyword}
              onChange={(e) => setVersionKeyword(e.target.value)}
            />
            {versionKeyword && (
              <button
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                onClick={() => setVersionKeyword('')}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button className="ui-btn ui-btn-default gap-1" onClick={loadData}><Filter size={14} /> 刷新</button>
          {latestVersion?.id && (
            <button
              className="ui-btn ui-btn-default gap-1"
              onClick={() => navigate(`/versions/${latestVersion.id}/files`)}
            >
              <FileBox size={14} /> 文件中心
            </button>
          )}
        </div>
        <button className="ui-btn ui-btn-primary gap-1 w-full sm:w-auto" onClick={handleCreateVersion} disabled={creatingVersion}>
          <Plus size={14} /> {creatingVersion ? '创建中...' : '新建版本'}
        </button>
      </div>

      <div className="sm:hidden space-y-2">
        {filteredVersions.map((v) => (
          <div
            key={v.id}
            className="bg-white border border-slate-200 rounded px-3 py-2.5"
            onClick={() => navigate(`/versions/${v.id}/workbench`)}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-medium text-slate-900">V{v.versionNo}</div>
                <div className="text-xs text-slate-500">{v.versionName || v.name || `成本计划 V${v.versionNo}`}</div>
              </div>
              {getStatusBadge(v.status)}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-y-1 text-xs text-slate-500">
              <div>创建人：{v.creator || '管理员'}</div>
              <div>创建：{v.createdAt ? new Date(v.createdAt).toLocaleString() : '-'}</div>
              <div className="col-span-2">更新：{v.updatedAt ? new Date(v.updatedAt).toLocaleString() : '-'}</div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                className="ui-btn ui-btn-sm ui-btn-default"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/versions/${v.id}/workbench`);
                }}
              >
                查看
              </button>
              <button
                className="ui-btn ui-btn-sm ui-btn-default"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/versions/${v.id}/files`);
                }}
              >
                文件
              </button>
            </div>
          </div>
        ))}
        {filteredVersions.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-sm">暂无匹配版本</div>
        )}
      </div>

      <div className="hidden sm:block ui-table-container">
        <table className="ui-table">
          <thead>
            <tr>
              <th className="w-24">版本号</th>
              <th className="min-w-[200px]">版本名称</th>
              <th className="w-24">状态</th>
              <th className="w-32">创建人</th>
              <th className="w-40">创建时间</th>
              <th className="w-40">最后更新</th>
              <th className="w-24 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredVersions.map((v) => (
              <tr key={v.id} className="group cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/versions/${v.id}/workbench`)}>
                <td className="font-mono text-blue-600 font-medium">V{v.versionNo}</td>
                <td className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                  {v.versionName || v.name || `成本计划 V${v.versionNo}`}
                </td>
                <td>{getStatusBadge(v.status)}</td>
                <td>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <User size={14} />
                    {v.creator || '管理员'}
                  </div>
                </td>
                <td className="text-slate-500 font-mono text-xs">
                  {v.createdAt ? new Date(v.createdAt).toLocaleString() : '-'}
                </td>
                <td className="text-slate-500 font-mono text-xs">
                  {v.updatedAt ? new Date(v.updatedAt).toLocaleString() : '-'}
                </td>
                <td className="text-center space-x-1">
                  <button
                    className="ui-btn-ghost p-1 rounded hover:bg-slate-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/versions/${v.id}/workbench`);
                    }}
                  >
                    <ArrowRight size={16} />
                  </button>
                  <button
                    className="ui-btn-ghost p-1 rounded hover:bg-slate-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/versions/${v.id}/files`);
                    }}
                  >
                    <FileBox size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredVersions.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">暂无匹配版本</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    );
  };

  const renderMembers = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Users size={15} className="text-emerald-600" />
          共 {members.length} 位项目成员
        </div>
        <button className="ui-btn ui-btn-primary gap-1 w-full sm:w-auto" onClick={() => setShowMemberModal(true)}>
          <Plus size={14} /> 添加成员
        </button>
      </div>
      <div className="sm:hidden space-y-2">
        {members.map((m) => (
          <div key={m.id || `${m.userId}-${m.username}`} className="bg-white border border-slate-200 rounded px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                  <User size={13} className="text-emerald-600" />
                  {m.username || `用户${m.userId}`}
                </div>
                <div className="mt-1">{getRoleBadge(m.projectRole)}</div>
              </div>
              <button className="ui-btn ui-btn-sm ui-btn-danger" onClick={() => handleRemoveMember(m.userId, m.username || String(m.userId))}>
                移除
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-500">数据范围：<span className="ui-badge ui-badge-gray">{m.dataScope || '-'}</span></div>
          </div>
        ))}
        {members.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-sm">暂无成员</div>
        )}
      </div>
      <div className="hidden sm:block ui-table-container">
        <table className="ui-table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>项目角色</th>
              <th>数据范围</th>
              <th className="text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id || `${m.userId}-${m.username}`}>
                <td>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <User size={13} className="text-emerald-600" />
                    {m.username || `用户${m.userId}`}
                  </div>
                </td>
                <td>{getRoleBadge(m.projectRole)}</td>
                <td><span className="ui-badge ui-badge-gray">{m.dataScope || '-'}</span></td>
                <td className="text-right">
                  <button className="ui-btn ui-btn-sm ui-btn-danger" onClick={() => handleRemoveMember(m.userId, m.username || String(m.userId))}>
                    移除
                  </button>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr><td colSpan={4} className="text-center py-10 text-slate-400">暂无成员</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFiles = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <FileBox size={15} className="text-purple-600" />
        文件中心按版本归档，请选择要查看的版本。
      </div>
      <div className="bg-white border border-slate-200 rounded p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <select
          value={fileCenterVersionId}
          onChange={(e) => setFileCenterVersionId(e.target.value)}
          className="ui-input w-full sm:w-60"
        >
          <option value="">请选择版本</option>
          {versions.map((version) => (
            <option key={version.id} value={version.id}>
              {version.versionNo ? `V${version.versionNo}` : version.versionName || version.id} · {formatStatusLabel(String(version.status || '').toUpperCase())}
            </option>
          ))}
        </select>
        <button
          className="ui-btn ui-btn-primary w-full sm:w-auto"
          onClick={() => {
            if (!fileCenterVersionId) {
              toast.warning('请先选择版本');
              return;
            }
            navigate(`/versions/${fileCenterVersionId}/files`);
          }}
        >
          打开文件中心
        </button>
      </div>
    </div>
  );

  const renderAudit = () => (
    <div className="space-y-2">
      <div className="sm:hidden space-y-2">
      {auditLogs.map((log) => (
        <div key={log.id} className="bg-white border border-slate-200 rounded px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>{getAuditActionBadge(log.action)}</div>
            <div className="text-xs text-slate-500">{log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}</div>
          </div>
          <div className="mt-1 text-xs text-slate-500">操作者：<span className="font-medium text-slate-700">{log.operatorName || '-'}</span></div>
          <div className="mt-1 text-xs text-slate-500">业务类型：<span className="ui-badge ui-badge-gray">{log.bizType || '-'}</span></div>
          <div className="mt-2 text-xs text-slate-500 break-words">详情：{log.detailJson || '-'}</div>
        </div>
      ))}
      {auditLogs.length === 0 && (
        <div className="text-center py-6 text-slate-400 text-sm">暂无审计日志</div>
      )}
    </div>

    <div className="hidden sm:block ui-table-container">
      <table className="ui-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>操作者</th>
            <th>动作</th>
            <th>业务类型</th>
            <th>详情</th>
          </tr>
        </thead>
        <tbody>
          {auditLogs.map((log) => (
            <tr key={log.id}>
              <td className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
              <td className="font-medium text-slate-700">{log.operatorName || '-'}</td>
              <td>{getAuditActionBadge(log.action)}</td>
              <td><span className="ui-badge ui-badge-gray">{log.bizType || '-'}</span></td>
              <td className="text-xs text-slate-500">{log.detailJson || '-'}</td>
            </tr>
          ))}
          {auditLogs.length === 0 && (
            <tr><td colSpan={5} className="text-center py-10 text-slate-400">暂无审计日志</td></tr>
          )}
        </tbody>
      </table>
    </div>
    </div>
  );

  const renderContent = () => {
    if (activeTab === 'overview') return renderDashboard();
    if (activeTab === 'versions') return renderVersions();
    if (activeTab === 'members') return renderMembers();
    if (activeTab === 'files') return renderFiles();
    if (activeTab === 'audit') return renderAudit();
    return null;
  };

  return (
    <Layout title={normalizedProject?.name || '加载中...'} subtitle={`项目编号: ${normalizedProject?.code || '-'}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <button className="ui-btn ui-btn-default gap-1" onClick={handleBackToProjects}>
          <ArrowLeft size={14} />
          返回项目列表
        </button>
        {latestVersion?.id && (
          <button
            className="ui-btn ui-btn-primary gap-1"
            onClick={() => navigate(`/versions/${latestVersion.id}/workbench`)}
          >
            打开最新版本
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="ui-label">项目负责人</span>
            <div className="font-medium text-slate-900 flex items-center gap-2">
              <User size={16} className="text-slate-400" />
              {normalizedProject?.manager || '-'}
            </div>
          </div>
          <div>
            <span className="ui-label">创建时间</span>
            <div className="font-medium text-slate-900 flex items-center gap-2">
              <Clock size={16} className="text-slate-400" />
              {normalizedProject?.createTime ? new Date(normalizedProject.createTime).toLocaleDateString() : '-'}
            </div>
          </div>
          <div>
            <span className="ui-label">当前状态</span>
            <div className="mt-1">{getStatusBadge(normalizedProject?.status || 'ACTIVE')}</div>
          </div>
          <div>
            <span className="ui-label">预算总额</span>
            <div className="font-mono font-medium text-slate-900">¥ {Number(normalizedProject?.budget || 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <Tabs active={activeTab} onChange={(id) => setSearchParams({ tab: id })} />
      {loading ? <div className="text-sm text-slate-500">加载中...</div> : renderContent()}

      {showMemberModal && (
        <div className="fixed inset-0 bg-black/35 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">添加项目成员</h3>
              <button onClick={() => setShowMemberModal(false)} className="ui-btn-icon">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div>
                <label className="block text-slate-600 mb-1">用户名</label>
                <input
                  className="ui-input"
                  value={memberForm.username}
                  onChange={(e) => setMemberForm((prev) => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">角色</label>
                <select
                  className="ui-input"
                  value={memberForm.projectRole}
                  onChange={(e) => setMemberForm((prev) => ({ ...prev, projectRole: e.target.value }))}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {formatRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
              <button className="ui-btn ui-btn-default" onClick={() => setShowMemberModal(false)}>取消</button>
              <button className="ui-btn ui-btn-primary" onClick={handleAddMember} disabled={addingMember}>
                {addingMember ? '添加中...' : '确认添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProjectDetail;
