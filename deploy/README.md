# Deployment Assets

This folder contains deployment templates and packaging scripts.

## Structure

- `nginx/cost-system.conf.template`: Nginx reverse proxy template (domain + SSL placeholders).
- `scripts/package-backend.bat`: Build backend JAR and copy runtime config.
- `scripts/package-frontend.bat`: Build frontend static assets.
- `scripts/package-all.bat`: Build frontend + backend and collect outputs to `deploy/dist`.
- `scripts/render-nginx-config.bat`: Render a domain-specific Nginx config from the template.
- `scripts/cleanup-build-artifacts.bat`: Remove local build/cache artifacts.

## Quick Start

1. Run package script from project root:

   ```bat
   deploy\scripts\package-all.bat
   ```

2. Packaged files are generated under:

   - `deploy/dist/backend`
   - `deploy/dist/frontend`
   - `deploy/dist/nginx`

3. Generate a domain-specific Nginx config:

   ```bat
   deploy\scripts\render-nginx-config.bat your.domain.com
   ```

   Optional certificate paths:

   ```bat
   deploy\scripts\render-nginx-config.bat your.domain.com /etc/nginx/ssl/your.domain.com.crt /etc/nginx/ssl/your.domain.com.key
   ```

## Deployment Notes

- Backend default port: `31943` (context path `/api`).
- Nginx proxies `/api/` to backend and serves frontend static files.
- Replace SSL cert/key placeholders before applying config in production.
