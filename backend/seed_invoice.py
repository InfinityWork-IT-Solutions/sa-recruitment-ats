
import asyncio
from sqlalchemy import select
from app.core.database import SessionLocal, AsyncSession
from app.models import User, Agency, RecruiterSubscription, Invoice, PaymentTransaction, SubscriptionPlan
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

async def seed_test_invoice():
    db = SessionLocal()
    try:
        # 1. Find the user (InfinityWork IT Solutions)
        stmt = select(User).where(User.email == 'mpumelelo@infinitywork.tso.za')
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            print("User not found")
            return

        agency_id = user.agency_id
        if not agency_id:
            print("User has no agency_id")
            return
            
        # 2. Get a plan
        stmt = select(SubscriptionPlan).limit(1)
        result = await db.execute(stmt)
        plan = result.scalar_one_or_none()
        
        # 3. Create/Get subscription
        stmt = select(RecruiterSubscription).where(RecruiterSubscription.recruiter_agency_id == agency_id)
        result = await db.execute(stmt)
        sub = result.scalar_one_or_none()
        
        if not sub:
            sub = RecruiterSubscription(
                recruiter_agency_id=agency_id,
                plan_id=plan.id,
                status='active',
                current_period_start=datetime.utcnow(),
                current_period_end=datetime.utcnow() + timedelta(days=30),
                amount=Decimal('4199.00')
            )
            db.add(sub)
            await db.flush()
        
        # 4. Create Transaction
        inv_num = f"INV-{uuid.uuid4().hex[:8].upper()}"
        trans = PaymentTransaction(
            subscription_id=sub.id,
            recruiter_agency_id=agency_id,
            transaction_type='subscription',
            amount=sub.amount,
            currency='ZAR',
            payment_status='complete',
            payment_date=datetime.utcnow(),
            invoice_number=inv_num
        )
        db.add(trans)
        await db.flush()
        
        # 5. Create Invoice
        inv = Invoice(
            subscription_id=sub.id,
            recruiter_agency_id=agency_id,
            transaction_id=trans.id,
            invoice_number=inv_num,
            status='paid',
            subtotal=sub.amount / Decimal('1.15'),
            tax_amount=sub.amount - (sub.amount / Decimal('1.15')),
            total=sub.amount,
            amount_paid=sub.amount,
            currency='ZAR',
            line_items=[{"description": "Professional Plan Subscription", "amount": float(sub.amount)}],
            issue_date=datetime.utcnow(),
            due_date=datetime.utcnow(),
            paid_date=datetime.utcnow(),
            pdf_url=f"/subscriptions/invoices/{uuid.uuid4()}/download" # Will be overridden by fallback anyway
        )
        db.add(inv)
        await db.commit()
        print(f"Successfully created invoice {inv_num} for agency {agency_id}")
        
    except Exception as e:
        print(f"Error: {e}")
        await db.rollback()
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(seed_test_invoice())
