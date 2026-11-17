import React, { useState, useEffect, useRef } from 'react';
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
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from 'lucide-react';
// @ts-ignore
import * as mammothModule from 'mammoth';
const mammoth = (mammothModule as any).default || mammothModule;
import * as XLSX from 'xlsx';
import ClassMaterialService from '../../services/classMaterial.service';
import AssignmentService from '../../services/assignment.service';
import { getActiveSchoolId } from '../../services/tenantSession';

/**
 * Định dạng dung lượng tệp tin (B, KB, MB, GB)
 */
export const formatBytes = (bytes?: number | string): string => {
  if (!bytes) return '0 B';
  const num = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
  if (isNaN(num) || num === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return `${parseFloat((num / Math.pow(k, i)).toFixed(1))} ${sizes[i] || 'B'}`;
};

export interface MaterialItem {
  id?: string;
  assignmentId?: string;
  assignment_id?: string;
  title?: string;
  description?: string;
  file_name?: string;
  fileName?: string;
  file_type?: string;
  file_size?: number | string;
  fileSize?: number | string;
  created_at?: string;
  createdAt?: string;
  url?: string;
  fileUrl?: string;
  file_url?: string;
  preview_url?: string;
  download_url?: string;
  uploaded_by_name?: string;
}

export interface MaterialPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: MaterialItem | null;
}

/**
 * Tách phần mở rộng trực tiếp từ file_name hoặc file_url (loại bỏ query params)
 */
export const getFileExtension = (fileName?: string, fileUrl?: string): string => {
  const target = (fileName || fileUrl || '').split('?')[0].trim().toLowerCase();
  const parts = target.split('.');
  return parts.length > 1 ? parts.pop() || '' : '';
};

/**
 * Kiểm tra xem URL có phải presigned S3/SeaweedFS/R2 hoặc URL bên ngoài hay không.
 * Nếu là presigned/external URL, KHÔNG gửi Authorization header để tránh lỗi 400 Bad Request
 * (AWS S3 / SeaweedFS: "Only one auth mechanism allowed; only the X-Amz-Algorithm query parameter,
 *  Signature query string or the Authorization header should be recommended").
 */
export const isExternalOrSignedUrl = (url: string): boolean => {
  if (!url) return false;
  const lower = url.toLowerCase();
  const isApiInternal =
    (url.startsWith('/') && !url.startsWith('//')) ||
    (Boolean(import.meta.env.VITE_API_URL) && url.startsWith(import.meta.env.VITE_API_URL));

  const hasSignature =
    lower.includes('x-amz-') ||
    lower.includes('signature=') ||
    lower.includes('awssignature') ||
    lower.includes('amazonaws.com') ||
    lower.includes('r2.cloudflarestorage.com') ||
    lower.includes(':8333') || // SeaweedFS S3
    lower.includes(':9000'); // MinIO S3

  return !isApiInternal || hasSignature;
};

// -------------------------------------------------------------
// Magic Bytes Helper Functions (Kiểm tra chữ ký nhị phân)
// -------------------------------------------------------------

/** Kiểm tra xem buffer có phải định dạng ZIP archive (Office OpenXML: .xlsx, .docx, .docm) không */
const isZipArchive = (buffer: ArrayBuffer): boolean => {
  if (!buffer || buffer.byteLength < 4) return false;
  const bytes = new Uint8Array(buffer, 0, 4);
  return bytes[0] === 0x50 && bytes[1] === 0x4b; // 'PK'
};

/** Kiểm tra xem buffer có phải định dạng OLE2 Compound Document (Legacy Excel: .xls) không */
const isOle2Compound = (buffer: ArrayBuffer): boolean => {
  if (!buffer || buffer.byteLength < 8) return false;
  const bytes = new Uint8Array(buffer, 0, 8);
  return (
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0 &&
    bytes[4] === 0xa1 &&
    bytes[5] === 0xb1 &&
    bytes[6] === 0x1a &&
    bytes[7] === 0xe1
  );
};

