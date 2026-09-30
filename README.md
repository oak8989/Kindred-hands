# VolunteerHub - Volunteer Tracking System

A complete, production-ready volunteer tracking system that runs in Docker and can be securely accessed over the internet.

## Features

- **Volunteer Accounts**: Email-based registration with temporary passwords and mandatory password reset
- **Public & Private Events**: Browse, register, and manage events with capacity tracking
- **Recurring Events**: Daily, weekly, and monthly schedules with single-occurrence cancellation
- **Member Portal**: Profile, event registrations, attendance history, medals, and progress tracking
- **Check-in/Check-out**: QR code scanning, staff-assisted attendance, and walk-in support
- **Administration**: Role-based tools for managing members, events, attendance, waivers, and settings
- **White-label Branding**: Customizable organization name, logo, colors, and theme
- **Waivers**: Versioned waiver management with digital signature collection
- **CSV Exports**: Export member and attendance data with volunteer hours
- **Medals**: Configurable participation milestones with automatic and manual awards
- **Email**: Console/file delivery by default; configurable SMTP for production
- **Password Reset**: Secure, expiring, single-use reset links
- **Roles**: Member, Assistant, and Admin with server-enforced permissions

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)
- At least 512MB RAM available for containers

## Quick Start

### 1. Clone and Configure

```bash
git clone <repository-url> volunteerhub
cd volunteerhub

# Copy environment file
cp .env.example .env

# IMPORTANT: Edit .env and set strong passwords/secrets
# Generate secrets with: openssl rand -hex 32
nano .env
```

### 2. Start the Application

```bash
docker compose up -d
```

### 3. Run the Setup Wizard

Open your browser to `http://localhost:3000` (or your configured `HOST_PORT`).

The setup wizard will guide you through:
1. **Network Configuration** - Choose the host port
2. **Organization Setup** - Name, branding, timezone
3. **Email Configuration** - Console (default), file, or SMTP
4. **Admin Account** - Create the initial administrator

### 4. Access the Application

After setup, log in with the admin credentials you created.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HOST_PORT` | Port on host machine | `3000` |
| `APP_NAME` | Organization name | `VolunteerHub` |
| `APP_URL` | Public URL | `http://localhost:3000` |
| `SECRET_KEY` | Session/token signing key | **Must change** |
| `POSTGRES_DB` | Database name | `volunteerhub` |
| `POSTGRES_USER` | Database user | `volunteerhub` |
| `POSTGRES_PASSWORD` | Database password | **Must change** |
| `REDIS_PASSWORD` | Redis password | **Must change** |
| `EMAIL_MODE` | `console`, `file`, or `smtp` | `console` |
| `SMTP_HOST` | SMTP server hostname | - |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_ENCRYPTION` | `none`, `tls`, or `starttls` | `starttls` |
| `SMTP_USERNAME` | SMTP username | - |
| `SMTP_PASSWORD` | SMTP password | - |
| `SMTP_FROM_ADDRESS` | Sender email address | - |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `900000` |
| `RATE_LIMIT_MAX` | Max requests per window | `20` |

**What belongs where:**
- **Environment variables (.env)**: Secrets, database credentials, SMTP passwords, domain configuration
- **Setup wizard**: Organization name, branding, admin account, email mode selection
- **Never commit**: `.env` file, any file containing real passwords or tokens

## Email Modes

### Console Mode (Default)
All emails are logged to Docker logs. Perfect for development and testing.
```bash
docker compose logs -f app | grep EMAIL
```

### File Mode
Emails are saved as files in `/data/logs/emails/` inside the container.
```bash
docker compose exec app ls /data/logs/emails/
```

### SMTP Mode
Configure in `.env` or via the admin settings panel:
```env
EMAIL_MODE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_ENCRYPTION=starttls
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_ADDRESS=noreply@yourdomain.com
```

## Local Network Access

To access from other devices on your local network:

1. Find your server's local IP:
   ```bash
   # Linux/Mac
   ip addr show | grep "inet " | grep -v 127.0.0.1
   # Windows
   ipconfig
   ```

2. Access from any device on the network:
   ```
   http://<your-server-ip>:3000
   ```

3. If using a firewall, allow the port:
   ```bash
   # UFW (Ubuntu)
   sudo ufw allow 3000/tcp

   # Firewalld (RHEL/Fedora)
   sudo firewall-cmd --permanent --add-port=3000/tcp
   sudo firewall-cmd --reload
   ```

## Secure Internet Exposure

**Docker alone does not configure internet access.** You must configure your network infrastructure.

### Option 1: Reverse Proxy with HTTPS (Recommended)

Use a reverse proxy like Caddy or Nginx with Let's Encrypt:

#### Using Caddy (simplest)

```bash
# Install Caddy on your host machine
# Create Caddyfile
cat > Caddyfile << 'EOF'
volunteer.yourdomain.com {
    reverse_proxy localhost:3000
}
EOF

