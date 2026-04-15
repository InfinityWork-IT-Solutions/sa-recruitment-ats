import httpx
import asyncio

async def main():
    async with httpx.AsyncClient() as client:
        # We don't have token, so let's hit the DB schema instead
        from app.models.client_company import ClientCompany
        from app.schemas.client_company import ClientCompanyResponse
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import select
        
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(ClientCompany).limit(1))
            company = result.scalar_one_or_none()
            if company:
                try:
                    resp = ClientCompanyResponse.model_validate(company)
                    print(resp.model_dump_json())
                except Exception as e:
                    print("ERROR:", e)

if __name__ == "__main__":
    asyncio.run(main())
