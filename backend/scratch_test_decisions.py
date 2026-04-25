
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.services.ai_decision_queue_service import AIDecisionQueueService
from app.core.config import settings

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/recruitpro_ats"

async def test_pending_decisions():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        service = AIDecisionQueueService(session)
        try:
            decisions = await service.get_pending_decisions()
            print("Successfully fetched decisions:")
            print(decisions)
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_pending_decisions())
