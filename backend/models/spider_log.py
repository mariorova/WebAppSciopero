from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from database import Base

class SpiderLog(Base):
    __tablename__ = "spider_logs"

    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime, default=datetime.now, nullable=False)
    end_time = Column(DateTime, nullable=True)
    status = Column(String, nullable=False)  # "SUCCESS", "FAILED", "RUNNING"
    records_added = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)