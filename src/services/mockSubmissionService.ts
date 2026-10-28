import JSZip from 'jszip';
import {
  Submission,
  SubmitAssignmentPayload,
  GradeSubmissionPayload,
  AiAuditDeclaration,
  ZipTreeNode,
  SubmissionFile
} from '../types/submission';

/* ==========================================================================
   1. MOCK DATASETS (DỮ LIỆU MẪU CHUẨN ĐỂ KIỂM THỬ)
   ========================================================================== */

// Cây thư mục mẫu dành cho Case 1: Sinh viên nộp source code dạng ZIP
export const MOCK_ZIP_TREE_CASE_1: ZipTreeNode[] = [
  {
    id: 'node-src',
    name: 'src',
    path: 'src',
    type: 'folder',
    children: [
      {
        id: 'node-src-auth',
        name: 'auth',
        path: 'src/auth',
        type: 'folder',
        children: [
          {
            id: 'node-jwt-middleware',
            name: 'jwt.middleware.ts',
            path: 'src/auth/jwt.middleware.ts',
            type: 'file',
            extension: 'ts',
            size: 2450,
            content: `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { RedisTokenBlacklistService } from './token.blacklist.service';

export interface AuthenticatedUser {
  userId: string;
  role: 'STUDENT' | 'LECTURER' | 'ADMIN';
  email: string;
}

/**
 * ART-AI Authentication Middleware
 * Validates JWT Access Token & Checks Redis Blacklist for Revoked Tokens
 */
export async function authenticateJwt(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  // 1. Kiểm tra Token Blacklist (Redis)
  const isBlacklisted = await RedisTokenBlacklistService.isRevoked(token);
  if (isBlacklisted) {
    return res.status(401).json({ error: 'Token has been revoked or session expired' });
  }

  // 2. Xác thực chữ ký mã hóa JWT
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'art-ai-secret') as AuthenticatedUser;
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}`
          },
          {
            id: 'node-token-blacklist',
            name: 'token.blacklist.service.ts',
            path: 'src/auth/token.blacklist.service.ts',
            type: 'file',
            extension: 'ts',
            size: 1680,
            content: `import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export class RedisTokenBlacklistService {
  private static PREFIX = 'token:blacklist:';

  /**
   * Đưa token vào danh sách đen khi sinh viên logout hoặc đổi mật khẩu
   */
  public static async revokeToken(token: string, expiresInSeconds: number): Promise<void> {
    const key = \`\${this.PREFIX}\${token}\`;
    await redisClient.set(key, 'REVOKED', 'EX', expiresInSeconds);
  }

  /**
   * Kiểm tra nhanh trạng thái token trong cache O(1)
   */
  public static async isRevoked(token: string): Promise<boolean> {
    const key = \`\${this.PREFIX}\${token}\`;
    const result = await redisClient.get(key);
    return result === 'REVOKED';
  }
}`
          }
        ]
      },
      {
        id: 'node-src-services',
        name: 'services',
        path: 'src/services',
        type: 'folder',
        children: [
          {
            id: 'node-storage-provider',
            name: 'storage.provider.ts',
            path: 'src/services/storage.provider.ts',
            type: 'file',
            extension: 'ts',
            size: 3120,
            content: `/**
 * Abstraction layer for File Storage
 * AI Declaration: Abstraction Phase (Suggested by ChatGPT-4o)
 */
export interface IStorageProvider {
  uploadFile(buffer: Buffer, filename: string, mimeType: string): Promise<string>;
  deleteFile(fileUrl: string): Promise<boolean>;
  getDownloadStream(fileKey: string): Promise<NodeJS.ReadableStream>;
}

export class S3StorageProvider implements IStorageProvider {
  async uploadFile(buffer: Buffer, filename: string): Promise<string> {
    // S3 upload implementation
    return \`https://art-ai-bucket.s3.ap-southeast-1.amazonaws.com/submissions/\${filename}\`;
  }
  async deleteFile(fileUrl: string): Promise<boolean> {
    return true;
  }
  async getDownloadStream(fileKey: string): Promise<NodeJS.ReadableStream> {
    throw new Error('Not implemented');
  }
}`
          },
          {
            id: 'node-analytics-service',
            name: 'participation.service.ts',
            path: 'src/services/participation.service.ts',
            type: 'file',
            extension: 'ts',
            size: 2800,
            content: `import { Db } from 'mongodb';

/**
 * AI Declaration: Algorithmic Thinking Phase
 * Student rejected client-side filtering proposed by Gemini 1.5 Pro
 * and implemented server-side MongoDB Aggregation pipeline instead.
 */
export class ParticipationAnalyticsService {
  constructor(private db: Db) {}

  async calculateRealTimeStudentParticipation(classId: string) {
    const pipeline = [
      { $match: { classId } },
      {
        $group: {
          _id: '$studentId',
          totalSubmissions: { $sum: 1 },
          avgScore: { $avg: '$score' },
          lastActive: { $max: '$submittedAt' }
        }
      },
      { $sort: { avgScore: -1 } }
    ];

    return this.db.collection('submissions').aggregate(pipeline).toArray();
  }
}`
          }
        ]
      },
      {
        id: 'node-src-controllers',
        name: 'controllers',
        path: 'src/controllers',
        type: 'folder',
        children: [
          {
            id: 'node-submission-controller',
            name: 'submission.controller.ts',
            path: 'src/controllers/submission.controller.ts',
            type: 'file',
            extension: 'ts',
            size: 1950,
            content: `import { Request, Response } from 'express';

export class SubmissionController {
  static async handleFileUpload(req: Request, res: Response) {
    const file = req.file;
    const { aiAuditLog } = req.body;
    return res.status(201).json({
      success: true,
      message: 'Submission uploaded with verified AI Audit Log',
      fileId: file?.filename,
      aiDeclared: Boolean(aiAuditLog)
    });
  }
}`
          }
        ]
      }
    ]
  },
  {
    id: 'node-package-json',
    name: 'package.json',
    path: 'package.json',
    type: 'file',
    extension: 'json',
    size: 680,
    content: `{
  "name": "art-ai-backend-submission",
  "version": "1.0.0",
  "description": "Student Tran Thi B - DE181802 Submission",
  "main": "dist/index.js",
  "dependencies": {
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "ioredis": "^5.4.1",
    "mongodb": "^6.8.0"
  }
}`
  },
  {
    id: 'node-readme',
    name: 'README.md',
    path: 'README.md',
    type: 'file',
    extension: 'md',
    size: 1200,
    content: `# Báo Cáo Kiến Trúc Phần Mềm (C4 Model) & ART-AI Declaration
**Sinh viên:** Trần Thị B (DE181802)  
**Lớp:** SE18D01 | **Môn học:** SWD392  

### Tóm tắt phương pháp thiết kế:
- Áp dụng cấu trúc phân tầng sạch (Clean / Hexagonal Architecture).
- Toàn bộ quá trình tham vấn AI được khai báo chi tiết trong bảng ART-AI Audit Log 5 tiêu chí.
- Các module nhạy cảm (JWT Blacklist, File Provider) được kiểm thử kỹ lưỡng.`
  }
];

