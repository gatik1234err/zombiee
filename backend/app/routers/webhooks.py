from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.database import get_db
from app.models import API, AuditTrail
from app.schemas import APIResponse

router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])


@router.post("/gateway")
async def ingest_gateway_logs(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.json()
    return APIResponse(message="Gateway logs ingested", data={"count": len(body) if isinstance(body, list) else 1})


@router.post("/sensor")
async def ingest_sensor_events(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.json()
    return APIResponse(message="Sensor events ingested", data={"count": len(body) if isinstance(body, list) else 1})
