from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta

from app.database import get_db
from app.models import API, DecommissionWorkflow
from app.schemas import APIResponse

router = APIRouter(prefix="/api/v1", tags=["zombies"])


@router.get("/zombies")
async def list_zombies(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DecommissionWorkflow)
        .options(selectinload(DecommissionWorkflow.api))
        .order_by(DecommissionWorkflow.detected_at.desc())
    )
    workflows = result.scalars().all()

    return APIResponse(data=[{
        "id": str(wf.id),
        "api_id": str(wf.api_id),
        "endpoint_path": wf.api.endpoint_path if wf.api else None,
        "http_method": wf.api.http_method if wf.api else None,
        "risk_score": wf.api.risk_score if wf.api else 0,
        "environment": wf.api.environment if wf.api else None,
        "owner_team": wf.api.owner_team if wf.api else None,
        "current_stage": wf.current_stage,
        "detected_at": wf.detected_at.isoformat() if wf.detected_at else None,
        "quarantined_at": wf.quarantined_at.isoformat() if wf.quarantined_at else None,
        "approved_at": wf.approved_at.isoformat() if wf.approved_at else None,
        "decommissioned_at": wf.decommissioned_at.isoformat() if wf.decommissioned_at else None,
        "rescued_at": wf.rescued_at.isoformat() if wf.rescued_at else None,
        "grace_period_days": wf.grace_period_days,
        "auto_decommission_date": wf.auto_decommission_date.isoformat() if wf.auto_decommission_date else None,
        "pr_url": wf.pr_url,
        "pr_status": wf.pr_status,
        "safety_catch_triggered": wf.safety_catch_triggered,
        "days_in_stage": (datetime.utcnow() - (wf.quarantined_at or wf.detected_at)).days if (wf.quarantined_at or wf.detected_at) else 0,
        "days_since_last_traffic": (datetime.utcnow() - (wf.api.last_traffic_timestamp or wf.api.last_seen)).days if wf.api else 0,
    } for wf in workflows])


@router.get("/shadows")
async def list_shadows(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(API).where(API.status == "shadow").order_by(API.risk_score.desc())
    )
    apis = result.scalars().all()

    return APIResponse(data=[{
        "id": str(api.id),
        "endpoint_path": api.endpoint_path,
        "http_method": api.http_method,
        "environment": api.environment,
        "risk_score": api.risk_score,
        "data_sensitivity": api.data_sensitivity,
        "first_seen": api.first_seen.isoformat() if api.first_seen else None,
        "last_seen": api.last_seen.isoformat() if api.last_seen else None,
    } for api in apis])