// Khai báo AI chuẩn 5 tiêu chí của sinh viên Trần Thị B
const MOCK_AI_AUDIT_LOG_FULL: AiAuditDeclaration = {
  isDeclared: true,
  transparencyScore: 92,
  decomposition: {
    aiTool: 'ChatGPT-4o',
    decision: 'Partially Modified',
    prompt: '"Help me break down the authentication process with JWT & Refresh token."',
    responseSummary: 'Divided into 4 submodules: validation, token gen, cookie, middleware.',
    reflection: 'Kept the proposed 4 modules, altered token storage to secure cookies.'
  },
  pattern: {
    aiTool: 'GitHub Copilot',
    decision: 'Heavily Adapted',
    prompt: '"Generate generic repository pattern for MongoDB CRUD operations."',
    responseSummary: 'Provided standard BaseRepository class using native Mongo client.',
    reflection: 'Adapted types to fit project schema and added retry transactions.'
  },
  abstraction: {
    aiTool: 'ChatGPT-4o',
    decision: 'Fully Accepted',
    prompt: '"Abstract file upload handling into an independent storage provider."',
    responseSummary: 'Created IStorageProvider interface with SeaweedFS & S3 adapters.',
    reflection: 'Implemented interface smoothly without leaking filesystem details.'
  },
  algorithmic: {
    aiTool: 'Gemini 1.5 Pro',
    decision: 'Rejected',
    prompt: '"Write optimal query to calculate real-time student participation."',
    responseSummary: 'Suggested client-side sorting and filter logic over full dataset.',
    reflection: 'Rejected client-side approach; implemented MongoDB Aggregation pipeline instead.'
  },
  reflection: {
    aiTool: 'Claude 3.5 Sonnet',
    decision: 'Fully Accepted',
    prompt: '"Review this module architecture and point out critical code smells."',
    responseSummary: 'Suggested decomposing monolithic handlers into service layers.',
    reflection: 'Acknowledged tight coupling and refactored logic into service layer.'
  }
};

