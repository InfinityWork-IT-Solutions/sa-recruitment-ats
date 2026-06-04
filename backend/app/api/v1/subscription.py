"""
============================================================================
SUBSCRIPTION MANAGEMENT API
============================================================================

PURPOSE:
Handle recruiter subscription management, billing, and payments.

ENDPOINTS:
1. GET  /api/subscriptions/plans - Get available plans
2. POST /api/subscriptions/create - Create subscription
3. POST /api/subscriptions/upgrade - Upgrade plan
4. POST /api/subscriptions/downgrade - Downgrade plan
5. POST /api/subscriptions/cancel - Cancel subscription
6. GET  /api/subscriptions/current - Get current subscription
7. GET  /api/subscriptions/invoices - Get billing history
8. POST /api/payfast/webhook - PayFast ITN webhook

============================================================================
"""

from typing import List
from datetime import datetime, timedelta
from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import random

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.services.payfast_service import PayFastService
from app.models import (
    Agency as RecruiterAgency,
    RecruiterSubscription,
    SubscriptionPlan,
    PaymentTransaction,
    User,
    Invoice
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


# ============================================================================
# RESPONSE MODELS
# ============================================================================

class PlanResponse(BaseModel):
    id: str
    name: str
    display_name: str
    description: str
    price_monthly: float
    price_annual: float
    seats_included: int
    features: dict
    is_most_popular: bool


class SubscriptionResponse(BaseModel):
    id: str
    plan: PlanResponse
    status: str
    billing_cycle: str
    amount: float
    seats_allocated: int
    seats_used: int
    current_period_end: datetime
    trial_end_date: datetime | None
    is_trialing: bool
    days_until_renewal: int


# ============================================================================
# ENDPOINT 1: GET AVAILABLE PLANS
# ============================================================================

@router.get("/plans", response_model=List[PlanResponse])
async def get_subscription_plans(db: AsyncSession = Depends(get_db)):
    """
    Get all available subscription plans
    
    Returns plans sorted by price
    """
    
    result = await db.execute(
        select(SubscriptionPlan)
        .where(SubscriptionPlan.is_active == True)
        .order_by(SubscriptionPlan.display_order)
    )
    
    plans = result.scalars().all()
    
    return [
        PlanResponse(
            id=str(plan.id),
            name=plan.name,
            display_name=plan.display_name,
            description=plan.description,
            price_monthly=float(plan.price_monthly),
            price_annual=float(plan.price_annual) if plan.price_annual else 0,
            seats_included=plan.seats_included,
            features={
                "video_screening": plan.video_screening_enabled,
                "ai_matching": plan.ai_matching_enabled,
                "advanced_analytics": plan.advanced_analytics_enabled,
                "api_access": plan.api_access_enabled,
                "white_label": plan.white_label_enabled,
                "priority_support": plan.priority_support,
                "max_searches": plan.max_searches_per_month
            },
            is_most_popular=(plan.name == "professional")
        )
        for plan in plans
    ]


# ============================================================================
# ENDPOINT 2: CREATE SUBSCRIPTION
# ============================================================================

class CreateSubscriptionRequest(BaseModel):
    plan_name: str  # 'starter' | 'professional' | 'enterprise'
    billing_cycle: str = 'monthly'


@router.post("/create")
async def create_subscription(
    request: CreateSubscriptionRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create new subscription and return PayFast payment form data.
    Called right after registration from the billing setup page.

    Flow:
    1. Lookup agency from the authenticated user
    2. Lookup plan by name
    3. Create subscription record (status: trialing)
    4. Return PayFast form data — frontend auto-submits to PayFast
    """

    # Agency comes from the authenticated user
    agency = await db.get(RecruiterAgency, current_user.agency_id)
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    # Look up plan by name
    plan_result = await db.execute(
        select(SubscriptionPlan).where(
            SubscriptionPlan.name == request.plan_name,
            SubscriptionPlan.is_active == True
        )
    )
    plan = plan_result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan '{request.plan_name}' not found")

    # Check if already has active subscription
    existing = await db.execute(
        select(RecruiterSubscription).where(
            RecruiterSubscription.recruiter_agency_id == agency.id,
            RecruiterSubscription.status.in_(['active', 'trialing'])
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Agency already has an active subscription")

    # Create subscription record
    subscription = RecruiterSubscription(
        recruiter_agency_id=agency.id,
        plan_id=plan.id,
        status='trialing',
        billing_cycle=request.billing_cycle,
        trial_start_date=datetime.utcnow(),
        trial_end_date=datetime.utcnow() + timedelta(days=plan.trial_days),
        current_period_start=datetime.utcnow(),
        current_period_end=datetime.utcnow() + timedelta(days=plan.trial_days),
        seats_allocated=plan.seats_included,
        seats_used=1,
        amount=plan.price_annual if request.billing_cycle == 'annual' else plan.price_monthly
    )

    db.add(subscription)
    await db.commit()
    await db.refresh(subscription)

    # Generate PayFast payment data for the frontend to redirect with
    payfast = PayFastService(db)
    payment_data = await payfast.create_subscription_payment(
        subscription=subscription,
        plan=plan,
        billing_cycle=request.billing_cycle
    )

    return {
        "subscription_id": str(subscription.id),
        "trial_days": plan.trial_days,
        "trial_end_date": subscription.trial_end_date.isoformat(),
        "payment_required_on": subscription.trial_end_date.isoformat(),
        "payfast_payment_url": payment_data['payment_url'],
        "payfast_payment_data": payment_data['payment_data']
    }


# ============================================================================
# ENDPOINT 3: GET CURRENT SUBSCRIPTION
# ============================================================================

@router.get("/current", response_model=SubscriptionResponse)
async def get_current_subscription(
    agency_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get current active subscription for agency
    """
    
    result = await db.execute(
        select(RecruiterSubscription).where(
            RecruiterSubscription.recruiter_agency_id == agency_id,
            RecruiterSubscription.status.in_(['active', 'trialing'])
        )
    )
    
    subscription = result.scalars().first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    # Get plan
    plan = await db.get(SubscriptionPlan, subscription.plan_id)

    # Count actual active team members for this agency (source of truth)
    from app.models.user import UserRole
    seats_count = await db.execute(
        select(User).where(
            User.agency_id == agency_id,
            User.is_active == True,
            User.role.in_([UserRole.client, UserRole.recruiter, UserRole.agency_admin])
        )
    )
    actual_seats_used = len(seats_count.scalars().all())

    # Sync stored value if it drifted
    if subscription.seats_used != actual_seats_used:
        subscription.seats_used = actual_seats_used
        await db.commit()

    # Calculate days until renewal
    days_until_renewal = (subscription.current_period_end - datetime.utcnow()).days

    return SubscriptionResponse(
        id=str(subscription.id),
        plan=PlanResponse(
            id=str(plan.id),
            name=plan.name,
            display_name=plan.display_name,
            description=plan.description,
            price_monthly=float(plan.price_monthly),
            price_annual=float(plan.price_annual) if plan.price_annual else 0,
            seats_included=plan.seats_included,
            features={
                "video_screening": plan.video_screening_enabled,
                "ai_matching": plan.ai_matching_enabled,
                "advanced_analytics": plan.advanced_analytics_enabled
            },
            is_most_popular=False
        ),
        status=subscription.status,
        billing_cycle=subscription.billing_cycle,
        amount=float(subscription.amount),
        seats_allocated=subscription.seats_allocated,
        seats_used=actual_seats_used,
        current_period_end=subscription.current_period_end,
        trial_end_date=subscription.trial_end_date,
        is_trialing=(subscription.status == 'trialing'),
        days_until_renewal=days_until_renewal
    )


# ============================================================================
# ENDPOINT 3.5: CHANGE SUBSCRIPTION PLAN
# ============================================================================

class ChangePlanRequest(BaseModel):
    agency_id: UUID
    new_plan_id: UUID

@router.post("/change-plan")
async def change_subscription_plan(
    request: ChangePlanRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Change subscription plan (upgrade or downgrade)
    
    Takes effect immediately
    Prorates the billing
    """
    
    from sqlalchemy.orm import selectinload
    
    # Get current subscription with plan pre-loaded
    result = await db.execute(
        select(RecruiterSubscription)
        .where(
            RecruiterSubscription.recruiter_agency_id == request.agency_id,
            RecruiterSubscription.status.in_(['active', 'trialing'])
        )
        .options(selectinload(RecruiterSubscription.plan))
    )
    subscription = result.scalars().first()
    
    # Get new plan
    new_plan = await db.get(SubscriptionPlan, request.new_plan_id)
    if not new_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    if not subscription:
        # Create a new subscription
        subscription = RecruiterSubscription(
            recruiter_agency_id=request.agency_id,
            plan_id=request.new_plan_id,
            status='trialing',
            billing_cycle='monthly',
            amount=new_plan.price_monthly,
            seats_allocated=new_plan.seats_included,
            current_period_start=datetime.utcnow(),
            current_period_end=datetime.utcnow() + timedelta(days=14),
            trial_start_date=datetime.utcnow(),
            trial_end_date=datetime.utcnow() + timedelta(days=14)
        )
        db.add(subscription)
        await db.commit()
        await db.refresh(subscription)
        old_plan_name = "None"
    else:
        # Update existing subscription
        old_plan_name = subscription.plan.display_name if subscription.plan else "Unknown"
        subscription.plan_id = request.new_plan_id
        subscription.amount = new_plan.price_monthly if subscription.billing_cycle == 'monthly' else new_plan.price_annual
        subscription.seats_allocated = new_plan.seats_included
        await db.commit()
        await db.refresh(subscription)
    
    # For testing purposes: Create an invoice immediately so the user can test the download feature
    import random
    
    # 1. Create a mock transaction
    transaction = PaymentTransaction(
        subscription_id=subscription.id,
        recruiter_agency_id=request.agency_id,
        transaction_type='subscription_change',
        amount=subscription.amount,
        currency='ZAR',
        payment_status='complete',
        payment_date=datetime.utcnow(),
        invoice_number=f"INV-{random.randint(10000, 99999)}"
    )
    db.add(transaction)
    await db.flush()
    
    # 2. Create the invoice
    invoice = Invoice(
        subscription_id=subscription.id,
        recruiter_agency_id=request.agency_id,
        transaction_id=transaction.id,
        invoice_number=transaction.invoice_number,
        status='paid',
        subtotal=subscription.amount / Decimal('1.15'),
        tax_amount=subscription.amount - (subscription.amount / Decimal('1.15')),
        total=subscription.amount,
        amount_paid=subscription.amount,
        currency='ZAR',
        line_items=[{"description": f"Plan upgrade to {new_plan.display_name}", "amount": float(subscription.amount)}],
        issue_date=datetime.utcnow(),
        due_date=datetime.utcnow(),
        paid_date=datetime.utcnow()
    )
    db.add(invoice)
    
    # 3. Trigger notification
    # We need the user_id from the current session or agency admin
    stmt = select(User).where(User.agency_id == request.agency_id)
    result = await db.execute(stmt)
    admin_user = result.scalars().first()
    
    if admin_user:
        await NotificationService.create_notification(
            db,
            user_id=admin_user.id,
            title="Subscription Upgraded",
            message=f"Success! Your agency has been moved to the {new_plan.display_name} plan.",
            notification_type="billing",
            link="/settings/billing"
        )
    
    await db.commit()
    
    return {
        "success": True,
        "message": f"Plan changed from {old_plan_name} to {new_plan.display_name}",
        "new_plan": {
            "name": new_plan.display_name,
            "price": float(subscription.amount),
            "seats": new_plan.seats_included
        }
    }


# ============================================================================
# ENDPOINT 4: CANCEL SUBSCRIPTION
# ============================================================================

@router.post("/cancel")
async def cancel_subscription(
    agency_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Cancel subscription
    
    Subscription remains active until end of current period
    """
    
    result = await db.execute(
        select(RecruiterSubscription).where(
            RecruiterSubscription.recruiter_agency_id == agency_id,
            RecruiterSubscription.status.in_(['active', 'trialing'])
        )
    )
    
    subscription = result.scalars().first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    # Cancel via PayFast service
    payfast = PayFastService(db)
    await payfast.cancel_subscription(subscription)
    
    return {
        "success": True,
        "message": "Subscription cancelled. Access will continue until end of current period.",
        "access_until": subscription.current_period_end.isoformat()
    }


# ============================================================================
# ENDPOINT 5: GET BILLING HISTORY
# ============================================================================

@router.get("/invoices")
async def get_invoices(
    agency_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get billing history and invoices
    """
    
    result = await db.execute(
        select(Invoice)
        .where(Invoice.recruiter_agency_id == agency_id)
        .order_by(Invoice.created_at.desc())
    )
    
    invoices = result.scalars().all()
    
    return {
        "invoices": [
            {
                "id": str(invoice.id),
                "invoice_number": invoice.invoice_number,
                "status": invoice.status,
                "total": float(invoice.total),
                "currency": invoice.currency,
                "issue_date": invoice.issue_date.isoformat(),
                "due_date": invoice.due_date.isoformat(),
                "paid_date": invoice.paid_date.isoformat() if invoice.paid_date else None,
                "pdf_url": invoice.pdf_url if invoice.pdf_url else f"/subscriptions/invoices/{invoice.id}/download"
            }
            for invoice in invoices
        ]
    }

@router.get("/invoices/{invoice_id}/download")
async def download_invoice(
    invoice_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Download invoice as HTML (Printable)
    """
    from fastapi.responses import HTMLResponse
    
    invoice = await db.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    # Simple professional HTML template
    html_content = f"""
    <html>
    <head>
        <title>Invoice {invoice.invoice_number}</title>
        <style>
            body {{ font-family: sans-serif; padding: 40px; color: #333; }}
            .header {{ display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; }}
            .invoice-title {{ font-size: 24px; font-weight: bold; color: #2563eb; }}
            .details {{ margin-top: 40px; display: grid; grid-template-cols: 1fr 1fr; gap: 40px; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 40px; }}
            th {{ text-align: left; background: #f8fafc; padding: 12px; border-bottom: 2px solid #eee; }}
            td {{ padding: 12px; border-bottom: 1px solid #eee; }}
            .total-section {{ margin-top: 40px; text-align: right; font-size: 18px; }}
            .footer {{ margin-top: 100px; font-size: 12px; color: #94a3b8; text-align: center; }}
            @media print {{ .no-print {{ display: none; }} }}
        </style>
    </head>
    <body>
        <div class="no-print" style="background: #f1f5f9; padding: 10px; margin-bottom: 20px; border-radius: 8px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">Print or Save as PDF</button>
        </div>
        
        <div class="header">
            <div>
                <div class="invoice-title">RECRUITPRO SA</div>
                <div>InfinityWork IT Solutions</div>
                <div>Cape Town, South Africa</div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: bold;">INVOICE</div>
                <div>#{invoice.invoice_number}</div>
                <div>Date: {invoice.issue_date.strftime('%d %b %Y')}</div>
            </div>
        </div>
        
        <div class="details">
            <div>
                <div style="font-weight: bold; margin-bottom: 10px; color: #64748b; font-size: 12px; text-transform: uppercase;">Bill To:</div>
                <div style="font-weight: bold;">{invoice.recruiter_agency_id}</div>
                <div>Status: <span style="color: {'#059669' if invoice.status == 'paid' else '#d97706'}">{invoice.status.upper()}</span></div>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>RecruitPro Subscription - {invoice.invoice_number}</td>
                    <td style="text-align: right;">{invoice.currency} {float(invoice.total):,.2f}</td>
                </tr>
            </tbody>
        </table>
        
        <div class="total-section">
            <div>Subtotal: {invoice.currency} {float(invoice.subtotal):,.2f}</div>
            <div>Tax (15%): {invoice.currency} {float(invoice.tax_amount or 0):,.2f}</div>
            <div style="font-size: 24px; font-weight: bold; margin-top: 10px;">Total: {invoice.currency} {float(invoice.total):,.2f}</div>
        </div>
        
        <div class="footer">
            Thank you for choosing RecruitPro SA. For billing inquiries, contact billing@recruitpro.co.za
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


# ============================================================================
# ENDPOINT: TRIAL STATUS (used by TrialBanner in the frontend)
# ============================================================================

@router.get("/trial-status")
async def get_trial_status(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns trial info for the banner shown in the dashboard."""
    if not current_user.agency_id:
        return {"is_trial": False, "days_remaining": 0, "has_billing": False, "trial_ends_at": None}

    agency = await db.get(RecruiterAgency, current_user.agency_id)
    if not agency:
        return {"is_trial": False, "days_remaining": 0, "has_billing": False, "trial_ends_at": None}

    # Check for an active paid subscription token (billing set up)
    sub_result = await db.execute(
        select(RecruiterSubscription).where(
            RecruiterSubscription.recruiter_agency_id == agency.id,
            RecruiterSubscription.status.in_(["active", "trialing"]),
            RecruiterSubscription.payfast_subscription_token != None,
        )
    )
    has_billing = sub_result.scalar_one_or_none() is not None

    days_remaining = 0
    trial_ends_at = None
    if agency.trial_ends_at:
        delta = agency.trial_ends_at - datetime.utcnow()
        days_remaining = max(0, delta.days)
        trial_ends_at = agency.trial_ends_at.isoformat()

    return {
        "is_trial": bool(agency.is_trial),
        "days_remaining": days_remaining,
        "has_billing": has_billing,
        "trial_ends_at": trial_ends_at,
    }


# ============================================================================
# ENDPOINT 6: PAYFAST ITN WEBHOOK
# ============================================================================

payfast_router = APIRouter(prefix="/api/payfast", tags=["PayFast"])

# Also register webhook on the main subscriptions router so
# notify_url = /api/v1/subscriptions/webhook works
@router.post("/webhook", include_in_schema=False)
@payfast_router.post("/webhook")
async def payfast_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    PayFast ITN (Instant Transaction Notification) webhook
    
    Called by PayFast when payment events occur
    
    IMPORTANT: This must be accessible from PayFast servers
    """
    
    # Get form data from PayFast
    form_data = await request.form()
    itn_data = dict(form_data)
    
    # Add IP address for logging
    itn_data['_ip_address'] = request.client.host
    
    # Process ITN
    payfast = PayFastService(db)
    success = await payfast.process_itn(itn_data)
    
    if success:
        return {"status": "ok"}
    else:
        raise HTTPException(status_code=400, detail="ITN processing failed")


# Include PayFast router
router.include_router(payfast_router)
