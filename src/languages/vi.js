// Tiếng Việt
const vi = {
  // Auth
  login: {
    tagline: 'XÁC THỰC TÀI KHOẢN',
    title: 'Chào mừng trở lại EDUX',
    subtitle: 'Cổng thông tin đào tạo & dịch vụ sinh viên FPT University',
    semesterBadge: 'KỲ HỌC FALL 2025 • HỆ THỐNG TRỰC TUYẾN',
    emailLabel: 'EMAIL / TÊN ĐĂNG NHẬP',
    emailPlaceholder: 'email@fpt.edu.vn hoặc tên đăng nhập',
    passwordLabel: 'MẬT KHẨU',
    passwordPlaceholder: 'Nhập mật khẩu của bạn',
    forgotPassword: 'Quên mật khẩu?',
    rememberMe: 'Ghi nhớ đăng nhập trên thiết bị này',
    submit: 'Đăng nhập vào hệ thống',
    submitting: 'Đang xử lý đăng nhập...',
    support: 'Hỗ trợ kỹ thuật',
    copyright: '© 2025 FPT University. Cổng Đào Tạo & Dịch Vụ Sinh Viên EDUX.',
    validationError: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.',
    brandDesc: 'Trải nghiệm học tập trực tuyến thông minh — quản lý thời khóa biểu, bài tập, điểm số, thông báo và hỗ trợ học vụ dành cho sinh viên & giảng viên FPT University.',
    roleStudent: 'Sinh viên',
    roleLecturer: 'Giảng viên',
    roleAdmin: 'Quản trị',
    features: {
      dashboard: { label: 'Dashboard', sub: 'Thống kê thời gian thực' },
      assignment: { label: 'Bài tập', sub: 'Quản lý & nộp bài' },
      notification: { label: 'Thông báo', sub: 'Cập nhật tức thời' },
    },
  },

  // Layout
  layout: {
    semester: 'FALL 2025',
    logout: 'Đăng xuất',
    footer: 'Cổng Đào Tạo & Dịch Vụ Sinh Viên Trực Tuyến',
    hotline: 'Hotline',
    copyright: '© 2025 FPT Edu',
  },

  // Nav
  nav: {
    overview: 'Tổng quan',
    timetable: 'Thời khóa biểu',
    grades: 'Bảng điểm',
    lms: 'LMS & Coursera',
    services: 'Dịch vụ',
  },

  // Roles
  role: {
    student: 'Sinh viên',
    lecturer: 'Giảng viên',
    admin: 'Quản trị viên',
    subject_head: 'Trưởng bộ môn',
  },

  // Dashboard common
  dashboard: {
    portalBadge: 'EDUX Student Portal • FALL 2025',
    lecturerBadge: 'EDUX Lecturer Portal • FALL 2025',
    adminBadge: 'EDUX Admin Console • FALL 2025',
    welcomeStudent: 'Xin chào,',
    welcomeDesc: 'Chào mừng bạn quay lại — Đây là tổng quan học tập của bạn hôm nay.',
    lecturerDesc: 'Đây là tổng quan giảng dạy của bạn — quản lý lớp học, bài tập và chấm bài.',
    adminDesc: 'Tổng quan hệ thống EDUX FPT University.',
    adminTitle: 'Bảng điều khiển Quản trị',
    loading: 'Đang tải...',
    noData: 'Không có dữ liệu',
  },

  // Stats
  stats: {
    totalClasses: 'Lớp học đang tham gia',
    pendingAssignments: 'Bài tập chờ nộp',
    submittedAssignments: 'Bài tập đã nộp',
    averageScore: 'Điểm trung bình',
    classesTeaching: 'Lớp học đang dạy',
    totalStudents: 'Tổng sinh viên',
    pendingSubmissions: 'Bài nộp chờ chấm',
    totalAssignments: 'Tổng bài tập đã tạo',
    totalUsers: 'Tổng người dùng',
    totalLecturers: 'Giảng viên',
    activeClasses: 'Lớp học hoạt động',
    currentSemester: '● Học kỳ FALL 2025',
    allDone: '● Đã hoàn thành tất cả',
    needDone: '● Cần hoàn thành sớm',
    allGraded: '● Đã chấm hết',
    needGrade: '● Cần chấm điểm',
    total: '● Tổng số bài đã nộp',
    allClasses: '● Tất cả lớp học',
    inClasses: '● Trong các lớp đang dạy',
    active: '● Đang hoạt động',
    studentAcc: '● Tài khoản sinh viên',
    lecturerAcc: '● Tài khoản giảng viên',
    allFaculty: '● Tất cả khoa / môn',
    noScore: '● Chưa có điểm',
    onScale10: '● Trên thang 10',
  },

  // Assignments
  assignments: {
    title: 'Bài tập gần đây',
    subtitle: '5 bài gần nhất',
    submitted: '✓ Đã nộp',
    overdue: 'Quá hạn',
    today: 'Hôm nay',
    daysLeft: 'Còn {n} ngày',
    empty: 'Không có bài tập nào',
  },

  // Submissions
  submissions: {
    title: 'Bài nộp gần đây',
    pendingLabel: '{n} chờ chấm',
    waitGrade: 'Chờ chấm',
    empty: 'Không có bài nộp mới',
  },

  // Notifications
  notifications: {
    title: 'Thông báo',
    newLabel: '{n} mới',
    empty: 'Không có thông báo',
    system: 'Hệ thống',
    support: 'Đường dây Hỗ trợ Học vụ FPT',
    hotline: 'Hotline: (024) 7300 1866 (Nhánh 1)',
  },

  // Users (Admin)
  users: {
    title: 'Người dùng mới nhất',
    subtitle: '5 gần nhất',
    empty: 'Chưa có người dùng mới',
    student: 'Sinh viên',
    lecturer: 'Giảng viên',
  },

  // System status
  system: {
    title: 'Trạng thái Hệ thống',
    apiServer: 'API Server',
    database: 'Database',
    fileStorage: 'File Storage',
    running: 'Hoạt động',
  },

  // 404
  notFound: {
    code: '404',
    title: 'Không tìm thấy trang',
    desc: 'Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.',
    back: 'Quay lại',
  },
};

export default vi;
