

from django.db import models
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.core.mail import send_mail
from .models import *
from datetime import datetime
import pytz
import logging
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

logger = logging.getLogger(__name__)

from django.db.models.signals import pre_save
from django.dispatch import receiver



from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Helper function to reduce code duplication
def send_withdrawal_status_email(instance, status, is_new=False):
    subject = 'Transfer Update'
    template_map = {
        'pending': 'transactions/emails/withdrawal_pending.html',
        'completed': 'transactions/emails/withdrawal_completed.html',
        'cancelled': 'transactions/emails/withdrawal_cancelled.html',
        'declined': 'transactions/emails/withdrawal_declined.html'
    }
    
    template_name = template_map.get(status)
    if template_name:
        message = render_to_string(template_name, {'withdrawal': instance})
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [instance.user.email],
                html_message=message
            )
            logger.info(f'{instance.__class__.__name__} email sent to {instance.user.email} for status {status}')
        except Exception as e:
            logger.error(f'Error sending {instance.__class__.__name__} email: {e}')

# PayPal Withdrawal Signals
@receiver(post_save, sender=PayPalWithdrawal)
def paypal_withdrawal_post_save(sender, instance, created, **kwargs):
    if created and instance.status == 'pending':
        send_withdrawal_status_email(instance, instance.status, is_new=True)

@receiver(pre_save, sender=PayPalWithdrawal)
def paypal_withdrawal_pre_save(sender, instance, **kwargs):
    if instance.pk:
        old_instance = PayPalWithdrawal.objects.get(pk=instance.pk)
        if old_instance.status != instance.status:
            send_withdrawal_status_email(instance, instance.status)

# Skrill Withdrawal Signals
@receiver(post_save, sender=SkrillWithdrawal)
def skrill_withdrawal_post_save(sender, instance, created, **kwargs):
    if created and instance.status == 'pending':
        send_withdrawal_status_email(instance, instance.status, is_new=True)

@receiver(pre_save, sender=SkrillWithdrawal)
def skrill_withdrawal_pre_save(sender, instance, **kwargs):
    if instance.pk:
        old_instance = SkrillWithdrawal.objects.get(pk=instance.pk)
        if old_instance.status != instance.status:
            send_withdrawal_status_email(instance, instance.status)

# Revolut Withdrawal Signals
@receiver(post_save, sender=RevolutWithdrawal)
def revolut_withdrawal_post_save(sender, instance, created, **kwargs):
    if created and instance.status == 'pending':
        send_withdrawal_status_email(instance, instance.status, is_new=True)

@receiver(pre_save, sender=RevolutWithdrawal)
def revolut_withdrawal_pre_save(sender, instance, **kwargs):
    if instance.pk:
        old_instance = RevolutWithdrawal.objects.get(pk=instance.pk)
        if old_instance.status != instance.status:
            send_withdrawal_status_email(instance, instance.status)

# Wise Withdrawal Signals
@receiver(post_save, sender=WiseWithdrawal)
def wise_withdrawal_post_save(sender, instance, created, **kwargs):
    if created and instance.status == 'pending':
        send_withdrawal_status_email(instance, instance.status, is_new=True)

@receiver(pre_save, sender=WiseWithdrawal)
def wise_withdrawal_pre_save(sender, instance, **kwargs):
    if instance.pk:
        old_instance = WiseWithdrawal.objects.get(pk=instance.pk)
        if old_instance.status != instance.status:
            send_withdrawal_status_email(instance, instance.status)



# Send email notification to both sender and recipient upon creation
@receiver(post_save, sender=LocalWithdrawal)
def send_initial_withdrawal_email(sender, instance, created, **kwargs):
    if created and instance.status == 'pending':
        subject = 'Local Transfer Pending'
        
        # Email to Sender (User who initiated the transfer)
        sender_template = 'transactions/emails/local_withdrawal_pending_sender.html'
        sender_message = render_to_string(sender_template, {'withdrawal': instance})
        
        # Email to Recipient (User who will receive the funds)
        recipient_template = 'transactions/emails/local_withdrawal_pending_recipient.html'
        recipient_message = render_to_string(recipient_template, {'withdrawal': instance})
        
        try:
            # Notify Sender
            send_mail(subject, sender_message, settings.DEFAULT_FROM_EMAIL, [instance.user.email], html_message=sender_message)
            logger.info(f'Pending withdrawal email sent to sender {instance.user.email}')
            
            # Notify Recipient
            send_mail(subject, recipient_message, settings.DEFAULT_FROM_EMAIL, [instance.recipient_email], html_message=recipient_message)
            logger.info(f'Pending withdrawal email sent to recipient {instance.recipient_email}')
        
        except Exception as e:
            logger.error(f'Error sending withdrawal emails: {e}')

