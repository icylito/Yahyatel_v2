"""
examples/seed_example.py
------------------------
Shows how to seed initial users into the database directly via SQLAlchemy.
Run this independently of the FastAPI server:

    pip install sqlalchemy asyncpg bcrypt python-dotenv
    python examples/seed_example.py

Requires DATABASE_URL in your .env file:
    DATABASE_URL=postgresql://user:password@localhost:5432/yourdb
"""

import asyncio
import os
import bcrypt
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

load_dotenv(".env")

DB_URL = os.getenv("DATABASE_URL", "")
if not DB_URL:
    raise RuntimeError("Set DATABASE_URL in your .env file before running this script.")

# Normalize the URL to the asyncpg driver format
DB_URL = (
    DB_URL
    .replace("postgres://", "postgresql+asyncpg://", 1)
    .replace("postgresql://", "postgresql+asyncpg://", 1)
)

engine = create_async_engine(DB_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


# ---------------------------------------------------------------------------
# Edit this list to match your own users/roles before running
# ---------------------------------------------------------------------------
SEED_USERS = [
    {
        "name":     os.getenv("ADMIN_NAME",     "Admin User"),
        "phone":    os.getenv("ADMIN_PHONE",    "+10000000001"),
        "email":    os.getenv("ADMIN_EMAIL",    "admin@example.com"),
        "password": os.getenv("ADMIN_PASSWORD", "Admin123!"),
        "role":     "admin",
    },
    {
        "name":     os.getenv("AGENT_NAME",     "Support Agent"),
        "phone":    os.getenv("AGENT_PHONE",    "+10000000002"),
        "email":    os.getenv("AGENT_EMAIL",    "agent@example.com"),
        "password": os.getenv("AGENT_PASSWORD", "Agent123!"),
        "role":     "customer_agent",
    },
    {
        "name":     "Demo Customer",
        "phone":    "+10000000003",
        "email":    "customer@example.com",
        "password": "Customer123!",
        "role":     "customer",
    },
]


async def main():
    print("\n[DB] Connecting to database...\n")

    # Create the users table if it does not exist yet
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id       SERIAL PRIMARY KEY,
                name     TEXT NOT NULL,
                phone    TEXT,
                email    TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role     TEXT NOT NULL DEFAULT 'customer'
            )
        """))
        print("[OK] Table 'users' verified.\n")

    inserted = 0
    updated = 0

    async with async_session() as session:
        for u in SEED_USERS:
            hashed = hash_password(u["password"])

            # Upsert: update if email exists, insert otherwise
            result = await session.execute(
                text("SELECT id FROM users WHERE email = :email"),
                {"email": u["email"]},
            )
            row = result.fetchone()

            if row:
                await session.execute(
                    text("UPDATE users SET name=:name, phone=:phone, password=:password, role=:role WHERE email=:email"),
                    {"name": u["name"], "phone": u["phone"], "password": hashed, "role": u["role"], "email": u["email"]},
                )
                print(f"  [~] Updated : {u['email']}  ({u['role']})")
                updated += 1
            else:
                await session.execute(
                    text("INSERT INTO users (name, phone, email, password, role) VALUES (:name, :phone, :email, :password, :role)"),
                    {"name": u["name"], "phone": u["phone"], "email": u["email"], "password": hashed, "role": u["role"]},
                )
                print(f"  [+] Inserted: {u['email']}  ({u['role']})")
                inserted += 1

        await session.commit()

    # Report total rows
    async with async_session() as session:
        total = (await session.execute(text("SELECT COUNT(*) FROM users"))).scalar()

    print(f"\nDone — {inserted} inserted, {updated} updated. Total users in DB: {total}\n")
    await engine.dispose()


asyncio.run(main())
