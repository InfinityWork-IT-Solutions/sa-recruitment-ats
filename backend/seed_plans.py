import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.models import SubscriptionPlan

from dotenv import load_dotenv
load_dotenv()
DB_URL = os.getenv("DATABASE_URL") or "postgresql+asyncpg://postgres:postgres@localhost:5432/sa_recruitment_ats"

engine = create_async_engine(DB_URL)

async def seed():
    async with AsyncSession(engine) as db:
        p1 = SubscriptionPlan(name='starter', display_name='Starter', description='For small teams', price_monthly=999.00, price_annual=9990.00, seats_included=1, video_screening_enabled=False, ai_matching_enabled=True, advanced_analytics_enabled=False, api_access_enabled=False, white_label_enabled=False, priority_support=False, max_searches_per_month=100)
        p2 = SubscriptionPlan(name='professional', display_name='Professional', description='For growing agencies', price_monthly=2499.00, price_annual=24990.00, seats_included=5, video_screening_enabled=True, ai_matching_enabled=True, advanced_analytics_enabled=True, api_access_enabled=False, white_label_enabled=False, priority_support=False, max_searches_per_month=500)
        p3 = SubscriptionPlan(name='enterprise', display_name='Enterprise', description='For large agencies', price_monthly=4999.00, price_annual=49990.00, seats_included=10, video_screening_enabled=True, ai_matching_enabled=True, advanced_analytics_enabled=True, api_access_enabled=True, white_label_enabled=True, priority_support=True, max_searches_per_month=0)
        db.add_all([p1, p2, p3])
        await db.commit()
        print('Seeded!')

asyncio.run(seed())
