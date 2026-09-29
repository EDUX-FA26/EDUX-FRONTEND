// English
const en = {
  // Auth
  login: {
    tagline: 'ACCOUNT AUTHENTICATION',
    title: 'Welcome back to EDUX',
    subtitle: 'FPT University academic & student services portal',
    semesterBadge: 'FALL 2025 SEMESTER • ONLINE SYSTEM',
    emailLabel: 'EMAIL / USERNAME',
    emailPlaceholder: 'email@fpt.edu.vn or username',
    passwordLabel: 'PASSWORD',
    passwordPlaceholder: 'Enter your password',
    forgotPassword: 'Forgot password?',
    rememberMe: 'Remember me on this device',
    submit: 'Sign in to the system',
    submitting: 'Signing in...',
    support: 'Technical Support',
    copyright: '© 2025 FPT University. EDUX Academic & Student Services Portal.',
    validationError: 'Please enter your username and password.',
    brandDesc: 'Smart online learning experience — manage timetables, assignments, grades, notifications, and academic services for FPT University students & lecturers.',
    roleStudent: 'Student',
    roleLecturer: 'Lecturer',
    roleAdmin: 'Admin',
    features: {
      timetable: { label: 'Schedule & Timetable', sub: 'Instant 24/7' },
      lms: { label: 'LMS & Coursera', sub: 'Official Resources' },
      support: { label: '1-on-1 Support', sub: 'Quick Response' },
    },
  },

  // Layout
  layout: {
    semester: 'FALL 2025',
    logout: 'Log out',
    footer: 'Academic & Student Services Online Portal',
    hotline: 'Hotline',
    copyright: '© 2025 FPT Edu',
  },

  // Nav
  nav: {
    overview: 'Overview',
    users: 'Users',
    reports: 'Reports',
    notifications: 'Notifications',
    logs: 'System Logs',
    dashboard: 'Dashboard',
    timetable: 'Timetable',
    grades: 'Grades',
    lms: 'LMS & Coursera',
    services: 'Services',
    streak: 'Learning Streak',
  },

  // Roles
  role: {
    student: 'Student',
    lecturer: 'Lecturer',
    admin: 'Administrator',
    subject_head: 'Subject Head',
  },

  // Dashboard common
  dashboard: {
    portalBadge: 'EDUX Student Portal • FALL 2025',
    lecturerBadge: 'EDUX Lecturer Portal • FALL 2025',
    adminBadge: 'EDUX Admin Console • FALL 2025',
    welcomeStudent: 'Hello,',
    welcomeDesc: 'Welcome back — Here is your academic overview for today.',
    lecturerDesc: 'Here is your teaching overview — manage classes, assignments, and grading.',
    adminDesc: 'EDUX FPT University system overview.',
    adminTitle: 'Admin Dashboard',
    loading: 'Loading...',
    noData: 'No data available',
  },

  // Stats
  stats: {
    totalClasses: 'Enrolled classes',
    pendingAssignments: 'Pending assignments',
    submittedAssignments: 'Submitted assignments',
    averageScore: 'Average score',
    classesTeaching: 'Classes teaching',
    totalStudents: 'Total students',
    pendingSubmissions: 'Pending submissions',
    totalAssignments: 'Total assignments created',
    totalUsers: 'Total users',
    totalLecturers: 'Lecturers',
    activeClasses: 'Active classes',
    currentSemester: '● FALL 2025 Semester',
    allDone: '● All completed',
    needDone: '● Needs attention',
    allGraded: '● All graded',
    needGrade: '● Needs grading',
    total: '● Total submitted',
    allClasses: '● All classes',
    inClasses: '● In active classes',
    active: '● Currently active',
    studentAcc: '● Student accounts',
    lecturerAcc: '● Lecturer accounts',
    allFaculty: '● All faculties',
    noScore: '● No grades yet',
    onScale10: '● Out of 10',
  },

  // Assignments
  assignments: {
    title: 'Recent assignments',
    subtitle: '5 most recent',
    submitted: '✓ Submitted',
    overdue: 'Overdue',
    today: 'Today',
    daysLeft: '{n} days left',
    empty: 'No assignments found',
  },

  // Submissions
  submissions: {
    title: 'Recent submissions',
    pendingLabel: '{n} pending',
    waitGrade: 'Pending grade',
    empty: 'No new submissions',
  },

  // Notifications
  notifications: {
    title: 'Notifications',
    newLabel: '{n} new',
    empty: 'No notifications',
    system: 'System',
    support: 'FPT Academic Support Hotline',
    hotline: 'Hotline: (024) 7300 1866 (Ext. 1)',
  },

  // Users (Admin)
  users: {
    title: 'Newest users',
    subtitle: '5 most recent',
    empty: 'No new users yet',
    student: 'Student',
    lecturer: 'Lecturer',
  },

  // System status
  system: {
    title: 'System Status',
    apiServer: 'API Server',
    database: 'Database',
    fileStorage: 'File Storage',
    running: 'Running',
  },

  // Streak management
  streakPage: {
    badge: 'Streak Management System',
    title: 'Learning Motivation Tracking Center',
    desc: 'Maintain your daily flashcard learning in Vietnam timezone to keep your streak alive, track activity heatmaps, and recover missed streaks.',
    heatmapTitle: 'Learning Activity Heatmap',
    heatmapSubtitle: 'Activity by day (VN Timezone)',
    heatmapEmpty: 'No heatmap data recorded yet.',
    sectionTitle: 'Streak Status by Subject',
    emptySubjects: 'No subject streak data available.',
    completedToday: 'Completed today',
    recoverable: 'Recoverable',
    notStudiedToday: 'Not studied today',
    currentStreak: 'Current streak',
    longestStreak: 'Longest streak',
    recoveryQuota: 'Recovery quota:',
    rescueBtn: 'Recover Streak',
    rescuing: 'Recovering...',
    days: 'days',
    recoverSuccess: 'Streak recovered successfully!',
    recoverError: 'Unable to recover streak at this time.',
    activityHistoryTitle: 'Activity History',
    activityHistorySubtitle: 'Most Recent Flashcard Sessions',
    activityEmpty: 'No activity history recorded yet.',
    typeFlashcardCompleted: 'Flashcard Set Completed',
    typeStreakRecovered: 'Streak Recovered',
    typeQuizCompleted: 'Quiz Completed',
    typeDefault: 'Learning'
  },

  streak: {
    backToList: 'Back to Streak List',
    detailTitle: 'SUBJECT DETAIL',
    codePlaceholder: 'SUBJECT CODE',
    subjectDefault: 'Subject',
    currentStreak: 'Current Streak',
    longestStreak: 'Longest Streak',
    lastActivity: 'Last Activity Date',
    neverStudied: 'Not recorded yet',
    recoveryQuota: 'Remaining Recovery Quota',
    days: 'days',
    times: 'times',
    loadingError: 'Unable to load subject streak details.',
  },

  // 404
  notFound: {
    code: '404',
    title: 'Page not found',
    desc: 'The page you are looking for does not exist or has been moved.',
    back: 'Go back',
  },
};

export default en;