/* ==========================================================================
   2. IN-MEMORY DATABASE STATE (MÔ PHỎNG DB BACKEND THỰC TẾ)
   ========================================================================== */

const STORAGE_KEY = 'edux_art_ai_mock_submissions_db_v2';

const defaultMockDatabase: Record<string, Submission> = {
  // Case 1: Sinh viên Trần Thị B (Đã nộp bài file ZIP, khai báo AI đầy đủ, chưa chấm điểm)
  'sub-de181802': {
    id: 'sub-de181802',
    assignmentId: 'asg-swd392-01',
    studentId: 'std-02',
    studentName: 'Tran Thi B',
    studentCode: 'DE181802',
    studentEmail: 'tranb.de181802@fpt.edu.vn',
    status: 'SUBMITTED',
    submittedAt: '2026-10-27T14:35:00Z',
    lastUpdatedAt: '2026-10-27T14:35:00Z',
    file: {
      name: 'SE18D01_TranThiB_BackendArchitecture.zip',
      url: 'https://cdn.edux.edu.vn/submissions/SE18D01_TranThiB_BackendArchitecture.zip',
      size: 4850000, // 4.85 MB
      mimeType: 'application/zip',
      fileType: 'zip',
      extractedTree: MOCK_ZIP_TREE_CASE_1
    },
    aiAuditLog: MOCK_AI_AUDIT_LOG_FULL,
    grade: null,
    aiRiskLevel: 'low',
    aiRiskLabel: 'low AI-transparency risk'
  },

  // Case 2: Sinh viên Lê Văn C (Nộp file PDF, KHÔNG KHAI BÁO AI - Kiểm thử empty state)
  'sub-de181803': {
    id: 'sub-de181803',
    assignmentId: 'asg-swd392-01',
    studentId: 'std-03',
    studentName: 'Le Van C',
    studentCode: 'DE181803',
    studentEmail: 'levanc.de181803@fpt.edu.vn',
    status: 'SUBMITTED',
    submittedAt: '2026-10-26T09:12:00Z',
    file: {
      name: 'BaoCao_KienTrucHeThong_LeVanC.pdf',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      size: 1250000, // 1.25 MB
      mimeType: 'application/pdf',
      fileType: 'pdf'
    },
    aiAuditLog: null, // Không khai báo AI
    grade: null,
    aiRiskLevel: 'low',
    aiRiskLabel: 'pure human / no AI reported'
  },

  // Case 3: Sinh viên Phạm Thị D (Đã được Giảng viên chấm điểm trước đó - Phục vụ luồng Edit Grade)
  'sub-de181804': {
    id: 'sub-de181804',
    assignmentId: 'asg-swd392-01',
    studentId: 'std-04',
    studentName: 'Pham Thi D',
    studentCode: 'DE181804',
    studentEmail: 'phamd.de181804@fpt.edu.vn',
    status: 'GRADED',
    submittedAt: '2026-10-25T11:00:00Z',
    file: {
      name: 'SE18D01_PhamThiD_Project.zip',
      url: 'https://cdn.edux.edu.vn/submissions/SE18D01_PhamThiD_Project.zip',
      size: 3200000,
      mimeType: 'application/zip',
      fileType: 'zip',
      extractedTree: MOCK_ZIP_TREE_CASE_1
    },
    aiAuditLog: MOCK_AI_AUDIT_LOG_FULL,
    grade: {
      score: 8.5,
      feedback: 'Code có cấu trúc tốt, phân chia layer rõ ràng. Khai báo AI minh bạch và có tự phản chiếu rất xác đáng.',
      gradedAt: '2026-10-27T16:20:00Z',
      gradedBy: 'ThS. Nguyễn Văn Giảng Viên',
      rubrics: {
        decomposition: 1.75,
        pattern: 1.75,
        abstraction: 1.75,
        algorithmic: 1.50,
        reflection: 1.75,
        r1: 3.5,
        r2: 3.25,
        r3: 1.75
      },
      aiComplianceStatus: 'compliant',
      isDraft: false
    },
    aiRiskLevel: 'low',
    aiRiskLabel: 'low AI-transparency risk'
  }
};

