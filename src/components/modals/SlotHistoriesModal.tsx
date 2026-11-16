import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, Calendar, ArrowRight, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import ClassService from '../../services/class.service';

export interface SlotInfo {
  id: string;
  slot_number: number;
  title?: string;
  date?: string;
  time?: string;
  content?: string;
  assignments?: any[];
}

export interface ClassCardItem {
  id: string;
  code: string;
  semesterTag: string;
  title: string;
  className: string;
  semester: string;
  totalSlots: number;
  slots: SlotInfo[];
  raw?: any;
}

export interface SlotHistoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  classesData?: any[];
  isLoading?: boolean;
  onSelectSlot?: (classItem: ClassCardItem, slot: SlotInfo | null, slotNumber: number) => void;
  onSelectClass?: (classItem: ClassCardItem) => void;
  role?: 'student' | 'lecturer';
}

export default function SlotHistoriesModal({
  isOpen,
  onClose,
  classesData,
  isLoading: propLoading = false,
  onSelectSlot,
  onSelectClass,
  role = 'student',
}: SlotHistoriesModalProps) {
  const navigate = useNavigate();

  const [internalClasses, setInternalClasses] = useState<ClassCardItem[]>([]);
  const [internalLoading, setInternalLoading] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState<number | 'all'>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Chuẩn hóa một raw class item thành ClassCardItem
  const normalizeClassItem = (c: any): ClassCardItem => {
    const rawSlots: any[] = Array.isArray(c.slots) ? c.slots : [];
    const totalSlots =
      typeof c.total_slots === 'number'
        ? c.total_slots
        : rawSlots.length > 0
        ? rawSlots.length
        : typeof c.totalSlots === 'number'
        ? c.totalSlots
        : 0;

    const semesterRaw = c.semester_code || c.semester_name || c.semester || '';
    const semesterTag = semesterRaw ? `[${semesterRaw.toUpperCase()}]` : '[FALL2026]';
    const semester = c.semester_name || c.semester || c.semester_code || 'Fall2026';

    const normalizedSlots: SlotInfo[] =
      rawSlots.length > 0
        ? rawSlots.map((s: any, idx: number) => ({
            id: s.id || `slot-${c.id}-${s.slot_number || idx + 1}`,
            slot_number: typeof s.slot_number === 'number' ? s.slot_number : idx + 1,
            title: s.title || '',
            date: s.date || '',
            time: s.time || '',
            content: s.content || '',
            assignments: s.assignments || [],
          }))
        : [];

    return {
      id: c.id || c.class_id || '',
      code: c.subject_code || c.code || 'CODE',
      semesterTag,
      title: c.subject_name || c.title || c.name || 'Môn học',
      className: c.class_code || c.class_name || c.className || 'N/A',
      semester,
      totalSlots: Math.max(totalSlots, normalizedSlots.length),
      slots: normalizedSlots,
      raw: c,
    };
  };

  // Fetch dữ liệu lớp & slot thực tế khi modal mở nếu không truyền classesData từ ngoài
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const loadData = async () => {
      // 1. Nếu có classesData được truyền từ props
      if (classesData && Array.isArray(classesData) && classesData.length > 0) {
        const normalized = classesData.map(normalizeClassItem);
        if (isMounted) {
          setInternalClasses(normalized);
        }

        // Bổ sung fetch slot cho các lớp chưa có slots mảng
        const needSlots = normalized.filter((item) => item.slots.length === 0 && item.id);
        if (needSlots.length > 0) {
          try {
            const slotPromises = needSlots.map(async (item) => {
              try {
                const sRes = await ClassService.getClassSlots(item.id);
                const sData = sRes?.data || sRes || [];
                const arr = Array.isArray(sData) ? sData : [];
                return { classId: item.id, slots: arr };
              } catch (e) {
                return { classId: item.id, slots: [] };
              }
            });
            const slotsResults = await Promise.all(slotPromises);
            if (isMounted) {
              setInternalClasses((prev) =>
                prev.map((cls) => {
                  const match = slotsResults.find((r) => r.classId === cls.id);
                  if (match && match.slots.length > 0) {
                    const normSlots = match.slots.map((s: any, idx: number) => ({
                      id: s.id || `slot-${cls.id}-${s.slot_number || idx + 1}`,
                      slot_number: typeof s.slot_number === 'number' ? s.slot_number : idx + 1,
                      title: s.title || '',
                      date: s.date || '',
                      time: s.time || '',
                      content: s.content || '',
                      assignments: s.assignments || [],
                    }));
                    return {
                      ...cls,
                      totalSlots: Math.max(cls.totalSlots, normSlots.length),
                      slots: normSlots,
                    };
                  }
                  return cls;
                })
              );
            }
          } catch (err) {
            console.warn('[SlotHistoriesModal] Failed to enrich slots for prop classes:', err);
          }
        }
        return;
      }

      // 2. Tự gọi API Backend ClassService.getMyClasses()
      setInternalLoading(true);
      try {
        const res = await ClassService.getMyClasses({ limit: 100 });
        const list = res?.data?.data || res?.data || res || [];
        const rawList = Array.isArray(list) ? list : [];

        const normalized = rawList.map(normalizeClassItem);
        if (isMounted) {
          setInternalClasses(normalized);
        }

        // Nếu backend chưa trả slots sẵn trong findClasses, fetch song song các slots
        const needSlots = normalized.filter((item) => item.slots.length === 0 && item.id);
        if (needSlots.length > 0) {
          const slotPromises = needSlots.map(async (item) => {
            try {
              const sRes = await ClassService.getClassSlots(item.id);
              const sData = sRes?.data || sRes || [];
              const arr = Array.isArray(sData) ? sData : [];
              return { classId: item.id, slots: arr };
            } catch (e) {
              return { classId: item.id, slots: [] };
            }
          });
          const slotsResults = await Promise.all(slotPromises);
          if (isMounted) {
            setInternalClasses((prev) =>
              prev.map((cls) => {
                const match = slotsResults.find((r) => r.classId === cls.id);
                if (match && match.slots.length > 0) {
                  const normSlots = match.slots.map((s: any, idx: number) => ({
                    id: s.id || `slot-${cls.id}-${s.slot_number || idx + 1}`,
                    slot_number: typeof s.slot_number === 'number' ? s.slot_number : idx + 1,
                    title: s.title || '',
                    date: s.date || '',
                    time: s.time || '',
                    content: s.content || '',
                    assignments: s.assignments || [],
                  }));
                  return {
                    ...cls,
                    totalSlots: Math.max(cls.totalSlots, normSlots.length),
                    slots: normSlots,
                  };
                }
                return cls;
              })
            );
          }
        }
      } catch (err) {
        console.error('[SlotHistoriesModal] Failed to fetch classes:', err);
      } finally {
        if (isMounted) {
          setInternalLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, classesData]);

  // Hỗ trợ phím Esc để đóng modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Khóa cuộn trang khi modal mở
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Tính toán tổng số lớp & tổng số slot
  const { totalClasses, totalSlots } = useMemo(() => {
    const totalC = internalClasses.length;
    const totalS = internalClasses.reduce((acc, curr) => acc + (curr.totalSlots || curr.slots.length || 0), 0);
    return { totalClasses: totalC, totalSlots: totalS };
  }, [internalClasses]);

  // Phân trang danh sách lớp
  const paginatedClasses = useMemo(() => {
    if (pageSize === 'all') {
      return internalClasses;
    }
    const start = (currentPage - 1) * pageSize;
    return internalClasses.slice(start, start + pageSize);
  }, [internalClasses, pageSize, currentPage]);

  const totalPages = useMemo(() => {
    if (pageSize === 'all' || internalClasses.length === 0) return 1;
    return Math.ceil(internalClasses.length / pageSize);
  }, [internalClasses.length, pageSize]);

  // Xử lý chuyển page size
  const handlePageSizeChange = (val: string) => {
    if (val === 'all') {
      setPageSize('all');
      setCurrentPage(1);
    } else {
      const num = parseInt(val, 10);
      setPageSize(num);
      setCurrentPage(1);
    }
  };

  // Điều hướng xem lớp
  const handleClassClick = (cls: ClassCardItem) => {
    onClose();
    if (onSelectClass) {
      onSelectClass(cls);
    } else {
      const targetRole = role === 'lecturer' ? 'lecturer' : 'student';
      navigate(`/${targetRole}/classes/${cls.id}`);
    }
  };

  // Điều hướng xem slot
  const handleSlotClick = (cls: ClassCardItem, slot: SlotInfo | null, slotNumber: number) => {
    onClose();
    if (onSelectSlot) {
      onSelectSlot(cls, slot, slotNumber);
    } else {
      const targetRole = role === 'lecturer' ? 'lecturer' : 'student';
      navigate(`/${targetRole}/classes/${cls.id}`, {
        state: {
          slotId: slot?.id,
          slotNumber,
        },
      });
    }
  };

  if (!isOpen) return null;

  const isLoading = propLoading || internalLoading;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-4 sm:p-6 transition-opacity animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <style>{`
        .custom-slot-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-slot-scroll::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 8px;
        }
        .custom-slot-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 8px;
        }
        .custom-slot-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      {/* ==================== SUBWINDOW MODAL: DANH SÁCH SLOT THEO LỚP ==================== */}
      <div
        id="slot-modal"
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[86vh] flex flex-col overflow-hidden border border-slate-200 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. MODAL HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3.5">
            {/* Icon Cam Bo Góc */}
            <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center text-lg shadow-md shadow-orange-500/20 shrink-0">
              <CalendarCheck size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 leading-snug">Danh sách slot theo lớp</h2>
              <p className="text-xs text-slate-400 mt-0.5">Theo dõi lớp học và truy cập nhanh từng buổi học</p>
            </div>
          </div>

          {/* Thống kê nhanh & Nút đóng X */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50/50">
              <span>{totalClasses} lớp</span>
              <span className="mx-2.5 text-slate-300">|</span>
              <span>{totalSlots} slot</span>
            </div>

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

        {/* 2. MODAL BODY (VÙNG CUỘN DANH SÁCH LỚP) */}
        <div className="p-6 overflow-y-auto max-h-[58vh] custom-slot-scroll space-y-4 bg-[#fcfcfd] flex-1 min-h-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="text-xs font-medium text-slate-500">Đang tải danh sách lớp và slot...</p>
            </div>
          ) : internalClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <Calendar size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-700">Chưa có dữ liệu lớp học nào</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Bạn hiện chưa được phân công hoặc chưa ghi danh vào lớp học nào trong học kỳ này.
              </p>
            </div>
          ) : (
            paginatedClasses.map((cls) => {
              // Tạo danh sách nút slot
              const slotCount = cls.totalSlots || cls.slots.length;
              const slotsToRender =
                cls.slots.length > 0
                  ? cls.slots
                  : Array.from({ length: slotCount }, (_, i) => ({
                      id: `mock-slot-${cls.id}-${i + 1}`,
                      slot_number: i + 1,
                      title: `Slot ${i + 1}`,
                    }));

              return (
                <div
                  key={cls.id || cls.code}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:border-slate-300 transition space-y-4"
                >
                  {/* Hàng trên: Thông tin môn, Lớp, Học kỳ, Nút Xem lớp */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Trái: Mã môn & Tên môn */}
                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center gap-1.5 bg-slate-100/80 border border-slate-200/60 px-2.5 py-0.5 rounded-md text-[10px] font-bold text-slate-600 tracking-wide">
                        <span>{cls.code}</span>
                        <span className="text-slate-400">•</span>
                        <span>{cls.semesterTag}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 mt-1.5 truncate" title={cls.title}>
                        {cls.title}
                      </h3>
                    </div>

                    {/* Phải: Cột Lớp, Học kỳ & Nút Xem lớp */}
                    <div className="flex items-center justify-between md:justify-end gap-6 shrink-0">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LỚP</div>
                        <div className="text-xs font-bold text-slate-700 mt-0.5">{cls.className}</div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HỌC KỲ</div>
                        <div className="text-xs font-bold text-slate-700 mt-0.5">{cls.semester}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleClassClick(cls)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        <span>Xem lớp</span>
                        <ArrowRight size={11} className="text-slate-500" />
                      </button>
                    </div>
                  </div>

                  {/* Hàng dưới: Danh sách nút Slot */}
                  <div className="pt-3.5 border-t border-slate-100 flex items-start gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium shrink-0 pt-1">
                      <Calendar size={14} className="text-slate-400" />
                      <span>Danh sách slot</span>
                      <span className="bg-slate-100 text-slate-600 font-bold text-[10px] px-2 py-0.5 rounded-full">
                        {slotCount}
                      </span>
                    </div>

                    {/* Grid các ô số Slot tự xuống dòng */}
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {slotsToRender.map((s, idx) => {
                        const slotNum = s.slot_number || idx + 1;
                        return (
                          <button
                            key={s.id || idx}
                            type="button"
                            onClick={() => handleSlotClick(cls, s as SlotInfo, slotNum)}
                            title={s.title ? `${cls.code} - Slot ${slotNum}: ${s.title}` : `Slot ${slotNum}`}
                            className="w-7 h-7 rounded-lg border border-slate-200/90 bg-white hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600 text-slate-600 text-[11px] font-semibold flex items-center justify-center transition shrink-0 cursor-pointer"
                          >
                            {slotNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 3. MODAL FOOTER */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            Đang hiển thị{' '}
            <span className="font-bold text-slate-800" id="display-count">
              {paginatedClasses.length} lớp
            </span>
            {internalClasses.length > paginatedClasses.length && (
              <span className="text-slate-400 ml-1">(trên tổng {internalClasses.length} lớp)</span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Phân trang trang trước / sau */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-slate-600"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[11px] font-semibold text-slate-600 px-1">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-slate-600"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <span>Số lớp hiển thị</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold bg-white outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="all">Tất cả</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
