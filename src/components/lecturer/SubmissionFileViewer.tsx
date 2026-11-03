import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Download,
  Copy,
  Check,
  Code2,
  FileCode,
  FileSpreadsheet,
  FileCheck,
  File,
  Search,
  ExternalLink,
  Sparkles,
  Info,
  Layers,
  Terminal,
  FileJson,
  FileType as FileTypeIcon
} from 'lucide-react';
import { SubmissionFile, ZipTreeNode } from '../../types/submission';
import { parseZipFileToTree, MOCK_ZIP_TREE_CASE_1 } from '../../services/mockSubmissionService';

/* ==========================================================================
   PROPS INTERFACE
   ========================================================================== */

export interface SubmissionFileViewerProps {
  file: SubmissionFile | null | undefined;
  onAiAnnotate?: () => void;
  showAiAnnotationBanner?: boolean;
  onCloseAiAnnotationBanner?: () => void;
  className?: string;
}

/* ==========================================================================
   HELPER: FILE EXTENSION ICON MAPPING
   ========================================================================== */

function getFileIcon(extension?: string) {
  const ext = extension?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileCode size={15} className="text-blue-500 shrink-0" />;
    case 'js':
    case 'jsx':
      return <FileCode size={15} className="text-amber-500 shrink-0" />;
    case 'json':
      return <FileJson size={15} className="text-emerald-500 shrink-0" />;
    case 'py':
      return <Terminal size={15} className="text-cyan-500 shrink-0" />;
    case 'java':
      return <FileCode size={15} className="text-orange-500 shrink-0" />;
    case 'html':
    case 'xml':
      return <Code2 size={15} className="text-rose-500 shrink-0" />;
    case 'css':
    case 'scss':
      return <FileTypeIcon size={15} className="text-purple-500 shrink-0" />;
    case 'md':
    case 'txt':
      return <FileText size={15} className="text-slate-500 shrink-0" />;
    case 'pdf':
      return <FileText size={15} className="text-red-500 shrink-0" />;
    case 'xlsx':
    case 'xls':
    case 'csv':
      return <FileSpreadsheet size={15} className="text-green-600 shrink-0" />;
    default:
      return <File size={15} className="text-slate-400 shrink-0" />;
  }
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/* ==========================================================================
   MAIN COMPONENT: SubmissionFileViewer
   ========================================================================== */

