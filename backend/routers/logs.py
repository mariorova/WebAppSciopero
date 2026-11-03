from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models.spider_log import SpiderLog

router = APIRouter(prefix="/api/logs", tags=["Monitoraggio Log"])

@router.get("", status_code=status.HTTP_200_OK)
def get_spider_logs(
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, description="Filtra per stato (SUCCESS, FAILED)"),
    db: Session = Depends(get_db)
):
    query = db.query(SpiderLog)
    if status_filter:
        query = query.filter(SpiderLog.status.ilike(f"%{status_filter}%"))
    
    logs = query.order_by(SpiderLog.start_time.desc()).limit(limit).all()
    
    return [
        {
            "id": log.id,
            "start_time": log.start_time,
            "end_time": log.end_time,
            "status": log.status,
            "records_added": log.records_added,
            "error_message": log.error_message
        }
        for log in logs
    ]