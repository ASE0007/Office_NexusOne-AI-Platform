"""NexusOne AI - Notification Tasks (Celery)"""

from celery import shared_task
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_email_task(template_name, recipient_email, context):
    """Send email notification"""
    try:
        from django.core.mail import send_mail
        from django.template.loader import render_to_string

        subjects = {
            'email_verification': 'Verify your NexusOne AI account',
            'password_reset': 'Reset your NexusOne AI password',
            'invoice_created': 'New Invoice from NexusOne AI',
            'ticket_created': 'Support Ticket Created',
            'ticket_reply': 'New Reply on Your Support Ticket',
            'leave_approved': 'Leave Request Approved',
            'leave_rejected': 'Leave Request Rejected',
            'task_assigned': 'New Task Assigned to You',
            'payment_received': 'Payment Received',
        }
        subject = subjects.get(template_name, 'NexusOne AI Notification')

        # Simple text email (replace with HTML templates in production)
        message = f"Hello {context.get('user_name', '')},\n\n"

        if template_name == 'email_verification':
            message += f"Please verify your email with token: {context.get('token')}"
        elif template_name == 'password_reset':
            message += f"Your password reset token: {context.get('token')}"
        elif template_name == 'task_assigned':
            message += f"You have been assigned a new task: {context.get('task_title')}"
        else:
            message += "You have a new notification on NexusOne AI."

        message += "\n\nRegards,\nNexusOne AI Team"

        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [recipient_email], fail_silently=True)
        return f"Email sent to {recipient_email}"
    except Exception as e:
        logger.error(f"Email task error: {e}")
        return f"Email failed: {e}"


@shared_task
def send_in_app_notification(user_id, title, message, notification_type='info', link='', meta=None):
    """Create in-app notification and push via WebSocket"""
    try:
        from apps.notifications.models import Notification
        from django.contrib.auth import get_user_model
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        User = get_user_model()
        user = User.objects.get(id=user_id)

        notification = Notification.objects.create(
            user=user,
            company=user.company,
            title=title,
            message=message,
            notification_type=notification_type,
            link=link,
            meta=meta or {},
        )

        # Push via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"notifications_{user_id}",
            {
                'type': 'notification_message',
                'data': {
                    'id': str(notification.id),
                    'title': title,
                    'message': message,
                    'notification_type': notification_type,
                    'link': link,
                    'created_at': str(notification.created_at),
                }
            }
        )
        return f"Notification sent to {user.email}"
    except Exception as e:
        logger.error(f"Notification task error: {e}")
        return f"Notification failed: {e}"


@shared_task
def send_sms_task(phone_number, message):
    """Send SMS via Twilio"""
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(body=message, from_=settings.TWILIO_FROM_NUMBER, to=phone_number)
        return f"SMS sent to {phone_number}"
    except Exception as e:
        logger.error(f"SMS task error: {e}")
        return f"SMS failed: {e}"


@shared_task
def check_overdue_invoices():
    """Periodic task: flag overdue invoices"""
    from apps.billing.models import Invoice
    from django.utils import timezone
    updated = Invoice.objects.filter(
        status='pending', due_date__lt=timezone.now().date()
    ).update(status='overdue')
    return f"Marked {updated} invoices as overdue"


@shared_task
def check_sla_breaches():
    """Periodic task: alert on SLA breaches"""
    from apps.support.models import Ticket
    from django.utils import timezone
    breached = Ticket.objects.filter(
        status__in=['open', 'pending', 'in_progress'],
        sla_due_at__lt=timezone.now()
    )
    for ticket in breached:
        if ticket.assigned_to:
            send_in_app_notification.delay(
                str(ticket.assigned_to.id),
                'SLA Breach Alert',
                f"Ticket #{ticket.ticket_number} has breached SLA!",
                'error',
                f"/support/tickets/{ticket.id}"
            )
    return f"Checked SLA for {breached.count()} tickets"
