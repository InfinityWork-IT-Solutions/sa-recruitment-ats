import httpx
import asyncio

async def test_register():
    url = "http://localhost:8000/api/v1/auth/register"
    payload = {
        "agency": {
            "name": "Test Agency",
            "email": "testagency99@example.com",
            "city": "Cape Town",
            "province": "Western Cape",
            "country": "South Africa",
            "subscription_tier": "professional"
        },
        "user": {
            "email": "testagency99@example.com",
            "password": "Password123*",
            "first_name": "Test",
            "last_name": "User",
            "phone": "1234567890",
            "role": "agency_admin"
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        print("Status code:", response.status_code)
        print("Response:", response.text)

if __name__ == "__main__":
    asyncio.run(test_register())
