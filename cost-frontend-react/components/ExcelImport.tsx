import React, { useState, useRef } from 'react';
import { importExportApi } from '../services/apiService';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useToast } from './ToastProvider';


interface ExcelImportProps {
  versionId: number;
  onSuccess: () => void;
  onClose: () => void;
}

export const ExcelImport: React.FC<ExcelImportProps> = ({ versionId, onSuccess, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    successCount?: number;
    errorCount?: number;
    errors?: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setResult(null);
      } else {
        toast.warning('请选择Excel文件（.xlsx或.xls格式）');
      }

    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const response = await importExportApi.importExcel(versionId, file);
      const rawErrors = response?.errors || [];
      const errorMessages = rawErrors.map((item: any) => {
        if (typeof item === 'string') {
          return item;
        }
        if (item?.row !== undefined) {
          return `第${item.row}行：${item.message || '数据错误'}`;
        }
        return item?.message || '数据错误';
      });
      setResult({
        success: true,
        message: '导入成功！',
        successCount: response.successCount || 0,
        errorCount: response.errorCount || 0,
        errors: errorMessages,
      });

      
      if (response.errorCount === 0) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || '导入失败，请检查文件格式',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
      setResult(null);
    } else {
      toast.warning('请选择Excel文件（.xlsx或.xls格式）');
    }

  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Excel导入</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">导入说明</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• 支持格式: .xlsx, .xls</li>
              <li>• 需使用客户模板（包含固定Sheet名称与标题行，不能改名）</li>

              <li>• Sheet示例: 物资表-设备/装材/土建、基础分包测算成本对比、组塔分包测算成本对比、架线分包测算成本对比</li>
              <li>• 其他费用: 2.机械使用费用暂列、3.跨越架费用明细、4.其他费用明细表、5.其他框架费用明细、6.跨越咨询费、工程检测费、拆除费</li>
              <li>• 约束: 单位字段长度 ≤ 32 字符，备注 ≤ 512 字符</li>
              <li>
                • 示例文件: 
                <button
                  onClick={() => toast.info('模板暂未开放下载，请联系管理员获取')}

                  className="underline text-blue-700"
                >
                  下载模板
                </button>
              </li>
              <li>• 注意: 数量、单价、税率必须为数字，税率以百分比表示（如9代表9%）</li>

            </ul>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              file
                ? 'border-green-300 bg-green-50'
                : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            {!file ? (
              <div>
                <Upload size={48} className="mx-auto text-slate-400 mb-4" />
                <p className="text-sm text-slate-600 mb-2">
                  拖拽Excel文件到此处，或点击选择文件
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  选择文件
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div>
                <FileSpreadsheet size={48} className="mx-auto text-green-500 mb-4" />
                <p className="text-sm font-medium text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <button
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                  }}
                  className="mt-3 text-sm text-red-600 hover:text-red-700"
                >
                  重新选择
                </button>
              </div>
            )}
          </div>

          {/* Result */}
          {result && (
            <div
              className={`rounded-lg p-4 ${
                result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                {result.success ? (
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    result.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {result.message}
                  </p>
                  {result.successCount !== undefined && (
                    <p className="text-xs text-green-700 mt-1">
                      成功: {result.successCount} 行 | 失败: {result.errorCount} 行
                    </p>
                  )}
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto">
                      <p className="text-xs font-medium text-red-900 mb-1">错误详情:</p>
                      <ul className="text-xs text-red-700 space-y-0.5">
                        {result.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? '上传中...' : '开始导入'}
          </button>
        </div>
      </div>
    </div>
  );
};
