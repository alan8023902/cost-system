import React, { useEffect, useRef, useState } from 'react';
import { X, Download, MapPin, Maximize2, Minimize2 } from 'lucide-react';

interface FilePreviewModalProps {
  open: boolean;
  fileName: string;
  fileType: string;
  previewUrl: string;
  onClose: () => void;
  onDownload: () => void;
  sealPosition?: { x: number; y: number };
  onSaveSealPosition?: (position: { x: number; y: number }) => Promise<void> | void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  open,
  fileName,
  fileType,
  previewUrl,
  onClose,
  onDownload,
  sealPosition,
  onSaveSealPosition,
}) => {
  if (!open) return null;

  const isPdf = fileName.toLowerCase().endsWith('.pdf') || fileType === 'EXPORT_PDF' || fileType === 'SEALED_PDF';
  const defaultSealGuide = isPdf && (fileType === 'SEALED_PDF' || fileType === 'EXPORT_PDF');
  const [showSealGuide, setShowSealGuide] = useState(defaultSealGuide);
  const [expanded, setExpanded] = useState(false);
  const [draggingWindow, setDraggingWindow] = useState(false);
  const [windowPos, setWindowPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sealRatio, setSealRatio] = useState<{ x: number; y: number }>(sealPosition || { x: 0.64, y: 0.095 });
  const [sealPixel, setSealPixel] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [sealChanged, setSealChanged] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setShowSealGuide(defaultSealGuide);
  }, [defaultSealGuide]);

  useEffect(() => {
    if (!open) return;
    setExpanded(false);
    setWindowPos({ x: 0, y: 0 });
  }, [open]);

  useEffect(() => {
    if (sealPosition) {
      setSealRatio(sealPosition);
      setSealChanged(false);
    }
  }, [sealPosition]);

  useEffect(() => {
    if (!isPdf) return;
    const syncSealPixel = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const nextX = rect.width * sealRatio.x;
      const nextY = rect.height * (1 - sealRatio.y);
      setSealPixel({ x: nextX, y: nextY });
    };
    syncSealPixel();
    window.addEventListener('resize', syncSealPixel);
    return () => window.removeEventListener('resize', syncSealPixel);
  }, [isPdf, sealRatio]);

  const handleSealPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPdf || !onSaveSealPosition) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nextX = Math.min(Math.max(0, event.clientX - rect.left), rect.width);
    const nextY = Math.min(Math.max(0, event.clientY - rect.top), rect.height);
    setSealPixel({ x: nextX, y: nextY });
    const nextRatioX = rect.width === 0 ? 0 : nextX / rect.width;
    const nextRatioY = rect.height === 0 ? 0 : 1 - nextY / rect.height;
    setSealRatio({ x: Number(nextRatioX.toFixed(4)), y: Number(nextRatioY.toFixed(4)) });
    setSealChanged(true);
  };

  const enableSealAdjust = Boolean(isPdf && onSaveSealPosition && showSealGuide);

  const handlePointerUp = () => {
    if (!dragging) return;
    setDragging(false);
  };

  const handleSaveSealPosition = async () => {
    if (!onSaveSealPosition) return;
    setSaving(true);
    try {
      await onSaveSealPosition(sealRatio);
      setSealChanged(false);
    } finally {
      setSaving(false);
    }
  };

  const handleWindowMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (expanded) return;
    setDraggingWindow(true);
    dragStartRef.current = {
      x: event.clientX - windowPos.x,
      y: event.clientY - windowPos.y,
    };
  };

  const handleWindowMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingWindow) return;
    setWindowPos({
      x: event.clientX - dragStartRef.current.x,
      y: event.clientY - dragStartRef.current.y,
    });
  };

  const handleWindowMouseUp = () => {
    if (!draggingWindow) return;
    setDraggingWindow(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`relative bg-white rounded-lg shadow-xl border border-slate-200 flex flex-col ${expanded ? 'w-[96vw] h-[92vh]' : 'w-[920px] h-[680px]'} max-w-[1200px]`}
        style={expanded ? undefined : { transform: `translate(${windowPos.x}px, ${windowPos.y}px)` }}
        onMouseMove={handleWindowMouseMove}
        onMouseUp={handleWindowMouseUp}
        onMouseLeave={handleWindowMouseUp}
      >
        <div
          className={`px-4 py-3 border-b border-slate-200 flex items-center justify-between ${expanded ? '' : 'cursor-move'}`}
          onMouseDown={handleWindowMouseDown}
        >
          <div className="text-sm font-semibold text-slate-900 truncate">{fileName}</div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setExpanded((prev) => !prev)}
              className="ui-btn ui-btn-sm ui-btn-default"
            >
              {expanded ? <Minimize2 size={12} className="mr-1" /> : <Maximize2 size={12} className="mr-1" />}
              {expanded ? '还原窗口' : '放大窗口'}
            </button>
            {isPdf && (
              <button
                onClick={() => setShowSealGuide((prev) => !prev)}
                className="ui-btn ui-btn-sm ui-btn-default"
              >
                <MapPin size={12} className="mr-1" />
                {showSealGuide ? '隐藏盖章位置' : '显示盖章位置'}
              </button>
            )}
            {isPdf && onSaveSealPosition && (
              <button
                onClick={handleSaveSealPosition}
                disabled={!sealChanged || saving}
                className="ui-btn ui-btn-sm ui-btn-primary disabled:opacity-50"
              >
                <MapPin size={12} className="mr-1" />
                {saving ? '保存中...' : '保存盖章位置'}
              </button>
            )}
            <button
              onClick={onDownload}
              className="ui-btn ui-btn-sm ui-btn-primary"
            >
              <Download size={12} className="mr-1" />
              下载
            </button>
            <button onClick={onClose} className="ui-btn-icon">
              <X size={16} />
            </button>
          </div>
        </div>
        <div
          ref={containerRef}
          onPointerMove={enableSealAdjust ? handlePointerMove : undefined}
          onPointerUp={enableSealAdjust ? handlePointerUp : undefined}
          onPointerLeave={enableSealAdjust ? handlePointerUp : undefined}
          className="flex-1 bg-slate-50 relative"
        >
          {isPdf ? (
            <>
              <iframe title="file-preview" src={previewUrl} className="w-full h-full" />
              {showSealGuide && (
                <div className="absolute inset-0 pointer-events-none">
                  <div
                    onPointerDown={handleSealPointerDown}
                    className={`absolute w-8 h-8 rounded-full border-2 border-red-400 bg-red-50/70 flex items-center justify-center ${onSaveSealPosition ? 'cursor-move pointer-events-auto' : 'cursor-default'}`}
                    style={{ left: sealPixel.x, top: sealPixel.y, transform: 'translate(-50%, -50%)' }}
                  >
                    <MapPin size={14} className="text-red-500" />
                  </div>
                  <div
                    className="absolute text-[11px] text-red-500 bg-white/80 border border-red-100 px-2 py-1 rounded"
                    style={{ left: sealPixel.x + 16, top: sealPixel.y + 16 }}
                  >
                    盖章位置（x: {sealRatio.x}, y: {sealRatio.y}）
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-slate-500">
              当前格式不支持在线预览，请下载查看。
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
