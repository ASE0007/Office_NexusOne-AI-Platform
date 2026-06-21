/**
 * NexusOne AI - TypeScript Type Definitions
 */

// ── Auth ──────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  bio?: string;
  company?: string;
  company_name?: string;
  theme: 'light' | 'dark';
  language: string;
  timezone: string;
  is_active: boolean;
  is_email_verified: boolean;
  is_2fa_enabled: boolean;
  created_at: string;
  last_login_at?: string;
}

export type UserRole = 'super_admin' | 'company_admin' | 'manager' | 'employee' | 'support_agent' | 'accountant' | 'customer';

// ── Company ───────────────────────────────────────────────────────
export interface Company {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  website?: string;
  logo?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone: string;
  currency: string;
  language: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  max_users: number;
  user_count: number;
  storage_usage_percent: number;
  theme_color: string;
  is_active: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  company: string;
  name: string;
  description?: string;
  head?: string;
  head_name?: string;
  is_active: boolean;
  created_at: string;
}

// ── CRM ───────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  company: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  website?: string;
  avatar?: string;
  address?: string;
  city?: string;
  country?: string;
  status: 'active' | 'inactive' | 'prospect' | 'vip';
  tags: string[];
  source?: string;
  notes?: string;
  total_revenue: number;
  outstanding_balance: number;
  assigned_to?: string;
  assigned_to_name?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  company: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'converted' | 'lost';
  priority: 'low' | 'medium' | 'high';
  source?: string;
  expected_value?: number;
  expected_close_date?: string;
  notes?: string;
  follow_up_date?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  created_at: string;
}

// ── Projects ──────────────────────────────────────────────────────
export interface Project {
  id: string;
  company: string;
  client?: string;
  client_name?: string;
  manager?: string;
  manager_name?: string;
  team_members: TeamMember[];
  title: string;
  description?: string;
  status: ProjectStatus;
  priority: Priority;
  start_date?: string;
  deadline?: string;
  budget?: number;
  spent: number;
  progress: number;
  is_overdue: boolean;
  budget_usage_percent: number;
  task_count: number;
  tags: string[];
  milestones: Milestone[];
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'archived';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
}

export interface Milestone {
  id: string;
  project: string;
  title: string;
  description?: string;
  due_date: string;
  is_completed: boolean;
  completed_at?: string;
}

// ── Tasks ─────────────────────────────────────────────────────────
export interface Task {
  id: string;
  company: string;
  project?: string;
  parent?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  assigned_to?: string;
  assigned_to_name?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours: number;
  checklist: ChecklistItem[];
  checklist_progress: number;
  subtask_count: number;
  is_overdue: boolean;
  tags: string[];
  order: number;
  created_at: string;
  comments: TaskComment[];
}

export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'blocked';

export interface ChecklistItem {
  title: string;
  done: boolean;
}

export interface TaskComment {
  id: string;
  task: string;
  author?: string;
  author_name?: string;
  content: string;
  created_at: string;
}

// ── Billing ───────────────────────────────────────────────────────
export interface Invoice {
  id: string;
  company: string;
  customer: string;
  customer_name?: string;
  project?: string;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
  currency: string;
  is_recurring: boolean;
  notes?: string;
  items: InvoiceItem[];
  payments_received: number;
  created_at: string;
}

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';

export interface InvoiceItem {
  id: string;
  invoice: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Payment {
  id: string;
  company: string;
  invoice: string;
  customer: string;
  amount: number;
  currency: string;
  method: string;
  status: 'success' | 'pending' | 'failed' | 'refunded';
  transaction_id?: string;
  paid_at?: string;
  created_at: string;
}

// ── Support ───────────────────────────────────────────────────────
export interface Ticket {
  id: string;
  company: string;
  customer?: string;
  customer_name?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  category?: string;
  category_name?: string;
  ticket_number: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  sla_due_at?: string;
  is_sla_breached: boolean;
  reply_count: number;
  ai_summary?: string;
  ai_suggested_reply?: string;
  replies: TicketReply[];
  created_at: string;
  updated_at: string;
}

export type TicketStatus = 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed' | 'escalated';

export interface TicketReply {
  id: string;
  ticket: string;
  author?: string;
  author_name?: string;
  author_role?: string;
  content: string;
  is_internal: boolean;
  is_ai_generated: boolean;
  created_at: string;
}

// ── HRM ───────────────────────────────────────────────────────────
export interface Employee {
  id: string;
  user: string;
  user_name: string;
  user_email: string;
  company: string;
  department?: string;
  department_name?: string;
  manager?: string;
  manager_name?: string;
  employee_id: string;
  designation: string;
  employment_type: string;
  status: EmployeeStatus;
  date_of_joining: string;
  basic_salary: number;
  currency: string;
  annual_leave_balance: number;
  sick_leave_balance: number;
  performance_rating?: number;
  created_at: string;
}

export type EmployeeStatus = 'active' | 'inactive' | 'terminated' | 'on_leave';

export interface LeaveRequest {
  id: string;
  employee: string;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by?: string;
  approved_by_name?: string;
  rejection_reason?: string;
  created_at: string;
}

// ── Inventory ─────────────────────────────────────────────────────
export interface InventoryItem {
  id: string;
  company: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  category?: string;
  category_name?: string;
  supplier?: string;
  supplier_name?: string;
  warehouse?: string;
  warehouse_name?: string;
  quantity: number;
  available_quantity: number;
  minimum_stock: number;
  cost_price: number;
  selling_price: number;
  currency: string;
  is_low_stock: boolean;
  status: 'active' | 'inactive' | 'discontinued';
  image?: string;
  created_at: string;
}

// ── Shared ────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  detail?: string;
}
