import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  FileText,
  FolderKanban,
  Layers3,
  Settings,
} from 'lucide-react';
import Layout from '../components/Layout';
import { formatStatusLabel } from '../constants';
import { projectApi, templateApi, workflowApi } from '../services/apiService';

type DashboardProject = {
  id: number;
  name: string;
  code: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  orgId?: number | null;
  tagColor?: string;
};

const STATUS_META: Record<string, { label: string; barClass: string; textClass: string }> = {
  ACTIVE: { label: '进行中', barClass: 'bg-blue-600', textClass: 'text-blue-700' },
  ARCHIVED: { label: '已归档', barClass: 'bg-slate-500', textClass: 'text-slate-700' },
  UNKNOWN: { label: '其他', barClass: 'bg-amber-500', textClass: 'text-amber-700' },
};

const TAG_COLOR_META: Record<string, { label: string; dotClass: string }> = {
  blue: { label: '蓝色', dotClass: 'bg-blue-500' },
  green: { label: '绿色', dotClass: 'bg-emerald-500' },
  purple: { label: '紫色', dotClass: 'bg-purple-500' },
  orange: { label: '橙色', dotClass: 'bg-orange-500' },
  red: { label: '红色', dotClass: 'bg-rose-500' },
  gray: { label: '灰色', dotClass: 'bg-slate-500' },
  default: { label: '默认', dotClass: 'bg-slate-400' },
};

const parseDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeProjects = (payload: any): DashboardProject[] => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.content)
      ? payload.content
      : [];
  return list
    .map((item: any) => ({
      id: Number(item?.id ?? 0),
      name: String(item?.name || item?.projectName || '未命名项目'),
      code: String(item?.code || item?.projectCode || '-'),
      status: String(item?.status || 'UNKNOWN').toUpperCase(),
      createdAt: item?.createdAt,
      updatedAt: item?.updatedAt,
      orgId: item?.orgId ?? null,
      tagColor: item?.tagColor || 'default',
    }))
    .filter((item) => item.id > 0);
};

const fetchAllProjects = async (): Promise<DashboardProject[]> => {
  const firstPage = await projectApi.list({ page: 0, size: 200, sort: 'createdAt,desc' });
  if (Array.isArray(firstPage)) {
    return normalizeProjects(firstPage);
  }

  const all = normalizeProjects(firstPage?.content || []);
  const totalPages = Number(firstPage?.totalPages || 1);
  if (totalPages <= 1) {
    return all;
  }

  for (let pageIndex = 1; pageIndex < totalPages; pageIndex += 1) {
    const pageData = await projectApi.list({ page: pageIndex, size: 200, sort: 'createdAt,desc' });
    all.push(...normalizeProjects(pageData?.content || []));
  }
  return all;
};

const formatMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const SystemDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [publishedTemplates, setPublishedTemplates] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([fetchAllProjects(), workflowApi.getMyTasks(), templateApi.listPublished()])
      .then(([projectRes, taskRes, tplRes]) => {
        if (!alive) return;
        const projectList = projectRes.status === 'fulfilled' ? projectRes.value : [];
        const tasks = taskRes.status === 'fulfilled' && Array.isArray(taskRes.value) ? taskRes.value : [];
        const templates = tplRes.status === 'fulfilled' && Array.isArray(tplRes.value) ? tplRes.value : [];

        setProjects(projectList);
        setPendingCount(tasks.filter((item: any) => String(item?.status).toUpperCase() === 'PENDING').length);
        setPublishedTemplates(templates.length);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const statusRows = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach((project) => {
      const key = project.status || 'UNKNOWN';
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([status, count]) => {
        const meta = STATUS_META[status] || STATUS_META.UNKNOWN;
        return {
          status,
          label: meta.label,
          count,
          barClass: meta.barClass,
          textClass: meta.textClass,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [projects]);

  const monthRows = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: formatMonthKey(date),
        label: `${date.getMonth() + 1}月`,
        count: 0,
      };
    });

    const counters = new Map(months.map((item) => [item.key, 0]));
    projects.forEach((project) => {
      const createdAt = parseDate(project.createdAt);
      if (!createdAt) return;
      const monthKey = formatMonthKey(createdAt);
      if (!counters.has(monthKey)) return;
      counters.set(monthKey, (counters.get(monthKey) || 0) + 1);
    });

    return months.map((month) => ({ ...month, count: counters.get(month.key) || 0 }));
  }, [projects]);

  const orgRows = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach((project) => {
      const key = project.orgId ? `组织${project.orgId}` : '未分配组织';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [projects]);

  const tagColorRows = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach((project) => {
      const key = String(project.tagColor || 'default').toLowerCase();
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([key, count]) => ({
        key,
        count,
        meta: TAG_COLOR_META[key] || TAG_COLOR_META.default,
      }))
      .sort((a, b) => b.count - a.count);
  }, [projects]);

  const stats = useMemo(() => {
    const now = Date.now();
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
    const updatedRecently = projects.filter((project) => {
      const updatedAt = parseDate(project.updatedAt);
      return updatedAt ? updatedAt.getTime() >= monthAgo : false;
    }).length;

    const createdThisMonth = projects.filter((project) => {
      const createdAt = parseDate(project.createdAt);
      if (!createdAt) return false;
      const nowDate = new Date(now);
      return createdAt.getFullYear() === nowDate.getFullYear() && createdAt.getMonth() === nowDate.getMonth();
    }).length;

    return {
      total: projects.length,
      statusCount: statusRows.length,
      createdThisMonth,
      updatedRecently,
    };
  }, [projects, statusRows.length]);

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => {
        const dateA = parseDate(a.createdAt)?.getTime() || 0;
        const dateB = parseDate(b.createdAt)?.getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [projects]);

  const rightPanel = (
    <div className="space-y-4 text-sm">
      <section className="border border-slate-200 bg-white p-4">
        <div className="mb-2 text-xs font-semibold text-slate-500">运行提醒</div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">待审批任务</span>
            <span className="font-semibold text-amber-600">{pendingCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">可访问项目</span>
            <span className="font-semibold text-blue-700">{stats.total}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">已发布模板</span>
            <span className="font-semibold text-emerald-700">{publishedTemplates}</span>
          </div>
        </div>
      </section>

      <section className="border border-slate-200 bg-white p-4">
        <div className="mb-2 text-xs font-semibold text-slate-500">快速入口</div>
        <div className="space-y-2">
          <button className="ui-btn ui-btn-default w-full" onClick={() => navigate('/workbench')}>项目工作台</button>
          <button className="ui-btn ui-btn-default w-full" onClick={() => navigate('/my-tasks')}>审批中心</button>
          <button className="ui-btn ui-btn-default w-full" onClick={() => navigate('/templates')}>模板管理</button>
          <button className="ui-btn ui-btn-default w-full" onClick={() => navigate('/settings')}>系统设置</button>
        </div>
      </section>
    </div>
  );

  const statusMax = Math.max(...statusRows.map((item) => item.count), 1);
  const monthMax = Math.max(...monthRows.map((item) => item.count), 1);

  return (
    <Layout title="全局概览" subtitle="全项目统计与趋势图（当前账号可访问范围）" rightPanel={rightPanel}>
      <div className="space-y-4 text-sm">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">项目总数</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{stats.total}</div>
          </div>
          <div className="border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">本月新增项目</div>
            <div className="mt-1 text-2xl font-semibold text-blue-700">{stats.createdThisMonth}</div>
          </div>
          <div className="border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">近30天更新</div>
            <div className="mt-1 text-2xl font-semibold text-indigo-700">{stats.updatedRecently}</div>
          </div>
          <div className="border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">待审批任务</div>
            <div className="mt-1 text-2xl font-semibold text-amber-700">{pendingCount}</div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div className="border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
              <BarChart3 size={16} className="text-blue-600" />
              项目状态分布
            </div>
            {statusRows.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">暂无项目数据</div>
            ) : (
              <div className="space-y-3">
                {statusRows.map((item) => {
                  const width = `${Math.max((item.count / statusMax) * 100, item.count > 0 ? 8 : 0)}%`;
                  const ratio = stats.total > 0 ? `${Math.round((item.count / stats.total) * 100)}%` : '0%';
                  return (
                    <div key={item.status}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-semibold text-slate-900">{item.count}（{ratio}）</span>
                      </div>
                      <div className="h-2 bg-slate-100">
                        <div className={`h-2 ${item.barClass}`} style={{ width }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
              <CalendarDays size={16} className="text-indigo-600" />
              最近6个月新增项目
            </div>
            {monthRows.every((item) => item.count === 0) ? (
              <div className="py-8 text-center text-xs text-slate-400">最近6个月暂无新增项目</div>
            ) : (
              <div className="space-y-3">
                <div className="flex h-36 items-end gap-2 border-b border-slate-200 pb-2">
                  {monthRows.map((month) => {
                    const barHeight = Math.max((month.count / monthMax) * 100, month.count > 0 ? 10 : 2);
                    return (
                      <div key={month.key} className="flex flex-1 flex-col items-center gap-1">
                        <div className="text-[11px] font-semibold text-slate-700">{month.count}</div>
                        <div className="w-full bg-slate-100" style={{ height: '96px' }}>
                          <div className="w-full bg-indigo-500" style={{ height: `${barHeight}%`, marginTop: `${100 - barHeight}%` }} />
                        </div>
                        <div className="text-[11px] text-slate-500">{month.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div className="border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
              <Layers3 size={16} className="text-slate-600" />
              组织分布（Top 6）
            </div>
            <div className="space-y-2 text-xs">
              {orgRows.length === 0 ? (
                <div className="py-6 text-center text-slate-400">暂无组织数据</div>
              ) : orgRows.map((item) => (
                <div key={item.label} className="flex items-center justify-between border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-semibold text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
              <Activity size={16} className="text-slate-600" />
              项目标记色分布
            </div>
            <div className="space-y-2 text-xs">
              {tagColorRows.length === 0 ? (
                <div className="py-6 text-center text-slate-400">暂无颜色数据</div>
              ) : tagColorRows.map((item) => (
                <div key={item.key} className="flex items-center justify-between border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.meta.dotClass}`} />
                    <span className="text-slate-600">{item.meta.label}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="font-semibold text-slate-800">最新项目清单</div>
            <button className="ui-btn ui-btn-default" onClick={() => navigate('/projects')}>全部项目</button>
          </div>
          <div className="overflow-auto">
            <table className="ui-table min-w-[840px]">
              <thead>
                <tr>
                  <th>项目名称</th>
                  <th>项目编码</th>
                  <th>状态</th>
                  <th>组织</th>
                  <th>创建时间</th>
                  <th className="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400">加载中...</td></tr>
                ) : recentProjects.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400">暂无项目数据</td></tr>
                ) : (
                  recentProjects.map((project) => (
                    <tr key={project.id}>
                      <td>{project.name}</td>
                      <td>{project.code}</td>
                      <td>{formatStatusLabel(project.status)}</td>
                      <td>{project.orgId ? `组织${project.orgId}` : '-'}</td>
                      <td>{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '-'}</td>
                      <td className="text-right">
                        <button className="ui-btn ui-btn-sm ui-btn-default" onClick={() => navigate(`/projects/${project.id}`)}>
                          查看
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <button className="ui-card p-4 text-left hover:bg-slate-50" onClick={() => navigate('/workbench')}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">项目工作台</span>
              <FolderKanban size={16} className="text-slate-500" />
            </div>
            <div className="mt-1 text-xs text-slate-500">进入项目选择和版本操作</div>
          </button>
          <button className="ui-card p-4 text-left hover:bg-slate-50" onClick={() => navigate('/my-tasks')}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">审批中心</span>
              <Bell size={16} className="text-slate-500" />
            </div>
            <div className="mt-1 text-xs text-slate-500">处理待办审批和历史任务</div>
          </button>
          <button className="ui-card p-4 text-left hover:bg-slate-50" onClick={() => navigate('/templates')}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">模板管理</span>
              <FileText size={16} className="text-slate-500" />
            </div>
            <div className="mt-1 text-xs text-slate-500">维护模板结构与指标规则</div>
          </button>
          <button className="ui-card p-4 text-left hover:bg-slate-50" onClick={() => navigate('/settings')}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">系统设置</span>
              <Settings size={16} className="text-slate-500" />
            </div>
            <div className="mt-1 text-xs text-slate-500">流程、角色和权限配置</div>
          </button>
        </section>
      </div>
    </Layout>
  );
};

export default SystemDashboard;
