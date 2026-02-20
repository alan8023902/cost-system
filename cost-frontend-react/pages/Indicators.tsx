import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import TraceDrawer from '../components/TraceDrawer';
import { formatIndicatorLabel } from '../constants';
import { useToast } from '../components/ToastProvider';
import { indicatorApi, projectApi, versionApi } from '../services/apiService';
import { RefreshCcw, Calculator, Search } from 'lucide-react';

const Indicators: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialVersionId = searchParams.get('versionId') || '';
  const [projects, setProjects] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [indicators, setIndicators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [working, setWorking] = useState(false);
  const [traceState, setTraceState] = useState<{ open: boolean; key: string; name: string }>(
    { open: false, key: '', name: '' }
  );
  const toast = useToast();

  const getLatestVersion = (list: any[]) => {
    if (list.length === 0) return null;
    return [...list].sort((a, b) => {
      const versionNoDiff = Number(b.versionNo || 0) - Number(a.versionNo || 0);
      if (versionNoDiff !== 0) return versionNoDiff;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    })[0];
  };

  const loadIndicators = async (versionId: string) => {
    if (!versionId) return;
    const data = await indicatorApi.list(versionId);
    setIndicators(Array.isArray(data) ? data : []);
  };

  const init = async () => {
    setLoading(true);
    try {
      const projectList = (await projectApi.list()) as any;
      const projectArray = Array.isArray(projectList) ? projectList : projectList?.content || [];
      setProjects(projectArray || []);

      if (initialVersionId) {
        const versionInfo = await versionApi.get(initialVersionId);
        if (versionInfo?.projectId) {
          const projectId = String(versionInfo.projectId);
          setSelectedProjectId(projectId);
          const versionList = await projectApi.getVersions(projectId);
          setVersions(versionList || []);
        }
        setSelectedVersionId(initialVersionId);
        await loadIndicators(initialVersionId);
      } else if (projectArray && projectArray.length > 0) {
        const projectId = String(projectArray[0].id);
        setSelectedProjectId(projectId);
        const versionList = await projectApi.getVersions(projectId);
        setVersions(versionList || []);
        const latest = getLatestVersion(versionList || []);
        if (latest?.id) {
          const versionId = String(latest.id);
          setSelectedVersionId(versionId);
          await loadIndicators(versionId);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (selectedVersionId) {
      setSearchParams({ versionId: selectedVersionId });
    }
  }, [selectedVersionId, setSearchParams]);

  const handleProjectChange = async (projectId: string) => {
    setSelectedProjectId(projectId);
    setVersions([]);
    setIndicators([]);
    setSelectedVersionId('');
    if (!projectId) return;
    const versionList = await projectApi.getVersions(projectId);
    setVersions(versionList || []);
    const latest = getLatestVersion(versionList || []);
    if (latest?.id) {
      const versionId = String(latest.id);
      setSelectedVersionId(versionId);
      await loadIndicators(versionId);
    }
  };

  const handleVersionChange = async (versionId: string) => {
    setSelectedVersionId(versionId);
    if (!versionId) return;
    await loadIndicators(versionId);
  };

  const handleRecalculate = async () => {
    if (!selectedVersionId) return;
    setWorking(true);
    try {
      await indicatorApi.recalculate(selectedVersionId);
      await loadIndicators(selectedVersionId);
      toast.success('重算完成');
    } catch (e: any) {
      toast.error(e?.message || '重算失败');
    } finally {
      setWorking(false);
    }
  };

  const filteredIndicators = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    if (!key) return indicators;
    return indicators.filter((ind) => {
      const label = formatIndicatorLabel(ind.indicatorKey, ind.indicatorName);
      const content = `${ind.indicatorKey || ''} ${ind.indicatorName || ''} ${label || ''} ${ind.expression || ''}`.toLowerCase();
      return content.includes(key);
    });
  }, [indicators, keyword]);

  return (
    <Layout title="指标看板" subtitle="指标展示与追溯分析">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="ui-input w-56"
            >
              <option value="">选择项目</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name || p.projectName || `项目${p.id}`}</option>
              ))}
            </select>
            <select
              value={selectedVersionId}
              onChange={(e) => handleVersionChange(e.target.value)}
              className="ui-input w-full sm:w-56"
            >
              <option value="">选择版本</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.versionNo ? `V${v.versionNo}` : v.versionName || v.id} · {v.status || '-'}
                </option>
              ))}
            </select>
            <div className="relative">
              <Search size={14} className="absolute left-2 top-2.5 text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索指标键/名称/表达式"
                className="ui-input w-full sm:w-64 pl-7"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="ui-btn ui-btn-default gap-1" onClick={init}>
              <RefreshCcw size={14} /> 刷新
            </button>
            <button
              className="ui-btn ui-btn-primary gap-1"
              onClick={handleRecalculate}
              disabled={!selectedVersionId || working}
            >
              <Calculator size={14} /> 重算指标
            </button>
          </div>
        </div>

        <div className="sm:hidden space-y-2">
          {loading ? (
            <div className="text-center py-6 text-slate-400 text-sm">加载中...</div>
          ) : (
            filteredIndicators.map((ind) => (
              <div key={ind.indicatorKey} className="bg-white border border-slate-200 rounded px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{formatIndicatorLabel(ind.indicatorKey, ind.indicatorName)}</div>
                    <div className="text-xs text-slate-400 font-mono">{ind.indicatorKey || '-'}</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{ind.value ?? '-'}</div>
                </div>
                <div className="mt-1 text-xs text-slate-500">表达式：{ind.expression || '-'}</div>
                <div className="mt-1 text-xs text-slate-500">计算时间：{ind.calcTime ? new Date(ind.calcTime).toLocaleString() : '-'}</div>
                <div className="mt-2">
                  <button
                    className="ui-btn ui-btn-sm ui-btn-default"
                    onClick={() => setTraceState({
                      open: true,
                      key: ind.indicatorKey,
                      name: formatIndicatorLabel(ind.indicatorKey, ind.indicatorName),
                    })}
                    disabled={!selectedVersionId}
                  >
                    追溯
                  </button>
                </div>
              </div>
            ))
          )}
          {!loading && filteredIndicators.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-sm">暂无指标数据</div>
          )}
        </div>

        <div className="hidden sm:block ui-table-container">
          <table className="ui-table">
            <thead>
              <tr>
                <th>指标</th>
                <th>指标名称</th>
                <th>值</th>
                <th>表达式</th>
                <th>计算时间</th>
                <th className="text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">加载中...</td></tr>
              ) : filteredIndicators.map((ind) => (
                <tr key={ind.indicatorKey} className="hover:bg-slate-50">
                  <td>
                    <div className="text-sm text-slate-900">{formatIndicatorLabel(ind.indicatorKey, ind.indicatorName)}</div>
                    <div className="text-xs text-slate-400 font-mono">{ind.indicatorKey || '-'}</div>
                  </td>
                  <td>{formatIndicatorLabel(ind.indicatorKey, ind.indicatorName)}</td>
                  <td className="font-semibold">{ind.value ?? '-'}</td>
                  <td className="text-xs text-slate-500">{ind.expression || '-'}</td>
                  <td className="text-xs text-slate-500">{ind.calcTime ? new Date(ind.calcTime).toLocaleString() : '-'}</td>
                  <td className="text-center">
                    <button
                      className="ui-btn ui-btn-sm ui-btn-default"
                      onClick={() => setTraceState({
                        open: true,
                        key: ind.indicatorKey,
                        name: formatIndicatorLabel(ind.indicatorKey, ind.indicatorName),
                      })}
                      disabled={!selectedVersionId}
                    >
                      追溯
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredIndicators.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">暂无指标数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TraceDrawer
        open={traceState.open}
        versionId={Number(selectedVersionId)}
        indicatorKey={traceState.key}
        indicatorName={traceState.name}
        onClose={() => setTraceState({ open: false, key: '', name: '' })}
      />
    </Layout>
  );
};

export default Indicators;
