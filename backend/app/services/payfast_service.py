"""
============================================================================
PAYFAST INTEGRATION SERVICE
============================================================================

PURPOSE:
Handle all PayFast payment processing for recruiter subscriptions.

FEATURES:
- Subscription payments (recurring)
- One-time payments
- ITN (Instant Transaction Notification) webhook handling
- Payment verification
- Subscription management

PAYFAST DOCS:
https://developers.payfast.co.za/docs

============================================================================
"""

import os
import hashlib
import logging
import urllib.parse
from typing import Dict, Optional
from datetime import datetime, timedelta
from decimal import Decimal

logger = logging.getLogger(__name__)

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import (
    RecruiterSubscription,
    SubscriptionPlan,
    PaymentTransaction,
    PayFastWebhook,
    Invoice
)


class PayFastService:
    """
    PayFast payment integration for South African payments
    
    Supports:
    - Credit cards
    - EFT (Electronic Funds Transfer)
    - Instant EFT
    - SnapScan
    - Zapper
    - Masterpass
    - Mobicred
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
        
        # PayFast credentials (from environment)
        self.merchant_id = os.getenv("PAYFAST_MERCHANT_ID")
        self.merchant_key = os.getenv("PAYFAST_MERCHANT_KEY")
        self.passphrase = os.getenv("PAYFAST_PASSPHRASE")  # Optional but recommended
        
        # Use sandbox for testing
        self.use_sandbox = os.getenv("PAYFAST_SANDBOX", "true").lower() == "true"
        
        # PayFast URLs
        if self.use_sandbox:
            self.payment_url = "https://sandbox.payfast.co.za/eng/process"
            self.validate_url = "https://sandbox.payfast.co.za/eng/query/validate"
        else:
            self.payment_url = "https://www.payfast.co.za/eng/process"
            self.validate_url = "https://www.payfast.co.za/eng/query/validate"
    
    
    # ============================================================================
    # CREATE PAYMENT REQUEST
    # ============================================================================
    
    async def create_subscription_payment(
        self,
        subscription: RecruiterSubscription,
        plan: SubscriptionPlan,
        billing_cycle: str = 'monthly'
    ) -> Dict:
        """
        Create PayFast payment request for subscription
        
        Returns payment form data to POST to PayFast
        """
        
        # Calculate amount
        if billing_cycle == 'annual':
            amount = plan.price_annual
            item_name = f"{plan.display_name} Plan - Annual"
        else:
            amount = plan.price_monthly
            item_name = f"{plan.display_name} Plan - Monthly"
        
        # Build payment data
        payment_data = {
            # Merchant details
            'merchant_id': self.merchant_id,
            'merchant_key': self.merchant_key,
            'return_url': f"{os.getenv('FRONTEND_URL')}/billing/success",
            'cancel_url': f"{os.getenv('FRONTEND_URL')}/billing/cancel",
            'notify_url': f"{os.getenv('BACKEND_URL')}/api/v1/subscriptions/webhook",
            
            # Buyer details
            'name_first': (subscription.recruiter_agency.primary_contact_name or '').split()[0] if (subscription.recruiter_agency.primary_contact_name or '').strip() else '',
            'name_last': ' '.join((subscription.recruiter_agency.primary_contact_name or '').split()[1:]),
            'email_address': subscription.recruiter_agency.email,
            
            # Transaction details
            'amount': f"{amount:.2f}",
            'item_name': item_name,
            'item_description': f"RecruitPro SA - {item_name}",
            
            # Custom fields
            'custom_str1': str(subscription.id),  # Subscription ID
            'custom_str2': str(subscription.recruiter_agency_id),  # Agency ID
            'custom_str3': billing_cycle,
            
            # Subscription (recurring billing)
            'subscription_type': '1',  # 1 = subscription
            'billing_date': (datetime.utcnow() + timedelta(days=plan.trial_days)).strftime('%Y-%m-%d'),
            'recurring_amount': f"{amount:.2f}",
            'frequency': '3',  # 3 = Monthly
            'cycles': '0',  # 0 = Until cancelled
            
            # Email confirmation
            'email_confirmation': '1',
            'confirmation_address': subscription.recruiter_agency.email,
        }
        
        # Add passphrase if configured
        if self.passphrase:
            payment_data['passphrase'] = self.passphrase

        # Generate signature
        signature = self._generate_signature(payment_data)
        payment_data['signature'] = signature

        # Remove passphrase from final data (only used for signature)
        if 'passphrase' in payment_data:
            del payment_data['passphrase']

        # Remove empty-value fields: they're excluded from our signature, so don't
        # submit them to PayFast either — otherwise PayFast includes them in its
        # own signature calculation and the hashes diverge.
        payment_data = {k: v for k, v in payment_data.items() if str(v).strip()}

        return {
            'payment_url': self.payment_url,
            'payment_data': payment_data
        }
    
    
    async def create_onetime_payment(
        self,
        agency_id: str,
        amount: Decimal,
        description: str,
        email: str,
        name: str
    ) -> Dict:
        """
        Create one-time payment (not subscription)
        
        Used for:
        - Additional seats
        - One-time upgrades
        - Extra features
        """
        
        payment_data = {
            'merchant_id': self.merchant_id,
            'merchant_key': self.merchant_key,
            'return_url': f"{os.getenv('FRONTEND_URL')}/billing/success",
            'cancel_url': f"{os.getenv('FRONTEND_URL')}/billing/cancel",
            'notify_url': f"{os.getenv('BACKEND_URL')}/api/v1/subscriptions/webhook",
            
            'name_first': name.split()[0],
            'name_last': name.split()[-1] if len(name.split()) > 1 else '',
            'email_address': email,
            
            'amount': f"{amount:.2f}",
            'item_name': description,
            'item_description': f"RecruitPro SA - {description}",
            
            'custom_str1': 'onetime',
            'custom_str2': str(agency_id),
            
            'email_confirmation': '1',
            'confirmation_address': email,
        }
        
        if self.passphrase:
            payment_data['passphrase'] = self.passphrase
        
        signature = self._generate_signature(payment_data)
        payment_data['signature'] = signature
        
        if 'passphrase' in payment_data:
            del payment_data['passphrase']

        payment_data = {k: v for k, v in payment_data.items() if str(v).strip()}

        return {
            'payment_url': self.payment_url,
            'payment_data': payment_data
        }


    # ============================================================================
    # SIGNATURE GENERATION
    # ============================================================================
    
    def _generate_signature(self, data: Dict) -> str:
        """
        Generate PayFast MD5 signature, matching their PHP SDK exactly:
          ksort() → exclude empty values → urlencode(trim(val)) → passphrase appended last
        """
        passphrase = data.get('passphrase', '')

        # Sort alphabetically (PHP ksort), strip values, skip empty
        pairs = []
        for key in sorted(data.keys()):
            if key in ('signature', 'passphrase'):
                continue
            val = str(data[key]).strip()
            if val:
                pairs.append(f"{key}={urllib.parse.quote_plus(val)}")

        param_string = '&'.join(pairs)

        if passphrase and passphrase.strip():
            param_string += f"&passphrase={urllib.parse.quote_plus(passphrase.strip())}"

        signature = hashlib.md5(param_string.encode()).hexdigest()
        return signature
    
    
    def _verify_signature(self, data: Dict, signature: str) -> bool:
        """
        Verify PayFast signature from webhook
        """
        
        calculated_signature = self._generate_signature(data)
        return calculated_signature == signature
    
    
    # ============================================================================
    # ITN (INSTANT TRANSACTION NOTIFICATION) WEBHOOK HANDLER
    # ============================================================================
    
    async def process_itn(self, itn_data: Dict) -> bool:
        """
        Process ITN (webhook) from PayFast
        
        This is called when PayFast sends payment notifications
        
        ITN Types:
        - COMPLETE: Payment successful
        - FAILED: Payment failed
        - PENDING: Payment pending
        - CANCELLED: Payment cancelled by user
        """
        
        # Log webhook
        webhook = PayFastWebhook(
            event_type=itn_data.get('payment_status'),
            payment_id=itn_data.get('pf_payment_id'),
            subscription_token=itn_data.get('token'),
            payload=itn_data,
            ip_address=itn_data.get('_ip_address')  # You'll need to pass this from the request
        )
        
        try:
            # 1. Verify signature
            signature = itn_data.get('signature')
            if not self._verify_signature(itn_data, signature):
                webhook.signature_valid = False
                webhook.error_message = "Invalid signature"
                self.db.add(webhook)
                await self.db.commit()
                return False
            
            webhook.signature_valid = True
            
            # 2. Verify payment with PayFast server
            if not await self._verify_payment_with_payfast(itn_data):
                webhook.error_message = "Payment verification failed"
                self.db.add(webhook)
                await self.db.commit()
                return False
            
            # 3. Process based on payment status
            payment_status = itn_data.get('payment_status')
            
            if payment_status == 'COMPLETE':
                await self._handle_successful_payment(itn_data)
            elif payment_status == 'FAILED':
                await self._handle_failed_payment(itn_data)
            elif payment_status == 'CANCELLED':
                await self._handle_cancelled_payment(itn_data)
            
            webhook.processed = True
            webhook.processed_at = datetime.utcnow()
            
        except Exception as e:
            webhook.error_message = str(e)
        
        self.db.add(webhook)
        await self.db.commit()
        
        return webhook.processed
    
    
    async def _verify_payment_with_payfast(self, itn_data: Dict) -> bool:
        """
        Verify payment with PayFast server
        
        This is REQUIRED by PayFast security protocol
        """
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.validate_url,
                    data=itn_data,
                    timeout=10.0
                )
                
                return response.text == "VALID"
        except Exception as e:
            print(f"PayFast verification error: {e}")
            return False
    
    
    async def _handle_successful_payment(self, itn_data: Dict):
        """
        Handle successful payment
        
        Actions:
        1. Update subscription status to 'active'
        2. Create payment transaction record
        3. Generate invoice
        4. Send confirmation email
        """
        
        subscription_id = itn_data.get('custom_str1')
        
        # Get subscription
        subscription = await self.db.get(RecruiterSubscription, subscription_id)
        if not subscription:
            raise Exception(f"Subscription {subscription_id} not found")
        
        # Update subscription
        subscription.status = 'active'
        subscription.payfast_subscription_token = itn_data.get('token')
        subscription.payfast_payment_id = itn_data.get('pf_payment_id')
        subscription.current_period_start = datetime.utcnow()
        
        # Set next billing date based on cycle
        if subscription.billing_cycle == 'annual':
            subscription.current_period_end = datetime.utcnow() + timedelta(days=365)
        else:
            subscription.current_period_end = datetime.utcnow() + timedelta(days=30)
        
        # Create payment transaction
        transaction = PaymentTransaction(
            subscription_id=subscription.id,
            recruiter_agency_id=subscription.recruiter_agency_id,
            transaction_type='subscription',
            amount=Decimal(itn_data.get('amount_gross')),
            currency='ZAR',
            payfast_payment_id=itn_data.get('pf_payment_id'),
            payfast_transaction_id=itn_data.get('m_payment_id'),
            payment_status='complete',
            payment_method=itn_data.get('payment_method'),
            description=itn_data.get('item_name'),
            payfast_data=itn_data,
            payment_date=datetime.utcnow()
        )
        
        self.db.add(transaction)
        await self.db.commit()
        
        # Generate invoice (async task)
        # await self.generate_invoice(subscription, transaction)
        
        # Send confirmation email
        # await self.send_payment_confirmation_email(subscription, transaction)
    
    
    async def _handle_failed_payment(self, itn_data: Dict):
        """
        Handle failed payment
        
        Actions:
        1. Update subscription status to 'past_due'
        2. Create failed transaction record
        3. Send payment failed email
        """
        
        subscription_id = itn_data.get('custom_str1')
        subscription = await self.db.get(RecruiterSubscription, subscription_id)
        
        if subscription:
            subscription.status = 'past_due'
            
            transaction = PaymentTransaction(
                subscription_id=subscription.id,
                recruiter_agency_id=subscription.recruiter_agency_id,
                transaction_type='subscription',
                amount=Decimal(itn_data.get('amount_gross')),
                currency='ZAR',
                payfast_payment_id=itn_data.get('pf_payment_id'),
                payment_status='failed',
                description=itn_data.get('item_name'),
                payfast_data=itn_data
            )
            
            self.db.add(transaction)
            await self.db.commit()
            
            # Send failed payment email
            # await self.send_payment_failed_email(subscription)
    
    
    async def _handle_cancelled_payment(self, itn_data: Dict):
        """
        Handle cancelled payment
        """
        
        subscription_id = itn_data.get('custom_str1')
        subscription = await self.db.get(RecruiterSubscription, subscription_id)
        
        if subscription:
            transaction = PaymentTransaction(
                subscription_id=subscription.id,
                recruiter_agency_id=subscription.recruiter_agency_id,
                transaction_type='subscription',
                amount=Decimal(itn_data.get('amount_gross')),
                currency='ZAR',
                payment_status='cancelled',
                description=itn_data.get('item_name'),
                payfast_data=itn_data
            )
            
            self.db.add(transaction)
            await self.db.commit()
    
    
    # ============================================================================
    # SUBSCRIPTION MANAGEMENT
    # ============================================================================
    
    async def cancel_subscription(self, subscription: RecruiterSubscription):
        """
        Cancel subscription
        
        NOTE: PayFast doesn't have API for cancellation
        Cancellation must be done via merchant dashboard OR by customer
        """
        
        subscription.status = 'canceled'
        subscription.canceled_at = datetime.utcnow()
        subscription.auto_renew = False
        
        await self.db.commit()
        
        # Send cancellation email
        # await self.send_cancellation_email(subscription)
    
    
    async def pause_subscription(self, subscription: RecruiterSubscription):
        """
        Pause subscription temporarily
        """
        
        subscription.status = 'paused'
        await self.db.commit()
    
    
    async def resume_subscription(self, subscription: RecruiterSubscription):
        """
        Resume paused subscription
        """
        
        subscription.status = 'active'
        await self.db.commit()
    
    
    # ============================================================================
    # HELPER METHODS
    # ============================================================================
    
    async def check_trial_expiration(self):
        """
        Check for expired trials and update status
        
        Run this daily via cron job
        """
        
        result = await self.db.execute(
            select(RecruiterSubscription).where(
                RecruiterSubscription.status == 'trialing',
                RecruiterSubscription.trial_end_date <= datetime.utcnow()
            )
        )
        
        expired_trials = result.scalars().all()
        
        for subscription in expired_trials:
            # Check if payment method is set up
            if subscription.payfast_subscription_token:
                # Trial ends, payment should process automatically
                subscription.status = 'active'
            else:
                # No payment method, cancel subscription
                subscription.status = 'canceled'
                subscription.ended_at = datetime.utcnow()
        
        await self.db.commit()
        
        return len(expired_trials)
