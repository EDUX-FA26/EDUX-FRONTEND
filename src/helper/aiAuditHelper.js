/**
 * AI Audit Data Helper - EDUX Platform (Frontend)
 * Chuẩn hóa dữ liệu Khai báo Liêm chính Học thuật AI (ART-AI)
 * Hỗ trợ mô hình Đa phân rã theo Module (Multi-Scope AI Audit Declarations)
 * Đảm bảo 100% Tương thích ngược (Backward Compatibility) với các bài nộp cũ.
 */

export const COMPUTATIONAL_THINKING_KEYS = [
  'decomposition',
  'pattern_recognition',
  'abstraction',
  'algorithmic_thinking',
  'reflection',
];

export const RUBRIC_TITLES = {
  decomposition: 'Decomposition (Phân rã bài toán)',
  pattern_recognition: 'Pattern Recognition (Nhận diện mẫu & quy luật)',
  pattern: 'Pattern Recognition (Nhận diện mẫu & quy luật)',
  abstraction: 'Abstraction (Trừu tượng hóa & Mô hình)',
  algorithmic_thinking: 'Algorithmic Thinking (Tư duy thuật toán)',
  algorithmic: 'Algorithmic Thinking (Tư duy thuật toán)',
  reflection: 'Reflection (Phản tư & Đánh giá giải pháp)',
};

/**
 * Tạo một bộ 5 declarations mặc định cho một scope
 */
export function createDefaultDeclarations() {
  return {
    decomposition: {
      tool: 'ChatGPT',
      aiTool: 'ChatGPT',
      decision: 'Partially Modified',
      prompt: '',
      response: '',
      responseSummary: '',
      reflection: '',
      studentReflection: '',
      isCompleted: false,
    },
    pattern_recognition: {
      tool: 'ChatGPT',
      aiTool: 'ChatGPT',
      decision: 'Fully Accepted',
      prompt: '',
      response: '',
      responseSummary: '',
      reflection: '',
      studentReflection: '',
      isCompleted: false,
    },
    abstraction: {
      tool: 'ChatGPT',
      aiTool: 'ChatGPT',
      decision: 'Fully Accepted',
      prompt: '',
      response: '',
      responseSummary: '',
      reflection: '',
      studentReflection: '',
      isCompleted: false,
    },
    algorithmic_thinking: {
      tool: 'ChatGPT',
      aiTool: 'ChatGPT',
      decision: 'Fully Accepted',
      prompt: '',
      response: '',
      responseSummary: '',
      reflection: '',
      studentReflection: '',
      isCompleted: false,
    },
    reflection: {
      tool: 'ChatGPT',
      aiTool: 'ChatGPT',
      decision: 'Fully Accepted',
      prompt: '',
      response: '',
      responseSummary: '',
      reflection: '',
      studentReflection: '',
      isCompleted: false,
    },
    // Alias tiện dụng
    pattern: {
      tool: 'ChatGPT',
      aiTool: 'ChatGPT',
      decision: 'Fully Accepted',
      prompt: '',
      response: '',
      responseSummary: '',
      reflection: '',
      studentReflection: '',
      isCompleted: false,
    },
    algorithmic: {
      tool: 'ChatGPT',
      aiTool: 'ChatGPT',
      decision: 'Fully Accepted',
      prompt: '',
      response: '',
      responseSummary: '',
      reflection: '',
      studentReflection: '',
      isCompleted: false,
    },
  };
}

/**
 * Tạo một scope mặc định mới
 * @param {number} index
 * @param {string} title
 * @param {string} description
 */
export function createEmptyScope(index = 0, title = '', description = '') {
  const scopeId = `scope-${Date.now()}-${index + 1}`;
  return {
    id: scopeId,
    scopeId: scopeId,
    scope_title: title || `Module ${index + 1}`,
    title: title || `Module ${index + 1}`,
    scope_description: description || '',
    description: description || '',
    declarations: createDefaultDeclarations(),
  };
}

/**
 * Chuẩn hóa một item declaration đơn lẻ để tương thích cả camelCase và snake_case
 */
