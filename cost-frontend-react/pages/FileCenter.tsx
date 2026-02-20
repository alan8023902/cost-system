import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import FilePreviewModal from '../components/FilePreviewModal';
import { fileApi, projectApi, versionApi } from '../services/apiService';
import { FileText, ArrowLeft, Download, Eye, ShieldCheck, Search } from 'lucide-react';
import { formatStatusLabel } from '../constants';

interface FileInfo {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdBy: string;
  createdAt: string;
}

interface SealRecord {
  id: number;
  versionId: number;
  pdfFileId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  sealedBy: string;
  sealedAt: string;
  sealType: string;
  fileHash: string;
  createdAt: string;
}

const FileCenter: React.FC = () => {
  const navigate = useNavigate();
  const { versionId } = useParams<{ versionId: string }>();
  const [activeTab, setActiveTab] = useState<'files' | 'seals'>('files');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [sealRecords, setSealRecords] = useState<SealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ url: string; name: string; type: string } | null>(null);
  const [previewFileId, setPreviewFileId] = useState<number | null>(null);
  const [selectedSeal, setSelectedSeal] = useState<SealRecord | null>(null);
  const [versionList, setVersionList] = useState<any[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [sealPosition, setSealPosition] = useState<{ x: number; y: number } | null>(null);
  const [fileKeyword, setFileKeyword] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<'ALL' | 'EXPORT_XLSX' | 'EXPORT_PDF' | 'SEALED_PDF'>('ALL');
  const [fileSortBy, setFileSortBy] = useState<'time' | 'size'>('time');
  const [fileSortDir, setFileSortDir] = useState<'desc' | 'asc'>('desc');
  const [sealKeyword, setSealKeyword] = useState('');
  const [sealTypeFilter, setSealTypeFilter] = useState<'ALL' | 'SEALED_PDF' | 'EXPORT_PDF'>('ALL');
  const [sealSortBy, setSealSortBy] = useState<'time' | 'size'>('time');
  const [sealSortDir, setSealSortDir] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    if (!versionId) return;
    const id = parseInt(versionId);
    setSelectedVersionId(id);
    loadData(id);
    loadVersionList(id);
  }, [versionId]);

  const loadVersionList = async (currentId: number) => {
    try {
      const versionInfo = await versionApi.get(String(currentId));
      if (versionInfo) {
        setSealPosition({
          x: versionInfo.sealPosX ?? 0.64,
          y: versionInfo.sealPosY ?? 0.095,
        });
      }
      if (!versionInfo?.projectId) return;
      const versions = await projectApi.getVersions(String(versionInfo.projectId));
      setVersionList(versions || []);
    } catch (err: any) {
      console.error('加载版本列表失败:', err);
    }
  };

  const loadData = async (currentId: number) => {
    setLoading(true);
    setError('');
    try {
      const [fileResult, sealResult] = await Promise.all([
        fileApi.listVersionFiles(currentId),
        fileApi.listSealRecords(currentId),
      ]);
      setFiles(fileResult || []);
      setSealRecords(sealResult || []);
    } catch (err: any) {
      setError(err.message || '加载文件中心失败');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (size: number) => {
    if (!size && size !== 0) return '-';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = async (fileId: number) => {
    const { blob, filename } = await fileApi.downloadFile(fileId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleVersionChange = (value: string) => {
    if (!value) return;
    navigate(`/versions/${value}/files`);
  };

  const handleSaveSealPosition = async (position: { x: number; y: number }) => {
    if (!selectedVersionId) return;
    const result = await versionApi.updateSealPosition(String(selectedVersionId), {
      sealPosX: position.x,
      sealPosY: position.y,
    });
    setSealPosition({
      x: result?.sealPosX ?? position.x,
      y: result?.sealPosY ?? position.y,
    });
  };

  const handlePreview = async (fileId: number, fileName: string, fileType: string) => {
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }
    const { blob } = await fileApi.downloadFile(fileId);
    const url = URL.createObjectURL(blob);
    setPreview({ url, name: fileName, type: fileType });
    setPreviewFileId(fileId);
  };

  const closePreview = () => {
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }
    setPreview(null);
    setPreviewFileId(null);
  };

  const fileTypeBadge = (type: string) => {
    const map: Record<string, { label: string; className: string }> = {
      EXPORT_XLSX: { label: 'Excel导出', className: 'bg-blue-50 text-blue-600 border-blue-100' },
      EXPORT_PDF: { label: 'PDF导出', className: 'bg-slate-50 text-slate-600 border-slate-200' },
      SEALED_PDF: { label: '已盖章PDF', className: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    };
    const config = map[type] || { label: type, className: 'bg-slate-50 text-slate-600 border-slate-200' };
    return <span className={`px-2 py-0.5 text-xs rounded-md border ${config.className}`}>{config.label}</span>;
  };

  const filteredFiles = useMemo(() => {
    let list = files;
    if (fileTypeFilter !== 'ALL') {
      list = list.filter((file) => file.fileType === fileTypeFilter);
    }
    const keyword = fileKeyword.trim().toLowerCase();
    if (keyword) {
      list = list.filter((file) => `${file.fileName} ${file.createdBy || ''}`.toLowerCase().includes(keyword));
    }
    const sorted = [...list].sort((a, b) => {
      const factor = fileSortDir === 'asc' ? 1 : -1;
      if (fileSortBy === 'size') {
        return (a.fileSize - b.fileSize) * factor;
      }
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * factor;
    });
    return sorted;
  }, [files, fileTypeFilter, fileKeyword, fileSortBy, fileSortDir]);

  const filteredSeals = useMemo(() => {
    let list = sealRecords;
    if (sealTypeFilter !== 'ALL') {
      list = list.filter((record) => record.fileType === sealTypeFilter);
    }
    const keyword = sealKeyword.trim().toLowerCase();
    if (keyword) {
      list = list.filter((record) =>
        `${record.fileName} ${record.sealedBy || ''} ${record.fileHash || ''}`.toLowerCase().includes(keyword)
      );
    }
    const sorted = [...list].sort((a, b) => {
      const factor = sealSortDir === 'asc' ? 1 : -1;
      if (sealSortBy === 'size') {
        return (a.fileSize - b.fileSize) * factor;
      }
      return (new Date(a.sealedAt).getTime() - new Date(b.sealedAt).getTime()) * factor;
    });
    return sorted;
  }, [sealRecords, sealTypeFilter, sealKeyword, sealSortBy, sealSortDir]);

  const sealSummary = useMemo(() => {
    return {
      total: filteredSeals.length,
      lastSealedAt: filteredSeals[0]?.sealedAt,
    };
  }, [filteredSeals]);

  return (
    <Layout title="文件中心" subtitle="导出历史、盖章记录与预览">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`/versions/${versionId}/workbench`)}
            className="ui-btn ui-btn-default gap-1.5"
          >
            <ArrowLeft size={16} className="mr-2" />
            返回工作台
          </button>
          <div className="flex items-center space-x-3">
            <div className="text-xs text-slate-500">版本切换</div>
            <select
              value={selectedVersionId ?? ''}
              onChange={(e) => handleVersionChange(e.target.value)}
              className="ui-select w-64"
            >
              {versionList.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.versionNo ? `V${version.versionNo}` : version.versionName || version.id} · {formatStatusLabel(String(version.status || '').toUpperCase())}
                </option>
              ))}
            </select>
            <button
              onClick={() => selectedVersionId && loadData(selectedVersionId)}
              className="ui-btn ui-btn-default ui-btn-sm"
            >
              刷新
            </button>
          </div>
        </div>

        {error && (
          <div className="ui-alert-error">
            {error}
          </div>
        )}

        <div className="flex items-center space-x-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('files')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'files' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            文件列表
          </button>
          <button
            onClick={() => setActiveTab('seals')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'seals' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            签章记录
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">加载中...</div>
        ) : activeTab === 'files' ? (
          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search size={14} className="absolute left-2 top-2.5 text-slate-400" />
                  <input
                    value={fileKeyword}
                    onChange={(e) => setFileKeyword(e.target.value)}
                    placeholder="搜索文件名/创建人"
                    className="ui-input w-[220px] pl-7"
                  />
                </div>
                <select
                  value={fileTypeFilter}
                  onChange={(e) => setFileTypeFilter(e.target.value as any)}
                  className="ui-select h-8 w-32"
                >
                  <option value="ALL">全部类型</option>
                  <option value="EXPORT_XLSX">Excel导出</option>
                  <option value="EXPORT_PDF">PDF导出</option>
                  <option value="SEALED_PDF">已盖章PDF</option>
                </select>
                <select
                  value={fileSortBy}
                  onChange={(e) => setFileSortBy(e.target.value as any)}
                  className="ui-select h-8 w-24"
                >
                  <option value="time">按时间</option>
                  <option value="size">按大小</option>
                </select>
                <button
                  onClick={() => setFileSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                  className="ui-btn ui-btn-default ui-btn-sm"
                >
                  {fileSortDir === 'desc' ? '降序' : '升序'}
                </button>
              </div>
              <div className="text-xs text-slate-500">共 {filteredFiles.length} 条</div>
            </div>

            <div className="ui-table-container">
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
                  {filteredFiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        暂无文件
                      </td>
                    </tr>
                  ) : (
                    filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-50">
                        <td>
                          <div className="font-medium text-slate-900 truncate max-w-[260px]" title={file.fileName}>
                            {file.fileName}
                          </div>
                          <div className="text-xs text-slate-400">{new Date(file.createdAt).toLocaleString()}</div>
                        </td>
                        <td>{fileTypeBadge(file.fileType)}</td>
                        <td className="text-slate-500 text-xs">{formatSize(file.fileSize)}</td>
                        <td className="text-slate-500 text-xs">{file.createdBy || '-'}</td>
                        <td className="text-right space-x-2">
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3 text-xs text-emerald-700 flex items-center justify-between">
              <div className="flex items-center">
                <ShieldCheck size={14} className="mr-2" />
                共 {sealSummary.total} 条签章记录
              </div>
              <div>最近盖章：{sealSummary.lastSealedAt ? new Date(sealSummary.lastSealedAt).toLocaleString() : '-'}</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search size={14} className="absolute left-2 top-2.5 text-slate-400" />
                  <input
                    value={sealKeyword}
                    onChange={(e) => setSealKeyword(e.target.value)}
                    placeholder="搜索文件名/盖章人/哈希"
                    className="ui-input w-[240px] pl-7"
                  />
                </div>
                <select
                  value={sealTypeFilter}
                  onChange={(e) => setSealTypeFilter(e.target.value as any)}
                  className="ui-select h-8 w-32"
                >
                  <option value="ALL">全部类型</option>
                  <option value="SEALED_PDF">已盖章PDF</option>
                  <option value="EXPORT_PDF">PDF导出</option>
                </select>
                <select
                  value={sealSortBy}
                  onChange={(e) => setSealSortBy(e.target.value as any)}
                  className="ui-select h-8 w-24"
                >
                  <option value="time">按时间</option>
                  <option value="size">按大小</option>
                </select>
                <button
                  onClick={() => setSealSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                  className="ui-btn ui-btn-default ui-btn-sm"
                >
                  {sealSortDir === 'desc' ? '降序' : '升序'}
                </button>
              </div>
              <div className="text-xs text-slate-500">共 {filteredSeals.length} 条</div>
            </div>

            <div className="ui-table-container">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>文件</th>
                    <th>盖章人</th>
                    <th>盖章时间</th>
                    <th>类型</th>
                    <th className="text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSeals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        暂无签章记录
                      </td>
                    </tr>
                  ) : (
                    filteredSeals.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50">
                        <td>
                          <div className="font-medium text-slate-900 truncate max-w-[260px]" title={record.fileName}>
                            {record.fileName || '已盖章文件'}
                          </div>
                          <div className="text-xs text-slate-400">{record.fileHash?.slice(0, 12)}...</div>
                        </td>
                        <td className="text-slate-600 text-sm">{record.sealedBy || '-'}</td>
                        <td className="text-slate-500 text-xs">{new Date(record.sealedAt).toLocaleString()}</td>
                        <td>{fileTypeBadge(record.fileType || 'SEALED_PDF')}</td>
                        <td className="text-right space-x-2">
                          <button
                            onClick={() => setSelectedSeal(record)}
                            className="ui-btn ui-btn-sm ui-btn-default"
                          >
                            <FileText size={12} className="mr-1" />
                            详情
                          </button>
                          <button
                            onClick={() => handlePreview(record.pdfFileId, record.fileName, record.fileType)}
                            className="ui-btn ui-btn-sm ui-btn-default"
                          >
                            <Eye size={12} className="mr-1" />
                            预览
                          </button>
                          <button
                            onClick={() => handleDownload(record.pdfFileId)}
                            className="ui-btn ui-btn-sm ui-btn-primary"
                          >
                            <Download size={12} className="mr-1" />
                            下载
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

      {selectedSeal && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setSelectedSeal(null)} />
          <div className="w-[420px] bg-white h-full shadow-xl border-l border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200">
              <div className="text-sm font-semibold text-slate-900">签章记录详情</div>
              <div className="text-xs text-slate-500 mt-1">记录ID: {selectedSeal.id}</div>
            </div>
            <div className="p-5 text-sm space-y-4">
              <div>
                <div className="text-xs text-slate-500">文件</div>
                <div className="text-sm text-slate-900 mt-1">{selectedSeal.fileName || '-'}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500">盖章人</div>
                  <div className="text-sm text-slate-900 mt-1">{selectedSeal.sealedBy || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">盖章时间</div>
                  <div className="text-sm text-slate-900 mt-1">{new Date(selectedSeal.sealedAt).toLocaleString()}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">文件哈希</div>
                <div className="text-xs text-slate-700 mt-1 break-all">{selectedSeal.fileHash || '-'}</div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePreview(selectedSeal.pdfFileId, selectedSeal.fileName, selectedSeal.fileType)}
                  className="ui-btn ui-btn-default ui-btn-sm"
                >
                  预览文件
                </button>
                <button
                  onClick={() => handleDownload(selectedSeal.pdfFileId)}
                  className="ui-btn ui-btn-primary ui-btn-sm"
                >
                  下载文件
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default FileCenter;
