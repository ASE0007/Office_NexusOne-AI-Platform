/**
 * NexusOne AI - API Service
 * Axios instance with JWT auth, refresh token, and error handling
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_URL}/api/v1/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login/', { email, password }),
  register: (data: object) => api.post('/auth/register/', data),
  logout: (refresh: string) => api.post('/auth/logout/', { refresh }),
  refreshToken: (refresh: string) => api.post('/auth/token/refresh/', { refresh }),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data: object) => api.patch('/auth/profile/', data),
  changePassword: (data: object) => api.post('/auth/change-password/', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password/', { email }),
  resetPassword: (data: object) => api.post('/auth/reset-password/', data),
  verifyEmail: (token: string) => api.post('/auth/verify-email/', { token }),
  getLoginHistory: () => api.get('/auth/login-history/'),
  getSessions: () => api.get('/auth/sessions/'),
  getUsers: (params?: object) => api.get('/auth/users/', { params }),
};

// ── Companies ─────────────────────────────────────────────────────
export const companiesAPI = {
  get: () => api.get('/companies/'),
  update: (data: object) => api.patch('/companies/', data),
  create: (data: object) => api.post('/companies/create/', data),
  getStats: () => api.get('/companies/stats/'),
  getDepartments: () => api.get('/companies/departments/'),
  createDepartment: (data: object) => api.post('/companies/departments/', data),
  updateDepartment: (id: string, data: object) => api.patch(`/companies/departments/${id}/`, data),
  deleteDepartment: (id: string) => api.delete(`/companies/departments/${id}/`),
};

// ── CRM ───────────────────────────────────────────────────────────
export const crmAPI = {
  // Customers
  getCustomers: (params?: object) => api.get('/crm/customers/', { params }),
  getCustomer: (id: string) => api.get(`/crm/customers/${id}/`),
  createCustomer: (data: object) => api.post('/crm/customers/', data),
  updateCustomer: (id: string, data: object) => api.patch(`/crm/customers/${id}/`, data),
  deleteCustomer: (id: string) => api.delete(`/crm/customers/${id}/`),
  // Customer sub-resources
  getCustomerNotes: (customerId: string) => api.get(`/crm/customers/${customerId}/notes/`),
  addCustomerNote: (customerId: string, data: object) => api.post(`/crm/customers/${customerId}/notes/`, data),
  getCustomerDocs: (customerId: string) => api.get(`/crm/customers/${customerId}/documents/`),
  uploadCustomerDoc: (customerId: string, data: FormData) =>
    api.post(`/crm/customers/${customerId}/documents/`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getCustomerActivities: (customerId: string) => api.get(`/crm/customers/${customerId}/activities/`),
  addCustomerActivity: (customerId: string, data: object) => api.post(`/crm/customers/${customerId}/activities/`, data),
  // Leads
  getLeads: (params?: object) => api.get('/crm/leads/', { params }),
  getLead: (id: string) => api.get(`/crm/leads/${id}/`),
  createLead: (data: object) => api.post('/crm/leads/', data),
  updateLead: (id: string, data: object) => api.patch(`/crm/leads/${id}/`, data),
  convertLead: (id: string) => api.post(`/crm/leads/${id}/convert/`),
  getStats: () => api.get('/crm/stats/'),
};

// ── Projects ──────────────────────────────────────────────────────
export const projectsAPI = {
  getAll: (params?: object) => api.get('/projects/', { params }),
  get: (id: string) => api.get(`/projects/${id}/`),
  create: (data: object) => api.post('/projects/', data),
  update: (id: string, data: object) => api.patch(`/projects/${id}/`, data),
  delete: (id: string) => api.delete(`/projects/${id}/`),
  getKanban: (projectId: string) => api.get(`/projects/${projectId}/kanban/`),
  getMilestones: (projectId: string) => api.get(`/projects/${projectId}/milestones/`),
  createMilestone: (projectId: string, data: object) => api.post(`/projects/${projectId}/milestones/`, data),
  getStats: () => api.get('/projects/stats/'),
};

// ── Tasks ─────────────────────────────────────────────────────────
export const tasksAPI = {
  getAll: (params?: object) => api.get('/tasks/', { params }),
  get: (id: string) => api.get(`/tasks/${id}/`),
  create: (data: object) => api.post('/tasks/', data),
  update: (id: string, data: object) => api.patch(`/tasks/${id}/`, data),
  delete: (id: string) => api.delete(`/tasks/${id}/`),
  getComments: (taskId: string) => api.get(`/tasks/${taskId}/comments/`),
  addComment: (taskId: string, data: object) => api.post(`/tasks/${taskId}/comments/`, data),
  getTimeLogs: (taskId: string) => api.get(`/tasks/${taskId}/timelogs/`),
  addTimeLog: (taskId: string, data: object) => api.post(`/tasks/${taskId}/timelogs/`, data),
  reorder: (data: object) => api.post('/tasks/reorder/', data),
};

// ── Billing ───────────────────────────────────────────────────────
export const billingAPI = {
  // Invoices
  getInvoices: (params?: object) => api.get('/billing/invoices/', { params }),
  getInvoice: (id: string) => api.get(`/billing/invoices/${id}/`),
  createInvoice: (data: object) => api.post('/billing/invoices/', data),
  updateInvoice: (id: string, data: object) => api.patch(`/billing/invoices/${id}/`, data),
  addInvoiceItem: (invoiceId: string, data: object) => api.post(`/billing/invoices/${invoiceId}/items/`, data),
  downloadPDF: (id: string) => api.get(`/billing/invoices/${id}/pdf/`, { responseType: 'blob' }),
  // Payments
  getPayments: (params?: object) => api.get('/billing/payments/', { params }),
  createPayment: (data: object) => api.post('/billing/payments/', data),
  // Expenses
  getExpenses: (params?: object) => api.get('/billing/expenses/', { params }),
  createExpense: (data: FormData) => api.post('/billing/expenses/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateExpense: (id: string, data: object) => api.patch(`/billing/expenses/${id}/`, data),
  getStats: () => api.get('/billing/stats/'),
};

// ── Support ───────────────────────────────────────────────────────
export const supportAPI = {
  getTickets: (params?: object) => api.get('/support/tickets/', { params }),
  getTicket: (id: string) => api.get(`/support/tickets/${id}/`),
  createTicket: (data: object) => api.post('/support/tickets/', data),
  updateTicket: (id: string, data: object) => api.patch(`/support/tickets/${id}/`, data),
  getReplies: (ticketId: string) => api.get(`/support/tickets/${ticketId}/replies/`),
  addReply: (ticketId: string, data: object) => api.post(`/support/tickets/${ticketId}/replies/`, data),
  getAISummary: (ticketId: string) => api.post(`/support/tickets/${ticketId}/ai-summary/`),
  getCategories: () => api.get('/support/categories/'),
  getStats: () => api.get('/support/stats/'),
};

// ── HRM ───────────────────────────────────────────────────────────
export const hrmAPI = {
  getEmployees: (params?: object) => api.get('/hrm/employees/', { params }),
  getEmployee: (id: string) => api.get(`/hrm/employees/${id}/`),
  createEmployee: (data: object) => api.post('/hrm/employees/', data),
  updateEmployee: (id: string, data: object) => api.patch(`/hrm/employees/${id}/`, data),
  getAttendance: (params?: object) => api.get('/hrm/attendance/', { params }),
  markAttendance: (data: object) => api.post('/hrm/attendance/today/', data),
  getLeaves: (params?: object) => api.get('/hrm/leaves/', { params }),
  createLeave: (data: object) => api.post('/hrm/leaves/', data),
  approveLeave: (id: string, data: object) => api.post(`/hrm/leaves/${id}/approve/`, data),
  getSalaries: (params?: object) => api.get('/hrm/salaries/', { params }),
  createSalary: (data: object) => api.post('/hrm/salaries/', data),
  getStats: () => api.get('/hrm/stats/'),
};

// ── Inventory ─────────────────────────────────────────────────────
export const inventoryAPI = {
  getItems: (params?: object) => api.get('/inventory/items/', { params }),
  getItem: (id: string) => api.get(`/inventory/items/${id}/`),
  createItem: (data: FormData | object) => api.post('/inventory/items/', data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
  updateItem: (id: string, data: object) => api.patch(`/inventory/items/${id}/`, data),
  deleteItem: (id: string) => api.delete(`/inventory/items/${id}/`),
  getMovements: (params?: object) => api.get('/inventory/movements/', { params }),
  addMovement: (data: object) => api.post('/inventory/movements/', data),
  getCategories: () => api.get('/inventory/categories/'),
  createCategory: (data: object) => api.post('/inventory/categories/', data),
  getSuppliers: () => api.get('/inventory/suppliers/'),
  createSupplier: (data: object) => api.post('/inventory/suppliers/', data),
  getWarehouses: () => api.get('/inventory/warehouses/'),
  getStats: () => api.get('/inventory/stats/'),
};

// ── Analytics ─────────────────────────────────────────────────────
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard/'),
  getRevenue: (params?: object) => api.get('/analytics/revenue/', { params }),
  getCustomers: () => api.get('/analytics/customers/'),
  getEmployees: () => api.get('/analytics/employees/'),
};

// ── AI ────────────────────────────────────────────────────────────
export const aiAPI = {
  askCopilot: (question: string) => api.post('/ai/copilot/', { question }),
  getInsights: () => api.get('/ai/insights/'),
  getRevenueAnalysis: () => api.get('/ai/revenue-analysis/'),
  getProjectRisks: () => api.get('/ai/project-risks/'),
  getTaskPrioritization: () => api.get('/ai/task-prioritization/'),
};

// ── Notifications ─────────────────────────────────────────────────
export const notificationsAPI = {
  getAll: (params?: object) => api.get('/notifications/', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count/'),
  markRead: (id: string) => api.post(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/mark-all-read/'),
};

// ── Documents ─────────────────────────────────────────────────────
export const documentsAPI = {
  getFolders: () => api.get('/documents/folders/'),
  createFolder: (data: object) => api.post('/documents/folders/', data),
  getAll: (params?: object) => api.get('/documents/', { params }),
  upload: (data: FormData) => api.post('/documents/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  get: (id: string) => api.get(`/documents/${id}/`),
  delete: (id: string) => api.delete(`/documents/${id}/`),
};

// ── Approvals ─────────────────────────────────────────────────────
export const approvalsAPI = {
  getAll: (params?: object) => api.get('/approvals/', { params }),
  create: (data: object) => api.post('/approvals/', data),
  approve: (id: string, data: object) => api.post(`/approvals/${id}/action/`, data),
};

// ── Audit ─────────────────────────────────────────────────────────
export const auditAPI = {
  getLogs: (params?: object) => api.get('/audit/logs/', { params }),
};

// ── Calendar ──────────────────────────────────────────────────────
export const calendarAPI = {
  getEvents: (params?: object) => api.get('/calendar/events/', { params }),
  getEvent: (id: string) => api.get(`/calendar/events/${id}/`),
  createEvent: (data: object) => api.post('/calendar/events/', data),
  updateEvent: (id: string, data: object) => api.patch(`/calendar/events/${id}/`, data),
  deleteEvent: (id: string) => api.delete(`/calendar/events/${id}/`),
  getToday: () => api.get('/calendar/events/today/'),
  getUpcoming: (limit?: number) => api.get('/calendar/events/upcoming/', { params: { limit } }),
};