/** Kiểm tra xem buffer có phải văn bản hoặc HTML lỗi không (bắt đầu bằng <, {, <!DOCTYPE) */
const isHtmlOrJsonText = (buffer: ArrayBuffer): boolean => {
  if (!buffer || buffer.byteLength === 0) return false;
  const len = Math.min(buffer.byteLength, 128);
  const text = new TextDecoder('utf-8', { fatal: false })
    .decode(new Uint8Array(buffer, 0, len))
    .trim()
    .toLowerCase();
  return (
    text.startsWith('<!doctype') ||
    text.startsWith('<html') ||
    text.startsWith('<xml') ||
    text.startsWith('<?xml') ||
    text.startsWith('{"') ||
    text.startsWith('{ "')
  );
};

export default function MaterialPreviewModal({
  isOpen,
  onClose,
  material,
}: MaterialPreviewModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [excelWorkbook, setExcelWorkbook] = useState<any | null>(null);
  const [excelSheetNames, setExcelSheetNames] = useState<string[]>([]);
  const [activeSheetName, setActiveSheetName] = useState<string>('');
  const [excelHtml, setExcelHtml] = useState<string>('');
  const [textContent, setTextContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);

  const activeBlobUrlRef = useRef<string | null>(null);

  // Zoom control handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoom(100);

  useEffect(() => {
    let isMounted = true;

    async function loadUrls() {
      if (!isOpen || !material) return;

      setLoading(true);
      setError(null);
      setTextContent(null);
      setDocxHtml(null);
      setExcelWorkbook(null);
      setExcelSheetNames([]);
      setActiveSheetName('');
      setExcelHtml('');
      setZoom(100);

      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
      setBlobUrl('');

      try {
        let pUrl = material.preview_url || '';
        let dUrl =
          material.download_url ||
          material.url ||
          material.fileUrl ||
          material.file_url ||
          '';

        // Nếu chưa có presigned URLs trực tiếp trong material object, gọi API backend lấy về
        if (!pUrl && !dUrl && material.id) {
          const asgId = material.assignmentId || material.assignment_id;
          if (asgId) {
            const res = await AssignmentService.getMaterialDownloadUrl(asgId, material.id);
            const data = res?.data || res;
            pUrl = data.preview_url || data.url || data.download_url || '';
            dUrl = data.download_url || data.url || '';
          } else {
            const res = await ClassMaterialService.downloadMaterial(material.id);
            const data = res?.data || res;
            pUrl = data.preview_url || data.url || data.download_url || '';
            dUrl = data.download_url || data.url || '';
          }
        }

        if (isMounted) {
          setPreviewUrl(pUrl || dUrl);
          setDownloadUrl(dUrl || pUrl);
        }

        const rawFileName = material.file_name || material.fileName || material.title || '';
        const ext = getFileExtension(rawFileName, pUrl || dUrl);

        const isPdf = ext === 'pdf';
        const isWord = ext === 'docx' || ext === 'docm' || ext === 'doc';
        const isExcel = ['xlsx', 'xls', 'xlsm', 'csv'].includes(ext);
        const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext);
        const isText = [
          'txt', 'md', 'json', 'java', 'ts', 'tsx', 'js', 'jsx',
          'py', 'sql', 'html', 'css', 'xml', 'yaml', 'yml', 'log', 'sh', 'bat'
        ].includes(ext);

        const targetFetchUrl = pUrl || dUrl;

        // Chỉ tải dữ liệu blob đối với các định dạng hỗ trợ xem inline trực tiếp
        if (targetFetchUrl && (isPdf || isWord || isExcel || isImage || isText)) {
          let attempt = 0;
          const maxRetries = 2;
          let fetchSuccess = false;
          let currentUrl = targetFetchUrl;

          while (attempt <= maxRetries && !fetchSuccess) {
            try {
              // Đọc token mới nhất từ localStorage ngay tại thời điểm thực thi
              const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
              const fetchHeaders: Record<string, string> = {};
              const isSigned = isExternalOrSignedUrl(currentUrl);

              if (token && !isSigned) {
                fetchHeaders['Authorization'] = `Bearer ${token}`;
                const activeSchoolId =
                  getActiveSchoolId() ||
                  localStorage.getItem('school_id') ||
                  localStorage.getItem('activeSchoolId');
                if (activeSchoolId) {
                  fetchHeaders['X-School-Id'] = activeSchoolId;
                }
              }

              // Cache-buster nếu retry
              let reqUrl = currentUrl;
              if (attempt > 0) {
                const sep = reqUrl.includes('?') ? '&' : '?';
                reqUrl = `${reqUrl}${sep}_t=${Date.now()}`;
              }

              let response = await fetch(reqUrl, {
                headers: fetchHeaders,
                credentials: isSigned ? 'omit' : 'include',
              });

              if (!response.ok) {
                let errMsg = `Tải tệp tin thất bại (${response.status} ${response.statusText})`;
                try {
                  const errJson = await response.json();
                  if (errJson?.message) errMsg = errJson.message;
                } catch {}
                throw new Error(errMsg);
              }

              // 1. Nếu Backend trả về JSON chứa presigned URL
              const contentType = (response.headers.get('content-type') || '').toLowerCase();
              if (contentType.includes('application/json')) {
                const jsonResp = await response.json();
                const actualUrl =
                  jsonResp?.data?.preview_url ||
                  jsonResp?.preview_url ||
                  jsonResp?.data?.url ||
                  jsonResp?.url ||
                  jsonResp?.data?.download_url ||
                  jsonResp?.download_url;

                if (!actualUrl) {
                  throw new Error(jsonResp?.message || 'Không tìm thấy đường dẫn tệp trong phản hồi từ máy chủ.');
                }

                currentUrl = actualUrl;
                if (isMounted) {
                  setPreviewUrl(actualUrl);
                  const actualDownloadUrl =
                    jsonResp?.data?.download_url || jsonResp?.download_url || actualUrl;
                  setDownloadUrl(actualDownloadUrl);
                }

                // Gọi fetch URL Presigned nhị phân thực tế (hoàn toàn KHÔNG gửi kèm Authorization header)
                response = await fetch(actualUrl, { credentials: 'omit' });
                if (!response.ok) {
                  let errMsg = `Tải tệp tin nhị phân thất bại (${response.status} ${response.statusText})`;
                  try {
                    const errJson = await response.json();
                    if (errJson?.message) errMsg = errJson.message;
                  } catch {}
                  throw new Error(errMsg);
                }
              }

              // 2. Chặn response text/html (Vite SPA index.html fallback hoặc HTML error page)
              const finalContentType = (response.headers.get('content-type') || '').toLowerCase();
              if (finalContentType.includes('text/html') && !isText) {
                throw new Error('Máy chủ trả về phản hồi HTML thay vì dữ liệu tệp tin.');
              }

              const blob = await response.blob();
              const arrayBuffer = await blob.arrayBuffer();

              if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                throw new Error('Tệp tin rỗng hoặc không có dữ liệu.');
              }

              // 3. Kiểm tra Magic Bytes & Chặn HTML/Text giả lập nhị phân
              if (['xlsx', 'docx', 'docm'].includes(ext)) {
                if (isHtmlOrJsonText(arrayBuffer)) {
                  throw new Error('Dữ liệu nhận về là văn bản/HTML thay vì tệp nhị phân OpenXML.');
                }
                if (!isZipArchive(arrayBuffer)) {
                  throw new Error('Chữ ký tệp (Magic Bytes) không hợp lệ cho định dạng OpenXML.');
                }
              } else if (ext === 'xls') {
                if (isHtmlOrJsonText(arrayBuffer)) {
                  throw new Error('Dữ liệu nhận về là văn bản/HTML thay vì tệp nhị phân Excel.');
                }
                if (!isOle2Compound(arrayBuffer) && !isZipArchive(arrayBuffer)) {
                  throw new Error('Chữ ký tệp (Magic Bytes) không hợp lệ cho định dạng Excel.');
                }
              }

              // 4. Render nội dung dựa trên định dạng
              if (isMounted) {
                if (isPdf) {
                  const pdfBlob = new Blob([blob], { type: 'application/pdf' });
                  const newBlobUrl = URL.createObjectURL(pdfBlob);
                  activeBlobUrlRef.current = newBlobUrl;
                  setBlobUrl(newBlobUrl);
                } else if (isWord) {
                  try {
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    if (isMounted) {
                      setDocxHtml(result.value || '');
                    }
                  } catch (wordErr: any) {
                    console.error('Mammoth docx parse error:', wordErr);
                    throw new Error(wordErr?.message || 'Không thể đọc cấu trúc tệp Word này. Vui lòng tải xuống để mở.');
                  }
                } else if (isExcel) {
                  try {
                    const wb = XLSX.read(arrayBuffer, { type: 'array' });
                    const sheetNames = wb.SheetNames || [];
                    if (isMounted) {
                      setExcelWorkbook(wb);
                      setExcelSheetNames(sheetNames);
                      if (sheetNames.length > 0) {
                        const firstSheet = sheetNames[0];
                        setActiveSheetName(firstSheet);
                        const ws = wb.Sheets[firstSheet];
                        setExcelHtml(ws ? XLSX.utils.sheet_to_html(ws) : '');
                      }
                    }
                  } catch (excelErr: any) {
                    console.error('XLSX parse error:', excelErr);
                    throw new Error(excelErr?.message || 'Không thể đọc cấu trúc tệp bảng tính này. Vui lòng tải xuống để mở.');
                  }
                } else if (isImage) {
                  const imgBlob = new Blob([blob], { type: blob.type || 'image/png' });
                  const newBlobUrl = URL.createObjectURL(imgBlob);
                  activeBlobUrlRef.current = newBlobUrl;
                  setBlobUrl(newBlobUrl);
                } else if (isText) {
                  const text = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
                  if (isMounted) {
                    setTextContent(text);
                  }
                }
              }

              fetchSuccess = true;
            } catch (attemptErr: any) {
              attempt++;
              if (attempt <= maxRetries) {
                console.warn(`Lần tải thứ ${attempt} thất bại, đang tự động thử lại sau 400ms...`, attemptErr);
                await new Promise((r) => setTimeout(r, 400));
              } else {
                console.error('Tất cả lần thử tải xem trước đều thất bại:', attemptErr);
                if (isMounted) {
                  if (isPdf || isImage) {
                    // Fallback dùng trực tiếp URL nếu fetch blob gặp issue
                    setBlobUrl(targetFetchUrl);
                  } else {
                    setError(
                      attemptErr?.message?.includes('could not find <table>')
                        ? 'Dữ liệu nhận về không hợp lệ. Vui lòng tải xuống để mở tệp tin.'
                        : attemptErr?.message || 'Không thể tải nội dung xem trước'
                    );
                  }
                }
              }
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
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
    };
  }, [isOpen, material]);

  // Phím tắt bàn phím: ESC để đóng, +/- để Zoom, 0 để Reset Zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setZoom((prev) => Math.min(prev + 25, 200));
      } else if (e.key === '-') {
        setZoom((prev) => Math.max(prev - 25, 50));
      } else if (e.key === '0') {
        setZoom(100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !material) return null;

  const rawFileName = material.file_name || material.fileName || material.title || '';
  const ext = getFileExtension(rawFileName, previewUrl || downloadUrl);

  const isPdf = ext === 'pdf';
  const isWord = ext === 'docx' || ext === 'docm' || ext === 'doc';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext);
  const isText = [
    'txt', 'md', 'csv', 'json', 'java', 'ts', 'tsx', 'js', 'jsx',
    'py', 'sql', 'html', 'css', 'xml', 'yaml', 'yml', 'log', 'sh', 'bat'
  ].includes(ext);
  const isArchive = ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext);
  const isExcel = ['xls', 'xlsx', 'xlsm'].includes(ext);
  const isPpt = ['ppt', 'pptx'].includes(ext);

  const handleSelectSheet = (sheetName: string) => {
    if (!excelWorkbook || sheetName === activeSheetName) return;
    setActiveSheetName(sheetName);
    const ws = excelWorkbook.Sheets[sheetName];
    setExcelHtml(ws ? XLSX.utils.sheet_to_html(ws) : '');
  };

  const getFileBadge = () => {
    const badgeText = ext ? ext.toUpperCase() : 'TÀI LIỆU';
    if (isPdf) {
      return {
        icon: <FileText size={20} className="text-rose-400" />,
        bg: 'bg-rose-950/60',
        badgeText,
      };
    }
    if (isWord) {
      return {
        icon: <FileText size={20} className="text-blue-400" />,
        bg: 'bg-blue-950/60',
        badgeText,
      };
    }
    if (isExcel) {
      return {
        icon: <FileSpreadsheet size={20} className="text-teal-400" />,
        bg: 'bg-teal-950/60',
        badgeText,
      };
    }
    if (isImage) {
      return {
        icon: <ImageIcon size={20} className="text-purple-400" />,
        bg: 'bg-purple-950/60',
        badgeText,
      };
    }
    if (isText) {
      return {
        icon: <FileCode size={20} className="text-emerald-400" />,
        bg: 'bg-emerald-950/60',
        badgeText,
      };
    }
    if (isPpt) {
      return {
        icon: <FileSpreadsheet size={20} className="text-orange-400" />,
        bg: 'bg-orange-950/60',
        badgeText,
      };
    }
    if (isArchive) {
      return {
        icon: <Archive size={20} className="text-amber-400" />,
        bg: 'bg-amber-950/60',
        badgeText,
      };
    }
    return {
      icon: <File size={20} className="text-slate-400" />,
      bg: 'bg-slate-800',
      badgeText,
    };
  };

  const badge = getFileBadge();

  const handleDownload = () => {
    const targetUrl = downloadUrl || previewUrl;
    if (!targetUrl) return;

    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = material.file_name || material.fileName || material.title || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayTitle = material.title || material.file_name || material.fileName || 'Tài liệu';
  const displayFileName = material.file_name || material.fileName || material.title || '';
  const displayFileSize = material.file_size || material.fileSize;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex flex-col overflow-hidden select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* ------------------------------------------------------------- */}
      {/* GOOGLE DRIVE VIEWER: TOP TOOLBAR                              */}
      {/* ------------------------------------------------------------- */}
      <div
        className="h-14 sm:h-16 shrink-0 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between z-30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bên trái: Thông tin tệp */}
        <div className="flex items-center gap-3 min-w-0 pr-3">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition cursor-pointer mr-0.5"
            title="Đóng (Esc)"
          >
            <X size={20} />
          </button>
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${badge.bg} flex items-center justify-center shrink-0 border border-slate-700/60 shadow-xs`}
          >
            {badge.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2
                className="text-sm sm:text-base font-semibold text-slate-100 leading-snug truncate max-w-xs sm:max-w-md lg:max-w-xl"
                title={displayTitle}
              >
                {displayTitle}
              </h2>
              <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/80 shrink-0 uppercase tracking-wider">
                {badge.badgeText}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 truncate">
              <span className="truncate">{displayFileName}</span>
              {displayFileSize && (
                <>
                  <span>•</span>
                  <span className="shrink-0">{formatBytes(displayFileSize)}</span>
                </>
              )}
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

        {/* Ở giữa: Cụm điều khiển Zoom (- 100% +) */}
        {(isWord || isExcel || isImage || isText) && !loading && !error && (
          <div className="hidden md:flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl px-1.5 py-1 gap-1 shadow-inner">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="w-7 h-7 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/70 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition cursor-pointer"
              title="Thu nhỏ (-)"
            >
              <ZoomOut size={15} />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-0.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700/60 rounded-md transition cursor-pointer min-w-[50px] text-center"
              title="Đặt lại 100% (Phím 0)"
            >
              {zoom}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="w-7 h-7 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/70 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition cursor-pointer"
              title="Phóng to (+)"
            >
              <ZoomIn size={15} />
            </button>
          </div>
        )}

        {/* Bên phải: Nút tải xuống nổi bật & các thao tác */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => window.open(previewUrl || downloadUrl, '_blank')}
            disabled={loading || (!previewUrl && !downloadUrl)}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition cursor-pointer disabled:opacity-40"
            title="Mở trong tab mới"
          >
            <ExternalLink size={17} />
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={loading || !downloadUrl}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition shadow-md shadow-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Tải tài liệu về máy"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Tải xuống</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* GOOGLE DRIVE VIEWER: MAIN CONTENT CANVAS                      */}
      {/* ------------------------------------------------------------- */}
      <div
        className="flex-1 min-h-0 bg-slate-950 flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-9 h-9 text-blue-500 animate-spin" />
            <p className="text-xs font-medium text-slate-400">
              Đang chuẩn bị trình xem trực tiếp {badge.badgeText}...
            </p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-800/80 text-red-400 flex items-center justify-center">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Không thể tải xem trước
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">{error}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  // Trigger reload effect
                  setBlobUrl('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 transition cursor-pointer border border-slate-700"
              >
                <RefreshCw size={14} /> Thử lại
              </button>
              {downloadUrl && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  <Download size={14} /> Tải tài liệu về máy
                </button>
              )}
            </div>
          </div>
        ) : isPdf && (blobUrl || previewUrl) ? (
          /* NHÓM 1: File PDF */
          <iframe
            src={blobUrl || previewUrl}
            className="w-full h-full border-0 bg-slate-900"
            title={displayTitle}
          />
        ) : isWord && docxHtml !== null ? (
          /* NHÓM 2: File Word .docx/.docm (Tờ giấy trắng A4 đổ bóng trên nền tối) */
          <div className="w-full h-full overflow-y-auto p-4 sm:p-10 flex justify-center bg-slate-900 custom-scrollbar">
            <style>{`
              .docx-preview-paper {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              }
              .docx-preview-paper h1 { font-size: 1.75rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.75rem; color: #0f172a; line-height: 1.3; }
              .docx-preview-paper h2 { font-size: 1.35rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; color: #1e293b; line-height: 1.35; }
              .docx-preview-paper h3 { font-size: 1.15rem; font-weight: 600; margin-top: 0.85rem; margin-bottom: 0.4rem; color: #334155; }
              .docx-preview-paper h4, .docx-preview-paper h5, .docx-preview-paper h6 { font-size: 1rem; font-weight: 600; margin-top: 0.75rem; margin-bottom: 0.25rem; color: #475569; }
              .docx-preview-paper p { margin-bottom: 0.75rem; line-height: 1.7; color: #334155; font-size: 0.9375rem; }
              .docx-preview-paper ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 0.75rem; }
              .docx-preview-paper ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 0.75rem; }
              .docx-preview-paper li { margin-bottom: 0.25rem; line-height: 1.6; color: #334155; }
              .docx-preview-paper table { width: 100%; border-collapse: collapse; margin-top: 1rem; margin-bottom: 1rem; font-size: 0.875rem; }
              .docx-preview-paper th, .docx-preview-paper td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
              .docx-preview-paper th { background-color: #f8fafc; font-weight: 600; color: #1e293b; }
              .docx-preview-paper img { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; }
              .docx-preview-paper blockquote { border-left: 4px solid #cbd5e1; padding-left: 1rem; color: #64748b; font-style: italic; margin: 1rem 0; }
              .docx-preview-paper code { background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.85em; color: #0f172a; }
              .docx-preview-paper a { color: #2563eb; text-decoration: underline; }
            `}</style>
            <div
              className="w-full max-w-4xl bg-white p-8 sm:p-16 shadow-2xl rounded-sm sm:rounded-md min-h-[90vh] select-text docx-preview-paper my-auto text-slate-800 border border-slate-200/40"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
            >
              {docxHtml ? (
                <div dangerouslySetInnerHTML={{ __html: docxHtml }} />
              ) : (
                <div className="text-center text-slate-400 italic py-16">
                  Tài liệu không có nội dung văn bản để hiển thị.
                </div>
              )}
            </div>
          </div>
        ) : isExcel && excelWorkbook ? (
          /* NHÓM 3: File Bảng tính Excel (.xlsx, .xls, .xlsm, .csv) với Sheet Tabs ở đáy */
          <div className="w-full h-full flex flex-col bg-slate-900 overflow-hidden">
            {/* Vùng hiển thị bảng tính */}
            <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-slate-900">
              <div
                className="excel-sheet-table min-w-full inline-block bg-white shadow-xl rounded-md overflow-hidden"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top left',
                }}
              >
                <style>{`
                  .excel-sheet-table table {
                    border-collapse: collapse;
                    width: 100%;
                    border: 1px solid #cbd5e1;
                    font-size: 0.8125rem;
                    color: #1e293b;
                    background-color: #ffffff;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                  }
                  .excel-sheet-table tr:first-child td,
                  .excel-sheet-table th {
                    background-color: #f1f5f9;
                    font-weight: 600;
                    color: #0f172a;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    border: 1px solid #cbd5e1;
                  }
                  .excel-sheet-table td,
                  .excel-sheet-table th {
                    border: 1px solid #e2e8f0;
                    padding: 6px 12px;
                    white-space: nowrap;
                    text-align: left;
                  }
                  .excel-sheet-table tr:hover td {
                    background-color: #f8fafc;
                  }
                `}</style>
                {excelHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: excelHtml }} />
                ) : (
                  <div className="text-center text-slate-400 italic py-16">
                    Trang tính này không có dữ liệu để hiển thị.
                  </div>
                )}
              </div>
            </div>

            {/* Google Sheets Bottom Sheet Tabs Bar (Thanh tab trang tính ở đáy) */}
            {excelSheetNames.length > 0 && (
              <div className="h-11 shrink-0 bg-slate-900 border-t border-slate-800 px-4 flex items-center gap-1.5 overflow-x-auto z-20 custom-scrollbar">
                <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1 shrink-0">
                  <FileSpreadsheet size={15} className="text-teal-400" /> Trang tính ({excelSheetNames.length}):
                </span>
                {excelSheetNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelectSheet(name)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition cursor-pointer shrink-0 font-medium flex items-center gap-1.5 ${
                      name === activeSheetName
                        ? 'bg-teal-600 text-white shadow-sm font-semibold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/80'
                    }`}
                  >
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : isImage && (blobUrl || previewUrl) ? (
          /* NHÓM 4: File Hình ảnh */
          <div className="w-full h-full flex items-center justify-center p-6 overflow-auto bg-slate-950">
            <img
              src={blobUrl || previewUrl}
              alt={displayTitle}
              style={{
                transform: `scale(${zoom / 100})`,
                transition: 'transform 0.15s ease-out',
              }}
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-slate-800 bg-black/40"
            />
          </div>
        ) : isText && textContent !== null ? (
          /* NHÓM 5: File Văn bản & Mã nguồn */
          <div className="w-full h-full p-4 sm:p-8 overflow-auto bg-slate-950 custom-scrollbar">
            <pre
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top left',
              }}
              className="font-mono text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed select-text"
            >
              <code>{textContent}</code>
            </pre>
          </div>
        ) : (
          /* NHÓM 6: File Nén, Bản trình chiếu hoặc định dạng không hỗ trợ xem trực tiếp */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto space-y-4">
            <div
              className={`w-20 h-20 rounded-3xl ${badge.bg} border border-slate-700 flex items-center justify-center shadow-lg shadow-black/30`}
            >
              {React.cloneElement(badge.icon, { size: 40 })}
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-100 mb-1">
                {displayTitle}
              </h3>
              <p className="text-xs text-slate-400">
                {displayFileName} {displayFileSize ? `• ${formatBytes(displayFileSize)}` : ''}
              </p>
              {material.description && (
                <p className="text-xs text-slate-300 mt-2 bg-slate-800 border border-slate-700 p-3 rounded-xl max-w-md mx-auto text-left whitespace-pre-line">
                  {material.description}
                </p>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 max-w-md">
              Tài liệu định dạng <strong>{badge.badgeText}</strong> không hỗ trợ xem trực tiếp trong trình duyệt. Vui lòng tải xuống để mở trên máy tính của bạn.
            </div>

            <button
              type="button"
              onClick={handleDownload}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2.5 transition shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              <Download size={18} />
              <span>Tải xuống tài liệu {displayFileSize ? `(${formatBytes(displayFileSize)})` : ''}</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Info / Note (Google Drive viewer dark footer) */}
      {material.description && (isPdf || isImage || isText || (isWord && docxHtml !== null) || (isExcel && excelWorkbook)) && (
        <div className="px-6 py-2 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="truncate italic">
            Ghi chú: {material.description}
          </span>
          <button
            type="button"
            onClick={() => window.open(previewUrl || downloadUrl, '_blank')}
            className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-medium shrink-0 ml-4 cursor-pointer"
          >
            <span>Mở tab mới</span>
            <ExternalLink size={12} />
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
