import asyncio
import random
import uuid
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import text

from app.models import (
    Base, API, SecurityFinding, TrafficMetric, AuditTrail,
    DecommissionWorkflow, User, APIDependency
)
from app.database import DATABASE_URL

random.seed(42)

ENDPOINTS = [
    ("/api/v1/accounts/{account_id}/balance", "GET"),
    ("/api/v1/accounts/{account_id}/transactions", "GET"),
    ("/api/v1/accounts/{account_id}/transfer", "POST"),
    ("/api/v1/accounts/{account_id}/details", "GET"),
    ("/api/v1/accounts/bulk", "POST"),
    ("/api/v1/cards/{card_id}/status", "GET"),
    ("/api/v1/cards/{card_id}/transactions", "GET"),
    ("/api/v1/cards/{card_id}/freeze", "POST"),
    ("/api/v1/cards/{card_id}/unfreeze", "POST"),
    ("/api/v1/cards/apply", "POST"),
    ("/api/v1/loans/{loan_id}/status", "GET"),
    ("/api/v1/loans/{loan_id}/repayment", "POST"),
    ("/api/v1/loans/calculate", "POST"),
    ("/api/v1/loans/apply", "POST"),
    ("/api/v1/payments/{payment_id}/status", "GET"),
    ("/api/v1/payments/initiate", "POST"),
    ("/api/v1/payments/schedule", "POST"),
    ("/api/v1/payments/batch", "POST"),
    ("/api/v1/transactions/{txn_id}/details", "GET"),
    ("/api/v1/transactions/recent", "GET"),
    ("/api/v1/transactions/search", "GET"),
    ("/api/v1/users/{user_id}/profile", "GET"),
    ("/api/v1/users/{user_id}/profile", "PUT"),
    ("/api/v1/users/{user_id}/preferences", "GET"),
    ("/api/v1/users/{user_id}/preferences", "PUT"),
    ("/api/v1/users/register", "POST"),
    ("/api/v1/auth/login", "POST"),
    ("/api/v1/auth/logout", "POST"),
    ("/api/v1/auth/refresh", "POST"),
    ("/api/v1/auth/mfa/setup", "POST"),
    ("/api/v1/notifications/{user_id}/list", "GET"),
    ("/api/v1/notifications/{user_id}/mark-read", "POST"),
    ("/api/v1/notifications/send", "POST"),
    ("/api/v1/reports/transactions/monthly", "GET"),
    ("/api/v1/reports/accounts/summary", "GET"),
    ("/api/v1/reports/compliance/pci-dss", "GET"),
    ("/api/v1/reports/fraud/daily", "GET"),
    ("/api/v1/compliance/kyc/{user_id}/status", "GET"),
    ("/api/v1/compliance/kyc/submit", "POST"),
    ("/api/v1/compliance/aml/check", "POST"),
    ("/api/v1/internal/audit/logs", "GET"),
    ("/api/v1/internal/audit/logs/export", "POST"),
    ("/api/v1/internal/metrics/system", "GET"),
    ("/api/v1/internal/health", "GET"),
    ("/api/v2/accounts/{account_id}/balance", "GET"),
    ("/api/v2/accounts/{account_id}/transactions", "GET"),
    ("/api/v2/payments/initiate", "POST"),
    ("/api/v2/users/{user_id}/profile", "GET"),
    ("/legacy/accounts/{account_id}", "GET"),
    ("/legacy/transactions/{txn_id}", "GET"),
    ("/legacy/users/{user_id}", "GET"),
    ("/internal/admin/users", "GET"),
    ("/internal/admin/users/{user_id}", "DELETE"),
    ("/internal/debug/env", "GET"),
    ("/internal/debug/config", "GET"),
    ("/api/v1/analytics/track", "POST"),
    ("/api/v1/analytics/events", "POST"),
    ("/api/v1/onboarding/start", "POST"),
    ("/api/v1/onboarding/{user_id}/progress", "GET"),
    ("/api/v1/currency/convert", "GET"),
    ("/api/v1/currency/rates", "GET"),
    ("/api/v1/exchange/rate", "GET"),
    ("/api/v1/exchange/trade", "POST"),
    ("/api/v1/investments/portfolio", "GET"),
    ("/api/v1/investments/trade", "POST"),
    ("/api/v1/investments/history", "GET"),
    ("/api/v1/insurance/policies", "GET"),
    ("/api/v1/insurance/claim", "POST"),
    ("/api/v1/mortgage/calculate", "POST"),
    ("/api/v1/mortgage/apply", "POST"),
    ("/api/v1/mortgage/{mortgage_id}/status", "GET"),
    ("/api/v1/support/tickets", "POST"),
    ("/api/v1/support/tickets/{ticket_id}", "GET"),
    ("/api/v1/support/chat/initiate", "POST"),
]

