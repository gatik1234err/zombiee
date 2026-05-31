from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List
import math
import uuid

from app.database import get_db
from app.models import API, SecurityFinding, TrafficMetric, DecommissionWorkflow, APIDependency
from app.schemas import APIInventoryItem, APIDetail, PaginatedResponse, APIResponse, SecurityFindingItem

router = APIRouter(prefix="/api/v1/inventory", tags=["inventory"])


@router.get("")
async def list_inventory(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=250),
    status: Optional[str] = Query(None),
    environment: Optional[str] = Query(None),
    risk_tier: Optional[str] = Query(None),
    owner: Optional[str] = Query(None),
    data_sensitivity: Optional[str] = Query(None),
    protocol: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("last_seen"),
    sort_order: Optional[str] = Query("desc"),
    db: AsyncSession = Depends(get_db),
):
    query = select(API).options(
        selectinload(API.traffic_metrics),
        selectinload(API.security_findings),
    )

    if status:
        statuses = [s.strip() for s in status.split(",")]
        query = query.where(API.status.in_(statuses))
    if environment:
        envs = [e.strip() for e in environment.split(",")]
        query = query.where(API.environment.in_(envs))
    if risk_tier:
        tiers = risk_tier.split(",")
        for tier in tiers:
            if tier == "critical":
                query = query.where(API.risk_score >= 80)
            elif tier == "high":
                query = query.where(API.risk_score.between(60, 79))
            elif tier == "medium":
                query = query.where(API.risk_score.between(40, 59))
            elif tier == "low":
                query = query.where(API.risk_score < 40)
    if owner:
        query = query.where(API.owner_team.ilike(f"%{owner}%"))
    if data_sensitivity:
        sensitivities = [s.strip() for s in data_sensitivity.split(",")]
        query = query.where(API.data_sensitivity.in_(sensitivities))
    if protocol:
        query = query.where(API.protocol == protocol)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                API.endpoint_path.ilike(search_term),
                API.business_domain.ilike(search_term),
                API.owner_team.ilike(search_term),
                API.tags.any(search),
            )
        )

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    sort_col = getattr(API, sort_by, API.last_seen)
    if sort_order == "desc":
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col.asc())

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    apis = result.scalars().all()

    items = []
    for api in apis:
        traffic_7d = sum(
            m.request_count for m in (api.traffic_metrics or [])
        )
        items.append(APIInventoryItem(
            id=str(api.id),
            endpoint_path=api.endpoint_path,
            http_method=api.http_method,
            environment=api.environment,
            status=api.status,
            risk_score=api.risk_score,
            data_sensitivity=api.data_sensitivity,
            owner_team=api.owner_team,
            owner_email=api.owner_email,
            business_domain=api.business_domain,
            protocol=api.protocol,
            tls_version=api.tls_version,
            framework=api.framework,
            first_seen=api.first_seen,
            last_seen=api.last_seen,
            last_traffic_timestamp=api.last_traffic_timestamp,
            deprecation_date=api.deprecation_date,
            decommission_date=api.decommission_date,
            tags=api.tags,
            traffic_7d=traffic_7d,
            security_findings_count=len(api.security_findings or []),
        ))

    return PaginatedResponse(
        items=[item.model_dump() for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size),
    )


