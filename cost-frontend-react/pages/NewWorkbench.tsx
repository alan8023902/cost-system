import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileDown,
  FileUp,
  Plus,
  Send,
  Stamp,
  Users,
} from 'lucide-react';
import Layout from '../components/Layout';
import Selector from '../components/Selector';
import { useToast } from '../components/ToastProvider';
import { formatStatusLabel } from '../constants';
import {
  fileApi,
  indicatorApi,
  projectApi,
  versionApi,
  workflowApi,
} from '../services/apiService';

type TrendPoint = { label: string; value: number };

const MiniTrend: React.FC<{ data: TrendPoint[] }> = ({ data }) => {
  if (data.length === 0) {
    return <div className="h-12 text-xs text-slate-400">暂无趋势数据</div>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const points = data
    .map((d, idx) => {
      const x = (idx / Math.max(data.length - 1, 1)) * 100;
      const y = 44 - (d.value / max) * 40;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg viewBox="0 0 100 48" className="h-12 w-full">
      <polyline points={points} fill="none" stroke="#1A5CFF" strokeWidth="2" />
    </svg>
  );
};

const NewWorkbench: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [projects, setProjects] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [projectDetail, setProjectDetail] = useState<any>(null);
  const [versionDetail, setVersionDetail] = useState<any>(null);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [workflowDetail, setWorkflowDetail] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let alive = true;
    projectApi
      .list()
      .then((res: any) => {
        if (!alive) return;
        const list = Array.isArray(res) ? res : Array.isArray(res?.content) ? res.content : [];
        setProjects(list);
        if (list[0]?.id) setSelectedProjectId(String(list[0].id));
      })
      .catch((err) => toast.error(err.message || '加载项目失败'))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    let alive = true;
    Promise.all([projectApi.get(selectedProjectId), projectApi.getVersions(selectedProjectId)])
      .then(async ([projectInfo, versionList]) => {
        if (!alive) return;
        const list = Array.isArray(versionList) ? versionList : [];
        setProjectDetail(projectInfo || null);
        setVersions(list);
        if (list[0]?.id) {
          setSelectedVersionId(String(list[0].id));
        } else {
          setSelectedVersionId('');
          setIndicators([]);
          setWorkflowDetail(null);
          setFiles([]);
        }

        const recent = list.slice(0, 6);
        const points: TrendPoint[] = [];
        for (const item of recent) {
          try {
            const result = await indicatorApi.list(String(item.id));
            const total = extractCostValues(Array.isArray(result) ? result : []).total;
            points.push({ label: `v${item.versionNo || item.id}`, value: total });
          } catch {
            points.push({ label: `v${item.versionNo || item.id}`, value: 0 });
          }
        }
        setTrendData(points.reverse());
      })
      .catch((err) => toast.error(err.message || '加载项目数据失败'));

    return () => {
      alive = false;
    };
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedVersionId) return;
    let alive = true;
    Promise.all([
      versionApi.get(selectedVersionId),
      indicatorApi.list(selectedVersionId),
      workflowApi.getVersionWorkflow(selectedVersionId),
      fileApi.listVersionFiles(Number(selectedVersionId)),
    ])
      .then(([version, indicatorList, workflow, fileList]) => {
        if (!alive) return;
        setVersionDetail(version || null);
        setIndicators(Array.isArray(indicatorList) ? indicatorList : []);
        setWorkflowDetail(workflow || null);
        setFiles(Array.isArray(fileList) ? fileList : []);
      })
      .catch((err) => toast.error(err.message || '加载版本数据失败'));
    return () => {
      alive = false;
    };
  }, [selectedVersionId]);

  const costValues = useMemo(() => extractCostValues(indicators), [indicators]);
  const previousTotal = trendData.length > 1 ? trendData[trendData.length - 2].value : 0;
  const ratio = previousTotal > 0 ? ((costValues.total - previousTotal) / previousTotal) * 100 : 0;

  const projectOptions = projects.map((item) => ({
    id: String(item.id),
    label: item.name || item.projectName || '未命名项目',
    subtitle: item.code || item.projectCode || '',
  }));

  const versionOptions = versions.map((item) => ({
    id: String(item.id),
    label: `v${item.versionNo || item.id}`,
    subtitle: formatStatusLabel(String(item.status || '').toUpperCase()),
  }));

  const recentTimeline = useMemo(() => {
    const events = [
      ...(Array.isArray(files)
        ? files.map((file: any) => ({
            time: file.createdAt,
            text: `${formatFileTypeLabel(file.fileType)} · ${file.fileName || '-'}`,
          }))
        : []),
      ...(Array.isArray(versions)
        ? versions.slice(0, 4).map((item: any) => ({
            time: item.updatedAt || item.createdAt,
            text: `版本 v${item.versionNo || item.id} 状态 ${formatStatusLabel(String(item.status || '').toUpperCase())}`,
          }))
        : []),
    ];
    return events
      .filter((item) => item.time)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6);
  }, [files, versions]);

  const workflowNodes = Array.isArray(workflowDetail?.definition?.nodes) ? workflowDetail.definition.nodes : [];
  const currentNode = workflowDetail?.currentNodeKey;

  const handleCreateVersion = async () => {
    if (!selectedProjectId) return;
    setWorking(true);
    try {
      await versionApi.create(selectedProjectId, {});
      toast.success('已新建版本');
      const list = await projectApi.getVersions(selectedProjectId);
      const next = Array.isArray(list) ? list : [];
      setVersions(next);
      if (next[0]?.id) setSelectedVersionId(String(next[0].id));
    } catch (err: any) {
      toast.error(err.message || '新建版本失败');
    } finally {
      setWorking(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedVersionId) return;
    setWorking(true);
    try {
      await versionApi.submit(selectedVersionId);
      toast.success('已提交审批');
      const detail = await versionApi.get(selectedVersionId);
      setVersionDetail(detail);
    } catch (err: any) {
      toast.error(err.message || '提交审批失败');
    } finally {
      setWorking(false);
    }
  };

  const handleExportPdf = async () => {
    if (!selectedVersionId) return;
    setWorking(true);
    try {
      await fileApi.exportPdf(Number(selectedVersionId));
      toast.success('已生成PDF，前往文件中心下载');
    } catch (err: any) {
      toast.error(err.message || '导出失败');
    } finally {
      setWorking(false);
    }
  };

  const handleSeal = async () => {
    if (!selectedVersionId) return;
    setWorking(true);
    try {
      await fileApi.sealVersion(Number(selectedVersionId));
      toast.success('盖章完成');
    } catch (err: any) {
      toast.error(err.message || '盖章失败');
    } finally {
      setWorking(false);
    }
  };

  const rightPanel = (
    <div className="space-y-4 text-sm">
      <section className="border border-slate-200 bg-white p-4">
        <div className="mb-2 font-semibold">项目概览</div>
        <div className="space-y-1 text-xs text-slate-600">
          <div>名称：{projectDetail?.name || '-'}</div>
          <div>编码：{projectDetail?.code || '-'}</div>
          <div>负责人：{projectDetail?.manager || '管理员'}</div>
          <div>起止：{projectDetail?.startDate || '-'} ~ {projectDetail?.endDate || '-'}</div>
          <div className="flex items-center gap-2 pt-1">
            <Users size={12} />
            <span>成员数：{projectDetail?.memberCount || '-'}</span>
          </div>
        </div>
      </section>

      <section className="border border-slate-200 bg-white p-4">
        <div className="mb-2 font-semibold">版本状态</div>
        <div className="mb-3 text-xs text-slate-600">当前状态：{formatStatusLabel(String(versionDetail?.status || '').toUpperCase())}</div>
        <div className="space-y-2">
          <button className="ui-btn ui-btn-primary w-full" onClick={handleSubmit} disabled={working}>
            <Send size={14} className="mr-1" />
            提交审批
          </button>
          <button className="ui-btn ui-btn-default w-full" onClick={handleExportPdf} disabled={working}>
            <FileDown size={14} className="mr-1" />
            导出 PDF
          </button>
          <button className="ui-btn ui-btn-default w-full" onClick={handleSeal} disabled={working}>
            <Stamp size={14} className="mr-1" />
            盖章
          </button>
          <button
            className="ui-btn ui-btn-default w-full"
            onClick={() => selectedVersionId && navigate(`/versions/${selectedVersionId}/workbench`)}
            disabled={!selectedVersionId}
          >
            进入数据录入
          </button>
        </div>
      </section>

      <section className="border border-slate-200 bg-white p-4">
        <div className="mb-2 font-semibold">关键指标</div>
        <MetricLine label="物资成本" value={costValues.material} total={costValues.total} />
        <MetricLine label="分包成本" value={costValues.subcontract} total={costValues.total} />
        <MetricLine label="费用合计" value={costValues.expense} total={costValues.total} />
      </section>

      <section className="border border-slate-200 bg-white p-4">
        <div className="mb-2 font-semibold">常用模板</div>
        <button className="ui-btn ui-btn-default w-full" onClick={() => navigate('/templates')}>
          物资模板 / 分包模板
        </button>
      </section>
    </div>
  );

  const currentNodeIndex = workflowNodes.findIndex((node: any) => node.nodeKey === currentNode);

  return (
    <Layout title="项目工作台" subtitle="项目、版本、流程与成本数据统一操作区" rightPanel={rightPanel}>
      <div className="space-y-4 text-sm">
        <section className="border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-60">
                <Selector
                  value={selectedProjectId}
                  options={projectOptions}
                  placeholder="项目"
                  onChange={(id) => setSelectedProjectId(String(id))}
                  loading={loading}
                />
              </div>
              <div className="w-56">
                <Selector
                  value={selectedVersionId}
                  options={versionOptions}
                  placeholder="版本"
                  onChange={(id) => setSelectedVersionId(String(id))}
                  loading={loading}
                />
              </div>
              <button className="ui-btn ui-btn-default" onClick={handleCreateVersion} disabled={working || !selectedProjectId}>
                <Plus size={14} className="mr-1" />
                新建版本
              </button>
              <button
                className="ui-btn ui-btn-default"
                onClick={() => selectedVersionId && navigate(`/versions/${selectedVersionId}/workbench?tab=import-export`)}
                disabled={!selectedVersionId}
              >
                <FileUp size={14} className="mr-1" />
                导入数据
              </button>
              <button
                className="ui-btn ui-btn-primary"
                onClick={() => selectedVersionId && navigate(`/versions/${selectedVersionId}/workbench`)}
                disabled={!selectedVersionId}
              >
                进入版本工作台
              </button>
            </div>
            <div className="flex items-center justify-start lg:justify-end">
              <button className="ui-btn ui-btn-default" onClick={() => navigate('/my-tasks')}>
                审批中心
                <span className="ml-2 rounded-full bg-red-500 px-2 text-xs text-white">
                  {workflowDetail?.myPending ? 1 : 0}
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="border border-slate-200 bg-white p-3">
            <div className="text-xs text-slate-500">当前版本</div>
            <div className="mt-1 font-semibold text-slate-900">V{versionDetail?.versionNo || '-'}</div>
          </div>
          <div className="border border-slate-200 bg-white p-3">
            <div className="text-xs text-slate-500">版本状态</div>
            <div className="mt-1 font-semibold text-blue-700">{formatStatusLabel(String(versionDetail?.status || '').toUpperCase())}</div>
          </div>
          <div className="border border-slate-200 bg-white p-3">
            <div className="text-xs text-slate-500">总成本</div>
            <div className="mt-1 font-semibold text-slate-900">{toWan(costValues.total)} 万</div>
          </div>
          <div className="border border-slate-200 bg-white p-3">
            <div className="text-xs text-slate-500">环比变化</div>
            <div className={`mt-1 font-semibold ${ratio >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {ratio >= 0 ? '+' : '-'}{Math.abs(ratio).toFixed(1)}%
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <section className="border border-slate-200 bg-white p-4">
              <div className="mb-2 font-semibold">成本趋势</div>
              <div className="text-2xl font-semibold text-slate-900">{toWan(costValues.total)} 万元</div>
              <div className="mt-2">
                <MiniTrend data={trendData} />
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-4">
              <div className="mb-3 font-semibold">成本构成</div>
              <div className="grid grid-cols-[160px_1fr] items-center gap-4">
                <div
                  className="relative h-36 w-36 rounded-full border border-slate-200"
                  style={{
                    background: `conic-gradient(#1A5CFF 0 ${(costValues.material / Math.max(costValues.total, 1)) * 100}%,
                    #6E8FBF ${(costValues.material / Math.max(costValues.total, 1)) * 100}% ${((costValues.material + costValues.subcontract) / Math.max(costValues.total, 1)) * 100}%,
                    #E88B45 ${((costValues.material + costValues.subcontract) / Math.max(costValues.total, 1)) * 100}% 100%)`,
                  }}
                >
                  <div className="absolute inset-5 flex items-center justify-center rounded-full bg-white text-center text-xs text-slate-600">
                    总成本<br />{toWan(costValues.total)}万
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <LegendLine color="#1A5CFF" label="物资" value={costValues.material} total={costValues.total} />
                  <LegendLine color="#6E8FBF" label="分包" value={costValues.subcontract} total={costValues.total} />
                  <LegendLine color="#E88B45" label="费用" value={costValues.expense} total={costValues.total} />
                </div>
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-4">
              <div className="mb-3 font-semibold">审批流程节点</div>
              {workflowNodes.length === 0 ? (
                <div className="text-xs text-slate-400">暂无审批节点配置</div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {workflowNodes.map((node: any, idx: number) => {
                    const state = idx < currentNodeIndex ? 'done' : idx === currentNodeIndex ? 'current' : 'todo';
                    const cls = state === 'done'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : state === 'current'
                        ? 'border-blue-300 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-500';
                    return (
                      <div key={node.nodeKey || idx} className="flex items-center gap-2">
                        <div className={`min-w-[128px] rounded border px-3 py-2 text-xs ${cls}`}>
                          <div className="font-medium">{node.nodeName || node.nodeKey}</div>
                          <div className="mt-1 flex items-center gap-1 text-[11px]">
                            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />
                            {state === 'done' ? '已完成' : state === 'current' ? '当前节点' : '待处理'}
                          </div>
                        </div>
                        {idx < workflowNodes.length - 1 && <ArrowRight size={14} className="text-slate-300" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="border border-slate-200 bg-white p-4">
              <div className="mb-2 font-semibold">最近版本动态</div>
              <div className="space-y-2 text-xs">
                {recentTimeline.length === 0 ? (
                  <div className="text-slate-400">暂无动态记录</div>
                ) : (
                  recentTimeline.map((item, idx) => (
                    <div key={`${item.time}-${idx}`} className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-700">{item.text}</span>
                      <span className="text-slate-400">
                        {new Date(item.time).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="space-y-4 xl:col-span-1">
            <section className="border border-slate-200 bg-white p-4">
              <div className="mb-2 font-semibold">快速入口</div>
              <div className="space-y-2">
                <button
                  className="ui-btn ui-btn-default w-full justify-between"
                  onClick={() => selectedVersionId && navigate(`/versions/${selectedVersionId}/workbench`)}
                >
                  成本明细录入
                  <ArrowRight size={14} />
                </button>
                <button className="ui-btn ui-btn-default w-full justify-between" onClick={() => navigate('/my-tasks')}>
                  审批处理
                  <ArrowRight size={14} />
                </button>
                <button className="ui-btn ui-btn-default w-full justify-between" onClick={() => navigate('/files')}>
                  文件中心
                  <ArrowRight size={14} />
                </button>
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-4">
              <div className="mb-2 font-semibold">审批提醒</div>
              <div className="flex items-center gap-2 text-xs">
                {workflowDetail?.myPending ? (
                  <>
                    <Clock3 size={14} className="text-amber-500" />
                    当前版本存在待审批节点
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    当前版本无待办
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const extractCostValues = (indicators: any[]) => {
  const find = (keys: string[]) => {
    const item = indicators.find((indicator: any) => {
      const key = String(indicator?.indicatorKey || '').toUpperCase();
      return keys.some((name) => key.includes(name));
    });
    return Number(item?.value || 0);
  };
  const material = find(['MATERIAL']);
  const subcontract = find(['SUBCONTRACT']);
  const expense = find(['EXPENSE']);
  const total = find(['TOTAL_COST', 'COST_TOTAL', 'TOTAL']) || material + subcontract + expense;
  return { material, subcontract, expense, total };
};

const toWan = (value: number) => (value / 10000).toFixed(1);

const formatFileTypeLabel = (value?: string) => {
  const map: Record<string, string> = {
    EXPORT_XLSX: 'Excel导出',
    EXPORT_PDF: 'PDF导出',
    SEALED_PDF: '盖章文件',
    IMPORT_XLSX: 'Excel导入',
  };
  const code = String(value || '').toUpperCase();
  return map[code] || (value || '文件');
};

const LegendLine: React.FC<{ color: string; label: string; value: number; total: number }> = ({ color, label, value, total }) => {
  const ratio = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <span>{label}</span>
      </div>
      <span>{ratio.toFixed(1)}%</span>
    </div>
  );
};

const MetricLine: React.FC<{ label: string; value: number; total: number }> = ({ label, value, total }) => {
  const ratio = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span>{label}</span>
        <span>{toWan(value)}万</span>
      </div>
      <div className="h-2 bg-slate-100">
        <div className="h-2 bg-[#1A5CFF]" style={{ width: `${ratio}%` }} />
      </div>
    </div>
  );
};

export default NewWorkbench;