export function normalizeDeclarationItem(item) {
  if (!item || typeof item !== 'object') {
    return {
      tool: 'Not Declared',
      aiTool: 'Not Declared',
      decision: 'Not Declared',
      prompt: '',
      response: '',
      responseSummary: '',
      aiResponseSummary: '',
      reflection: '',
      studentReflection: '',
      isCompleted: false,
    };
  }

  const tool =
    item.tool ||
    item.aiTool ||
    item.ai_tool ||
    item.ai_tool_used ||
    item.toolUsed ||
    item.tool_used ||
    'ChatGPT';

  const decision =
    item.decision ||
    item.decisionStatus ||
    item.decision_status ||
    item.yourDecision ||
    item.your_decision ||
    'Fully Accepted';

  const prompt =
    item.prompt ||
    item.prompt_used ||
    item.promptUsed ||
    item.promptContent ||
    item.prompt_content ||
    item.input_used ||
    item.inputUsed ||
    '';

  const response =
    item.response ||
    item.responseSummary ||
    item.response_summary ||
    item.aiResponseSummary ||
    item.ai_response_summary ||
    item.aiRespond ||
    item.ai_respond ||
    item.aiResponse ||
    item.ai_response ||
    item.output ||
    '';

  const reflection =
    item.reflection ||
    item.studentReflection ||
    item.student_reflection ||
    item.selfReflection ||
    item.self_reflection ||
    item.evaluation ||
    item.self_evaluation ||
    '';

  const hasPrompt = Boolean(prompt && prompt.trim().length > 0);
  const hasResponse = Boolean(response && response.trim().length > 0);
  const hasReflection = Boolean(reflection && reflection.trim().length > 0);

  // Chỉ tính là hoàn thành khi ĐÃ ĐIỀN ĐỦ cả 3 mục text: Prompt, Response, Reflection (không tính chỉ chọn dropdown)
  const isCompleted = hasPrompt && hasResponse && hasReflection;
  const isPartiallyFilled = (hasPrompt || hasResponse || hasReflection) && !isCompleted;

  // Nếu cả 3 trường text đều trống thì coi như chưa khai báo
  const finalDecision = isCompleted || isPartiallyFilled
    ? (decision || 'Partially Modified')
    : 'Not Declared';

  return {
    tool,
    aiTool: tool,
    decision: finalDecision,
    prompt,
    response,
    responseSummary: response,
    aiResponseSummary: response,
    reflection,
    studentReflection: reflection,
    isCompleted,
    isPartiallyFilled,
  };
}

/**
 * Chuẩn hóa một map declarations (5 tiêu chí)
 */
export function normalizeDeclarationsMap(decs) {
  const result = createDefaultDeclarations();

  if (!decs || typeof decs !== 'object') {
    return result;
  }

  // Hỗ trợ trường hợp decs là Array các phases (như mappedPhases)
  if (Array.isArray(decs)) {
    decs.forEach((item) => {
      const k = (item.phaseKey || item.rubricKey || item.key || item.name || '').toLowerCase();
      let targetKey = null;
      if (k.includes('decomp')) targetKey = 'decomposition';
      else if (k.includes('pattern')) targetKey = 'pattern_recognition';
      else if (k.includes('abstr')) targetKey = 'abstraction';
      else if (k.includes('algo')) targetKey = 'algorithmic_thinking';
      else if (k.includes('reflec')) targetKey = 'reflection';

      if (targetKey) {
        result[targetKey] = normalizeDeclarationItem(item);
      }
    });
  } else {
    // Decomposition
    const decomp = decs.decomposition || decs.Decomposition || decs['decomposition'];
    if (decomp) result.decomposition = normalizeDeclarationItem(decomp);

    // Pattern Recognition
    const pattern =
      decs.pattern_recognition ||
      decs.patternRecognition ||
      decs.pattern ||
      decs['pattern_recognition'] ||
      decs['Pattern Recognition'];
    if (pattern) {
      const item = normalizeDeclarationItem(pattern);
      result.pattern_recognition = item;
      result.pattern = item;
    }

    // Abstraction
    const abstraction = decs.abstraction || decs.Abstraction || decs['abstraction'];
    if (abstraction) result.abstraction = normalizeDeclarationItem(abstraction);

    // Algorithmic Thinking
    const algo =
      decs.algorithmic_thinking ||
      decs.algorithmicThinking ||
      decs.algorithmic ||
      decs['algorithmic_thinking'] ||
      decs['Algorithmic Thinking'];
    if (algo) {
      const item = normalizeDeclarationItem(algo);
      result.algorithmic_thinking = item;
      result.algorithmic = item;
    }

    // Reflection
    const reflection =
      decs.reflection ||
      decs.aiReflection ||
      decs.ai_reflection ||
      decs['reflection'] ||
      decs['AI Reflection'];
    if (reflection) result.reflection = normalizeDeclarationItem(reflection);
  }

  result.pattern = result.pattern_recognition;
  result.algorithmic = result.algorithmic_thinking;

  return result;
}