@router.get("/{api_id}")
async def get_api_detail(api_id: str, db: AsyncSession = Depends(get_db)):
    try:
        uid = uuid.UUID(api_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid API ID")

    query = select(API).options(
        selectinload(API.security_findings),
        selectinload(API.traffic_metrics),
        selectinload(API.decommission_workflow),
        selectinload(API.source_dependencies),
        selectinload(API.target_dependencies),
    ).where(API.id == uid)

    result = await db.execute(query)
    api = result.scalar_one_or_none()

    if not api:
        raise HTTPException(status_code=404, detail="API not found")

    return APIDetail(
        id=str(api.id),
        endpoint_path=api.endpoint_path,
        http_method=api.http_method,
        environment=api.environment,
        status=api.status,
        risk_score=api.risk_score,
        data_sensitivity=api.data_sensitivity,
        owner_team=api.owner_team,
        owner_email=api.owner_email,
        business_domain=api.business_domain,
        protocol=api.protocol,
        tls_version=api.tls_version,
        framework=api.framework,
        first_seen=api.first_seen,
        last_seen=api.last_seen,
        last_traffic_timestamp=api.last_traffic_timestamp,
        deprecation_date=api.deprecation_date,
        decommission_date=api.decommission_date,
        metadata=api.api_metadata,
        tags=api.tags,
        security_findings=[SecurityFindingItem(
            id=str(sf.id),
            api_id=str(sf.api_id),
            dimension=sf.dimension,
            severity=sf.severity,
            title=sf.title,
            description=sf.description,
            evidence=sf.evidence,
            remediation_steps=sf.remediation_steps,
            cvss_score=sf.cvss_score,
            status=sf.status,
            assigned_to=sf.assigned_to,
            due_date=sf.due_date,
            resolved_at=sf.resolved_at,
            resolved_by=sf.resolved_by,
        ) for sf in (api.security_findings or [])],
        traffic_metrics=api.traffic_metrics or [],
        decommission_workflow=api.decommission_workflow,
    )


@router.get("/{api_id}/risk")
async def get_api_risk(api_id: str, db: AsyncSession = Depends(get_db)):
    try:
        uid = uuid.UUID(api_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid API ID")

    result = await db.execute(select(API).where(API.id == uid))
    api = result.scalar_one_or_none()

    if not api:
        raise HTTPException(status_code=404, detail="API not found")

    return APIResponse(data={
        "risk_score": api.risk_score,
        "breakdown": {
            "data_sensitivity_weight": 25,
            "auth_weight": 20,
            "encryption_weight": 15,
            "exposure_weight": 20,
            "age_weight": 10,
            "traffic_weight": 10,
        },
        "factors": [
            {"name": "Data Sensitivity", "score": min(100, api.risk_score + 10), "weight": 25},
            {"name": "Authentication", "score": max(0, api.risk_score - 5), "weight": 20},
            {"name": "Encryption", "score": max(0, api.risk_score - 15), "weight": 15},
            {"name": "Exposure", "score": min(100, api.risk_score + 20), "weight": 20},
            {"name": "Age", "score": min(100, api.risk_score + 5), "weight": 10},
            {"name": "Traffic Pattern", "score": api.risk_score, "weight": 10},
        ],
    })


@router.get("/{api_id}/security")
async def get_api_security(api_id: str, db: AsyncSession = Depends(get_db)):
    try:
        uid = uuid.UUID(api_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid API ID")

    result = await db.execute(
        select(SecurityFinding).where(SecurityFinding.api_id == uid)
    )
    findings = result.scalars().all()

    return APIResponse(data=[{
        "id": str(f.id),
        "api_id": str(f.api_id),
        "dimension": f.dimension,
        "severity": f.severity,
        "title": f.title,
        "description": f.description,
        "evidence": f.evidence,
        "remediation_steps": f.remediation_steps,
        "cvss_score": f.cvss_score,
        "status": f.status,
        "assigned_to": f.assigned_to,
    } for f in findings])


@router.post("/{api_id}/quarantine")
async def quarantine_api(api_id: str, db: AsyncSession = Depends(get_db)):
    try:
        uid = uuid.UUID(api_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid API ID")

    result = await db.execute(select(API).where(API.id == uid))
    api = result.scalar_one_or_none()

    if not api:
        raise HTTPException(status_code=404, detail="API not found")

    api.status = "zombie"
    api.risk_score = min(100, api.risk_score + 20)

    wf_result = await db.execute(
        select(DecommissionWorkflow).where(DecommissionWorkflow.api_id == uid)
    )
    workflow = wf_result.scalar_one_or_none()

    if not workflow:
        from datetime import datetime, timedelta
        workflow = DecommissionWorkflow(
            api_id=uid,
            current_stage="quarantined",
            quarantined_at=datetime.utcnow(),
            quarantined_by="system",
            grace_period_days=30,
            auto_decommission_date=datetime.utcnow() + timedelta(days=30),
        )
        db.add(workflow)
    else:
        workflow.current_stage = "quarantined"
        workflow.quarantined_at = datetime.utcnow()

    await db.commit()

    return APIResponse(message="API quarantined successfully", data={
        "id": str(api.id),
        "status": api.status,
        "risk_score": api.risk_score,
    })


@router.post("/{api_id}/rescue")
async def rescue_api(api_id: str, db: AsyncSession = Depends(get_db)):
    try:
        uid = uuid.UUID(api_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid API ID")

    result = await db.execute(
        select(API).options(selectinload(API.decommission_workflow)).where(API.id == uid)
    )
    api = result.scalar_one_or_none()

    if not api:
        raise HTTPException(status_code=404, detail="API not found")

    api.status = "active"
    api.risk_score = max(0, api.risk_score - 30)

    if api.decommission_workflow:
        api.decommission_workflow.current_stage = "rescued"

    await db.commit()

    return APIResponse(message="API rescued successfully", data={
        "id": str(api.id),
        "status": api.status,
        "risk_score": api.risk_score,
    })


@router.post("/{api_id}/decommission")
async def decommission_api(api_id: str, db: AsyncSession = Depends(get_db)):
    try:
        uid = uuid.UUID(api_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid API ID")

    result = await db.execute(
        select(API).options(selectinload(API.decommission_workflow)).where(API.id == uid)
    )
    api = result.scalar_one_or_none()

    if not api:
        raise HTTPException(status_code=404, detail="API not found")

    api.status = "deprecated"

    if api.decommission_workflow:
        api.decommission_workflow.current_stage = "decommissioned"
        api.decommission_workflow.decommissioned_at = datetime.utcnow()

    await db.commit()

    return APIResponse(message="API decommissioned successfully", data={
        "id": str(api.id),
        "status": api.status,
    })