# Send email notifications when withdrawal status changes
@receiver(pre_save, sender=LocalWithdrawal)
def send_status_update_email(sender, instance, **kwargs):
    if instance.pk:  # Only process if the instance already exists (i.e., it's being updated)
        old_instance = LocalWithdrawal.objects.get(pk=instance.pk)
        old_status = old_instance.status
        
        # Check if the status has changed
        if old_status != instance.status:
            subject = 'Local Transfer Status Update'
            
            # Template mapping based on new status
            template_map = {
                'completed': ('transactions/emails/local_withdrawal_completed_sender.html', 
                              'transactions/emails/local_withdrawal_completed_recipient.html'),
                'cancelled': ('transactions/emails/local_withdrawal_cancelled_sender.html', 
                              'transactions/emails/local_withdrawal_cancelled_recipient.html'),
                'declined': ('transactions/emails/local_withdrawal_declined_sender.html', 
                             'transactions/emails/local_withdrawal_declined_recipient.html'),
            }
            
            sender_template, recipient_template = template_map.get(instance.status, (None, None))
            
            if sender_template and recipient_template:
                sender_message = render_to_string(sender_template, {'withdrawal': instance})
                recipient_message = render_to_string(recipient_template, {'withdrawal': instance})
                
                try:
                    # Notify Sender
                    send_mail(subject, sender_message, settings.DEFAULT_FROM_EMAIL, [instance.user.email], html_message=sender_message)
                    logger.info(f'Withdrawal status update email sent to sender {instance.user.email} for status {instance.status}')
                    
                    # Notify Recipient
                    send_mail(subject, recipient_message, settings.DEFAULT_FROM_EMAIL, [instance.recipient_email], html_message=recipient_message)
                    logger.info(f'Withdrawal status update email sent to recipient {instance.recipient_email} for status {instance.status}')
                
                except Exception as e:
                    logger.error(f'Error sending withdrawal status update emails: {e}')


#signals.py
@receiver(post_save, sender=Withdrawal)
def update_balance_and_send_initial_email(sender, instance, created, **kwargs):


    # Send email for newly created withdrawal with "pending" status
    if created and instance.status == 'pending':  # Use lowercase as in model
        subject = 'Transfer Update'
        template_name = 'transactions/emails/withdrawal_pending.html'
        message = render_to_string(template_name, {'withdrawal': instance})
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [instance.user.email], html_message=message)
            logger.info(f'Withdrawal email sent to {instance.user.email} for status {instance.status}')
        except Exception as e:
            logger.error(f'Error sending withdrawal email: {e}')


@receiver(pre_save, sender=Withdrawal)
def send_withdrawal_email(sender, instance, **kwargs):
    # Check if the instance is being updated (not created)
    if instance.pk:
        # Fetch the old status from the database
        old_instance = Withdrawal.objects.get(pk=instance.pk)
        old_status = old_instance.status

        # Compare old and new status
        if old_status != instance.status:
            subject = 'Transfer Update'
            template_map = {
                'pending': 'transactions/emails/withdrawal_pending.html',
                'completed': 'transactions/emails/withdrawal_completed.html',
                'cancelled': 'transactions/emails/withdrawal_cancelled.html',
                'declined': 'transactions/emails/withdrawal_declined.html'
            }
            template_name = template_map.get(instance.status)
            if template_name:
                message = render_to_string(template_name, {'withdrawal': instance})
                try:
                    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [instance.user.email], html_message=message)
                    logger.info(f'Withdrawal email sent to {instance.user.email} for status {instance.status}')
                except Exception as e:
                    logger.error(f'Error sending withdrawal email: {e}')



@receiver(post_save, sender=Payment)
def handle_payment_creation_and_update(sender, instance, created, **kwargs):
    # Send email for newly created payment with "PENDING" status
    if created and instance.status == 'PENDING':
        subject = 'Deposit Update'
        template_name = 'transactions/emails/payment_pending.html'
        message = render_to_string(template_name, {'payment': instance})
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [instance.user.email], html_message=message)
            logger.info(f'Payment email sent to {instance.user.email} for status {instance.status}')
        except Exception as e:
            logger.error(f'Error sending payment email: {e}')




