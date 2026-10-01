# Kindred Hands - Volunteer Tracking System

A complete, production-ready volunteer tracking system with a Node.js/Express backend, PostgreSQL database, and React frontend.

**GitHub:** [oak8989/kindred-hands](https://github.com/oak8989/kindred-hands)

## Features

- **Real Backend API**: Node.js/Express server with PostgreSQL database
- **Secure Authentication**: JWT tokens with bcrypt password hashing
- **Volunteer Accounts**: Email-based registration with temporary passwords
- **Public & Private Events**: Browse, register, and manage events
- **Recurring Events**: Daily, weekly, and monthly schedules
- **Member Portal**: Profile, registrations, attendance, medals
- **Check-in/Check-out**: QR codes, staff-assisted, walk-in support
- **Administration**: Role-based management tools
- **White-label Branding**: Customizable organization settings
- **Waivers**: Versioned waivers with digital signatures
- **CSV Exports**: Export member and attendance data
- **Medals**: Participation milestones and awards
- **Email**: Console/file/SMTP delivery modes
- **Password Reset**: Secure, expiring reset links
- **Roles**: Member, Assistant, Admin with permission enforcement

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Internet                       │
└────────────────────┬────────────────────────────┘
                     │ HTTPS (443)
┌────────────────────┴────────────────────────────┐
│              Reverse Proxy (Optional)            │
│              - TLS termination                   │
│              - Rate limiting                     │
└────────────────────┬────────────────────────────┘
                     │ HTTP (3000)
┌────────────────────┴────────────────────────────┐
│              Docker Host                         │
│  ┌─────────────────────────────────────────┐    │
│  │  Kindred Hands App (Express + React)    │    │
│  │  - API: Port 3001 (mapped to 3000)      │    │
│  │  - Serves static frontend files         │    │
│  └─────────────────────────────────────────┘    │
│  ┌──────────────┐  ┌──────────────────────┐    │
│  │  PostgreSQL   │  │  Redis (Optional)    │    │
│  │  (port 5432)  │  │  (port 6379)         │    │
│  └──────────────┘  └──────────────────────┘    │
│                                                 │
│  Volumes: db-data, app-uploads, app-backups     │
└─────────────────────────────────────────────────┘
```

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)
- At least 1GB RAM available for containers

## Quick Start

### 1. Clone and Configure

```bash
git clone https://github.com/oak8989/kindred-hands.git
cd kindred-hands

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

The application will:
- Build the React frontend
- Start the Express API server
- Initialize the PostgreSQL database
- Run database migrations

### 3. Access the Application

Open your browser to `http://localhost:3000`

The setup wizard will guide you through initial configuration.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HOST_PORT` | Port on host machine | `3000` |
| `APP_NAME` | Organization name | `Kindred Hands` |
| `APP_URL` | Public URL | `http://localhost:3000` |
| `JWT_SECRET` | JWT signing key | **Must change** |
| `POSTGRES_DB` | Database name | `kindredhands` |
| `POSTGRES_USER` | Database user | `kindredhands` |
| `POSTGRES_PASSWORD` | Database password | **Must change** |
| `REDIS_PASSWORD` | Redis password | **Must change** |
| `EMAIL_MODE` | `console`, `file`, or `smtp` | `console` |
| `SMTP_HOST` | SMTP server hostname | - |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_ENCRYPTION` | `none`, `tls`, or `starttls` | `starttls` |
| `SMTP_USERNAME` | SMTP username | - |
| `SMTP_PASSWORD` | SMTP password | - |
| `SMTP_FROM_ADDRESS` | Sender email address | - |
| `LOG_LEVEL` | Logging level | `info` |

## Email Modes

### Console Mode (Default)
All emails are logged to Docker logs. Perfect for development and testing.
```bash
docker compose logs -f app | grep EMAIL
```

### SMTP Mode
Configure in `.env`:
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

Access from other devices on your local network:

1. Find your server's local IP:
   ```bash
   # Linux/Mac
   ip addr show | grep "inet " | grep -v 127.0.0.1
   # Windows
   ipconfig
   ```

2. Access from any device:
   ```
   http://<your-server-ip>:3000
   ```

3. Allow the port in firewall:
   ```bash
   # UFW (Ubuntu)
   sudo ufw allow 3000/tcp

   # Firewalld (RHEL/Fedora)
   sudo firewall-cmd --permanent --add-port=3000/tcp
   sudo firewall-cmd --reload
   ```

## Secure Internet Exposure

### Option 1: Reverse Proxy with HTTPS (Recommended)

#### Using Caddy (simplest)

```bash
# Install Caddy on your host machine
cat > Caddyfile << 'EOF'
kindred-hands.yourdomain.com {
    reverse_proxy localhost:3000
}
EOF

caddy start
```

#### Using Nginx with Let's Encrypt

```bash
sudo apt install nginx certbot python3-certbot-nginx

cat > /etc/nginx/sites-available/kindred-hands << 'EOF'
server {
    listen 80;
    server_name kindred-hands.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/kindred-hands /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d kindred-hands.yourdomain.com
```

### DNS Configuration

1. Get your public IP: `curl ifconfig.me`
2. Create an A record: `kindred-hands.yourdomain.com → YOUR_IP`
3. Wait for DNS propagation (up to 48 hours)

## Database Operations

### Backup

```bash
# Create backup
docker compose exec db pg_dump -U kindredhands kindredhands > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated daily backup (add to crontab)
0 2 * * * cd /path/to/kindred-hands && docker compose exec -T db pg_dump -U kindredhands kindredhands > /path/to/backups/db_$(date +\%Y\%m\%d).sql
```

### Restore

```bash
# Restore from backup
cat backup.sql | docker compose exec -T db psql -U kindredhands kindredhands
```

### Full System Backup

```bash
# Stop services
docker compose down

# Backup volumes
docker run --rm -v kindred-hands_db-data:/data -v $(pwd):/backup alpine tar czf /backup/full-backup-$(date +%Y%m%d).tar.gz /data

# Restart
docker compose up -d
```

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

## Troubleshooting

### Application won't start
```bash
docker compose logs app
docker compose logs db
docker compose ps
docker compose restart
```

### Database connection errors
```bash
docker compose exec db pg_isready
docker compose logs db
```

### Can't access from browser
1. Verify app is running: `docker compose ps`
2. Check port mapping: `docker compose port app 3001`
3. Check firewall rules
4. Try `curl http://localhost:3000` from server

### Email not sending
1. Check email mode in `.env`
2. For SMTP: verify credentials
3. Check email logs: `docker compose logs app | grep EMAIL`
4. Check admin panel email log

### Reset the application
```bash
# WARNING: This deletes all data
docker compose down -v
docker compose up -d
```

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevents brute-force attacks
- **CSRF Protection**: Cookie-based CSRF tokens
- **Security Headers**: Helmet.js middleware
- **Input Validation**: Server-side validation on all endpoints
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy headers
- **Secure Cookies**: HttpOnly, Secure, SameSite flags
- **Generic Responses**: Prevents email enumeration
- **Short-lived Tokens**: QR tokens expire in 5 minutes
- **Password Reset Tokens**: Expire after 1 hour, single-use

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/set-password` - Set new password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Events
- `GET /api/events` - List all events
- `POST /api/events` - Create event (admin/assistant)

### Registrations
- `POST /api/registrations` - Register for event

### Attendance
- `POST /api/attendance/checkin` - Check in to event

### Health
- `GET /health` - Health check endpoint

## Development

### Run locally without Docker

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (separate terminal)
npm install
npm run dev
```

### Database migrations

```bash
cd backend
npm run migrate
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License

## Support

For issues and questions, please [open an issue](https://github.com/oak8989/kindred-hands/issues) on GitHub.
