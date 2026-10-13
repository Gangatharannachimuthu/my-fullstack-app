import { api } from './client';

// Mirrors frontend/src/services/mandramApi.js so the two clients stay recognisably
// the same shape. Same backend, same routes - only the UI differs.

export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
};

export const memberService = {
  getAll: (params) => api.get('/members', { params }),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  remove: (id) => api.delete(`/members/${id}`),
  getHistory: (memberId, params) => api.get(`/members/${memberId}/history`, { params }),
};

export const meetingService = {
  getAll: () => api.get('/meetings'),
  create: (data) => api.post('/meetings', data),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  remove: (id) => api.delete(`/meetings/${id}`),
  getLedger: (id) => api.get(`/meetings/${id}/ledger`),
  getSummary: (id) => api.get(`/meetings/${id}/summary`),
  finalize: (id) => api.post(`/meetings/${id}/finalize`),
  upsertShareContribution: (id, data) => api.post(`/meetings/${id}/share-contributions`, data),
};

export const loanService = {
  getAll: (params) => api.get('/loans', { params }),
  create: (data) => api.post('/loans', data),
  update: (id, data) => api.put(`/loans/${id}`, data),
  remove: (id) => api.delete(`/loans/${id}`),
  recordPayment: (id, data) => api.post(`/loans/${id}/payments`, data),
  updatePayment: (id, meetingId, data) => api.put(`/loans/${id}/payments/${meetingId}`, data),
  removePayment: (id, meetingId) => api.delete(`/loans/${id}/payments/${meetingId}`),
};

export const personalLoanService = {
  getAll: (params) => api.get('/personal-loans', { params }),
  disburse: (data) => api.post('/personal-loans', data),
  repay: (id, data) => api.post(`/personal-loans/${id}/repay`, data),
  update: (id, data) => api.put(`/personal-loans/${id}`, data),
  remove: (id) => api.delete(`/personal-loans/${id}`),
};

export const penaltyService = {
  getAll: (params) => api.get('/penalties', { params }),
  create: (data) => api.post('/penalties', data),
  update: (id, data) => api.put(`/penalties/${id}`, data),
  remove: (id) => api.delete(`/penalties/${id}`),
};

export const expenditureService = {
  getCategories: () => api.get('/expenditure-categories'),
  createCategory: (data) => api.post('/expenditure-categories', data),
  getForMeeting: (id) => api.get(`/meetings/${id}/expenditures`),
  create: (id, data) => api.post(`/meetings/${id}/expenditures`, data),
  update: (entryId, data) => api.put(`/expenditure-entries/${entryId}`, data),
  remove: (entryId) => api.delete(`/expenditure-entries/${entryId}`),
};

export const investmentService = {
  getCategories: () => api.get('/investment-categories'),
  createCategory: (data) => api.post('/investment-categories', data),
  getForMeeting: (id) => api.get(`/meetings/${id}/investments`),
  create: (id, data) => api.post(`/meetings/${id}/investments`, data),
  update: (entryId, data) => api.put(`/investment-entries/${entryId}`, data),
  remove: (entryId) => api.delete(`/investment-entries/${entryId}`),
};

export const chitService = {
  getAll: (params) => api.get('/chits', { params }),
  create: (data) => api.post('/chits', data),
  update: (id, data) => api.put(`/chits/${id}`, data),
  remove: (id) => api.delete(`/chits/${id}`),
};

export const joiningService = {
  getDues: () => api.get('/joining-dues'),
  getCandidates: () => api.get('/joining-candidates'),
  getSuggestion: (memberId) => api.get(`/members/${memberId}/joining-suggestion`),
  createDue: (data) => api.post('/joining-dues', data),
  updateDue: (id, data) => api.put(`/joining-dues/${id}`, data),
  removeDue: (id, force) => api.delete(`/joining-dues/${id}${force ? '?force=1' : ''}`),
  getForMeeting: (id) => api.get(`/meetings/${id}/joining-payments`),
  pay: (id, data) => api.post(`/meetings/${id}/joining-payments`, data),
};

export const messageService = {
  getLoanReminders: (id) => api.get(`/meetings/${id}/loan-reminders`),
};

export const userService = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`),
};
