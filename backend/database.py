import os
import asyncio
import random
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

import bcrypt
from dotenv import load_dotenv
from sqlalchemy import select, func, text, ForeignKey, DateTime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, relationship, selectinload, Mapped, mapped_column

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
logger = logging.getLogger(__name__)

# database
DB_URL = os.getenv("DATABASE_URL", "")
if not DB_URL:
    raise RuntimeError("DATABASE_URL is not set in your .env file")

# make sure we're using the async driver
DB_URL = DB_URL.replace("postgres://", "postgresql+asyncpg://", 1).replace("postgresql://", "postgresql+asyncpg://", 1)

engine        = create_async_engine(DB_URL, echo=False)
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


# models

class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id:       Mapped[int] = mapped_column(primary_key=True)
    name:     Mapped[str]
    phone:    Mapped[Optional[str]]
    email:    Mapped[str] = mapped_column(unique=True)
    password: Mapped[str]
    role:     Mapped[str] = mapped_column(default="customer")
    services: Mapped[list["UserService"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class UserService(Base):
    __tablename__ = "user_services"
    id:      Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    name:    Mapped[str]
    since:   Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    user:    Mapped["User"] = relationship(back_populates="services")


class ChatLog(Base):
    __tablename__ = "chatlogs"
    id:         Mapped[int] = mapped_column(primary_key=True)
    username:   Mapped[str]
    role:       Mapped[str]
    message:    Mapped[str]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ContactMessage(Base):
    __tablename__ = "contact_messages"
    id:         Mapped[int] = mapped_column(primary_key=True)
    name:       Mapped[str]
    email:      Mapped[str]
    subject:    Mapped[str] = mapped_column(default="General")
    message:    Mapped[str]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    status:     Mapped[str] = mapped_column(default="Pending")
    reply:      Mapped[Optional[str]] = mapped_column(nullable=True)
    reply_at:   Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class DeletionRequest(Base):
    __tablename__ = "deletion_requests"
    id:            Mapped[int] = mapped_column(primary_key=True)
    user_id:       Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_name:     Mapped[str]   # kept so admins can see who requested even after the account is deleted
    user_email:    Mapped[str]
    reason:        Mapped[str]
    custom_reason: Mapped[Optional[str]] = mapped_column(nullable=True)
    status:        Mapped[str] = mapped_column(default="Pending")   # Pending | Approved | Rejected
    admin_note:    Mapped[Optional[str]] = mapped_column(nullable=True)
    created_at:    Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# password utils

async def hash_password(plain: str) -> str:
    # runs in a thread so bcrypt doesn't block the event loop
    return await asyncio.to_thread(lambda: bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode())

def check_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# seed accounts (override via env vars in .env)

SYSTEM_ACCOUNTS = [
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
        "name":     os.getenv("DEMO_ADMIN_NAME",     "Demo Customer"),
        "phone":    os.getenv("DEMO_ADMIN_PHONE",    "+10000000003"),
        "email":    os.getenv("DEMO_ADMIN_EMAIL",    "customer@example.com"),
        "password": os.getenv("DEMO_ADMIN_PASSWORD", "Customer123!"),
        "role":     "customer",
    },
]

DEMO_NAMES = [
    "Alice Johnson", "Bob Smith", "Carol Williams", "David Brown", "Eva Martinez",
    "Frank Garcia", "Grace Lee", "Henry Wilson", "Iris Taylor", "Jack Anderson",
    "Karen Thomas", "Liam Jackson", "Mia White", "Noah Harris", "Olivia Martin",
    "Paul Thompson", "Quinn Moore", "Rachel Davis", "Sam Miller", "Tina Clark",
]

DEMO_PLANS = [
    # Internet
    "Internet Basic", "Internet Advanced", "Internet Premium", "Internet Ultra", "Fiber Gigabit",
    # Mobile
    "Mobile Basic", "Mobile Advanced", "Mobile Premium", "Mobile Ultra",
    # Business
    "Business Starter", "Business Pro", "Business Enterprise",
    # TV
    "TV Basic", "TV Advanced", "TV Premium",
    # Cyber Security
    "Cyber Security Basic", "Cyber Security Pro", "Cyber Security Enterprise",
    # Cloud
    "Cloud Starter", "Cloud Pro", "Cloud Enterprise",
]


# startup

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # safe migrations for older DB schemas
        for stmt in [
            "ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'Pending'",
            "ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS reply TEXT",
            "ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS reply_at TIMESTAMPTZ",
        ]:
            try:
                await conn.execute(text(stmt))
            except Exception:
                pass

    # refresh system accounts on every start so credentials stay in sync with .env
    async with async_session() as session:
        for acc in SYSTEM_ACCOUNTS:
            user   = (await session.execute(select(User).where(User.email == acc["email"]))).scalar_one_or_none()
            hashed = await hash_password(acc["password"])
            if user:
                user.password = hashed
                user.role     = acc["role"]
                logger.info(f"Account refreshed: {acc['email']}")
            else:
                session.add(User(name=acc["name"], phone=acc["phone"], email=acc["email"], password=hashed, role=acc["role"]))
                logger.info(f"Account created: {acc['email']}")
        await session.commit()

    # only seed demo customers once (skipped if any customers already exist)
    async with async_session() as session:
        count = (await session.execute(select(func.count(User.id)).where(User.role == "customer"))).scalar() or 0
        if count > 0:
            return

        logger.info("Seeding demo customers...")
        names             = random.sample(DEMO_NAMES, len(DEMO_NAMES))
        hashed_pw         = await hash_password(os.getenv("DEMO_USER_PASSWORD", "DemoPass123!"))
        demo_domain       = os.getenv("DEMO_EMAIL_DOMAIN", "example.com")
        demo_phone_prefix = os.getenv("DEMO_PHONE_PREFIX", "+1555")

        for i, name in enumerate(names):
            email = f"user{i+1}@{demo_domain}"
            user  = User(
                name=name,
                phone=f"{demo_phone_prefix}{random.randint(1000000, 9999999)}",
                email=email,
                password=hashed_pw,
                role="customer",
            )
            session.add(user)
            await session.flush()

            chosen_plans = random.sample(DEMO_PLANS, min(random.randint(1, 10), len(DEMO_PLANS)))
            for plan in chosen_plans:
                since = datetime.now(timezone.utc) - timedelta(
                    days=random.randint(0, 3) * 365 + random.randint(1, 11) * 30
                )
                session.add(UserService(user_id=user.id, name=plan, since=since))

        await session.commit()
        logger.info(f"Seeded {len(names)} demo customers.")


# users

async def db_get_all_users():
    async with async_session() as session:
        users = (await session.execute(select(User).options(selectinload(User.services)).order_by(User.id))).scalars().all()
        return [
            {
                "id": u.id, "name": u.name, "phone": u.phone, "email": u.email, "role": u.role,
                "subscribedServices": [{"name": s.name, "since": s.since.isoformat() if s.since else None} for s in u.services],
            }
            for u in users
        ]


async def db_get_user_by_email(email: str):
    async with async_session() as session:
        user = (await session.execute(select(User).where(User.email == email))).scalar_one_or_none()
        if not user:
            return None
        return {"id": user.id, "name": user.name, "phone": user.phone, "email": user.email, "password": user.password, "role": user.role}


async def db_create_user(name: str, phone: str, email: str, password: str, role: str) -> dict:
    async with async_session() as session:
        user = User(name=name, phone=phone, email=email, password=await hash_password(password), role=role)
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}