OWNERS = [
    ("Retail Banking", "retail-banking@bank.com"),
    ("Payments", "payments@bank.com"),
    ("Core Banking", "core-banking@bank.com"),
    ("Digital Channels", "digital@bank.com"),
    ("Risk & Compliance", "risk@bank.com"),
    ("Card Services", "cards@bank.com"),
    ("Loans", "loans@bank.com"),
    ("Investments", "investments@bank.com"),
    ("Fraud Detection", "fraud@bank.com"),
    ("Platform Engineering", "platform@bank.com"),
]

DOMAINS = [
    "Account Management", "Payments", "Card Services", "Loans", "User Management",
    "Authentication", "Notifications", "Reporting", "Compliance", "Internal Tools",
    "Analytics", "Onboarding", "Currency Exchange", "Investments", "Insurance",
    "Mortgage", "Support", "Fraud Detection", "Audit", "Legacy Systems",
]

FRAMEWORKS = ["Spring Boot", "Express.js", "Django REST", "FastAPI", "Go Gin", ".NET Core", "Ruby on Rails", "Flask"]
TLS_VERSIONS = ["TLS 1.3", "TLS 1.2", "TLS 1.1", "TLS 1.0"]
PROTOCOLS = ["HTTPS", "HTTP", "gRPC", "GraphQL"]

SECURITY_DIMENSIONS = [
    "authentication", "authorization", "encryption", "rate_limiting",
    "input_validation", "data_exposure", "infra_security", "headers",
    "cors", "logging", "compliance", "dependencies"
]

CRITICAL_FINDINGS = [
    ("No Rate Limiting", "API endpoint has no rate limiting configured, making it susceptible to brute force and DoS attacks", "Missing X-Rate-Limit headers in response", "Implement rate limiting using token bucket algorithm with Redis backend. Configure limits per user/IP."),
    ("Missing OAuth 2.0", "API does not require any authentication for access", "Endpoint accessible without any Authorization header", "Implement OAuth 2.0 with PKCE flow. Use JWT tokens with 15-min expiry."),
    ("TLS 1.0 Enabled", "Server accepts TLS 1.0 connections which is deprecated", "TLS version negotiation shows TLS 1.0 accepted", "Disable TLS 1.0/1.1, enforce minimum TLS 1.2"),
    ("PII in Response Body", "API returns full PII data including unmasked card numbers", "Response contains 'pan': '4111111111111111'", "Implement data masking. Return only last 4 digits for card numbers."),
    ("SQL Injection Vulnerable", "Endpoint does not sanitize user input in query parameters", "Parameter 'account_id' passed directly to SQL query", "Use parameterized queries. Implement input validation with allowlist."),
    ("Verbose Error Messages", "API returns stack traces in error responses", "Response contains 'Traceback (most recent call last)'", "Implement global error handler. Return generic error messages in production."),
    ("Missing Security Headers", "Response missing Content-Security-Policy, X-Frame-Options, etc.", "HTTP response headers analysis shows missing security headers", "Add CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Strict-Transport-Security"),
    ("CORS Wildcard Origin", "API allows any origin via CORS", "Response header 'Access-Control-Allow-Origin: *'", "Restrict CORS to specific allowed origins. Use allowlist configuration."),
    ("No Audit Logging", "Critical operations not being logged for audit trail", "No audit events detected for data modification operations", "Implement comprehensive audit logging for all data mutations. Log actor, action, before/after state."),
    ("Weak Encryption (AES-128)", "API uses AES-128 for data encryption which is below standard", "Encryption metadata shows AES-128-CBC", "Upgrade to AES-256-GCM for data encryption. Rotate encryption keys."),
    ("Exposed Debug Endpoint", "Debug endpoints accessible from production environment", "GET /internal/debug/env returns environment variables", "Remove debug endpoints from production. Implement network-level access control."),
    ("No Input Validation", "API accepts arbitrary input without validation", "POST body accepts any JSON without schema validation", "Implement request schema validation using JSON Schema or similar. Validate all inputs."),
    ("Missing CSRF Protection", "State-changing endpoints lack CSRF tokens", "POST endpoints accept requests without CSRF token", "Implement CSRF protection with SameSite cookies and anti-CSRF tokens."),
    ("Open Redirect", "API allows redirect to arbitrary URLs", "Parameter 'redirect_url' accepts any external URL", "Implement URL allowlist for redirects. Validate all redirect targets."),
    ("Weak Password Policy", "No minimum password complexity requirements", "Registration accepts password 'password123'", "Implement password policy: minimum 12 chars, upper/lower/numbers/special chars."),
]