/**
 * Chuẩn hóa một Scope object
 */
export function normalizeScope(scope, index = 0) {
  if (!scope || typeof scope !== 'object') {
    return createEmptyScope(index);
  }

  const id = scope.id || scope.scopeId || `scope-${index + 1}`;
  const scope_title =
    scope.scope_title ||
    scope.title ||
    scope.name ||
    scope.module_name ||
    `Module ${index + 1}`;
  const scope_description =
    scope.scope_description ||
    scope.description ||
    scope.desc ||
    '';

  const rawDecs = scope.declarations || scope.aiAuditLog || scope;
  const declarations = normalizeDeclarationsMap(rawDecs);

  return {
    id,
    scopeId: id,
    scope_title,
    title: scope_title,
    scope_description,
    description: scope_description,
    declarations,
  };
}

/**
 * Helper function chính: normalizeAuditData(rawData)
 * Dùng chung cho cả FE và BE.
 * 
 * @param {any} rawData Chuỗi JSON hoặc Object lưu trong submission.note hoặc declarations
 * @returns {{ version: string, scopes: Array<{ id: string, scope_title: string, scope_description: string, declarations: Object }> }}
 */
export function normalizeAuditData(rawData) {
  if (!rawData) {
    return {
      version: '2.0',
      scopes: [
        {
          id: 'default',
          scopeId: 'default',
          scope_title: 'Khai báo tổng quan',
          title: 'Khai báo tổng quan',
          scope_description: '',
          description: '',
          declarations: createDefaultDeclarations(),
        },
      ],
    };
  }

  let parsed = rawData;

  // Nếu là string JSON
  if (typeof parsed === 'string') {
    let trimmed = parsed.trim();
    if (trimmed.toLowerCase().startsWith('note:')) {
      trimmed = trimmed.substring(5).trim();
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch (e) {
      // Chuỗi thuần không phải JSON -> trả về default với note trong description
      return {
        version: '2.0',
        scopes: [
          {
            id: 'default',
            scopeId: 'default',
            scope_title: 'Khai báo tổng quan',
            title: 'Khai báo tổng quan',
            scope_description: trimmed,
            description: trimmed,
            declarations: createDefaultDeclarations(),
          },
        ],
      };
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      version: '2.0',
      scopes: [createEmptyScope(0, 'Khai báo tổng quan')],
    };
  }

  // 1. Trường hợp rawData ĐÃ CÓ mảng scopes (Multi-Scope format v2.0)
  if (Array.isArray(parsed.scopes) && parsed.scopes.length > 0) {
    const normalizedScopes = parsed.scopes.map((s, idx) => normalizeScope(s, idx));
    return {
      version: parsed.version || '2.0',
      scopes: normalizedScopes,
    };
  }

  // 2. Trường hợp rawData là dạng cũ (Single-Scope với object declarations phẳng)
  let rawDeclarations = parsed.declarations || parsed.aiAuditLog || null;

  // Nếu object chính là map declarations (chứa các key decomposition, pattern...)
  if (!rawDeclarations && (parsed.decomposition || parsed.pattern || parsed.abstraction || parsed.algorithmic || parsed.reflection)) {
    rawDeclarations = parsed;
  }

  const normalizedDeclarations = normalizeDeclarationsMap(rawDeclarations);

  return {
    version: '2.0',
    scopes: [
      {
        id: 'default',
        scopeId: 'default',
        scope_title: parsed.scope_title || parsed.title || 'Khai báo tổng quan',
        title: parsed.scope_title || parsed.title || 'Khai báo tổng quan',
        scope_description: parsed.scope_description || parsed.description || '',
        description: parsed.scope_description || parsed.description || '',
        declarations: normalizedDeclarations,
      },
    ],
  };
}

export default normalizeAuditData;
