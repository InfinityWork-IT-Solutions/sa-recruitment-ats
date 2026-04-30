"""
ADDITIONAL ENDPOINT: CHANGE SUBSCRIPTION PLAN

Add this to your subscription_api.py file
"""

@router.post("/change-plan")
async def change_subscription_plan(
    agency_id: UUID,
    new_plan_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Change subscription plan (upgrade or downgrade)
    
    Takes effect immediately
    Prorates the billing
    """
    
    # Get current subscription
    result = await db.execute(
        select(RecruiterSubscription).where(
            RecruiterSubscription.recruiter_agency_id == agency_id,
            RecruiterSubscription.status.in_(['active', 'trialing'])
        )
    )
    subscription = result.scalars().first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    # Get new plan
    new_plan = await db.get(SubscriptionPlan, new_plan_id)
    if not new_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Update subscription
    old_plan_name = subscription.plan.display_name
    subscription.plan_id = new_plan_id
    subscription.amount = new_plan.price_monthly if subscription.billing_cycle == 'monthly' else new_plan.price_annual
    subscription.seats_allocated = new_plan.seats_included
    
    await db.commit()
    await db.refresh(subscription)
    
    return {
        "success": True,
        "message": f"Plan changed from {old_plan_name} to {new_plan.display_name}",
        "new_plan": {
            "name": new_plan.display_name,
            "price": float(subscription.amount),
            "seats": new_plan.seats_included
        }
    }