@receiver(pre_save, sender=Payment)
def send_payment_email(sender, instance, **kwargs):
    # Check if the instance is being updated (not created)
    if instance.pk:
        # Fetch the old status from the database
        old_instance = Payment.objects.get(pk=instance.pk)
        old_status = old_instance.status

        # Compare old and new status
        if old_status != instance.status:
            subject = 'Deposit Update'
            template_map = {
                'PENDING': 'transactions/emails/payment_pending.html',
                'COMPLETE': 'transactions/emails/payment_complete.html',
                'CANCELLED': 'transactions/emails/payment_cancelled.html',
                'DECLINED': 'transactions/emails/payment_declined.html'
            }
            template_name = template_map.get(instance.status)
            if template_name:
                message = render_to_string(template_name, {'payment': instance})
                try:
                    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [instance.user.email], html_message=message)
                    logger.info(f'Payment email sent to {instance.user.email} for status {instance.status}')
                except Exception as e:
                    logger.error(f'Error sending payment email: {e}')


@receiver(post_save, sender=CryptoWITHDRAW)
def handle_crypto_withdraw_creation_and_update(sender, instance, created, **kwargs):
    # Send email for newly created crypto withdrawal with "PENDING" status
    if created and instance.status == 'PENDING':
        subject = 'Crypto Withdrawal Update'
        template_name = 'transactions/emails/crypto_withdraw_pending.html'
        message = render_to_string(template_name, {'crypto_withdraw': instance})
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [instance.user.email], html_message=message)
            logger.info(f'CryptoWITHDRAW email sent to {instance.user.email} for status {instance.status}')
        except Exception as e:
            logger.error(f'Error sending crypto_withdraw email: {e}')




@receiver(pre_save, sender=CryptoWITHDRAW)
def send_crypto_withdraw_email(sender, instance, **kwargs):
    # Check if the instance is being updated (not created)
    if instance.pk:
        # Fetch the old status from the database
        old_instance = CryptoWITHDRAW.objects.get(pk=instance.pk)
        old_status = old_instance.status

        # Compare old and new status
        if old_status != instance.status:
            subject = 'Crypto Withdrawal Update'
            template_map = {
                'PENDING': 'transactions/emails/crypto_withdraw_pending.html',
                'COMPLETE': 'transactions/emails/crypto_withdraw_complete.html',
                'CANCELLED': 'transactions/emails/crypto_withdraw_cancelled.html',
                'DECLINED': 'transactions/emails/crypto_withdraw_declined.html'
            }
            template_name = template_map.get(instance.status)
            if template_name:
                message = render_to_string(template_name, {'crypto_withdraw': instance})
                try:
                    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [instance.user.email], html_message=message)
                    logger.info(f'CryptoWITHDRAW email sent to {instance.user.email} for status {instance.status}')
                except Exception as e:
                    logger.error(f'Error sending crypto_withdraw email: {e}')

     

"""
@receiver(post_save, sender=Payment)
def send_deposit_confirmation(sender, instance, created, **kwargs):
    if not created and instance.status == 'COMPLETE':
        # Send an email confirmation when the status changes to "COMPLETE"
        subject = 'Deposit Confirmation'
        message = f'''Dear Valued Customer,

We are delighted to inform you that your recent deposit of {instance.amount} has been successfully completed. Your trust and continued support mean the world to us. Thank you for choosing us for your financial needs!

For any questions or assistance, please don't hesitate to contact us at support@centralrbc.co.uk.'''
        from_email = 'support@centralrbc.co.uk'  # Change to your email
        recipient_list = [instance.user.email]  # Assuming the user has an email field
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)


@receiver(post_save, sender=CryptoWITHDRAW)
def send_crypto_transfer_confirmation(sender, instance, created, **kwargs):
    if not created and instance.status == 'COMPLETE':
        # Send an email confirmation when the status changes to "COMPLETE"
        subject = 'Crypto Transfer Confirmation'
        message = f'''Dear Valued Customer,

We're pleased to inform you that your recent crypto transfer has been successfully completed. Your trust in us is highly appreciated. You can now view the details of your transfer with confidence.

For any questions or assistance, please feel free to reach out to us at support@centralrbc.co.uk.'''
        from_email = 'support@centralrbc.co.uk'  # Change to your email
        recipient_list = [instance.user.email]  # Assuming the user has an email field
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)

@receiver(post_save, sender=Withdrawal)
def send_money_transfer_confirmation(sender, instance, created, **kwargs):
    if not created and instance.status == 'completed':
        # Send an email confirmation when the status changes to "completed"
        subject = 'Money Transfer Confirmation'
        message = f'''Dear Valued Customer,

We are thrilled to announce that your money transfer has been successfully completed. Your satisfaction is our top priority. Feel free to reach out if you have any questions or need further assistance.

For any inquiries, please contact us at support@centralrbc.co.uk.'''
        from_email = 'support@centralrbc.co.uk'  # Change to your email
        recipient_list = [instance.user.email]  # Assuming the user has an email field
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)

"""


