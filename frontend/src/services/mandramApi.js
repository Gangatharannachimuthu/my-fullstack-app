import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const mandram = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Identify the signed-in account so the admin-only user routes can authorise.
mandram.interceptors.request.use((config) => {
  const username = localStorage.getItem('user_name');
  if (username) {
    config.headers['X-Username'] = username;
  }
  return config;
});

export const authService = {
  login: (username, password) => mandram.post('/auth/login', { username, password }),
};

export const userService = {
  getAll: () => mandram.get('/users'),
  create: (data) => mandram.post('/users', data),
  update: (id, data) => mandram.put(`/users/${id}`, data),
  remove: (id) => mandram.delete(`/users/${id}`),
};

export const memberService = {
  getAll: (params) => mandram.get('/members', { params }),
  create: (data) => mandram.post('/members', data),
  update: (id, data) => mandram.put(`/members/${id}`, data),
  remove: (id) => mandram.delete(`/members/${id}`),
  getHistory: (memberId, params) => mandram.get(`/members/${memberId}/history`, { params }),
};

export const meetingService = {
  getAll: () => mandram.get('/meetings'),
  create: (data) => mandram.post('/meetings', data),
  update: (meetingId, data) => mandram.put(`/meetings/${meetingId}`, data),
  remove: (meetingId) => mandram.delete(`/meetings/${meetingId}`),
  getLedger: (meetingId) => mandram.get(`/meetings/${meetingId}/ledger`),
  getSummary: (meetingId) => mandram.get(`/meetings/${meetingId}/summary`),
  finalize: (meetingId) => mandram.post(`/meetings/${meetingId}/finalize`),
  upsertShareContribution: (meetingId, data) =>
    mandram.post(`/meetings/${meetingId}/share-contributions`, data),
};

export const loanService = {
  getAll: (params) => mandram.get('/loans', { params }),
  create: (data) => mandram.post('/loans', data),
  update: (loanId, data) => mandram.put(`/loans/${loanId}`, data),
  remove: (loanId) => mandram.delete(`/loans/${loanId}`),
  recordPayment: (loanId, data) => mandram.post(`/loans/${loanId}/payments`, data),
  updatePayment: (loanId, meetingId, data) => mandram.put(`/loans/${loanId}/payments/${meetingId}`, data),
  removePayment: (loanId, meetingId) => mandram.delete(`/loans/${loanId}/payments/${meetingId}`),
};

export const personalLoanService = {
  getAll: (params) => mandram.get('/personal-loans', { params }),
  disburse: (data) => mandram.post('/personal-loans', data),
  repay: (loanId, data) => mandram.post(`/personal-loans/${loanId}/repay`, data),
  update: (loanId, data) => mandram.put(`/personal-loans/${loanId}`, data),
  remove: (loanId) => mandram.delete(`/personal-loans/${loanId}`),
};

export const penaltyService = {
  getAll: (params) => mandram.get('/penalties', { params }),
  create: (data) => mandram.post('/penalties', data),
  update: (id, data) => mandram.put(`/penalties/${id}`, data),
  remove: (id) => mandram.delete(`/penalties/${id}`),
};

export const expenditureService = {
  getCategories: () => mandram.get('/expenditure-categories'),
  createCategory: (data) => mandram.post('/expenditure-categories', data),
  getForMeeting: (meetingId) => mandram.get(`/meetings/${meetingId}/expenditures`),
  create: (meetingId, data) => mandram.post(`/meetings/${meetingId}/expenditures`, data),
  update: (entryId, data) => mandram.put(`/expenditure-entries/${entryId}`, data),
  remove: (entryId) => mandram.delete(`/expenditure-entries/${entryId}`),
};

export const investmentService = {
  getCategories: () => mandram.get('/investment-categories'),
  createCategory: (data) => mandram.post('/investment-categories', data),
  getForMeeting: (meetingId) => mandram.get(`/meetings/${meetingId}/investments`),
  create: (meetingId, data) => mandram.post(`/meetings/${meetingId}/investments`, data),
  update: (entryId, data) => mandram.put(`/investment-entries/${entryId}`, data),
  remove: (entryId) => mandram.delete(`/investment-entries/${entryId}`),
};

export const joiningService = {
  getDues: () => mandram.get('/joining-dues'),
  getCandidates: () => mandram.get('/joining-candidates'),
  getSuggestion: (memberId) => mandram.get(`/members/${memberId}/joining-suggestion`),
  createDue: (data) => mandram.post('/joining-dues', data),
  updateDue: (dueId, data) => mandram.put(`/joining-dues/${dueId}`, data),
  removeDue: (dueId, force) => mandram.delete(`/joining-dues/${dueId}${force ? '?force=1' : ''}`),
  getForMeeting: (meetingId) => mandram.get(`/meetings/${meetingId}/joining-payments`),
  pay: (meetingId, data) => mandram.post(`/meetings/${meetingId}/joining-payments`, data),
};

export const messageService = {
  getLoanReminders: (meetingId) => mandram.get(`/meetings/${meetingId}/loan-reminders`),
};

export const chitService = {
  getAll: (params) => mandram.get('/chits', { params }),
  create: (data) => mandram.post('/chits', data),
  update: (chitId, data) => mandram.put(`/chits/${chitId}`, data),
  remove: (chitId) => mandram.delete(`/chits/${chitId}`),
};

export const reportService = {
  getTrustValueTrend: () => mandram.get('/reports/trust-value-trend'),
};

export default mandram;