const getInitialDatabase = (): Record<string, Submission> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const studentMap = new Map<string, Submission>();

        for (const [k, v] of Object.entries(parsed)) {
          if (!v || typeof v !== 'object') continue;
          const sub = v as Submission;
          if (
            k.startsWith('asm_') ||
            k === 'DE181802' ||
            k === 'de181802' ||
            k === 'std-current-user'
          ) {
            continue;
          }

          const studentKey = sub.studentCode || sub.studentId || sub.id;
          if (!studentKey) continue;

          if (!studentMap.has(studentKey)) {
            studentMap.set(studentKey, sub);
          } else {
            const existing = studentMap.get(studentKey)!;
            const existingTime = new Date(existing.submittedAt || 0).getTime();
            const subTime = new Date(sub.submittedAt || 0).getTime();
            const existingIsGraded = existing.grade?.score != null || (existing as any).score != null;
            const subIsGraded = sub.grade?.score != null || (sub as any).score != null;

            if ((!existingIsGraded && subIsGraded) || (subTime > existingTime)) {
              studentMap.set(studentKey, sub);
            }
          }
        }

        const cleaned: Record<string, Submission> = {};
        for (const sub of studentMap.values()) {
          const canonicalId = (sub.studentCode === 'DE181802' || !sub.id) ? 'sub-de181802' : sub.id;
          cleaned[canonicalId] = { ...sub, id: canonicalId };
        }

        if (Object.keys(cleaned).length > 0) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
          } catch (e) {}
          return cleaned;
        }
      }
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(defaultMockDatabase));
};

const saveDatabase = (db: Record<string, Submission>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {}
};

let mockDatabase: Record<string, Submission> = getInitialDatabase();

// Giả lập network delay (ms)
const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

/* ==========================================================================
   3. CLIENT-SIDE ZIP PARSER HELPER (SỬ DỤNG JSZIP)
   ========================================================================== */

/**
 * Phân tích trực tiếp file ZIP ở client và tạo cây thư mục phân cấp
 * Có fallback tự động nếu file không đọc được hoặc không có nội dung text
 */
export async function parseZipFileToTree(fileOrBlob: File | Blob): Promise<ZipTreeNode[]> {
  try {
    const zip = await JSZip.loadAsync(fileOrBlob);
    const rootNodes: Record<string, ZipTreeNode> = {};
    const pathMap: Record<string, ZipTreeNode> = {};

    const entries = Object.keys(zip.files).sort();

    for (const relativePath of entries) {
      const zipEntry = zip.files[relativePath];
      const cleanPath = relativePath.replace(/\/$/, '');
      const parts = cleanPath.split('/');
      const isFolder = zipEntry.dir;
      const fileName = parts[parts.length - 1];

      if (!fileName) continue;

      let extension = '';
      if (!isFolder && fileName.includes('.')) {
        extension = fileName.split('.').pop()?.toLowerCase() || '';
      }

      let content = '';
      // Chỉ đọc nội dung text/code cho các đuôi phổ biến để tiết kiệm RAM
      const textExtensions = ['ts', 'js', 'jsx', 'tsx', 'py', 'java', 'html', 'css', 'json', 'md', 'txt', 'sql', 'yml', 'yaml', 'xml'];
      if (!isFolder && textExtensions.includes(extension)) {
        try {
          content = await zipEntry.async('string');
        } catch {
          content = '// [Binary or unreadable file content]';
        }
      }

      const node: ZipTreeNode = {
        id: `node-${cleanPath.replace(/[^a-zA-Z0-9]/g, '-')}`,
        name: fileName,
        path: cleanPath,
        type: isFolder ? 'folder' : 'file',
        extension: isFolder ? undefined : extension,
        size: (zipEntry as any)?._data ? (zipEntry as any)._data.uncompressedSize : undefined,
        children: isFolder ? [] : undefined,
        content: isFolder ? undefined : content
      };

      pathMap[cleanPath] = node;

      if (parts.length === 1) {
        rootNodes[cleanPath] = node;
      } else {
        const parentPath = parts.slice(0, -1).join('/');
        const parentNode = pathMap[parentPath];
        if (parentNode && parentNode.children) {
          parentNode.children.push(node);
        } else {
          rootNodes[cleanPath] = node;
        }
      }
    }

    return Object.values(rootNodes);
  } catch (err) {
    console.warn('Could not parse actual ZIP file, falling back to mock file tree structure.', err);
    return MOCK_ZIP_TREE_CASE_1;
  }
}

