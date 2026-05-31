import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, Boolean, Enum, JSON, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY as PG_ARRAY
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class APIStatus(str, enum.Enum):
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    ORPHANED = "orphaned"
    SHADOW = "shadow"
    ZOMBIE = "zombie"


class DataSensitivity(str, enum.Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"


class FindingSeverity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class FindingStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"


class UserRole(str, enum.Enum):
    VIEWER = "viewer"
    ANALYST = "analyst"
    ENGINEER = "engineer"
    ADMIN = "admin"
    AUDITOR = "auditor"


class WorkflowStage(str, enum.Enum):
    DETECTED = "detected"
    QUARANTINED = "quarantined"
    APPROVED = "approved"
    DECOMMISSIONED = "decommissioned"
    COMPLETED = "completed"
    RESCUED = "rescued"


class DependencyType(str, enum.Enum):
    CALLS = "calls"
    DATABASE = "database"
    QUEUE = "queue"
    EVENT = "event"


class DependencyStrength(str, enum.Enum):
    STRONG = "strong"
    WEAK = "weak"
    OCCASIONAL = "occasional"


class API(Base):
    __tablename__ = "apis"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    endpoint_path = Column(String(500), nullable=False)
    http_method = Column(String(10), nullable=False)
    environment = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default="active", index=True)
    risk_score = Column(Integer, default=0, index=True)
    data_sensitivity = Column(String(20), nullable=False, default="internal")
    owner_team = Column(String(100), index=True)
    owner_email = Column(String(200))
    business_domain = Column(String(200))
    protocol = Column(String(20), default="HTTPS")
    tls_version = Column(String(10), default="TLS 1.2")
    framework = Column(String(100))
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    last_traffic_timestamp = Column(DateTime)
    deprecation_date = Column(DateTime, nullable=True)
    decommission_date = Column(DateTime, nullable=True)
    api_metadata = Column("metadata", JSONB, default=dict)
    tags = Column(PG_ARRAY(Text), default=list)

    security_findings = relationship("SecurityFinding", back_populates="api", lazy="selectin")
    traffic_metrics = relationship("TrafficMetric", back_populates="api", lazy="selectin")
    decommission_workflow = relationship("DecommissionWorkflow", back_populates="api", uselist=False, lazy="selectin")
    source_dependencies = relationship("APIDependency", foreign_keys="APIDependency.source_api_id", back_populates="source_api", lazy="selectin")
    target_dependencies = relationship("APIDependency", foreign_keys="APIDependency.target_api_id", back_populates="target_api", lazy="selectin")


class SecurityFinding(Base):
    __tablename__ = "security_findings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    api_id = Column(UUID(as_uuid=True), ForeignKey("apis.id"), nullable=False, index=True)
    dimension = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    evidence = Column(Text)
    remediation_steps = Column(Text)
    cvss_score = Column(Float)
    status = Column(String(20), default="open")
    assigned_to = Column(String(200))
    due_date = Column(DateTime)
    resolved_at = Column(DateTime)
    resolved_by = Column(String(200))

    api = relationship("API", back_populates="security_findings")


class TrafficMetric(Base):
    __tablename__ = "traffic_metrics"

    time = Column(DateTime, primary_key=True)
    api_id = Column(UUID(as_uuid=True), ForeignKey("apis.id"), primary_key=True)
    request_count = Column(Integer, default=0)
    error_4xx_count = Column(Integer, default=0)
    error_5xx_count = Column(Integer, default=0)
    avg_response_time_ms = Column(Float, default=0)
    p95_response_time_ms = Column(Float, default=0)
    p99_response_time_ms = Column(Float, default=0)
    unique_ips = Column(Integer, default=0)

    api = relationship("API", back_populates="traffic_metrics")


class AuditTrail(Base):
    __tablename__ = "audit_trail"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    actor_id = Column(String(200))
    actor_email = Column(String(200))
    actor_role = Column(String(50))
    action = Column(String(50), nullable=False)
    target_type = Column(String(50))
    target_id = Column(String(200))
    target_name = Column(String(500))
    before_state = Column(JSONB)
    after_state = Column(JSONB)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    session_id = Column(String(200))
    justification = Column(Text)


class DecommissionWorkflow(Base):
    __tablename__ = "decommission_workflows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    api_id = Column(UUID(as_uuid=True), ForeignKey("apis.id"), nullable=False, index=True)
    current_stage = Column(String(20), nullable=False, default="detected", index=True)
    detected_at = Column(DateTime, default=datetime.utcnow)
    quarantined_at = Column(DateTime)
    quarantined_by = Column(String(200))
    approved_at = Column(DateTime)
    approved_by = Column(String(200))
    decommissioned_at = Column(DateTime)
    decommissioned_by = Column(String(200))
    rescued_at = Column(DateTime)
    rescued_by = Column(String(200))
    rescue_reason = Column(Text)
    grace_period_days = Column(Integer, default=30)
    auto_decommission_date = Column(DateTime)
    pr_url = Column(String(500))
    pr_status = Column(String(50))
    notification_sent_at = Column(DateTime)
    notification_acknowledged_at = Column(DateTime)
    safety_catch_triggered = Column(Boolean, default=False)
    safety_catch_triggered_at = Column(DateTime)

    api = relationship("API", back_populates="decommission_workflow")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(200), unique=True, nullable=False)
    name = Column(String(200))
    avatar_url = Column(String(500))
    role = Column(String(20), default="viewer")
    team = Column(String(100))
    department = Column(String(100))
    mfa_enabled = Column(Boolean, default=False)
    last_login_at = Column(DateTime)
    is_active = Column(Boolean, default=True)


class APIDependency(Base):
    __tablename__ = "api_dependencies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_api_id = Column(UUID(as_uuid=True), ForeignKey("apis.id"), nullable=False)
    target_api_id = Column(UUID(as_uuid=True), ForeignKey("apis.id"), nullable=False)
    dependency_type = Column(String(20), nullable=False)
    strength = Column(String(20), nullable=False)

    source_api = relationship("API", foreign_keys=[source_api_id], back_populates="source_dependencies")
    target_api = relationship("API", foreign_keys=[target_api_id], back_populates="target_dependencies")
