
import asyncio
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.models.usage import SubscriptionPlanLimits

async def seed_limits():
    async with AsyncSessionLocal() as db:
        plans = [
            {
                "plan_name": "lite",
                "cv_parses_per_month": 50,
                "ai_match_calculations_per_month": 500,
                "ai_search_queries_per_month": 200,
            },
            {
                "plan_name": "standard",
                "cv_parses_per_month": 250,
                "ai_match_calculations_per_month": 2000,
                "ai_search_queries_per_month": 1000,
            },
            {
                "plan_name": "premium",
                "cv_parses_per_month": 1000,
                "ai_match_calculations_per_month": 10000,
                "ai_search_queries_per_month": 5000,
            }
        ]
        
        for plan_data in plans:
            # Check if exists
            from sqlalchemy import select
            result = await db.execute(select(SubscriptionPlanLimits).filter(SubscriptionPlanLimits.plan_name == plan_data["plan_name"]))
            existing = result.scalars().first()
            
            if not existing:
                plan = SubscriptionPlanLimits(**plan_data)
                db.add(plan)
                print(f"Adding limits for {plan_data['plan_name']}")
            else:
                print(f"Limits for {plan_data['plan_name']} already exist")
                
        await db.commit()

if __name__ == "__main__":
    asyncio.run(seed_limits())