async def db_add_user_service(user_id: int, service_name: str, since: Optional[str] = None):
    async with async_session() as session:
        svc = UserService(user_id=user_id, name=service_name)
        if since:
            svc.since = datetime.fromisoformat(since.replace("Z", "+00:00"))
        session.add(svc)
        await session.commit()


# profile

async def db_get_user_profile(user_id: int) -> Optional[dict]:
    async with async_session() as session:
        user = (await session.execute(
            select(User).options(selectinload(User.services)).where(User.id == user_id)
        )).scalar_one_or_none()
        if not user:
            return None
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "services": [{"name": s.name, "since": s.since.isoformat() if s.since else None} for s in user.services],
        }


async def db_delete_user(user_id: int) -> bool:
    async with async_session() as session:
        user = await session.get(User, user_id)
        if not user:
            return False
        await session.delete(user)
        await session.commit()
        return True


# chatlogs

async def db_get_all_chatlogs():
    async with async_session() as session:
        rows = (await session.execute(select(ChatLog).order_by(ChatLog.created_at.asc()))).scalars().all()
        return [{"id": r.id, "user": r.username, "role": r.role, "text": r.message, "timestamp": r.created_at.isoformat() if r.created_at else None} for r in rows]


async def db_create_chatlog(username: str, role: str, message: str) -> dict:
    async with async_session() as session:
        log = ChatLog(username=username, role=role, message=message)
        session.add(log)
        await session.commit()
        await session.refresh(log)
        return {"id": log.id, "user": log.username, "role": log.role, "text": log.message, "timestamp": log.created_at.isoformat() if log.created_at else None}