HIGH_FINDINGS = [
    ("Insufficient Logging", "API logs minimal information for security events", "Logs contain only basic request info", "Enhance logging to include IP, user agent, request ID, and timestamp."),
    ("Missing API Version Header", "No API versioning strategy in place", "All endpoints serve same codebase", "Implement Accept-Version header strategy for API version management."),
    ("No Request Timeout", "API requests can hang indefinitely", "No timeout configured in gateway", "Configure 30-second request timeout at gateway level."),
    ("Weak Session Management", "Session tokens don't expire", "Session remains valid indefinitely", "Implement 15-min session expiry with sliding window refresh."),
    ("Insecure Direct Object Reference", "API allows accessing other users' data by ID", "GET /accounts/{id} accessible without ownership check", "Implement authorization checks to verify resource ownership."),
]


def generate_traffic(api_status: str, base_requests: int, days_ago: int) -> dict:
    if api_status == "zombie":
        req_count = random.randint(0, 3)
    elif api_status == "shadow":
        req_count = random.randint(50, 200)
    elif api_status == "orphaned":
        req_count = random.randint(5, 50)
    elif api_status == "deprecated":
        req_count = random.randint(10, 100)
    else:
        req_count = random.randint(100, 5000)

    return {
        "request_count": req_count,
        "error_4xx_count": int(req_count * random.uniform(0.01, 0.08)),
        "error_5xx_count": int(req_count * random.uniform(0.005, 0.03)),
        "avg_response_time_ms": round(random.uniform(45, 350), 1),
        "p95_response_time_ms": round(random.uniform(120, 800), 1),
        "p99_response_time_ms": round(random.uniform(250, 2000), 1),
        "unique_ips": random.randint(10, 500),
    }


