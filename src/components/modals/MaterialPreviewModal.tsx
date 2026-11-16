import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  FileText,
  FileCode,
  Image as ImageIcon,
  Archive,
  FileSpreadsheet,
  File,
  Loader2,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import ClassMaterialService from '../../services/classMaterial.service';
import { formatBytes } from './UploadSlotMaterialModal';
export { formatBytes };

export interface MaterialItem {
  id: string;
  title?: string;
  description?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number | string;
  created_at?: string;
  url?: string;
  preview_url?: string;
  download_url?: string;
  uploaded_by_name?: string;
}

export interface MaterialPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: MaterialItem | null;
}

export default function MaterialPreviewModal({
  isOpen,
  onClose,
  material,
}: MaterialPreviewModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [textContent, setTextContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUrls() {
      if (!isOpen || !material) return;

      setLoading(true);
      setError(null);
      setTextContent(null);

      try {
        let pUrl = material.preview_url || '';
        let dUrl = material.download_url || material.url || '';

        // If presigned URLs not directly in material object, fetch from backend
        if (!pUrl && !dUrl && material.id) {
          const res = await ClassMaterialService.downloadMaterial(material.id);
          const data = res.data || res;
          pUrl = data.preview_url || data.url || data.download_url || '';
          dUrl = data.download_url || data.url || '';
        }

        if (isMounted) {
          setPreviewUrl(pUrl || dUrl);
          setDownloadUrl(dUrl || pUrl);

          // If text or code file, fetch the content to render directly
          const fileName = material.file_name?.toLowerCase() || '';
          const isText =
            material.file_type?.startsWith('text/') ||
            /\.(txt|md|csv|json|js|ts|jsx|tsx|py|java|c|cpp|h|html|css|xml|yaml|yml|log)$/i.test(
              fileName
            );

          if (isText && (pUrl || dUrl)) {
            try {
              const fetchRes = await fetch(pUrl || dUrl);
              if (fetchRes.ok) {
                const text = await fetchRes.text();
                if (isMounted) setTextContent(text);
              }
            } catch (textErr) {
              console.warn('Failed to fetch text content preview:', textErr);
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching material preview URL:', err);
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              'Không thể tải đường dẫn xem trước tài liệu. Vui lòng thử lại.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUrls();

    return () => {
      isMounted = false;
    };
  }, [isOpen, material]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !material) return null;

  const fileName = material.file_name?.toLowerCase() || '';
  const fileType = material.file_type?.toLowerCase() || '';

  const isPdf = fileType.includes('pdf') || fileName.endsWith('.pdf');
  const isImage =
    fileType.startsWith('image/') ||
    /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(fileName);
  const isText =
    fileType.startsWith('text/') ||
    /\.(txt|md|csv|json|js|ts|jsx|tsx|py|java|c|cpp|h|html|css|xml|yaml|yml|log)$/i.test(
      fileName
    );
  const isArchive = /\.(zip|rar|7z|tar|gz)$/i.test(fileName);
  const isWord = /\.(doc|docx)$/i.test(fileName);
  const isPpt = /\.(ppt|pptx)$/i.test(fileName);
  const isExcel = /\.(xls|xlsx)$/i.test(fileName);

  const getFileBadge = () => {
    if (isPdf)
      return {
        icon: <FileText size={20} className="text-rose-500" />,
        bg: 'bg-rose-50',
        text: 'PDF Document',
      };
    if (isImage)
      return {
        icon: <ImageIcon size={20} className="text-purple-500" />,
        bg: 'bg-purple-50',
        text: 'Hình ảnh',
      };
    if (isText)
      return {
        icon: <FileCode size={20} className="text-emerald-500" />,
        bg: 'bg-emerald-50',
        text: 'Văn bản / Code',
      };
    if (isWord)
      return {
        icon: <FileText size={20} className="text-blue-500" />,
        bg: 'bg-blue-50',
        text: 'Word Document',
      };
    if (isPpt)
      return {
        icon: <FileSpreadsheet size={20} className="text-orange-500" />,
        bg: 'bg-orange-50',
        text: 'PowerPoint Presentation',
      };
    if (isExcel)
      return {
        icon: <FileSpreadsheet size={20} className="text-teal-500" />,
        bg: 'bg-teal-50',
        text: 'Excel Spreadsheet',
      };
    if (isArchive)
      return {
        icon: <Archive size={20} className="text-amber-500" />,
        bg: 'bg-amber-50',
        text: 'Tập tin nén',
      };
    return {
      icon: <File size={20} className="text-slate-500" />,
      bg: 'bg-slate-50',
      text: 'Tài liệu học tập',
    };
  };

  const badge = getFileBadge();

  const handleDownload = () => {
    const targetUrl = downloadUrl || previewUrl;
    if (!targetUrl) return;

    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = material.file_name || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden border border-slate-200 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3.5 min-w-0 pr-4">
            <div
              className={`w-11 h-11 rounded-2xl ${badge.bg} flex items-center justify-center shrink-0 border border-slate-200/60 shadow-2xs`}
            >
              {badge.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  className="text-sm sm:text-base font-bold text-slate-800 leading-snug truncate"
                  title={material.title || material.file_name}
                >
                  {material.title || material.file_name}
                </h2>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0">
                  {badge.text}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 truncate">
                <span className="truncate">{material.file_name}</span>
                <span>•</span>
                <span className="shrink-0">{formatBytes(material.file_size)}</span>
                {material.created_at && (
                  <>
                    <span>•</span>
                    <span className="shrink-0">
                      {new Date(material.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading || !downloadUrl}
              className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-2 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Tải tài liệu về máy"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Tải xuống</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              title="Đóng (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 min-h-0 bg-slate-50/50 flex flex-col relative overflow-hidden">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="text-xs font-medium text-slate-500">
                Đang chuẩn bị trình xem trực tiếp...
              </p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-500 flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Không thể tải xem trước
              </h3>
              <p className="text-xs text-slate-500">{error}</p>
              {downloadUrl && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-2 transition"
                >
                  <Download size={14} /> Tải tài liệu về máy
                </button>
              )}
            </div>
          ) : isPdf ? (
            <iframe
              src={previewUrl}
              className="w-full h-full border-0 bg-white"
              title={material.title || material.file_name}
            />
          ) : isImage ? (
            <div className="w-full h-full flex items-center justify-center p-6 overflow-auto bg-slate-900/5">
              <img
                src={previewUrl}
                alt={material.title || material.file_name}
                className="max-h-full max-w-full object-contain rounded-xl shadow-lg border border-slate-200/60 bg-white"
              />
            </div>
          ) : isText && textContent !== null ? (
            <div className="w-full h-full p-6 overflow-auto bg-white">
              <pre className="font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-text">
                <code>{textContent}</code>
              </pre>
            </div>
          ) : (
            /* Fallback Card for Office / Archives / Unsupported Preview Types */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto space-y-4">
              <div
                className={`w-20 h-20 rounded-3xl ${badge.bg} border border-slate-200/80 flex items-center justify-center shadow-md shadow-slate-100`}
              >
                {React.cloneElement(badge.icon, { size: 40 })}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  {material.title || material.file_name}
                </h3>
                <p className="text-xs text-slate-400">
                  {material.file_name} • {formatBytes(material.file_size)}
                </p>
                {material.description && (
                  <p className="text-xs text-slate-600 mt-2 bg-white border border-slate-200 p-3 rounded-xl max-w-md mx-auto text-left whitespace-pre-line">
                    {material.description}
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-xs text-amber-800 max-w-md">
                Tài liệu định dạng <strong>{badge.text}</strong> không hỗ trợ xem trực tiếp trong trình duyệt. Vui lòng tải xuống để mở trên máy tính của bạn.
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-2.5 transition shadow-lg shadow-orange-500/20 cursor-pointer"
              >
                <Download size={18} />
                <span>Tải xuống tài liệu ({formatBytes(material.file_size)})</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info note */}
        {material.description && (isPdf || isImage || isText) && (
          <div className="px-6 py-2.5 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span className="truncate italic">
              Ghi chú: {material.description}
            </span>
            <button
              type="button"
              onClick={() => window.open(previewUrl || downloadUrl, '_blank')}
              className="text-[11px] text-orange-600 hover:underline flex items-center gap-1 font-medium shrink-0 ml-4 cursor-pointer"
            >
              <span>Mở tab mới</span>
              <ExternalLink size={12} />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