async def db_delete_chatlog(log_id: int) -> bool:
    async with async_session() as session:
        log = await session.get(ChatLog, log_id)
        if not log:
            return False
        await session.delete(log)
        await session.commit()
        return True


async def db_delete_all_chatlogs():
    async with engine.begin() as conn:
        await conn.execute(text("TRUNCATE TABLE chatlogs RESTART IDENTITY"))


# stats & contacts

async def db_get_stats() -> dict:
    async with async_session() as session:
        users, subs, chats, contacts = (await session.execute(
            select(
                func.count(User.id),
                func.count(UserService.id),
                func.count(ChatLog.id),
                func.count(ContactMessage.id),
            )
        )).one()
        return {
            "users":            users    or 0,
            "subscriptions":    subs     or 0,
            "chatInteractions": chats    or 0,
            "contactMessages":  contacts or 0,
        }


async def db_save_contact(name: str, email: str, subject: str, message: str):
    async with async_session() as session:
        session.add(ContactMessage(name=name, email=email, subject=subject, message=message))
        await session.commit()


async def db_get_all_contacts():
    async with async_session() as session:
        rows = (await session.execute(
            select(ContactMessage).order_by(ContactMessage.created_at.desc())
        )).scalars().all()
        return [
            {
                "id": r.id,
                "name": r.name,
                "email": r.email,
                "subject": r.subject,
                "message": r.message,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "status": r.status or "Pending",
            }
            for r in rows
        ]


async def db_resolve_contact(contact_id: int) -> bool:
    async with async_session() as session:
        msg = await session.get(ContactMessage, contact_id)
        if not msg:
            return False
        msg.status = "Resolved"
        await session.commit()
        return True


async def db_reply_contact(contact_id: int, reply_text: str) -> bool:
    async with async_session() as session:
        msg = await session.get(ContactMessage, contact_id)
        if not msg:
            return False
        msg.reply    = reply_text
        msg.reply_at = datetime.now(timezone.utc)
        msg.status   = "Resolved"
        await session.commit()
        return True


# deletion requests

async def db_create_deletion_request(
    user_id: int, user_name: str, user_email: str, reason: str, custom_reason: Optional[str]
) -> dict:
    async with async_session() as session:
        # replace any existing pending request for this user
        existing = (await session.execute(
            select(DeletionRequest).where(
                DeletionRequest.user_id == user_id,
                DeletionRequest.status == "Pending",
            )
        )).scalar_one_or_none()
        if existing:
            await session.delete(existing)

        req = DeletionRequest(
            user_id=user_id,
            user_name=user_name,
            user_email=user_email,
            reason=reason,
            custom_reason=custom_reason,
        )
        session.add(req)
        await session.commit()
        await session.refresh(req)
        return {
            "id": req.id,
            "status": req.status,
            "reason": req.reason,
            "custom_reason": req.custom_reason,
            "created_at": req.created_at.isoformat(),
        }


async def db_get_all_deletion_requests() -> list:
    async with async_session() as session:
        rows = (await session.execute(
            select(DeletionRequest).order_by(DeletionRequest.created_at.desc())
        )).scalars().all()
        return [
            {
                "id": r.id,
                "user_id": r.user_id,
                "user_name": r.user_name,
                "user_email": r.user_email,
                "reason": r.reason,
                "custom_reason": r.custom_reason,
                "status": r.status,
                "admin_note": r.admin_note,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]


async def db_get_user_deletion_request(user_id: int) -> Optional[dict]:
    async with async_session() as session:
        row = (await session.execute(
            select(DeletionRequest)
            .where(DeletionRequest.user_id == user_id)
            .order_by(DeletionRequest.created_at.desc())
            .limit(1)
        )).scalar_one_or_none()
        if not row:
            return None
        return {
            "id": row.id,
            "status": row.status,
            "reason": row.reason,
            "custom_reason": row.custom_reason,
            "admin_note": row.admin_note,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }


async def db_approve_deletion_request(request_id: int) -> bool:
    async with async_session() as session:
        req = await session.get(DeletionRequest, request_id)
        if not req:
            return False
        req.status = "Approved"
        user_id = req.user_id
        await session.commit()

    if user_id:
        await db_delete_user(user_id)
    return True


async def db_reject_deletion_request(request_id: int, admin_note: str) -> bool:
    async with async_session() as session:
        req = await session.get(DeletionRequest, request_id)
        if not req:
            return False
        req.status     = "Rejected"
        req.admin_note = admin_note
        await session.commit()
        return True
