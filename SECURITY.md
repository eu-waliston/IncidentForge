# Security Policy

## Intended use
IncidentForge is a controlled training and demonstration lab. Playbooks are simulations; do not connect them to production response systems without a separate threat model, authorization, and safety review.

## Reporting
Do not publish secrets, evidence contents, personal data, or exploitable details in public issues. Contact the repository maintainer privately with a concise reproduction and impact description.

## Current security boundaries
- Helmet security headers, restrictive configurable CORS, JSON body limits, request IDs, and in-memory rate limiting are enabled.
- `API_ACCESS_TOKEN` optionally protects all `/api` routes using `x-api-token`. This is a shared-token gate, not user authentication or role-based access control. Use a strong secret and TLS when accessed remotely.
- Rate limiting is process-local and resets on restart. It is not a replacement for a reverse-proxy/WAF limiter in a multi-instance deployment.
- Evidence content is stored locally and SHA-256 checked, but database and custody history are not tamper-proof against privileged administrators.
- Actor values currently supplied by clients are not authenticated identity claims.
- No production deployment should be considered secure until authentication/authorization, secret management, TLS, backups/restore tests, dependency scanning, and external security review are completed.