# Run Caddy
caddy start
```

#### Using Nginx with Let's Encrypt

```bash
# Install certbot and nginx
sudo apt install nginx certbot python3-certbot-nginx

# Configure nginx
cat > /etc/nginx/sites-available/volunteerhub << 'EOF'
server {
    listen 80;
    server_name volunteer.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/volunteerhub /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d volunteer.yourdomain.com
```

### Option 2: Direct Exposure (Not Recommended)

If you must expose directly:
1. Configure your router to forward port 3000 to your server
2. Set `APP_URL` in `.env` to your public URL
3. Ensure `SECRET_KEY` is a strong random value
4. Consider using a firewall to restrict access

### DNS Configuration

Point your domain to your server's public IP:
1. Get your public IP: `curl ifconfig.me`
2. Create an A record: `volunteer.yourdomain.com → YOUR_IP`
3. Wait for DNS propagation (up to 48 hours)

### Router Configuration

1. Access your router admin panel (usually `192.168.1.1`)
2. Find "Port Forwarding" or "Virtual Server"
3. Forward external port 80/443 to your server's internal IP on port 3000
4. Assign a static IP to your server in DHCP settings

## Upgrades

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose up -d --build

# Verify health
docker compose ps
docker compose logs --tail=50 app
```

## Backups

### Database Backup
```bash
# Create backup
docker compose exec db pg_dump -U volunteerhub volunteerhub > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated daily backup (add to crontab)
0 2 * * * cd /path/to/volunteerhub && docker compose exec -T db pg_dump -U volunteerhub volunteerhub > /path/to/backups/db_$(date +\%Y\%m\%d).sql
```

### Full System Backup
```bash
# Stop services
docker compose down

# Backup volumes
docker run --rm -v volunteerhub_db-data:/data -v $(pwd):/backup alpine tar czf /backup/full-backup-$(date +%Y%m%d).tar.gz /data

# Restart
docker compose up -d
```

### Restore
```bash
# Restore database
cat backup.sql | docker compose exec -T db psql -U volunteerhub volunteerhub

# Or restore full backup
docker compose down
docker run --rm -v volunteerhub_db-data:/data -v $(pwd):/backup alpine sh -c "cd / && tar xzf /backup/full-backup-YYYYMMDD.tar.gz"
docker compose up -d
```

## Troubleshooting

### Application won't start
```bash
# Check logs
docker compose logs app
docker compose logs db

# Verify containers are running
docker compose ps

# Restart services
docker compose restart
```

### Can't access from browser
1. Verify the app is running: `docker compose ps`
2. Check port mapping: `docker compose port app 80`
3. Check firewall rules
4. Try `curl http://localhost:3000` from the server

### Database connection errors
```bash
# Check database health
docker compose exec db pg_isready

# View database logs
docker compose logs db
```

### Email not sending
1. Check email mode in settings
2. For SMTP: verify credentials in `.env`
3. Check email logs in admin panel
4. View Docker logs: `docker compose logs app | grep EMAIL`

### Reset the application
```bash
# WARNING: This deletes all data
docker compose down -v
docker compose up -d
# Re-run setup wizard at http://localhost:3000
```

## Security Notes

- **Passwords** are hashed using modern algorithms (bcrypt in production, simulated in demo)
- **Sessions** use secure cookie settings with HttpOnly and SameSite flags
- **CSRF protection** is implemented for state-changing operations
- **Rate limiting** prevents brute-force attacks on authentication
- **QR tokens** are short-lived (5 minutes) and single-use
- **Reset tokens** expire after 1 hour and are single-use
- **Generic responses** prevent email enumeration during registration/reset
- **Input validation** is performed on all user inputs
- **Secrets** are never logged or exposed in error messages

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Internet                       │
└────────────────────┬────────────────────────────┘
                     │ HTTPS (443)
┌────────────────────┴────────────────────────────┐
│              Reverse Proxy (Caddy/Nginx)         │
│              - TLS termination                   │
│              - Rate limiting                     │
└────────────────────┬────────────────────────────┘
                     │ HTTP (3000)
┌────────────────────┴────────────────────────────┐
│              Docker Host                         │
│  ┌─────────────────────────────────────────┐    │
│  │  VolunteerHub App (nginx + React SPA)   │    │
│  │  - Port 80 (mapped to host 3000)        │    │
│  └─────────────────────────────────────────┘    │
│  ┌──────────────┐  ┌──────────────────────┐    │
│  │  PostgreSQL   │  │  Redis               │    │
│  │  (port 5432)  │  │  (port 6379)         │    │
│  └──────────────┘  └──────────────────────┘    │
│                                                 │
│  Volumes: db-data, app-uploads, app-backups     │
└─────────────────────────────────────────────────┘
```

## License

MIT License - See LICENSE file for details.

## Support

For issues and questions, please open an issue on the project repository.
