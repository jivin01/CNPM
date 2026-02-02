import asyncio
import aiomysql
from app.database.config import settings

async def test_connection():
    try:
        print(f"Testing connection to: {settings.DATABASE_URL}")
        
        # Parse the connection string
        import re
        match = re.match(r'mysql\+aiomysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', settings.DATABASE_URL)
        if match:
            user, password, host, port, database = match.groups()
            
            conn = await aiomysql.connect(
                host=host,
                port=int(port),
                user=user,
                password=password,
                db=database
            )
            
            print("✅ Database connection successful!")
            
            # Test a simple query
            cursor = await conn.cursor()
            await cursor.execute("SELECT 1")
            result = await cursor.fetchone()
            print(f"✅ Query test successful: {result}")
            
            await cursor.close()
            conn.close()
            
        else:
            print("❌ Invalid DATABASE_URL format")
            
    except Exception as e:
        print(f"❌ Database connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
