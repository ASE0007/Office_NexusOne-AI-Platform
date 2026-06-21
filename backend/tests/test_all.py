"""
NexusOne AI — Automated Test Suite
Run: python manage.py test tests
"""

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
import json
import uuid

User = get_user_model()


# ── Helpers ──────────────────────────────────────────────────────
def make_company():
    from apps.companies.models import Company
    return Company.objects.create(
        name='Test Corp',
        slug=f'test-corp-{uuid.uuid4().hex[:6]}',
        email='test@testcorp.com',
    )


def make_user(company, role='employee', email=None):
    email = email or f'{uuid.uuid4().hex[:6]}@test.com'
    u = User.objects.create_user(
        email=email,
        password='TestPass123!',
        first_name='Test',
        last_name='User',
        role=role,
        company=company,
        is_active=True,
        is_email_verified=True,
    )
    return u


def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def unwrap(data):
    """Safely extract a list from a DRF response body whether it's paginated
    ({'results': [...]}) or a bare list — without misreading an empty,
    falsy [] as 'missing' the way `data.get('results') or data` would."""
    if isinstance(data, dict) and 'results' in data:
        return data['results']
    return data


# ── Auth Tests ────────────────────────────────────────────────────
class AuthTests(TestCase):
    def setUp(self):
        self.company = make_company()
        self.user = make_user(self.company, role='company_admin', email='admin@test.com')
        self.client = APIClient()

    def test_login_success(self):
        response = self.client.post('/api/v1/auth/login/', {
            'email': 'admin@test.com',
            'password': 'TestPass123!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_login_wrong_password(self):
        response = self.client.post('/api/v1/auth/login/', {
            'email': 'admin@test.com',
            'password': 'wrongpassword'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_requires_auth(self):
        response = self.client.get('/api/v1/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_with_auth(self):
        client = auth_client(self.user)
        response = client.get('/api/v1/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'admin@test.com')

    def test_get_users_list(self):
        client = auth_client(self.user)
        response = client.get('/api/v1/auth/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ── CRM Tests ─────────────────────────────────────────────────────
class CRMTests(TestCase):
    def setUp(self):
        self.company = make_company()
        self.admin = make_user(self.company, role='company_admin')
        self.client = auth_client(self.admin)

    def test_create_customer(self):
        response = self.client.post('/api/v1/crm/customers/', {
            'first_name': 'Alice',
            'last_name': 'Smith',
            'email': 'alice@example.com',
            'status': 'active',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['first_name'], 'Alice')

    def test_list_customers(self):
        response = self.client.get('/api/v1/crm/customers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_customer_missing_email(self):
        response = self.client.post('/api/v1/crm/customers/', {
            'first_name': 'Bob',
            'last_name': 'Jones',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_lead(self):
        response = self.client.post('/api/v1/crm/leads/', {
            'first_name': 'Carol',
            'last_name': 'White',
            'email': 'carol@prospect.com',
            'status': 'new',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_customer_belongs_to_company(self):
        # Create customer
        self.client.post('/api/v1/crm/customers/', {
            'first_name': 'Dave', 'last_name': 'Test', 'email': 'dave@test.com',
        }, format='json')
        # Other company cannot see it
        other_company = make_company()
        other_user = make_user(other_company, role='company_admin')
        other_client = auth_client(other_user)
        response = other_client.get('/api/v1/crm/customers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        customer_emails = [c['email'] for c in unwrap(response.data)]
        self.assertNotIn('dave@test.com', customer_emails)

    def test_crm_stats(self):
        response = self.client.get('/api/v1/crm/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ── Projects Tests ────────────────────────────────────────────────
class ProjectTests(TestCase):
    def setUp(self):
        self.company = make_company()
        self.admin = make_user(self.company, role='company_admin')
        self.client = auth_client(self.admin)

    def _create_project(self, title='Test Project', status='active'):
        return self.client.post('/api/v1/projects/', {
            'title': title,
            'status': status,
            'priority': 'medium',
        }, format='json')

    def test_create_project(self):
        response = self._create_project()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Test Project')

    def test_list_projects(self):
        self._create_project('P1')
        self._create_project('P2')
        response = self.client.get('/api/v1/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_project_stats(self):
        response = self.client.get('/api/v1/projects/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_project_title_required(self):
        response = self.client.post('/api/v1/projects/', {'status': 'active'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filter_by_status(self):
        self._create_project('Active P', 'active')
        self._create_project('Planning P', 'planning')
        response = self.client.get('/api/v1/projects/?status=active')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ── Tasks Tests ───────────────────────────────────────────────────
class TaskTests(TestCase):
    def setUp(self):
        self.company = make_company()
        self.admin = make_user(self.company, role='company_admin')
        self.client = auth_client(self.admin)

    def test_create_task(self):
        response = self.client.post('/api/v1/tasks/', {
            'title': 'Test Task',
            'priority': 'high',
            'status': 'pending',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_tasks(self):
        response = self.client.get('/api/v1/tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_task_status(self):
        create = self.client.post('/api/v1/tasks/', {
            'title': 'Task to Update', 'priority': 'low', 'status': 'pending',
        }, format='json')
        self.assertEqual(create.status_code, status.HTTP_201_CREATED)
        task_id = create.data['id']
        update = self.client.patch(f'/api/v1/tasks/{task_id}/', {'status': 'completed'}, format='json')
        self.assertEqual(update.status_code, status.HTTP_200_OK)
        self.assertEqual(update.data['status'], 'completed')

    def test_task_stats(self):
        response = self.client.get('/api/v1/tasks/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ── Billing Tests ─────────────────────────────────────────────────
class BillingTests(TestCase):
    def setUp(self):
        self.company = make_company()
        self.admin = make_user(self.company, role='company_admin')
        self.client = auth_client(self.admin)

    def test_create_invoice(self):
        from datetime import date, timedelta
        response = self.client.post('/api/v1/billing/invoices/', {
            'due_date': str(date.today() + timedelta(days=30)),
            'currency': 'USD',
            'tax_rate': '10',
            'discount': '0',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('invoice_number', response.data)

    def test_list_invoices(self):
        response = self.client.get('/api/v1/billing/invoices/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_billing_stats(self):
        response = self.client.get('/api/v1/billing/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_expense(self):
        from datetime import date
        response = self.client.post('/api/v1/billing/expenses/', {
            'title': 'Office Supplies',
            'amount': '150.00',
            'category': 'office',
            'expense_date': str(date.today()),
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


# ── Support Tests ─────────────────────────────────────────────────
class SupportTests(TestCase):
    def setUp(self):
        self.company = make_company()
        self.admin = make_user(self.company, role='company_admin')
        self.client = auth_client(self.admin)

    def test_create_ticket(self):
        response = self.client.post('/api/v1/support/tickets/', {
            'title': 'Test Bug Report',
            'description': 'Something is broken in the UI',
            'priority': 'high',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('ticket_number', response.data)

    def test_ticket_number_auto_generated(self):
        r = self.client.post('/api/v1/support/tickets/', {
            'title': 'Auto Number Test', 'description': 'Test', 'priority': 'low',
        }, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertTrue(r.data['ticket_number'].startswith('TKT-'))

    def test_list_tickets(self):
        response = self.client.get('/api/v1/support/tickets/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_support_stats(self):
        response = self.client.get('/api/v1/support/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ── HRM Tests ─────────────────────────────────────────────────────
class HRMTests(TestCase):
    def setUp(self):
        self.company = make_company()
        self.admin = make_user(self.company, role='company_admin')
        self.employee_user = make_user(self.company, role='employee')
        self.client = auth_client(self.admin)

    def test_create_employee(self):
        response = self.client.post('/api/v1/hrm/employees/', {
            'user': str(self.employee_user.id),
            'designation': 'Software Engineer',
            'employment_type': 'full_time',
            'status': 'active',
            'basic_salary': '5000.00',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_employees(self):
        response = self.client.get('/api/v1/hrm/employees/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_hrm_stats(self):
        response = self.client.get('/api/v1/hrm/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_leave_request(self):
        from apps.hrm.models import Employee
        from datetime import date, timedelta
        Employee.objects.create(
            company=self.company, user=self.admin,
            employee_id='EMP-TEST-1', designation='Manager',
            employment_type='full_time', status='active',
            date_of_joining=date.today(), basic_salary='3000.00',
        )
        response = self.client.post('/api/v1/hrm/leaves/', {
            'leave_type': 'annual',
            'start_date': str(date.today() + timedelta(days=7)),
            'end_date': str(date.today() + timedelta(days=9)),
            'reason': 'Vacation',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


# ── Inventory Tests ───────────────────────────────────────────────
class InventoryTests(TestCase):
    def setUp(self):
        self.company = make_company()
        self.admin = make_user(self.company, role='company_admin')
        self.client = auth_client(self.admin)

    def test_create_item(self):
        response = self.client.post('/api/v1/inventory/items/', {
            'name': 'Office Chair',
            'sku': 'CHR-001',
            'quantity': 10,
            'minimum_stock': 2,
            'cost_price': '150.00',
            'selling_price': '200.00',
            'unit': 'pcs',
            'status': 'active',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_items(self):
        response = self.client.get('/api/v1/inventory/items/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_inventory_stats(self):
        response = self.client.get('/api/v1/inventory/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_supplier(self):
        response = self.client.post('/api/v1/inventory/suppliers/', {
            'name': 'TechSupply Co',
            'email': 'supply@techsupply.com',
            'phone': '+8801234567890',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


# ── Calendar Tests ────────────────────────────────────────────────
class CalendarTests(TestCase):
    def setUp(self):
        self.company = make_company()
        self.admin = make_user(self.company, role='company_admin')
        self.client = auth_client(self.admin)

    def test_create_event(self):
        response = self.client.post('/api/v1/calendar/events/', {
            'title': 'Team Meeting',
            'event_type': 'meeting',
            'start_datetime': '2025-12-15T10:00:00Z',
            'end_datetime': '2025-12-15T11:00:00Z',
            'is_all_day': False,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Team Meeting')

    def test_list_events(self):
        response = self.client.get('/api/v1/calendar/events/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_event(self):
        create = self.client.post('/api/v1/calendar/events/', {
            'title': 'To Delete',
            'event_type': 'reminder',
            'start_datetime': '2025-12-20T09:00:00Z',
            'end_datetime': '2025-12-20T09:30:00Z',
            'is_all_day': False,
        }, format='json')
        event_id = create.data['id']
        delete = self.client.delete(f'/api/v1/calendar/events/{event_id}/')
        self.assertEqual(delete.status_code, status.HTTP_204_NO_CONTENT)


# ── AI Tests ──────────────────────────────────────────────────────
class AITests(TestCase):
    def setUp(self):
        self.company = make_company()
        self.admin = make_user(self.company, role='company_admin')
        self.client = auth_client(self.admin)

    def test_ai_copilot_requires_question(self):
        response = self.client.post('/api/v1/ai/copilot/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_ai_copilot_returns_answer(self):
        response = self.client.post('/api/v1/ai/copilot/', {
            'question': 'How many customers do we have?'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('answer', response.data)

    def test_ai_business_insights(self):
        response = self.client.get('/api/v1/ai/insights/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('insights', response.data)

    def test_ai_project_risk(self):
        response = self.client.get('/api/v1/ai/project-risks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_ai_task_prioritization(self):
        response = self.client.get('/api/v1/ai/task-prioritization/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ── Security / Multi-Tenancy Tests ────────────────────────────────
class MultiTenancyTests(TestCase):
    """Verify company data isolation"""

    def setUp(self):
        self.company_a = make_company()
        self.company_b = make_company()
        self.user_a = make_user(self.company_a, role='company_admin')
        self.user_b = make_user(self.company_b, role='company_admin')
        self.client_a = auth_client(self.user_a)
        self.client_b = auth_client(self.user_b)

    def test_crm_data_isolation(self):
        # Company A creates customer
        self.client_a.post('/api/v1/crm/customers/', {
            'first_name': 'Private', 'last_name': 'Customer',
            'email': 'private@company-a.com',
        }, format='json')
        # Company B cannot see it
        r = self.client_b.get('/api/v1/crm/customers/')
        emails = [c['email'] for c in unwrap(r.data)]
        self.assertNotIn('private@company-a.com', emails)

    def test_projects_data_isolation(self):
        self.client_a.post('/api/v1/projects/', {
            'title': 'Company A Secret Project', 'status': 'active', 'priority': 'high',
        }, format='json')
        r = self.client_b.get('/api/v1/projects/')
        titles = [p['title'] for p in unwrap(r.data)]
        self.assertNotIn('Company A Secret Project', titles)

    def test_support_tickets_isolation(self):
        self.client_a.post('/api/v1/support/tickets/', {
            'title': 'Private Ticket', 'description': 'Confidential', 'priority': 'low',
        }, format='json')
        r = self.client_b.get('/api/v1/support/tickets/')
        titles = [t['title'] for t in unwrap(r.data)]
        self.assertNotIn('Private Ticket', titles)


# ── Audit Log Tests ───────────────────────────────────────────────
class AuditTests(TestCase):
    def setUp(self):
        self.company = make_company()
        self.admin = make_user(self.company, role='company_admin')
        self.client = auth_client(self.admin)

    def test_audit_logs_accessible(self):
        response = self.client.get('/api/v1/audit/logs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_audit_log_search(self):
        response = self.client.get('/api/v1/audit/logs/?search=POST')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ── Documents Tests ───────────────────────────────────────────────
class DocumentTests(TestCase):
    def setUp(self):
        self.company = make_company()
        self.admin = make_user(self.company, role='company_admin')
        self.client = auth_client(self.admin)

    def test_create_folder(self):
        response = self.client.post('/api/v1/documents/folders/', {
            'name': 'Contracts'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Contracts')

    def test_list_folders(self):
        response = self.client.get('/api/v1/documents/folders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_documents(self):
        response = self.client.get('/api/v1/documents/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ── Approvals Tests ───────────────────────────────────────────────
class ApprovalTests(TestCase):
    def setUp(self):
        self.company = make_company()
        self.admin = make_user(self.company, role='company_admin')
        self.employee = make_user(self.company, role='employee')
        self.admin_client = auth_client(self.admin)
        self.emp_client = auth_client(self.employee)

    def test_create_approval_request(self):
        response = self.emp_client.post('/api/v1/approvals/', {
            'request_type': 'leave',
            'title': 'Annual Leave Request',
            'description': 'Need 3 days off',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_approve_request(self):
        create = self.emp_client.post('/api/v1/approvals/', {
            'request_type': 'expense',
            'title': 'Travel Expense',
            'description': 'Client visit',
        }, format='json')
        approval_id = create.data['id']
        response = self.admin_client.post(f'/api/v1/approvals/{approval_id}/action/', {
            'action': 'approve'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'approved')

    def test_reject_request(self):
        create = self.emp_client.post('/api/v1/approvals/', {
            'request_type': 'purchase',
            'title': 'Equipment Purchase',
            'description': 'New laptop',
        }, format='json')
        approval_id = create.data['id']
        response = self.admin_client.post(f'/api/v1/approvals/{approval_id}/action/', {
            'action': 'reject',
            'reason': 'Budget constraints'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'rejected')


# ── Analytics Tests ───────────────────────────────────────────────
class AnalyticsTests(TestCase):
    def setUp(self):
        self.company = make_company()
        self.admin = make_user(self.company, role='company_admin')
        self.client = auth_client(self.admin)

    def test_dashboard_stats(self):
        response = self.client.get('/api/v1/analytics/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_revenue_chart(self):
        response = self.client.get('/api/v1/analytics/revenue/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ── Notifications Tests ───────────────────────────────────────────
class NotificationsTests(TestCase):
    def setUp(self):
        self.company = make_company()
        self.admin = make_user(self.company, role='company_admin')
        self.client = auth_client(self.admin)

    def test_list_notifications(self):
        response = self.client.get('/api/v1/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_mark_all_read(self):
        response = self.client.post('/api/v1/notifications/mark-all-read/')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])
