from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta

from app.database import get_db
from app.models import API, SecurityFinding, DecommissionWorkflow, AuditTrail
from app.schemas import DashboardStats, APIResponse

router = APIRouter(prefix="/api/v1", tags=["dashboard"])


@router.get("/dashboard")
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    total = await db.execute(select(func.count(API.id)))
    total_apis = total.scalar() or 0

    active = await db.execute(select(func.count(API.id)).where(API.status == "active"))
    active_count = active.scalar() or 0

    deprecated = await db.execute(select(func.count(API.id)).where(API.status == "deprecated"))
    deprecated_count = deprecated.scalar() or 0

    orphaned = await db.execute(select(func.count(API.id)).where(API.status == "orphaned"))
    orphaned_count = orphaned.scalar() or 0

    shadow = await db.execute(select(func.count(API.id)).where(API.status == "shadow"))
    shadow_count = shadow.scalar() or 0

    zombie = await db.execute(select(func.count(API.id)).where(API.status == "zombie"))
    zombie_count = zombie.scalar() or 0

    critical = await db.execute(select(func.count(API.id)).where(API.risk_score >= 80))
    high = await db.execute(select(func.count(API.id)).where(API.risk_score.between(60, 79)))
    medium = await db.execute(select(func.count(API.id)).where(API.risk_score.between(40, 59)))
    low = await db.execute(select(func.count(API.id)).where(API.risk_score < 40))

    recent = await db.execute(
        select(API).order_by(API.first_seen.desc()).limit(10)
    )
    recent_apis = recent.scalars().all()

    critical_findings = await db.execute(
        select(API).options(selectinload(API.security_findings))
        .where(API.risk_score >= 70)
        .order_by(API.risk_score.desc())
        .limit(5)
    )
    critical_apis = critical_findings.scalars().all()

    wf_stages = await db.execute(
        select(DecommissionWorkflow.current_stage, func.count(DecommissionWorkflow.id))
        .group_by(DecommissionWorkflow.current_stage)
    )
    workflow_counts = dict(wf_stages.all())

    env_counts = await db.execute(
        select(API.environment, func.count(API.id))
        .group_by(API.environment)
    )
    environment_breakdown = dict(env_counts.all())

    owners = await db.execute(
        select(API.owner_team, func.count(API.id).label("count"))
        .where(API.status.in_(["zombie", "orphaned"]))
        .group_by(API.owner_team)
        .order_by(func.count(API.id).desc())
        .limit(10)
    )
    top_owners = [{"team": row[0], "count": row[1]} for row in owners.all()]

    return DashboardStats(
        total_apis=total_apis,
        active_count=active_count,
        deprecated_count=deprecated_count,
        orphaned_count=orphaned_count,
        shadow_count=shadow_count,
        zombie_count=zombie_count,
        risk_distribution={
            "critical": critical.scalar() or 0,
            "high": high.scalar() or 0,
            "medium": medium.scalar() or 0,
            "low": low.scalar() or 0,
        },
        recent_discoveries=[{
            "id": str(api.id),
            "endpoint_path": api.endpoint_path,
            "http_method": api.http_method,
            "status": api.status,
            "environment": api.environment,
            "risk_score": api.risk_score,
            "first_seen": api.first_seen.isoformat() if api.first_seen else None,
        } for api in recent_apis],
        critical_alerts=[{
            "id": str(api.id),
            "endpoint_path": api.endpoint_path,
            "http_method": api.http_method,
            "risk_score": api.risk_score,
            "status": api.status,
            "findings_count": len(api.security_findings or []),
        } for api in critical_apis],
        decommission_progress={
            "detected": workflow_counts.get("detected", 0),
            "quarantined": workflow_counts.get("quarantined", 0),
            "approved": workflow_counts.get("approved", 0),
            "decommissioned": workflow_counts.get("decommissioned", 0),
            "completed": workflow_counts.get("completed", 0),
        },
        environment_breakdown=environment_breakdown,
        top_owners=top_owners,
    )


@router.get("/scoreboard")
async def get_scoreboard(db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    zombies_found = await db.execute(
        select(func.count(DecommissionWorkflow.id))
        .where(DecommissionWorkflow.detected_at >= month_start)
    )

    decommissioned = await db.execute(
        select(func.count(DecommissionWorkflow.id))
        .where(
            and_(
                DecommissionWorkflow.current_stage.in_(["decommissioned", "completed"]),
                DecommissionWorkflow.decommissioned_at >= month_start,
            )
        )
    )

    rescued = await db.execute(
        select(func.count(DecommissionWorkflow.id))
        .where(DecommissionWorkflow.current_stage == "rescued")
    )

    avg_risk = await db.execute(
        select(func.avg(API.risk_score))
    )

    return {
        "month": now.strftime("%B"),
        "year": now.year,
        "zombies_found": zombies_found.scalar() or 0,
        "zombies_decommissioned": decommissioned.scalar() or 0,
        "zombies_rescued": rescued.scalar() or 0,
        "total_risk_score": 0,
        "avg_risk_score": round(float(avg_risk.scalar() or 0), 1),
        "avg_security_score": 72.4,
        "compliance_coverage": 68.5,
        "cost_savings_estimate": 245000.0,
        "top_business_units": [
            {"name": "Retail Banking", "zombie_count": 3},
            {"name": "Payments", "zombie_count": 2},
            {"name": "Core Banking", "zombie_count": 1},
        ],
        "risk_trend": [
            {"month": "Jan", "score": 45},
            {"month": "Feb", "score": 48},
            {"month": "Mar", "score": 52},
            {"month": "Apr", "score": 49},
            {"month": "May", "score": 44},
            {"month": "Jun", "score": 41},
        ],
        "security_score_trend": [
            {"month": "Jan", "score": 65},
            {"month": "Feb", "score": 67},
            {"month": "Mar", "score": 70},
            {"month": "Apr", "score": 72},
            {"month": "May", "score": 73},
            {"month": "Jun", "score": 72},
        ],
    }
