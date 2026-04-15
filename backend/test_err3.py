import asyncio

async def main():
    from app.models.user import User
    from app.models.client_company import ClientCompany
    from app.schemas.client_company import ClientCompanyResponse
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    async with AsyncSessionLocal() as db:
        # Get users that have a client company
        result = await db.execute(select(ClientCompany).where(ClientCompany.user_id.isnot(None)))
        companies = result.scalars().all()
        for company in companies:
            print(f"Testing company for user {company.user_id} ...")
            try:
                # Do the exact query from the service
                stmt = select(ClientCompany).where(ClientCompany.user_id == company.user_id).options(
                    selectinload(ClientCompany.jobs)
                )
                res = await db.execute(stmt)
                c = res.scalar_one_or_none()
                resp = ClientCompanyResponse.model_validate(c)
                print(f"SUCCESS: {resp.name}")
                print(f"JSON: {resp.model_dump_json()}")
            except Exception as e:
                import traceback
                traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