async def seed_database():
    engine = create_async_engine(DATABASE_URL, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb"))
        await conn.execute(text(
            "SELECT create_hypertable('traffic_metrics', 'time', if_not_exists => TRUE)"
        ))

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        # Create admin user
        admin = User(
            id=uuid.uuid4(),
            email="admin@zaddp.io",
            name="Dr. Sarah Chen",
            role="admin",
            team="Platform Security",
            department="Information Security",
            mfa_enabled=True,
            is_active=True,
        )
        session.add(admin)

        # Create 75 APIs
        created_apis = []
        now = datetime.utcnow()

        status_configs = [
            ("active", 45, 70, 95),
            ("deprecated", 12, 50, 70),
            ("orphaned", 8, 40, 75),
            ("shadow", 5, 75, 98),
            ("zombie", 5, 60, 90),
        ]

        api_counter = 0
        for status, count, risk_min, risk_max in status_configs:
            for _ in range(count):
                if api_counter >= len(ENDPOINTS):
                    break

                ep_path, method = ENDPOINTS[api_counter]
                owner = random.choice(OWNERS)
                env_weights = {"production": 0.6, "staging": 0.2, "development": 0.15, "uat": 0.05}
                env = random.choices(list(env_weights.keys()), weights=list(env_weights.values()))[0]
                sensitivity = random.choices(
                    ["public", "internal", "confidential", "restricted"],
                    weights=[0.1, 0.4, 0.35, 0.15]
                )[0]

                first_seen = now - timedelta(days=random.randint(30, 365))
                last_seen = now - timedelta(days=random.randint(0, 7))

                api = API(
                    id=uuid.uuid4(),
                    endpoint_path=ep_path,
                    http_method=method,
                    environment=env,
                    status=status,
                    risk_score=random.randint(risk_min, risk_max),
                    data_sensitivity=sensitivity,
                    owner_team=owner[0],
                    owner_email=owner[1],
                    business_domain=random.choice(DOMAINS),
                    protocol=random.choices(PROTOCOLS, weights=[0.85, 0.05, 0.05, 0.05])[0],
                    tls_version=random.choices(TLS_VERSIONS, weights=[0.6, 0.3, 0.07, 0.03])[0],
                    framework=random.choice(FRAMEWORKS),
                    first_seen=first_seen,
                    last_seen=last_seen,
                    last_traffic_timestamp=last_seen if status != "zombie" else now - timedelta(days=random.randint(45, 90)),
                    tags=random.sample(["critical", "customer-facing", "internal", "third-party", "regulated", "pci", "pii", "legacy"], k=random.randint(1, 4)),
                    metadata={"source": random.choice(["discovery-scan", "gateway-import", "manual-registration", "sensor-detection"]), "revision": random.randint(1, 15)},
                )
                session.add(api)
                created_apis.append(api)
                api_counter += 1

        await session.flush()

        # Security findings
        finding_dimensions = {}
        for sf_count in range(30):
            api = random.choice(created_apis)
            severity_weights = {"critical": 0.15, "high": 0.25, "medium": 0.35, "low": 0.2, "info": 0.05}
            severity = random.choices(list(severity_weights.keys()), weights=list(severity_weights.values()))[0]
            dimension = random.choice(SECURITY_DIMENSIONS)

            if severity == "critical" and CRITICAL_FINDINGS:
                title, desc, evidence, remediation = random.choice(CRITICAL_FINDINGS)
                cvss = round(random.uniform(8.0, 10.0), 1)
            elif severity == "high" and HIGH_FINDINGS:
                title, desc, evidence, remediation = random.choice(HIGH_FINDINGS)
                cvss = round(random.uniform(6.0, 7.9), 1)
            else:
                title = f"Minor {dimension.replace('_', ' ').title()} Issue"
                desc = f"Minor security observation in {dimension}"
                evidence = f"Scanner detected potential issue in {dimension}"
                remediation = f"Review and address {dimension} findings"
                cvss = round(random.uniform(1.0, 5.9), 1)

            finding = SecurityFinding(
                id=uuid.uuid4(),
                api_id=api.id,
                dimension=dimension,
                severity=severity,
                title=title,
                description=desc,
                evidence=evidence,
                remediation_steps=remediation,
                cvss_score=cvss,
                status=random.choices(["open", "in_progress", "resolved", "false_positive"], weights=[0.6, 0.2, 0.15, 0.05])[0],
                assigned_to=random.choice([None, "security-team@bank.com", "dev-team@bank.com"]),
            )
            session.add(finding)

        # Traffic metrics (30 days)
        for api in created_apis:
            for day in range(30):
                tm = generate_traffic(api.status, 500, day)
                metric = TrafficMetric(
                    time=now - timedelta(days=29 - day),
                    api_id=api.id,
                    **tm,
                )
                session.add(metric)

        # Decommission workflows for zombie APIs
        zombie_apis = [api for api in created_apis if api.status == "zombie"]
        zombie_apis.extend(random.sample([api for api in created_apis if api.status == "orphaned"], min(3, sum(1 for a in created_apis if a.status == "orphaned"))))

        stages = ["detected", "detected", "detected", "quarantined", "quarantined", "quarantined", "approved", "decommissioned"]
        for i, api in enumerate(zombie_apis[:8]):
            stage = stages[i]
            wf = DecommissionWorkflow(
                id=uuid.uuid4(),
                api_id=api.id,
                current_stage=stage,
                detected_at=now - timedelta(days=random.randint(15, 60)),
                quarantined_at=now - timedelta(days=random.randint(5, 30)) if stage in ["quarantined", "approved", "decommissioned"] else None,
                quarantined_by="system" if stage in ["quarantined", "approved", "decommissioned"] else None,
                approved_at=now - timedelta(days=random.randint(1, 10)) if stage == "decommissioned" else None,
                approved_by="admin@zaddp.io" if stage == "decommissioned" else None,
                decommissioned_at=now - timedelta(days=random.randint(1, 5)) if stage == "decommissioned" else None,
                decommissioned_by="admin@zaddp.io" if stage == "decommissioned" else None,
                grace_period_days=30,
                auto_decommission_date=now + timedelta(days=random.randint(5, 25)),
                notification_sent_at=now - timedelta(days=random.randint(1, 14)),
                pr_url=f"https://github.com/bank/api-decommission/pull/{random.randint(100, 999)}" if stage in ["approved", "decommissioned"] else None,
                pr_status=random.choice(["open", "merged"]) if stage in ["approved", "decommissioned"] else None,
            )
            session.add(wf)

        # API dependencies
        for _ in range(20):
            src, tgt = random.sample(created_apis, 2)
            dep = APIDependency(
                id=uuid.uuid4(),
                source_api_id=src.id,
                target_api_id=tgt.id,
                dependency_type=random.choice(["calls", "database", "queue", "event"]),
                strength=random.choice(["strong", "weak", "occasional"]),
            )
            session.add(dep)

        # Audit trail
        for _ in range(25):
            api = random.choice(created_apis)
            audit = AuditTrail(
                id=uuid.uuid4(),
                timestamp=now - timedelta(days=random.randint(0, 30)),
                actor_id=str(admin.id),
                actor_email=admin.email,
                actor_role=admin.role,
                action=random.choice(["view", "quarantine", "edit", "decommission"]),
                target_type="api",
                target_id=str(api.id),
                target_name=api.endpoint_path,
                ip_address=f"10.0.{random.randint(0, 255)}.{random.randint(1, 254)}",
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            )
            session.add(audit)

        await session.commit()
        print(f"Database seeded successfully!")
        print(f"  - {len(created_apis)} APIs created")
        print(f"  - 30 security findings")
        print(f"  - {len(created_apis) * 30} traffic metrics")
        print(f"  - 8 decommission workflows")
        print(f"  - 20 API dependencies")
        print(f"  - 25 audit trail entries")
        print(f"  - 1 admin user")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_database())