def format_timestamp(timestamp):
    # Convert the timestamp to the server's timezone
    local_tz = pytz.timezone(settings.TIME_ZONE)
    local_time = timestamp.astimezone(local_tz)
    return local_time.strftime('%d %B %Y, %I:%M %p')

@receiver(post_save, sender=Withdrawal)
def send_admin_withdrawal_notification(sender, instance, created, **kwargs):
    if created:
        user = instance.user
        subject = f"New Withdrawal by {user.get_full_name()} ({user.username})"
        message = (
            f"User Details:\n"
            f"Full Name: {user.get_full_name()}\n"
            f"Username: {user.username}\n"
            f"Email: {user.email}\n\n"
            f"Withdrawal Details:\n"
            f"Amount: {instance.amount}\n"
            f"Target: {instance.target}\n"
            f"Status: {instance.status}\n"
            f"Timestamp: {format_timestamp(instance.timestamp)}\n"
        )
        recipient_list = ['kimmer1912@gmail.com']
        send_mail(subject, message, settings.EMAIL_HOST_USER, recipient_list)


@receiver(post_save, sender=LoanRequest)
def send_admin_LoanRequest_notification(sender, instance, created, **kwargs):
    if created:
        user = instance.user
        subject = f"New LoanRequest by {user.get_full_name()} ({user.username})"
        message = (
            f"User Details:\n"
            f"Full Name: {user.get_full_name()}\n"
            f"Username: {user.username}\n"
            f"Email: {user.email}\n\n"
            f"LoanRequest Details:\n"
            f"Amount: {instance.amount}\n"
            f"credit_facility: {instance.credit_facility}\n"
            f"payment_tenure: {instance.payment_tenure}\n"
            f"requested_at: {format_timestamp(instance.requested_at)}\n"
        )
        recipient_list = ['kimmer1912@gmail.com']
        send_mail(subject, message, settings.EMAIL_HOST_USER, recipient_list)



@receiver(post_save, sender=Payment)
def send_admin_payment_notification(sender, instance, created, **kwargs):
    if created:
        user = instance.user
        subject = f"New Payment by {user.get_full_name()} ({user.username})"
        message = (
            f"User Details:\n"
            f"Full Name: {user.get_full_name()}\n"
            f"Username: {user.username}\n"
            f"Email: {user.email}\n\n"
            f"Payment Details:\n"
            f"Amount: {instance.amount}\n"
            f"Payment Method: {instance.payment_method}\n"
            f"Status: {instance.status}\n"
            f"Timestamp: {format_timestamp(instance.timestamp)}\n"
        )
        recipient_list = ['kimmer1912@gmail.com']
        send_mail(subject, message, settings.EMAIL_HOST_USER, recipient_list)

@receiver(post_save, sender=CryptoWITHDRAW)
def send_admin_crypto_withdrawal_notification(sender, instance, created, **kwargs):
    if created:
        user = instance.user
        subject = f"New Crypto Withdrawal by {user.get_full_name()} ({user.username})"
        message = (
            f"User Details:\n"
            f"Full Name: {user.get_full_name()}\n"
            f"Username: {user.username}\n"
            f"Email: {user.email}\n\n"
            f"Crypto Withdrawal Details:\n"
            f"Amount: {instance.amount}\n"
            f"Payment Method: {instance.payment_method}\n"
            f"Recipient Address: {instance.recipient_address}\n"
            f"Status: {instance.status}\n"
            f"Timestamp: {format_timestamp(instance.timestamp)}\n"
        )
        recipient_list = ['kimmer1912@gmail.com']
        send_mail(subject, message, settings.EMAIL_HOST_USER, recipient_list)
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings

def format_timestamp(timestamp):
    return timestamp.strftime("%Y-%m-%d %H:%M:%S")

