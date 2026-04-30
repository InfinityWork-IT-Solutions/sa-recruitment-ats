
import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionLocal

async def migrate_tiers():
    async with AsyncSessionLocal() as db:
        print("Updating subscriptiontier enum type...")
        
        # We need to use connection directly because ALTER TYPE cannot run in a transaction block
        # but SQLAlchemy usually starts one. We'll use text() with commit.
        
        # Try to add new values to the enum (PostgreSQL)
        for value in ['starter', 'professional', 'enterprise']:
            try:
                # ALTER TYPE cannot be run inside a transaction block in some versions/drivers
                # So we use a separate execution
                await db.execute(text(f"ALTER TYPE subscriptiontier ADD VALUE IF NOT EXISTS '{value}'"))
                await db.commit()
                print(f"Added {value} to subscriptiontier enum")
            except Exception as e:
                print(f"Notice: Could not add {value} to enum (might already exist): {e}")
                await db.rollback()

        print("Migrating subscription tiers in database...")
        
        # Update agencies table
        await db.execute(text("UPDATE agencies SET subscription_tier = 'starter' WHERE subscription_tier = 'lite'"))
        await db.execute(text("UPDATE agencies SET subscription_tier = 'professional' WHERE subscription_tier = 'standard'"))
        await db.execute(text("UPDATE agencies SET subscription_tier = 'enterprise' WHERE subscription_tier = 'premium'"))
        
        # Also update subscription_plan_limits table
        try:
            await db.execute(text("UPDATE subscription_plan_limits SET plan_name = 'starter' WHERE plan_name = 'lite'"))
            await db.execute(text("UPDATE subscription_plan_limits SET plan_name = 'professional' WHERE plan_name = 'standard'"))
            await db.execute(text("UPDATE subscription_plan_limits SET plan_name = 'enterprise' WHERE plan_name = 'premium'"))
        except Exception as e:
            print(f"subscription_plan_limits update skipped or failed: {e}")
            
        await db.commit()
        print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate_tiers())
