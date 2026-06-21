"""NexusOne AI - Create Demo Data Management Command"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta, date
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Create demo data for NexusOne AI'

    def handle(self, *args, **options):
        self.stdout.write('Creating demo data...')

        # Create Company
        from apps.companies.models import Company, Department
        company, created = Company.objects.get_or_create(
            slug='nexusone-demo',
            defaults={
                'name': 'NexusOne Demo Corp',
                'email': 'demo@nexusone.ai',
                'plan': 'professional',
                'max_users': 50,
                'theme_color': '#6366f1',
            }
        )

        # Create Admin User
        admin, created = User.objects.get_or_create(
            email='admin@nexusone.ai',
            defaults={
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'company_admin',
                'company': company,
                'is_active': True,
                'is_email_verified': True,
            }
        )
        if created:
            admin.set_password('Admin@123456')
            admin.save()

        # Create Manager
        manager, _ = User.objects.get_or_create(
            email='manager@nexusone.ai',
            defaults={
                'first_name': 'Sarah',
                'last_name': 'Johnson',
                'role': 'manager',
                'company': company,
                'is_active': True,
                'is_email_verified': True,
            }
        )
        if _:
            manager.set_password('Manager@123456')
            manager.save()

        # Create Departments
        departments_data = ['Engineering', 'Sales', 'Support', 'HR', 'Finance']
        departments = []
        for dept_name in departments_data:
            dept, _ = Department.objects.get_or_create(name=dept_name, company=company)
            departments.append(dept)

        # Create Customers
        from apps.crm.models import Customer, Lead
        customer_data = [
            ('Alice', 'Smith', 'alice@techcorp.com', 'TechCorp', 'active', 'vip'),
            ('Bob', 'Johnson', 'bob@globalinc.com', 'Global Inc', 'active', 'active'),
            ('Carol', 'Williams', 'carol@startup.io', 'StartupIO', 'prospect', 'prospect'),
            ('David', 'Brown', 'david@enterprise.com', 'Enterprise Ltd', 'active', 'active'),
            ('Emma', 'Davis', 'emma@solutions.net', 'Solutions Net', 'active', 'active'),
        ]
        customers = []
        for fn, ln, email, company_name, status, _ in customer_data:
            c, created = Customer.objects.get_or_create(
                email=email,
                company=company,
                defaults={
                    'first_name': fn, 'last_name': ln,
                    'company_name': company_name, 'status': status,
                    'total_revenue': random.uniform(5000, 50000),
                    'created_by': admin, 'assigned_to': manager,
                }
            )
            customers.append(c)

        # Create Leads
        leads_data = [
            ('Frank', 'Miller', 'frank@prospect.com', 'new', 'high'),
            ('Grace', 'Wilson', 'grace@bigco.com', 'qualified', 'medium'),
            ('Henry', 'Taylor', 'henry@startup.co', 'proposal', 'high'),
        ]
        for fn, ln, email, status, priority in leads_data:
            Lead.objects.get_or_create(
                email=email, company=company,
                defaults={
                    'first_name': fn, 'last_name': ln,
                    'status': status, 'priority': priority,
                    'expected_value': random.uniform(10000, 100000),
                    'created_by': admin, 'assigned_to': manager,
                }
            )

        # Create Projects
        from apps.projects.models import Project, Milestone
        projects_data = [
            ('Website Redesign', 'active', 'high', 75),
            ('Mobile App Development', 'active', 'critical', 45),
            ('ERP Integration', 'planning', 'medium', 10),
            ('Data Migration', 'completed', 'high', 100),
            ('Security Audit', 'on_hold', 'high', 30),
        ]
        projects = []
        for title, status, priority, progress in projects_data:
            p, _ = Project.objects.get_or_create(
                title=title, company=company,
                defaults={
                    'description': f'This is the {title} project managed by NexusOne AI.',
                    'status': status, 'priority': priority, 'progress': progress,
                    'deadline': date.today() + timedelta(days=random.randint(10, 90)),
                    'budget': random.uniform(10000, 100000),
                    'manager': manager, 'client': customers[0] if customers else None,
                    'created_by': admin,
                }
            )
            if _ and customers:
                p.team.add(manager)
            projects.append(p)

        # Create Tasks
        from apps.tasks.models import Task
        task_titles = [
            'Set up CI/CD pipeline', 'Design database schema',
            'Build REST API endpoints', 'Create UI components',
            'Write unit tests', 'Deploy to staging',
            'Performance optimization', 'Security review',
            'User documentation', 'Code review',
        ]
        for i, title in enumerate(task_titles):
            Task.objects.get_or_create(
                title=title, company=company,
                defaults={
                    'status': ['pending', 'in_progress', 'review', 'completed', 'blocked'][i % 5],
                    'priority': ['low', 'medium', 'high', 'critical'][i % 4],
                    'project': projects[i % len(projects)] if projects else None,
                    'assigned_to': manager, 'created_by': admin,
                    'due_date': timezone.now() + timedelta(days=random.randint(1, 30)),
                    'estimated_hours': random.uniform(2, 16),
                    'checklist': [
                        {'title': 'Research', 'done': True},
                        {'title': 'Implementation', 'done': i % 2 == 0},
                        {'title': 'Testing', 'done': False},
                    ],
                }
            )

        # Create Invoices
        from apps.billing.models import Invoice, InvoiceItem, Payment
        for i, customer in enumerate(customers[:3]):
            invoice, created = Invoice.objects.get_or_create(
                invoice_number=f'INV-2024-{str(i+1).zfill(5)}',
                defaults={
                    'company': company, 'customer': customer,
                    'status': ['paid', 'pending', 'overdue'][i % 3],
                    'issue_date': date.today() - timedelta(days=30),
                    'due_date': date.today() + timedelta(days=30 - (i * 20)),
                    'subtotal': 5000 * (i + 1),
                    'total': 5000 * (i + 1),
                    'currency': 'USD',
                    'created_by': admin,
                }
            )
            if created:
                InvoiceItem.objects.create(
                    invoice=invoice,
                    description=f'Professional Services - {customer.company_name}',
                    quantity=10, unit_price=500, amount=5000 * (i + 1)
                )

        # Create Support Tickets
        from apps.support.models import Ticket, TicketCategory
        cat, _ = TicketCategory.objects.get_or_create(name='Technical', company=company, defaults={'color': '#6366f1'})
        ticket_data = [
            ('Login issue on mobile app', 'Cannot login from iOS', 'open', 'high'),
            ('Payment gateway error', 'Payment fails on checkout', 'in_progress', 'critical'),
            ('Export feature not working', 'Excel export fails for large datasets', 'pending', 'medium'),
            ('Feature request: Dark mode', 'Please add dark mode support', 'resolved', 'low'),
        ]
        for i, (title, desc, status, priority) in enumerate(ticket_data):
            Ticket.objects.get_or_create(
                ticket_number=f'TKT-2024-{str(i+1).zfill(6)}',
                defaults={
                    'company': company, 'title': title, 'description': desc,
                    'status': status, 'priority': priority, 'category': cat,
                    'customer': customers[i % len(customers)] if customers else None,
                    'assigned_to': manager,
                    'sla_due_at': timezone.now() + timedelta(hours=24),
                    'created_by': admin,
                }
            )

        # Create HRM - Employees
        from apps.hrm.models import Employee
        Employee.objects.get_or_create(
            user=manager,
            defaults={
                'company': company,
                'employee_id': 'EMP-001',
                'designation': 'Engineering Manager',
                'department': departments[0] if departments else None,
                'employment_type': 'full_time',
                'status': 'active',
                'date_of_joining': date.today() - timedelta(days=365),
                'basic_salary': 8500,
            }
        )

        # Inventory
        from apps.inventory.models import Category, InventoryItem
        cat_hw, _ = Category.objects.get_or_create(name='Hardware', company=company)
        cat_sw, _ = Category.objects.get_or_create(name='Software', company=company)
        inventory_items = [
            ('MacBook Pro 16"', 'MBP-16-M3', cat_hw, 15, 5, 2500, 3000),
            ('Office Chair', 'CHAIR-001', cat_hw, 30, 10, 200, 350),
            ('Software License', 'SW-LIC-001', cat_sw, 50, 20, 100, 200),
            ('Monitor 27"', 'MON-27-4K', cat_hw, 8, 5, 400, 600),
        ]
        for name, sku, cat, qty, min_stock, cost, selling in inventory_items:
            InventoryItem.objects.get_or_create(
                sku=sku, company=company,
                defaults={
                    'name': name, 'category': cat,
                    'quantity': qty, 'minimum_stock': min_stock,
                    'cost_price': cost, 'selling_price': selling,
                    'created_by': admin,
                }
            )

        # Notifications
        from apps.notifications.models import Notification
        notif_data = [
            (admin, 'Welcome to NexusOne AI!', 'Your account is ready. Explore all features.', 'success'),
            (admin, 'New Invoice Created', 'Invoice INV-2024-00001 has been created.', 'info'),
            (admin, 'SLA Alert', 'Ticket TKT-2024-000002 is approaching SLA deadline.', 'warning'),
            (manager, 'Task Assigned', 'You have been assigned: Set up CI/CD pipeline', 'info'),
        ]
        for user, title, msg, ntype in notif_data:
            Notification.objects.get_or_create(
                user=user, title=title,
                defaults={'company': company, 'message': msg, 'notification_type': ntype}
            )

        self.stdout.write(self.style.SUCCESS(
            '\n✅ Demo data created successfully!\n'
            '📧 Admin: admin@nexusone.ai | Password: Admin@123456\n'
            '👤 Manager: manager@nexusone.ai | Password: Manager@123456\n'
        ))
