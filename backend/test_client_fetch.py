
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.services.ai_decision_queue_service import AIDecisionQueueService

DATABASE_URL = "postgresql+asyncpg://recruitpro_user:recruitpro_password_123@127.0.0.1:5432/recruitpro_sa"
TEST_COMPANY_ID = "78e96a7c-be6c-4a64-86a9-294a24c2eca0"

async def test_fetch():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        service = AIDecisionQueueService(session)
        data = await service.get_pending_decisions(company_id=TEST_COMPANY_ID)
        print(f"Totals: {data['totals']}")
        print(f"Decisions found: {len(data['all_decisions'])}")

if __name__ == "__main__":
    asyncio.run(test_fetch())
