import React, { useEffect, useState } from 'react';
import { X, ChevronRight, Hash, Sigma, AlertTriangle } from 'lucide-react';
import { indicatorApi } from '../services/apiService';

interface TraceDrawerProps {
  open: boolean;
  versionId: number;
  indicatorKey: string;
  indicatorName: string;
  onClose: () => void;
}

interface TraceResponse {
  expression?: string;
  result?: number;
  matched_line_item_ids?: number[];
  intermediate?: Array<{
    expression?: string;
    field?: string;
    condition?: string;
    count?: number;
    value?: number;
    itemIds?: number[];
  }>;
}

const TraceDrawer: React.FC<TraceDrawerProps> = ({ open, versionId, indicatorKey, indicatorName, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [trace, setTrace] = useState<TraceResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    loadTrace();
  }, [open, indicatorKey, versionId]);

  const loadTrace = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await indicatorApi.trace(String(versionId), indicatorKey);
      setTrace(result);
    } catch (err: any) {
      setError(err.message || '追溯数据获取失败');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[520px] bg-white h-full shadow-xl border-l border-slate-200 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">指标追溯</h3>
            <p className="text-xs text-slate-500 mt-1">{indicatorName}（{indicatorKey}）</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="px-5 py-3 text-xs text-red-600 bg-red-50 border-b border-red-100">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm">加载中...</div>
          ) : !trace ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm">暂无追溯信息</div>
          ) : (
            <div className="px-5 py-4 space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
                <div className="text-xs text-slate-500 mb-2 flex items-center">
                  <Sigma size={12} className="mr-1" />
                  规则表达式
                </div>
                <div className="text-sm text-slate-800 font-mono break-all">
                  {trace.expression || '-'}
                </div>
                <div className="mt-3 text-xs text-slate-500 flex items-center">
                  <Hash size={12} className="mr-1" />
                  结果值：<span className="ml-1 text-slate-800 font-semibold">{trace.result ?? '-'}</span>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 mb-2">命中明细行</div>
                <div className="bg-white border border-slate-200 rounded-md p-3 text-xs text-slate-600">
                  {trace.matched_line_item_ids && trace.matched_line_item_ids.length > 0 ? (
                    trace.matched_line_item_ids.join(', ')
                  ) : (
                    <span className="text-slate-400">无</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 mb-2">中间过程</div>
                {trace.intermediate && trace.intermediate.length > 0 ? (
                  <div className="space-y-3">
                    {trace.intermediate.map((step, index) => (
                      <div key={index} className="border border-slate-200 rounded-md p-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                          <span className="flex items-center">
                            <ChevronRight size={12} className="mr-1" />
                            步骤 {index + 1}
                          </span>
                          <span>命中 {step.count ?? 0} 行</span>
                        </div>
                        <div className="text-xs text-slate-600 space-y-1">
                          <div>表达式：<span className="font-mono text-slate-800">{step.expression || '-'}</span></div>
                          <div>字段：{step.field || '-'}</div>
                          <div>条件：{step.condition || '-'}</div>
                          <div>合计值：<span className="font-semibold">{step.value ?? '-'}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">暂无中间过程</div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-md p-3 text-xs text-amber-700 flex items-start">
                <AlertTriangle size={12} className="mr-2 mt-0.5" />
                追溯结果仅供审计与分析使用，修改明细后需重新计算。
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TraceDrawer;
