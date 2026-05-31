from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


class APIInventoryItem(BaseModel):
    id: str
    endpoint_path: str
    http_method: str
    environment: str
    status: str
    risk_score: int
    data_sensitivity: str
    owner_team: Optional[str]
    owner_email: Optional[str]
    business_domain: Optional[str]
    protocol: str
    tls_version: Optional[str]
    framework: Optional[str]
    first_seen: Optional[datetime]
    last_seen: Optional[datetime]
    last_traffic_timestamp: Optional[datetime]
    deprecation_date: Optional[datetime]
    decommission_date: Optional[datetime]
    tags: Optional[List[str]]
    traffic_7d: Optional[int] = 0
    security_findings_count: Optional[int] = 0

    class Config:
        from_attributes = True


class SecurityFindingItem(BaseModel):
    id: str
    api_id: str
    dimension: str
    severity: str
    title: str
    description: Optional[str]
    evidence: Optional[str]
    remediation_steps: Optional[str]
    cvss_score: Optional[float]
    status: str
    assigned_to: Optional[str]
    due_date: Optional[datetime]
    resolved_at: Optional[datetime]
    resolved_by: Optional[str]

    class Config:
        from_attributes = True


class TrafficMetricItem(BaseModel):
    time: datetime
    api_id: str
    request_count: int
    error_4xx_count: int
    error_5xx_count: int
    avg_response_time_ms: float
    p95_response_time_ms: float
    p99_response_time_ms: float
    unique_ips: int

    class Config:
        from_attributes = True


class AuditTrailItem(BaseModel):
    id: str
    timestamp: datetime
    actor_id: Optional[str]
    actor_email: Optional[str]
    actor_role: Optional[str]
    action: str
    target_type: Optional[str]
    target_id: Optional[str]
    target_name: Optional[str]
    before_state: Optional[Dict]
    after_state: Optional[Dict]
    ip_address: Optional[str]
    justification: Optional[str]

    class Config:
        from_attributes = True


class DecommissionWorkflowItem(BaseModel):
    id: str
    api_id: str
    current_stage: str
    detected_at: datetime
    quarantined_at: Optional[datetime]
    quarantined_by: Optional[str]
    approved_at: Optional[datetime]
    approved_by: Optional[str]
    decommissioned_at: Optional[datetime]
    decommissioned_by: Optional[str]
    rescued_at: Optional[datetime]
    rescued_by: Optional[str]
    rescue_reason: Optional[str]
    grace_period_days: int
    auto_decommission_date: Optional[datetime]
    pr_url: Optional[str]
    pr_status: Optional[str]
    notification_sent_at: Optional[datetime]
    notification_acknowledged_at: Optional[datetime]
    safety_catch_triggered: bool
    safety_catch_triggered_at: Optional[datetime]

    class Config:
        from_attributes = True


class APIDetail(BaseModel):
    id: str
    endpoint_path: str
    http_method: str
    environment: str
    status: str
    risk_score: int
    data_sensitivity: str
    owner_team: Optional[str]
    owner_email: Optional[str]
    business_domain: Optional[str]
    protocol: str
    tls_version: Optional[str]
    framework: Optional[str]
    first_seen: Optional[datetime]
    last_seen: Optional[datetime]
    last_traffic_timestamp: Optional[datetime]
    deprecation_date: Optional[datetime]
    decommission_date: Optional[datetime]
    metadata: Optional[Dict]
    tags: Optional[List[str]]
    security_findings: List[SecurityFindingItem] = []
    traffic_metrics: List[TrafficMetricItem] = []
    decommission_workflow: Optional[DecommissionWorkflowItem] = None

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_apis: int
    active_count: int
    deprecated_count: int
    orphaned_count: int
    shadow_count: int
    zombie_count: int
    risk_distribution: Dict[str, int]
    recent_discoveries: List[Dict]
    critical_alerts: List[Dict]
    decommission_progress: Dict[str, int]
    environment_breakdown: Dict[str, int]
    top_owners: List[Dict]


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int


class MonthlyScoreboard(BaseModel):
    month: str
    year: int
    zombies_found: int
    zombies_decommissioned: int
    zombies_rescued: int
    total_risk_score: int
    avg_risk_score: float
    avg_security_score: float
    compliance_coverage: float
    cost_savings_estimate: float
    top_business_units: List[Dict]
    risk_trend: List[Dict]
    security_score_trend: List[Dict]


class InventoryFilter(BaseModel):
    status: Optional[List[str]] = None
    environment: Optional[List[str]] = None
    risk_tier: Optional[List[str]] = None
    data_sensitivity: Optional[List[str]] = None
    owner: Optional[str] = None
    protocol: Optional[str] = None
    has_auth: Optional[bool] = None
    tls_version: Optional[str] = None
    search: Optional[str] = None


class UserItem(BaseModel):
    id: str
    email: str
    name: Optional[str]
    avatar_url: Optional[str]
    role: str
    team: Optional[str]
    department: Optional[str]
    mfa_enabled: bool
    last_login_at: Optional[datetime]
    is_active: bool

    class Config:
        from_attributes = True


class APIResponse(BaseModel):
    success: bool = True
    data: Any = None
    message: Optional[str] = None
    error: Optional[str] = None
