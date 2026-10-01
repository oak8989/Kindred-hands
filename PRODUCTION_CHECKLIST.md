# Production Deployment Checklist

## Pre-Deployment

### Security
- [ ] Change all default passwords in `.env`
- [ ] Generate strong `JWT_SECRET` (min 64 chars): `openssl rand -hex 32`
- [ ] Generate strong `POSTGRES_PASSWORD`: `openssl rand -base64 32`
- [ ] Generate strong `REDIS_PASSWORD`: `openssl rand -base64 32`
- [ ] Set `APP_URL` to your production domain
- [ ] Review firewall rules (only expose necessary ports)
- [ ] Enable HTTPS/TLS via reverse proxy
- [ ] Configure CORS for your domain only
- [ ] Review rate limiting settings

### Infrastructure
- [ ] Server meets minimum requirements (1GB+ RAM, 20GB+ disk)
- [ ] Docker and Docker Compose installed and updated
- [ ] Sufficient disk space for database growth
- [ ] Backup strategy implemented and tested
- [ ] Monitoring/logging solution in place
- [ ] SSL certificate obtained (Let's Encrypt or commercial)

### Configuration
- [ ] `.env` file configured with production values
- [ ] Email delivery configured (SMTP recommended for production)
- [ ] Timezone set correctly
- [ ] Organization branding configured
- [ ] Admin account created via setup wizard

## Deployment Steps

1. **Clone repository**
   ```bash
   git clone https://github.com/oak8989/kindred-hands.git
   cd kindred-hands
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   nano .env  # Edit with production values
   ```

3. **Start services**
   ```bash
   docker compose up -d
   ```

4. **Verify health**
   ```bash
   docker compose ps
   curl http://localhost:3000/health
   ```

5. **Run setup wizard**
   - Open browser to `http://your-domain.com`
   - Complete initial configuration
   - Create admin account

6. **Configure reverse proxy** (if exposing to internet)
   - Set up Nginx/Caddy with SSL
   - Update `APP_URL` in `.env`
   - Restart application

## Post-Deployment

### Verification
- [ ] Application accessible via browser
- [ ] Health check endpoint responds: `GET /health`
- [ ] Can register new user
- [ ] Can login with admin account
- [ ] Can create events
- [ ] Can register for events
- [ ] Check-in/check-out works
- [ ] Email delivery working (check logs or inbox)
- [ ] Database backups running automatically

### Monitoring
- [ ] Set up log monitoring (Docker logs, application logs)
- [ ] Configure alerts for:
  - High error rates
  - Database connection issues
  - Disk space warnings
  - Memory usage alerts
- [ ] Set up uptime monitoring (e.g., UptimeRobot, Pingdom)

### Maintenance
- [ ] Schedule regular backups (daily recommended)
- [ ] Test backup restoration quarterly
- [ ] Plan for application updates
- [ ] Document runbook for common issues

## Security Hardening

### Network
- [ ] Use firewall to restrict access
  ```bash
  # UFW example
  sudo ufw allow 22/tcp    # SSH
  sudo ufw allow 80/tcp    # HTTP (for Let's Encrypt)
  sudo ufw allow 443/tcp   # HTTPS
  sudo ufw enable
  ```
- [ ] Disable direct database access from internet
- [ ] Use SSH keys instead of passwords
- [ ] Change SSH port (optional)

### Application
- [ ] Enable HTTPS only (redirect HTTP to HTTPS)
- [ ] Set secure cookie flags
- [ ] Configure Content Security Policy
- [ ] Enable HSTS (HTTP Strict Transport Security)
- [ ] Regular security updates

### Database
- [ ] Use strong, unique password
- [ ] Limit database user permissions
- [ ] Regular security patches
- [ ] Monitor for suspicious activity

## Backup Strategy

### Automated Backups
```bash
# Add to crontab (daily at 2 AM)
0 2 * * * /path/to/kindred-hands/scripts/backup.sh /path/to/backups
```

### Backup Verification
- [ ] Test restore process monthly
- [ ] Verify backup integrity
- [ ] Store backups off-site (S3, Google Drive, etc.)
- [ ] Document restore procedure

### Retention Policy
- Keep daily backups for 7 days
- Keep weekly backups for 4 weeks
- Keep monthly backups for 1 year

## Performance Optimization

### Database
- [ ] Monitor query performance
- [ ] Add indexes for slow queries
- [ ] Regular VACUUM/ANALYZE (PostgreSQL)
- [ ] Connection pooling configured

### Application
- [ ] Enable gzip compression (already configured)
- [ ] Set appropriate cache headers
- [ ] Monitor memory usage
- [ ] Scale horizontally if needed

### Monitoring Tools
- [ ] PostgreSQL: `pg_stat_statements`
- [ ] Application: Winston logs
- [ ] System: `htop`, `iotop`, `netstat`
- [ ] Docker: `docker stats`

## Disaster Recovery

### Recovery Time Objective (RTO)
- Define maximum acceptable downtime
- Document recovery procedures
- Test recovery process quarterly

### Recovery Point Objective (RPO)
- Define maximum acceptable data loss
- Configure backup frequency accordingly
- Test restore process regularly

### Emergency Contacts
- [ ] Database administrator
- [ ] System administrator
- [ ] Application developer
- [ ] Hosting provider support

## Compliance & Legal

- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] GDPR compliance (if applicable)
- [ ] Data retention policy defined
- [ ] User consent mechanisms in place
- [ ] Cookie consent (if required)

## Documentation

- [ ] Deployment guide documented
- [ ] Backup/restore procedures documented
- [ ] Troubleshooting guide available
- [ ] API documentation (if custom integrations)
- [ ] User guide for administrators
- [ ] User guide for volunteers

## Ongoing Maintenance

### Weekly
- [ ] Review error logs
- [ ] Check disk space
- [ ] Verify backups completed
- [ ] Review user activity

### Monthly
- [ ] Security updates
- [ ] Performance review
- [ ] Backup restore test
- [ ] User feedback review

### Quarterly
- [ ] Full system audit
- [ ] Disaster recovery test
- [ ] Capacity planning
- [ ] Security review

## Support Resources

- **Documentation**: README.md
- **Issues**: https://github.com/oak8989/kindred-hands/issues
- **Docker Docs**: https://docs.docker.com/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Express Docs**: https://expressjs.com/

## Quick Commands

```bash
# View logs
docker compose logs -f app

# Restart application
docker compose restart app

# Check health
curl http://localhost:3000/health

# Database shell
docker compose exec db psql -U kindredhands kindredhands

# View resource usage
docker stats

# Update application
git pull
docker compose up -d --build
```