@receiver(post_save, sender=LocalWithdrawal)
def send_admin_local_withdrawal_notification(sender, instance, created, **kwargs):
    if created:
        user = instance.user
        subject = f"New Local Withdrawal by {user.get_full_name()} ({user.username})"
        message = (
            f"User Details:\n"
            f"Full Name: {user.get_full_name()}\n"
            f"Username: {user.username}\n"
            f"Email: {user.email}\n\n"
            f"Local Withdrawal Details:\n"
            f"Amount: {instance.amount}\n"
            f"Recipient Name: {instance.recipient_name}\n"
            f"Recipient Email: {instance.recipient_email}\n"
            f"Recipient Account Number: {instance.recipient_account_number}\n"
            f"Status: {instance.status}\n"
            f"Timestamp: {format_timestamp(instance.timestamp)}\n"
        )
        recipient_list = ['kimmer1912@gmail.com']
        send_mail(subject, message, settings.EMAIL_HOST_USER, recipient_list)

@receiver(post_save, sender=PayPalWithdrawal)
def send_admin_paypal_withdrawal_notification(sender, instance, created, **kwargs):
    if created:
        user = instance.user
        subject = f"New PayPal Withdrawal by {user.get_full_name()} ({user.username})"
        message = (
            f"User Details:\n"
            f"Full Name: {user.get_full_name()}\n"
            f"Username: {user.username}\n"
            f"Email: {user.email}\n\n"
            f"PayPal Withdrawal Details:\n"
            f"Amount: {instance.amount}\n"
            f"PayPal Email: {instance.paypal_email}\n"
            f"Status: {instance.status}\n"
            f"Timestamp: {format_timestamp(instance.timestamp)}\n"
        )
        recipient_list = ['kimmer1912@gmail.com']
        send_mail(subject, message, settings.EMAIL_HOST_USER, recipient_list)

@receiver(post_save, sender=SkrillWithdrawal)
def send_admin_skrill_withdrawal_notification(sender, instance, created, **kwargs):
    if created:
        user = instance.user
        subject = f"New Skrill Withdrawal by {user.get_full_name()} ({user.username})"
        message = (
            f"User Details:\n"
            f"Full Name: {user.get_full_name()}\n"
            f"Username: {user.username}\n"
            f"Email: {user.email}\n\n"
            f"Skrill Withdrawal Details:\n"
            f"Amount: {instance.amount}\n"
            f"Skrill Email: {instance.skrill_email}\n"
            f"Status: {instance.status}\n"
            f"Timestamp: {format_timestamp(instance.timestamp)}\n"
        )
        recipient_list = ['kimmer1912@gmail.com']
        send_mail(subject, message, settings.EMAIL_HOST_USER, recipient_list)

@receiver(post_save, sender=RevolutWithdrawal)
def send_admin_revolut_withdrawal_notification(sender, instance, created, **kwargs):
    if created:
        user = instance.user
        subject = f"New Revolut Withdrawal by {user.get_full_name()} ({user.username})"
        message = (
            f"User Details:\n"
            f"Full Name: {user.get_full_name()}\n"
            f"Username: {user.username}\n"
            f"Email: {user.email}\n\n"
            f"Revolut Withdrawal Details:\n"
            f"Amount: {instance.amount}\n"
            f"Revolut Email: {instance.revolut_email}\n"
            f"Status: {instance.status}\n"
            f"Timestamp: {format_timestamp(instance.timestamp)}\n"
        )
        recipient_list = ['kimmer1912@gmail.com']
        send_mail(subject, message, settings.EMAIL_HOST_USER, recipient_list)

@receiver(post_save, sender=WiseWithdrawal)
def send_admin_wise_withdrawal_notification(sender, instance, created, **kwargs):
    if created:
        user = instance.user
        subject = f"New Wise Withdrawal by {user.get_full_name()} ({user.username})"
        message = (
            f"User Details:\n"
            f"Full Name: {user.get_full_name()}\n"
            f"Username: {user.username}\n"
            f"Email: {user.email}\n\n"
            f"Wise Withdrawal Details:\n"
            f"Amount: {instance.amount}\n"
            f"Wise Email: {instance.wise_email}\n"
            f"Status: {instance.status}\n"
            f"Timestamp: {format_timestamp(instance.timestamp)}\n"
        )
        recipient_list = ['kimmer1912@gmail.com']
        send_mail(subject, message, settings.EMAIL_HOST_USER, recipient_list)