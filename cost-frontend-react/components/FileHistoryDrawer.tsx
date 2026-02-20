import React, { useEffect, useMemo, useState } from 'react';
import { X, Download, FileText, ShieldCheck, FileSpreadsheet, Eye } from 'lucide-react';
import { fileApi, versionApi } from '../services/apiService';
import FilePreviewModal from './FilePreviewModal';

interface FileInfo {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdBy: string;
  createdAt: string;
}

interface FileHistoryDrawerProps {
  open: boolean;
  versionId: number;
  onClose: () => void;
}

const FileHistoryDrawer: React.FC<FileHistoryDrawerProps> = ({ open, versionId, onClose }) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'EXPORT_XLSX' | 'EXPORT_PDF' | 'SEALED_PDF'>('ALL');
  const [sortBy, setSortBy] = useState<'time' | 'size'>('time');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [preview, setPreview] = useState<{ url: string; name: string; type: string } | null>(null);
  const [previewFileId, setPreviewFileId] = useState<number | null>(null);
  const [sealPosition, setSealPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    loadFiles();
  }, [open, versionId]);

  const loadFiles = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fileApi.listVersionFiles(versionId);
      const versionInfo = await versionApi.get(String(versionId));
      setFiles(result);
      if (versionInfo) {
        setSealPosition({
          x: versionInfo.sealPosX ?? 0.64,
          y: versionInfo.sealPosY ?? 0.095,
        });
      }
    } catch (err: any) {
      setError(err.message || '加载文件历史失败');
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = useMemo(() => {
    let list = files;
    if (filter !== 'ALL') {
      list = files.filter((file) => file.fileType === filter);
    }
    const sorted = [...list].sort((a, b) => {
      const factor = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'size') {
        return (a.fileSize - b.fileSize) * factor;
      }
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * factor;
    });
    return sorted;
  }, [files, filter, sortBy, sortDir]);

  const formatSize = (size: number) => {
    if (!size && size !== 0) return '-';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getTypeBadge = (type: string) => {
    const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      EXPORT_XLSX: { label: 'Excel导出', className: 'bg-blue-50 text-blue-600 border-blue-100', icon: <FileSpreadsheet size={12} /> },
      EXPORT_PDF: { label: 'PDF导出', className: 'bg-slate-50 text-slate-600 border-slate-200', icon: <FileText size={12} /> },
      SEALED_PDF: { label: '已盖章PDF', className: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <ShieldCheck size={12} /> },
    };
    const config = map[type] || { label: type, className: 'bg-slate-50 text-slate-600 border-slate-200', icon: <FileText size={12} /> };
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md border text-xs ${config.className}`}>
        {config.icon}
        <span>{config.label}</span>
      </span>
    );
  };

  const handleDownload = async (fileId: number) => {
    try {
      const { blob, filename } = await fileApi.downloadFile(fileId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || '下载失败');
    }
  };

  const handlePreview = async (fileId: number, fileName: string, fileType: string) => {
    try {
      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }
      const { blob } = await fileApi.downloadFile(fileId);
      const url = URL.createObjectURL(blob);
      setPreview({ url, name: fileName, type: fileType });
      setPreviewFileId(fileId);
    } catch (err: any) {
      setError(err.message || '预览失败');
    }
  };

  const closePreview = () => {
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }
    setPreview(null);
    setPreviewFileId(null);
  };

  const handleSaveSealPosition = async (position: { x: number; y: number }) => {
    const result = await versionApi.updateSealPosition(String(versionId), {
      sealPosX: position.x,
      sealPosY: position.y,
    });
    setSealPosition({
      x: result?.sealPosX ?? position.x,
      y: result?.sealPosY ?? position.y,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[520px] bg-white h-full shadow-xl border-l border-slate-200 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">文件管理</h3>
            <p className="text-xs text-slate-500 mt-1">导出历史与盖章文件</p>
          </div>
          <button onClick={onClose} className="ui-btn-icon">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`ui-btn ui-btn-sm ${filter === 'ALL' ? 'ui-btn-primary' : 'ui-btn-default'}`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('EXPORT_XLSX')}
              className={`ui-btn ui-btn-sm ${filter === 'EXPORT_XLSX' ? 'ui-btn-primary' : 'ui-btn-default'}`}
            >
              Excel
            </button>
            <button
              onClick={() => setFilter('EXPORT_PDF')}
              className={`ui-btn ui-btn-sm ${filter === 'EXPORT_PDF' ? 'ui-btn-primary' : 'ui-btn-default'}`}
            >
              PDF
            </button>
            <button
              onClick={() => setFilter('SEALED_PDF')}
              className={`ui-btn ui-btn-sm ${filter === 'SEALED_PDF' ? 'ui-btn-primary' : 'ui-btn-default'}`}
            >
              盖章
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="ui-select h-8 w-24"
            >
              <option value="time">按时间</option>
              <option value="size">按大小</option>
            </select>
            <button
              onClick={() => setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="ui-btn ui-btn-default ui-btn-sm"
            >
              {sortDir === 'desc' ? '降序' : '升序'}
            </button>
          </div>
          <button
            onClick={loadFiles}
            className="ui-btn ui-btn-default ui-btn-sm"
          >
            刷新
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
          ) : filteredFiles.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm">暂无文件记录</div>
          ) : (
            <table className="ui-table">
              <thead>
                <tr>
                  <th>文件</th>
                  <th>类型</th>
                  <th>大小</th>
                  <th>创建</th>
                  <th className="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50">
                    <td>
                      <div className="text-slate-900 text-sm font-medium truncate max-w-[180px]" title={file.fileName}>
                        {file.fileName}
                      </div>
                      <div className="text-xs text-slate-400">{new Date(file.createdAt).toLocaleString()}</div>
                    </td>
                    <td>{getTypeBadge(file.fileType)}</td>
                    <td className="text-slate-500 text-xs">{formatSize(file.fileSize)}</td>
                    <td className="text-slate-500 text-xs">{file.createdBy || '-'}</td>
                    <td className="text-right">
                      <button
                        onClick={() => handlePreview(file.id, file.fileName, file.fileType)}
                        className="ui-btn ui-btn-sm ui-btn-default"
                      >
                        <Eye size={12} className="mr-1" />
                        预览
                      </button>
                      <button
                        onClick={() => handleDownload(file.id)}
                        className="ui-btn ui-btn-sm ui-btn-primary"
                      >
                        <Download size={12} className="mr-1" />
                        下载
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {preview && (
        <FilePreviewModal
          open
          fileName={preview.name}
          fileType={preview.type}
          previewUrl={preview.url}
          onClose={closePreview}
          onDownload={() => previewFileId && handleDownload(previewFileId)}
          sealPosition={sealPosition ?? undefined}
          onSaveSealPosition={handleSaveSealPosition}
        />
      )}
    </div>
  );
};

export default FileHistoryDrawer;
