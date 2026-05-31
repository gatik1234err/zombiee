from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import JSONResponse

from app.database import get_db
from app.schemas import APIResponse

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.post("/{report_id}/export")
async def export_report(report_id: str):
    return APIResponse(message="Report export initiated", data={
        "report_id": report_id,
        "status": "generating",
        "download_url": f"/api/v1/reports/{report_id}/download",
    })
