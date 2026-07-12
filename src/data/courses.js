export const courses = [
  // Semester 1 — Core
  { code: 'MBAEX-8101', name: 'Organizational Behavior', semester: 1, kind: 'core', area: null },
  { code: 'MBAEX-8102', name: 'Data Analysis and Optimization', semester: 1, kind: 'core', area: null },
  { code: 'MBAEX-8103', name: 'Managerial Economics', semester: 1, kind: 'core', area: null },
  { code: 'MBAEX-8104', name: 'Accounting for Managerial Decisions', semester: 1, kind: 'core', area: null },
  { code: 'MBAEX-8105', name: 'Marketing Management', semester: 1, kind: 'core', area: null },
  { code: 'MBAEX-8106', name: 'Managerial Finance', semester: 1, kind: 'core', area: null },
  { code: 'MBAEX-8107', name: 'Information Technology for Organizations', semester: 1, kind: 'core', area: null },

  // Semester 2 — Core
  { code: 'MBAEX-8201', name: 'Human Resource Management', semester: 2, kind: 'core', area: null },
  { code: 'MBAEX-8202', name: 'Operations Management for Executives', semester: 2, kind: 'core', area: null },
  { code: 'MBAEX-8203', name: 'Economic Environment of Business', semester: 2, kind: 'core', area: null },
  { code: 'MBAEX-8204', name: 'Strategic Financial Management', semester: 2, kind: 'core', area: null },
  { code: 'MBAEX-8205', name: 'Marketing Research', semester: 2, kind: 'core', area: null },
  { code: 'MBAEX-8206', name: 'Business Communication', semester: 2, kind: 'core', area: null },
  { code: 'MBAEX-8207', name: 'Delivering Information Services', semester: 2, kind: 'core', area: null },

  // Semester 3 — Core
  { code: 'MBAEX-8301', name: 'Business Ethics and Corporate Governance', semester: 3, kind: 'core', area: null },
  { code: 'MBAEX-8302', name: 'Strategic Analysis', semester: 3, kind: 'core', area: null },
  { code: 'MBAEX-8303', name: 'Sustainable Business and Development', semester: 3, kind: 'core', area: null },

  // Semester 4 — Core
  { code: 'MBAEX-8401', name: 'Global Business Management', semester: 4, kind: 'core', area: null },
  { code: 'MBAEX-8402', name: 'Legal Environment of Business', semester: 4, kind: 'core', area: null },
  { code: 'MBAEX-8403', name: 'Leadership and Change Management', semester: 4, kind: 'core', area: null },
  { code: 'MBAEX-8404', name: 'Strategic Management', semester: 4, kind: 'core', area: null },

  // Electives — Culture, Philosophy and Management
  { code: 'MBAEX-9101', name: 'Cultural, Philosophical and Spiritual Foundations of Management', semester: null, kind: 'elective', area: 'Culture, Philosophy & Management' },
  { code: 'MBAEX-9102', name: 'Value Based Leadership: Learning to Create High Performing Organizations', semester: null, kind: 'elective', area: 'Culture, Philosophy & Management' },
  { code: 'MBAEX-9103', name: 'Personal Power and Leadership through Asian Values', semester: null, kind: 'elective', area: 'Culture, Philosophy & Management' },

  // Electives — Economics and Public Policy
  { code: 'MBAEX-9201', name: 'Economic Growth and Development', semester: null, kind: 'elective', area: 'Economics & Public Policy' },
  { code: 'MBAEX-9202', name: 'Economics of Innovation', semester: null, kind: 'elective', area: 'Economics & Public Policy' },

  // Electives — Entrepreneurship
  { code: 'MBAEX-9301', name: 'Entrepreneurship, Creativity and Innovation', semester: null, kind: 'elective', area: 'Entrepreneurship' },
  { code: 'MBAEX-9302', name: 'Managing Human Resources for SMEs and Start-ups', semester: null, kind: 'elective', area: 'Entrepreneurship' },

  // Electives — Finance
  { code: 'MBAEX-9401', name: 'Quantitative Analysis of Financial Decisions', semester: null, kind: 'elective', area: 'Finance' },
  { code: 'MBAEX-9402', name: 'Security Analysis and Portfolio Management', semester: null, kind: 'elective', area: 'Finance' },
  { code: 'MBAEX-9403', name: 'Financial Markets and Institutions', semester: null, kind: 'elective', area: 'Finance' },
  { code: 'MBAEX-9404', name: 'International Financial Management', semester: null, kind: 'elective', area: 'Finance' },
  { code: 'MBAEX-9405', name: 'Merchant Banking and Financial Services', semester: null, kind: 'elective', area: 'Finance' },
  { code: 'MBAEX-9406', name: 'Management Control System', semester: null, kind: 'elective', area: 'Finance' },
  { code: 'MBAEX-9407', name: 'Corporate Taxation', semester: null, kind: 'elective', area: 'Finance' },
  { code: 'MBAEX-9408', name: 'Financial Derivatives', semester: null, kind: 'elective', area: 'Finance' },
  { code: 'MBAEX-9409', name: 'Project Planning, Analysis, and Management', semester: null, kind: 'elective', area: 'Finance' },
  { code: 'MBAEX-9410', name: 'Financial Risk Management', semester: null, kind: 'elective', area: 'Finance' },
  { code: 'MBAEX-9411', name: 'Fixed Income Securities', semester: null, kind: 'elective', area: 'Finance' },
  { code: 'MBAEX-9412', name: 'Financial Analytics', semester: null, kind: 'elective', area: 'Finance' },
  { code: 'MBAEX-9413', name: 'Mergers and Corporate Restructuring', semester: null, kind: 'elective', area: 'Finance' },
  { code: 'MBAEX-9414', name: 'Financial Reporting', semester: null, kind: 'elective', area: 'Finance' },

  // Electives — Information Technology Management
  { code: 'MBAEX-9501', name: 'Business Process Re-engineering', semester: null, kind: 'elective', area: 'IT Management' },
  { code: 'MBAEX-9502', name: 'Strategic Management of Information Technology', semester: null, kind: 'elective', area: 'IT Management' },
  { code: 'MBAEX-9503', name: 'Managing E-Business', semester: null, kind: 'elective', area: 'IT Management' },

  // Electives — Marketing
  { code: 'MBAEX-9601', name: 'Consumer Behaviour', semester: null, kind: 'elective', area: 'Marketing' },
  { code: 'MBAEX-9602', name: 'Advertising Management', semester: null, kind: 'elective', area: 'Marketing' },
  { code: 'MBAEX-9603', name: 'Competitive Marketing', semester: null, kind: 'elective', area: 'Marketing' },
  { code: 'MBAEX-9604', name: 'Business Marketing', semester: null, kind: 'elective', area: 'Marketing' },
  { code: 'MBAEX-9605', name: 'Sales Force Management', semester: null, kind: 'elective', area: 'Marketing' },
  { code: 'MBAEX-9606', name: 'Service Marketing', semester: null, kind: 'elective', area: 'Marketing' },
  { code: 'MBAEX-9607', name: 'Sales Promotion Management', semester: null, kind: 'elective', area: 'Marketing' },
  { code: 'MBAEX-9608', name: 'Brand Management', semester: null, kind: 'elective', area: 'Marketing' },
  { code: 'MBAEX-9609', name: 'Digital Marketing', semester: null, kind: 'elective', area: 'Marketing' },
  { code: 'MBAEX-9610', name: 'Retailing Management', semester: null, kind: 'elective', area: 'Marketing' },
  { code: 'MBAEX-9611', name: 'Marketing Channel', semester: null, kind: 'elective', area: 'Marketing' },
  { code: 'MBAEX-9612', name: 'Marketing Analytics', semester: null, kind: 'elective', area: 'Marketing' },
  { code: 'MBAEX-9613', name: 'Advanced Marketing Research', semester: null, kind: 'elective', area: 'Marketing' },
  { code: 'MBAEX-9614', name: 'Global Marketing', semester: null, kind: 'elective', area: 'Marketing' },

  // Electives — OB & Human Resource Management
  { code: 'MBAEX-9701', name: 'Human Resource Metrics and Analytics', semester: null, kind: 'elective', area: 'OB & HRM' },
  { code: 'MBAEX-9702', name: 'Performance Management and Training Interventions', semester: null, kind: 'elective', area: 'OB & HRM' },
  { code: 'MBAEX-9703', name: 'Managing Training, Learning and Development', semester: null, kind: 'elective', area: 'OB & HRM' },
  { code: 'MBAEX-9704', name: 'Negotiation and Influence Skills', semester: null, kind: 'elective', area: 'OB & HRM' },
  { code: 'MBAEX-9705', name: 'Compensation and Rewards Management', semester: null, kind: 'elective', area: 'OB & HRM' },
  { code: 'MBAEX-9706', name: 'Management of Industrial Relations', semester: null, kind: 'elective', area: 'OB & HRM' },
  { code: 'MBAEX-9707', name: 'Cross Cultural and Global Management', semester: null, kind: 'elective', area: 'OB & HRM' },
  { code: 'MBAEX-9708', name: 'Managing Interpersonal and Group Processes', semester: null, kind: 'elective', area: 'OB & HRM' },
  { code: 'MBAEX-9709', name: 'Managing Diversity', semester: null, kind: 'elective', area: 'OB & HRM' },
  { code: 'MBAEX-9710', name: 'Counselling Skills for Managers', semester: null, kind: 'elective', area: 'OB & HRM' },
  { code: 'MBAEX-9711', name: 'Human Resource Development: Strategies and Systems', semester: null, kind: 'elective', area: 'OB & HRM' },
  { code: 'MBAEX-9712', name: 'Change and Intervention Strategies', semester: null, kind: 'elective', area: 'OB & HRM' },
  { code: 'MBAEX-9713', name: 'Talent Management', semester: null, kind: 'elective', area: 'OB & HRM' },
  { code: 'MBAEX-9714', name: 'Organizational Leadership: Inspiration, Dilemmas and Action', semester: null, kind: 'elective', area: 'OB & HRM' },

  // Electives — Operations Management and Decision Sciences
  { code: 'MBAEX-9801', name: 'Operations Strategy', semester: null, kind: 'elective', area: 'Operations & Decision Sciences' },
  { code: 'MBAEX-9802', name: 'Total Quality Management for Business Excellence', semester: null, kind: 'elective', area: 'Operations & Decision Sciences' },
  { code: 'MBAEX-9803', name: 'Systems Optimization and Management Science', semester: null, kind: 'elective', area: 'Operations & Decision Sciences' },
  { code: 'MBAEX-9804', name: 'Supply Chain Management', semester: null, kind: 'elective', area: 'Operations & Decision Sciences' },
  { code: 'MBAEX-9805', name: 'Predictive Analytics and Big Data', semester: null, kind: 'elective', area: 'Operations & Decision Sciences' },
  { code: 'MBAEX-9806', name: 'World Class Manufacturing', semester: null, kind: 'elective', area: 'Operations & Decision Sciences' },
  { code: 'MBAEX-9807', name: 'Supply Chain Analytics', semester: null, kind: 'elective', area: 'Operations & Decision Sciences' },
  { code: 'MBAEX-9808', name: 'Integrated Management Systems', semester: null, kind: 'elective', area: 'Operations & Decision Sciences' },
  { code: 'MBAEX-9809', name: 'Technology, Innovation and New Product Management', semester: null, kind: 'elective', area: 'Operations & Decision Sciences' },
  { code: 'MBAEX-9810', name: 'Service Operations Management', semester: null, kind: 'elective', area: 'Operations & Decision Sciences' },
  { code: 'MBAEX-9811', name: 'Sustainable Operations Management', semester: null, kind: 'elective', area: 'Operations & Decision Sciences' },
  { code: 'MBAEX-9812', name: 'Artificial Intelligence and Deep Learning', semester: null, kind: 'elective', area: 'Operations & Decision Sciences' },
  { code: 'MBAEX-9813', name: 'Managerial Decision Modelling', semester: null, kind: 'elective', area: 'Operations & Decision Sciences' },

  // Electives — Strategy
  { code: 'MBAEX-9901', name: 'Strategic Capability Building and Innovation', semester: null, kind: 'elective', area: 'Strategy' },
  { code: 'MBAEX-9902', name: 'Strategic Management in Social Enterprises', semester: null, kind: 'elective', area: 'Strategy' },
  { code: 'MBAEX-9903', name: 'International Business Strategy', semester: null, kind: 'elective', area: 'Strategy' },
  { code: 'MBAEX-9904', name: 'Strategic Management of Start-ups', semester: null, kind: 'elective', area: 'Strategy' },

  // Project Study
  { code: 'MBAEX-9907', name: 'Project Study', semester: null, kind: 'elective', area: 'Project Study' },
];

export const ELECTIVE_AREAS = [
  'Culture, Philosophy & Management',
  'Economics & Public Policy',
  'Entrepreneurship',
  'Finance',
  'IT Management',
  'Marketing',
  'OB & HRM',
  'Operations & Decision Sciences',
  'Strategy',
  'Project Study',
];

export function getCoursesBySemester(sem) {
  return courses.filter(c => c.semester === sem);
}

export function getElectives() {
  return courses.filter(c => c.kind === 'elective');
}

export function getElectivesByArea() {
  const grouped = {};
  for (const area of ELECTIVE_AREAS) {
    grouped[area] = courses.filter(c => c.kind === 'elective' && c.area === area);
  }
  return grouped;
}

export function getCourseByCode(code) {
  return courses.find(c => c.code === code);
}