export default function SubmissionFileViewer({
  file,
  onAiAnnotate,
  showAiAnnotationBanner = false,
  onCloseAiAnnotationBanner,
  className = ''
}: SubmissionFileViewerProps) {
  // Tree state for ZIP files
  const [treeNodes, setTreeNodes] = useState<ZipTreeNode[]>([]);
  const [isLoadingZip, setIsLoadingZip] = useState(false);
  const [expandedFolderPaths, setExpandedFolderPaths] = useState<Set<string>>(new Set(['src', 'src/auth', 'src/services']));
  const [selectedFile, setSelectedFile] = useState<ZipTreeNode | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [hasCopied, setHasCopied] = useState(false);
  const [dynamicTextContent, setDynamicTextContent] = useState<string | null>(null);

  // Parse zip file or load text on mount or file change
  useEffect(() => {
    if (!file) {
      setTreeNodes([]);
      setSelectedFile(null);
      setDynamicTextContent(null);
      return;
    }

    const isZip = file.fileType === 'zip' || file.name.toLowerCase().endsWith('.zip');
    const isCode = file.fileType === 'code' || /\.(ts|tsx|js|jsx|py|java|cpp|c|cs|html|css|json|md|txt|sql|xml|yml|yaml)$/i.test(file.name);

    if (isZip) {
      if (file.extractedTree && file.extractedTree.length > 0) {
        setTreeNodes(file.extractedTree);
        const firstFile = findFirstCodeFile(file.extractedTree);
        setSelectedFile(firstFile || null);
      } else if (file.rawFile) {
        setIsLoadingZip(true);
        parseZipFileToTree(file.rawFile)
          .then((nodes) => {
            const finalNodes = nodes && nodes.length > 0 ? nodes : MOCK_ZIP_TREE_CASE_1;
            setTreeNodes(finalNodes);
            setSelectedFile(findFirstCodeFile(finalNodes) || null);
          })
          .catch((err) => {
            console.warn('Error parsing rawFile ZIP:', err);
            setTreeNodes(MOCK_ZIP_TREE_CASE_1);
            setSelectedFile(findFirstCodeFile(MOCK_ZIP_TREE_CASE_1) || null);
          })
          .finally(() => setIsLoadingZip(false));
      } else if (file.url) {
        setIsLoadingZip(true);
        fetch(file.url)
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.blob();
          })
          .then((blob) => parseZipFileToTree(blob))
          .then((nodes) => {
            const finalNodes = nodes && nodes.length > 0 ? nodes : MOCK_ZIP_TREE_CASE_1;
            setTreeNodes(finalNodes);
            setSelectedFile(findFirstCodeFile(finalNodes) || null);
          })
          .catch((err) => {
            console.warn('Could not fetch or parse ZIP from file.url, using fallback tree:', err);
            setTreeNodes(MOCK_ZIP_TREE_CASE_1);
            setSelectedFile(findFirstCodeFile(MOCK_ZIP_TREE_CASE_1) || null);
          })
          .finally(() => setIsLoadingZip(false));
      } else {
        setTreeNodes(MOCK_ZIP_TREE_CASE_1);
        setSelectedFile(findFirstCodeFile(MOCK_ZIP_TREE_CASE_1) || null);
      }
    } else if (isCode) {
      if (file.textContent) {
        setDynamicTextContent(file.textContent);
      } else if (file.url) {
        fetch(file.url)
          .then((res) => res.text())
          .then((text) => setDynamicTextContent(text))
          .catch((err) => console.warn('Could not fetch code text from file.url:', err));
      }
    }
  }, [file]);

  // Tìm file code đầu tiên trong cây thư mục để preview mặc định
  function findFirstCodeFile(nodes: ZipTreeNode[]): ZipTreeNode | null {
    for (const node of nodes) {
      if (node.type === 'file') return node;
      if (node.children) {
        const found = findFirstCodeFile(node.children);
        if (found) return found;
      }
    }
    return null;
  }

  // Toggle thư mục mở/đóng
  const toggleFolder = (path: string) => {
    setExpandedFolderPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Sao chép code
  const handleCopyCode = (content?: string) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  // Download handler
  const handleDownload = () => {
    if (!file) return;
    if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`Đang tải file gốc: ${file.name}`);
    }
  };

  // =========================================================================
  // CASE 1: EMPTY STATE / NO FILE ATTACHED
  // =========================================================================
  if (!file) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center bg-white p-8 text-center text-slate-500 ${className}`}>
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
          <FileText size={32} />
        </div>
        <h3 className="text-sm font-bold text-slate-700">Chưa có bài nộp nào</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Sinh viên chưa đính kèm tệp tin mã nguồn hoặc báo cáo cho bài tập này.
        </p>
      </div>
    );
  }

  // =========================================================================
  // CASE 2: PDF PREVIEW
  // =========================================================================
  if (file.fileType === 'pdf' || file.name.endsWith('.pdf')) {
    return (
      <div className={`flex-1 flex flex-col bg-white overflow-hidden ${className}`}>
        {/* Header bar */}
        <div className="h-12 border-b border-slate-200 px-5 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
            <FileText size={16} className="text-rose-500" />
            <span>{file.name}</span>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono font-medium">
              {formatBytes(file.size)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              <Download size={13} className="text-slate-500" />
              <span>Download Original File</span>
            </button>
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition cursor-pointer"
            >
              <ExternalLink size={13} />
              <span>Mở tab mới</span>
            </a>
          </div>
        </div>

        {/* Embedded PDF Viewer */}
        <div className="flex-1 w-full h-full bg-slate-100 p-2">
          <iframe
            src={file.url}
            title={file.name}
            className="w-full h-full border-0 rounded-lg shadow-inner bg-white"
          />
        </div>
      </div>
    );
  }

  // =========================================================================
  // CASE 3: ZIP ARCHIVE -> GITHUB-STYLE FILE TREE HIERARCHY
  // =========================================================================
  if (file.fileType === 'zip' || file.name.endsWith('.zip')) {
    const codeLines = selectedFile?.content ? selectedFile.content.split('\n') : ['// Chọn một file trong cây thư mục bên trái để xem nội dung'];

    return (
      <div className={`flex-1 flex flex-col bg-white overflow-hidden ${className}`}>
        {/* Top Action Bar */}
        <div className="h-12 border-b border-slate-200 px-5 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
            <FolderOpen size={16} className="text-indigo-600" />
            <span>{file.name}</span>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono font-medium">
              {formatBytes(file.size)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onAiAnnotate && (
              <button
                type="button"
                onClick={onAiAnnotate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6b21a8] text-white rounded-lg text-xs font-bold hover:bg-purple-800 transition shadow-xs cursor-pointer"
              >
                <Sparkles size={12} />
                <span>AI Code Annotate</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              <Download size={13} className="text-slate-500" />
              <span>Download ZIP</span>
            </button>
          </div>
        </div>

        {/* AI Annotation Floating Alert (if active) */}
        {showAiAnnotationBanner && (
          <div className="bg-purple-50 border-b border-purple-200 px-5 py-2.5 flex items-center justify-between text-xs text-purple-900 transition">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-purple-600 shrink-0" />
              <span>
                <strong>AI Code Annotate:</strong> Phát hiện các đoạn mã tương thích với lời khai (JWT Middleware, Redis Token Blacklist, và IStorageProvider).
              </span>
            </div>
            {onCloseAiAnnotationBanner && (
              <button
                type="button"
                onClick={onCloseAiAnnotationBanner}
                className="text-purple-400 hover:text-purple-700 text-xs font-bold ml-2 cursor-pointer"
              >
                Đóng
              </button>
            )}
          </div>
        )}

        {/* Body Split Pane: Left = GitHub File Tree | Right = Code Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* CỘT TRÁI CON: FILE TREE VIEW (GITHUB STYLE) */}
          <aside className="w-64 border-r border-slate-200 bg-slate-50/70 flex flex-col shrink-0 select-none">
            {/* Search filter in tree */}
            <div className="p-2 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter files..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full text-xs pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-slate-700"
                />
              </div>
            </div>

            {/* Tree nodes list */}
            <div className="flex-1 overflow-y-auto custom-scroll p-1.5 text-xs">
              {isLoadingZip ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  Đang giải nén cấu trúc file...
                </div>
              ) : treeNodes.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  Không tìm thấy file nào trong thư mục.
                </div>
              ) : (
                treeNodes.map((node) => (
                  <TreeNodeItem
                    key={node.id}
                    node={node}
                    level={0}
                    expandedPaths={expandedFolderPaths}
                    onToggleFolder={toggleFolder}
                    selectedFile={selectedFile}
                    onSelectFile={setSelectedFile}
                    filterText={searchFilter}
                  />
                ))
              )}
            </div>
          </aside>

          {/* CỘT PHẢI CON: CODE CONTENT VIEWER */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Selected File Breadcrumb Bar */}
            <div className="h-9 border-b border-slate-200 px-4 flex items-center justify-between bg-slate-50/50 text-xs shrink-0">
              <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px] truncate">
                {selectedFile ? (
                  <>
                    {getFileIcon(selectedFile.extension)}
                    <span className="font-semibold text-slate-800">{selectedFile.path}</span>
                    {selectedFile.size && (
                      <span className="text-slate-400 ml-1">({formatBytes(selectedFile.size)})</span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-400">Chưa chọn file</span>
                )}
              </div>

              {selectedFile?.content && (
                <button
                  type="button"
                  onClick={() => handleCopyCode(selectedFile.content)}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-slate-100 transition cursor-pointer"
                  title="Sao chép nội dung file"
                >
                  {hasCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  <span>{hasCopied ? 'Copied!' : 'Copy'}</span>
                </button>
              )}
            </div>

            {/* Code Lines Display */}
            <div className="flex-1 p-4 font-mono text-xs text-slate-700 bg-white overflow-y-auto custom-scroll leading-relaxed select-text">
              {codeLines.map((line, idx) => {
                const lineNum = idx + 1;
                const isAnnotated =
                  line.includes('AI Declaration') ||
                  line.includes('RedisTokenBlacklistService') ||
                  line.includes('IStorageProvider');

                return (
                  <div
                    key={lineNum}
                    className={`flex gap-3 px-1.5 py-0.5 rounded transition ${
                      isAnnotated
                        ? 'bg-purple-50/80 border-l-2 border-purple-500 text-purple-950 font-medium'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-slate-400 select-none w-8 text-right shrink-0 font-mono text-[11px]">
                      {lineNum}
                    </span>
                    <span className="whitespace-pre flex-1">{line || ' '}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CASE 4: SINGLE CODE / TEXT FILE PREVIEW
  // =========================================================================
  const effectiveContent = dynamicTextContent || file.textContent || '// Could not load text content.';
  const textLines = effectiveContent.split('\n');

  return (
    <div className={`flex-1 flex flex-col bg-white overflow-hidden ${className}`}>
      {/* Header bar */}
      <div className="h-12 border-b border-slate-200 px-5 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
          <FileCode size={16} className="text-indigo-600" />
          <span>{file.name}</span>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono font-medium">
            {formatBytes(file.size)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onAiAnnotate && (
            <button
              type="button"
              onClick={onAiAnnotate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6b21a8] text-white rounded-lg text-xs font-bold hover:bg-purple-800 transition shadow-xs cursor-pointer"
            >
              <Sparkles size={12} />
              <span>AI Code Annotate</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            <Download size={13} className="text-slate-500" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Code Text Content */}
      <div className="flex-1 p-5 font-mono text-xs text-slate-700 bg-white overflow-y-auto custom-scroll leading-relaxed select-text">
        {textLines.map((line, idx) => (
          <div key={idx + 1} className="flex gap-4 hover:bg-slate-50 px-1 py-0.5 rounded">
            <span className="text-slate-400 select-none w-8 text-right shrink-0">{idx + 1}</span>
            <span className="whitespace-pre flex-1">{line || ' '}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENT: Recursive TreeNodeItem (GitHub-style Hierarchy)
   ========================================================================== */

interface TreeNodeItemProps {
  node: ZipTreeNode;
  level: number;
  expandedPaths: Set<string>;
  onToggleFolder: (path: string) => void;
  selectedFile: ZipTreeNode | null;
  onSelectFile: (node: ZipTreeNode) => void;
  filterText: string;
}

function TreeNodeItem({
  node,
  level,
  expandedPaths,
  onToggleFolder,
  selectedFile,
  onSelectFile,
  filterText
}: TreeNodeItemProps) {
  const isFolder = node.type === 'folder';
  const isExpanded = expandedPaths.has(node.path);
  const isSelected = selectedFile?.path === node.path;

  // Filter logic
  const matchesFilter = filterText
    ? node.name.toLowerCase().includes(filterText.toLowerCase()) ||
      (node.children && hasMatchingChild(node.children, filterText))
    : true;

  if (!matchesFilter) return null;

  return (
    <div className="select-none">
      <div
        onClick={() => {
          if (isFolder) {
            onToggleFolder(node.path);
          } else {
            onSelectFile(node);
          }
        }}
        style={{ paddingLeft: `${level * 14 + 6}px` }}
        className={`flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer transition text-xs font-mono truncate ${
          isSelected
            ? 'bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600'
            : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
        }`}
      >
        {isFolder ? (
          <>
            <span className="text-slate-400 hover:text-slate-600 p-0.5">
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>
            {isExpanded ? (
              <FolderOpen size={14} className="text-amber-500 shrink-0" />
            ) : (
              <Folder size={14} className="text-amber-500 shrink-0" />
            )}
            <span className="truncate">{node.name}</span>
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            {getFileIcon(node.extension)}
            <span className="truncate">{node.name}</span>
          </>
        )}
      </div>

      {/* Render children if folder is open */}
      {isFolder && isExpanded && node.children && (
        <div className="border-l border-slate-200/60 ml-2">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              expandedPaths={expandedPaths}
              onToggleFolder={onToggleFolder}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              filterText={filterText}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function hasMatchingChild(children: ZipTreeNode[], filter: string): boolean {
  return children.some(
    (c) =>
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      (c.children && hasMatchingChild(c.children, filter))
  );
}