/* ==========================================================================
   4. MOCK API SERVICE FUNCTIONS
   ========================================================================== */

export const MockSubmissionService = {
  /**
   * Sinh viên lấy thông tin bài nộp của chính mình
   * GET /api/assignments/:assignmentId/my-submission
   */
  async getMySubmission(assignmentId: string): Promise<Submission | null> {
    await delay(100);
    const db = getInitialDatabase();
    // Ưu tiên trả về bài nộp khớp assignmentId hoặc sub-de181802 có điểm mới nhất
    const sub =
      (assignmentId && db[`asm_${assignmentId}`]) ||
      (assignmentId && Object.values(db).find((s) => s.assignmentId === assignmentId && (s.grade || (s as any).score != null))) ||
      db['sub-de181802'] ||
      Object.values(db).find((s) => s.assignmentId === assignmentId);
    return sub ? JSON.parse(JSON.stringify(sub)) : null;
  },

  /**
   * Sinh viên nộp bài mới hoặc cập nhật bài nộp
   * POST /api/assignments/:assignmentId/submit
   */
  async submitAssignment(assignmentId: string, payload: SubmitAssignmentPayload): Promise<Submission> {
    await delay(300);

    let extractedTree: ZipTreeNode[] | undefined = undefined;
    let fileType: 'pdf' | 'zip' | 'docx' | 'code' | 'other' = 'other';
    let fileName = payload.file?.name || payload.fileMeta?.name || 'SE18D01_TranThiB_BackendArchitecture.zip';
    let fileSize = payload.file?.size || payload.fileMeta?.size || 1024;
    let mimeType = payload.file?.type || payload.fileMeta?.mimeType || 'application/octet-stream';

    if (fileName.endsWith('.zip')) {
      fileType = 'zip';
      if (payload.file) {
        extractedTree = await parseZipFileToTree(payload.file);
      } else {
        extractedTree = MOCK_ZIP_TREE_CASE_1;
      }
    } else if (fileName.endsWith('.pdf')) {
      fileType = 'pdf';
    } else if (/\.(ts|tsx|js|jsx|py|java|cpp|c|cs|html|css)$/i.test(fileName)) {
      fileType = 'code';
    } else if (/\.(docx|doc)$/i.test(fileName)) {
      fileType = 'docx';
    }

    const db = getInitialDatabase();
    // Luôn cập nhật bài nộp của sinh viên hiện tại thay vì tự tạo thêm sinh viên mới
    const existing = db['sub-de181802'] || Object.values(db).find((s) => s.studentCode === 'DE181802');

    const updatedSubmission: Submission = {
      ...(existing || defaultMockDatabase['sub-de181802']),
      id: existing?.id || 'sub-de181802',
      assignmentId: assignmentId || existing?.assignmentId || 'asg-swd392-01',
      studentId: existing?.studentId || 'std-01',
      studentName: existing?.studentName || 'Tran Thi B',
      studentCode: existing?.studentCode || 'DE181802',
      studentEmail: existing?.studentEmail || 'tranb.de181802@fpt.edu.vn',
      status: 'SUBMITTED',
      submittedAt: existing?.submittedAt || new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      version: (existing?.version || 1) + 1,
      file: {
        name: fileName,
        url: payload.file ? URL.createObjectURL(payload.file) : (existing?.file?.url || 'https://cdn.edux.edu.vn/mock-file.zip'),
        size: fileSize,
        mimeType,
        fileType,
        extractedTree: extractedTree || existing?.file?.extractedTree,
        rawFile: payload.file || undefined
      },
      aiAuditLog: payload.aiAuditLog || existing?.aiAuditLog || null,
      grade: existing?.grade || null,
      aiRiskLevel: payload.aiAuditLog?.isDeclared ? 'low' : (existing?.aiRiskLevel || 'low'),
      aiRiskLabel: payload.aiAuditLog?.isDeclared ? 'low AI-transparency risk' : (existing?.aiRiskLabel || 'pure manual / no AI')
    };

    const canonicalId = (updatedSubmission.studentCode === 'DE181802' || !updatedSubmission.id) ? 'sub-de181802' : updatedSubmission.id;
    updatedSubmission.id = canonicalId;
    db[canonicalId] = updatedSubmission;
    for (const key of Object.keys(db)) {
      if (key !== canonicalId && db[key]?.studentCode === updatedSubmission.studentCode) {
        delete db[key];
      }
    }
    mockDatabase = db;
    saveDatabase(db);
    return JSON.parse(JSON.stringify(updatedSubmission));
  },

  /**
   * Giảng viên lấy chi tiết 1 bài nộp để chấm điểm
   * GET /api/assignments/:assignmentId/submissions/:submissionId
   */
  async getSubmissionById(assignmentId: string, submissionId: string): Promise<Submission> {
    await delay(100);
    const db = getInitialDatabase();
    const sub = db[submissionId] || db['sub-de181802'];
    if (!sub) {
      throw new Error(`Submission not found: ${submissionId}`);
    }
    return JSON.parse(JSON.stringify(sub));
  },

  /**
   * Giảng viên cập nhật điểm số & nhận xét (Save Draft hoặc Publish)
   * PUT /api/submissions/:submissionId/grade
   */
  async gradeSubmission(submissionId: string, payload: GradeSubmissionPayload): Promise<Submission> {
    await delay(100);
    const db = getInitialDatabase();
    let existing = db[submissionId] || (submissionId && Object.values(db).find(s => s.id === submissionId || s.studentCode === submissionId)) || db['sub-de181802'];
    if (!existing) {
      existing = defaultMockDatabase['sub-de181802'];
    }

    existing.status = payload.isDraft ? 'SUBMITTED' : 'GRADED';
    existing.grade = {
      score: payload.score,
      feedback: payload.feedback,
      gradedAt: new Date().toISOString(),
      gradedBy: 'ThS. Nguyễn Văn Giảng Viên',
      rubrics: payload.rubrics,
      aiComplianceStatus: payload.aiComplianceStatus || 'compliant',
      isDraft: payload.isDraft ?? false
    };
    (existing as any).score = payload.score;
    (existing as any).feedback = payload.feedback;
    (existing as any).rubrics = payload.rubrics;

    const canonicalId = (existing.studentCode === 'DE181802' || !existing.id) ? 'sub-de181802' : existing.id;
    existing.id = canonicalId;
    db[canonicalId] = existing;

    // Xóa triệt để các key rác và các key trùng lặp sinh viên này
    for (const key of Object.keys(db)) {
      if (key.startsWith('asm_') || key === 'DE181802' || key === 'de181802' || key === 'std-current-user') {
        delete db[key];
      } else if (key !== canonicalId && db[key]?.studentCode === existing.studentCode) {
        delete db[key];
      }
    }

    mockDatabase = db;
    saveDatabase(db);
    return JSON.parse(JSON.stringify(existing));
  },

  /**
   * Giảng viên gửi yêu cầu nộp lại bài
   * POST /api/submissions/:submissionId/resubmit-request
   */
  async requestResubmit(submissionId: string, reason: string): Promise<boolean> {
    await delay(100);
    const db = getInitialDatabase();
    const sub = db[submissionId] || db['sub-de181802'];
    if (sub) {
      sub.resubmitRequested = true;
      sub.resubmitReason = reason;
      db[sub.id] = sub;
      mockDatabase[sub.id] = sub;
      saveDatabase(db);
    }
    return true;
  },

  /**
   * Tiện ích lấy toàn bộ danh sách để hiển thị - Đảm bảo không trùng lặp sinh viên
   */
  async getAllMockSubmissions(): Promise<Submission[]> {
    const db = getInitialDatabase();
    const seen = new Set<string>();
    const list: Submission[] = [];
    for (const [key, sub] of Object.entries(db)) {
      if (!sub || typeof sub !== 'object' || !sub.id) continue;
      if (key.startsWith('asm_') || key === 'DE181802' || key === 'de181802' || key === 'std-current-user') continue;
      const dedupKey = sub.studentCode || sub.id;
      if (!seen.has(dedupKey)) {
        seen.add(dedupKey);
        list.push(sub);
      }
    }
    return list;
  },

  /**
   * Truy xuất snapshot database hiện tại từ localStorage
   */
  getInitialDatabase(): Record<string, Submission> {
    return getInitialDatabase();
  }
};

export default MockSubmissionService;
