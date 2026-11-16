import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  UploadCloud,
  X,
  FileText,
  FileCode,
  Image as ImageIcon,
  Archive,
  File,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import ClassMaterialService from '../../services/classMaterial.service';

export interface UploadSlotMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotId: string;
  slotNumber?: number;
  slotTitle?: string;
  classId?: string;
  onSuccess?: (material: any) => void;
}

export function formatBytes(bytes: number | string | null | undefined, decimals = 1): string {
  if (!bytes) return '0 B';
  const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(num) || num === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return parseFloat((num / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function UploadSlotMaterialModal({
  isOpen,
  onClose,
  slotId,
  slotNumber,
  slotTitle,
  classId,
  onSuccess,
}: UploadSlotMaterialModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setTitle('');
      setDescription('');
      setError(null);
      setIsLoading(false);
      setIsDragging(false);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;

    // Check size limit: 50MB max
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('Dung lượng file tối đa là 50MB. Vui lòng chọn file nhỏ hơn.');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Auto-fill title if empty
    if (!title.trim()) {
      const fileNameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(fileNameWithoutExt);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Vui lòng chọn 1 tài liệu để tải lên.');
      return;
    }

    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề cho tài liệu.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      if (description.trim()) {
        formData.append('description', description.trim());
      }
      if (slotId) {
        formData.append('slot_id', slotId);
      }

      let res;
      try {
        res = await ClassMaterialService.uploadSlotMaterial(slotId, formData);
      } catch (slotErr) {
        // Fallback to class materials endpoint if slot endpoint fails
        if (classId) {
          res = await ClassMaterialService.uploadClassMaterial(classId, formData);
        } else {
          throw slotErr;
        }
      }

      if (onSuccess && res) {
        onSuccess(res.data || res);
      }
      onClose();
    } catch (err: any) {
      console.error('Error uploading slot material:', err);
      const msg = err.response?.data?.message || err.message || 'Không thể tải lên tài liệu. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return <ImageIcon size={20} className="text-purple-500" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
      return <Archive size={20} className="text-amber-500" />;
    }
    if (['pdf'].includes(ext || '')) {
      return <FileText size={20} className="text-rose-500" />;
    }
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext || '')) {
      return <FileText size={20} className="text-blue-500" />;
    }
    if (['ppt', 'pptx'].includes(ext || '')) {
      return <FileText size={20} className="text-orange-500" />;
    }
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'html', 'css', 'json'].includes(ext || '')) {
      return <FileCode size={20} className="text-emerald-500" />;
    }
    return <File size={20} className="text-slate-500" />;
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={isLoading ? undefined : onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 transition-all flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
              <UploadCloud size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 leading-snug">
                Tải lên tài liệu học tập
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Gắn cho Buổi học (Slot {slotNumber || 1}){slotTitle ? `: ${slotTitle}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer disabled:opacity-40"
            title="Đóng (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chọn tệp tài liệu <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="hidden"
              accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.txt,.png,.jpg,.jpeg,.zip,.rar"
            />

            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? 'border-orange-500 bg-orange-50/50'
                    : 'border-slate-200 hover:border-orange-400 hover:bg-slate-50/80 bg-slate-50/40'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-orange-100/70 text-orange-600 flex items-center justify-center mb-1">
                  <UploadCloud size={24} />
                </div>
                <div className="text-xs font-semibold text-slate-700">
                  Nhấp để tải lên hoặc kéo thả tệp vào đây
                </div>
                <div className="text-[11px] text-slate-400 max-w-xs">
                  Hỗ trợ PDF, PowerPoint, Word, Excel, TXT, Ảnh, ZIP, RAR (tối đa 50MB)
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/80">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                    {getFileIcon(file.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate" title={file.name}>
                      {file.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {formatBytes(file.size)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  disabled={isLoading}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                  title="Chọn file khác"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Title input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tiêu đề tài liệu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Slide bài giảng Buổi 1, Source Code mẫu..."
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
              required
            />
          </div>

          {/* Description input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mô tả / Ghi chú <span className="text-slate-400 font-normal">(không bắt buộc)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập ghi chú thêm cho sinh viên về tài liệu này..."
              rows={3}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition resize-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-40"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading || !file || !title.trim()}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Đang tải lên...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Tải lên ngay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
