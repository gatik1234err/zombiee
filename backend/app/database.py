from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://zaddp:zaddp_secret_2024@localhost:5432/zaddp")

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb"))
        await conn.execute(text(
            "SELECT create_hypertable('traffic_metrics', 'time', if_not_exists => TRUE)"
        ))
