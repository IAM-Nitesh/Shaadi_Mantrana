# Render Keep-Alive Solutions

This directory contains multiple solutions to keep your Render production server awake and prevent it from sleeping due to inactivity.

## 🚀 Quick Start

### Option 1: GitHub Actions (Recommended)
The most reliable solution - runs automatically in the cloud.

1. **Already configured!** The `.github/workflows/keep-alive.yml` file is set up to ping your server every 10 minutes.
2. **No setup required** - it runs automatically when you push this to your repository.
3. **Free** - GitHub Actions has generous free limits.

### Option 2: Local Node.js Script
Run the keep-alive service on your local machine.

```bash
# Run in foreground
npm run keep-alive

# Or run in background
npm run keep-alive-bg

# Or run directly
node scripts/keep-alive.js
```

### Option 3: Local Bash Script
Simple bash script for local execution.

```bash
# Make executable (one time)
chmod +x scripts/keep-alive.sh

# Run the script
./scripts/keep-alive.sh
```

### Option 4: Cron Job (Automated Local)
Set up an automated cron job on your local machine.

```bash
# Setup cron job (runs every minute)
./scripts/setup-cron.sh

# Check if it's working
crontab -l | grep keep-alive

# Remove cron job when needed
crontab -e  # Then delete the keep-alive line
```

## 📋 Available Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `keep-alive.js` | Node.js keep-alive service with stats | `npm run keep-alive` |
| `keep-alive.sh` | Bash keep-alive script | `./scripts/keep-alive.sh` |
| `setup-cron.sh` | Setup automated cron job | `./scripts/setup-cron.sh` |

## 🔧 Configuration

### GitHub Actions
- **Frequency**: Every 10 minutes (configurable in `.github/workflows/keep-alive.yml`)
- **URL**: `https://shaadi-mantrana.onrender.com/health`
- **Timeout**: 10 seconds

### Local Scripts
- **Frequency**: Every 60 seconds (configurable in scripts)
- **URL**: `https://shaadi-mantrana.onrender.com/health`
- **Timeout**: 10 seconds

## 📊 Monitoring

### GitHub Actions
- Check the "Actions" tab in your GitHub repository
- View logs for each keep-alive run
- See success/failure status

### Local Scripts
Both Node.js and Bash scripts provide real-time monitoring:

```
✅ [2025-09-01 12:34:56] Ping 42 - Server awake (HTTP 200, 0.234s)
📊 Stats: 42/42 successful (100.0% uptime)
```

## 🛑 Stopping Keep-Alive

### GitHub Actions
- Delete or disable the `.github/workflows/keep-alive.yml` file
- Or add a manual trigger only

### Local Scripts
- Press `Ctrl+C` to stop the running script
- For background processes: `pkill -f keep-alive`

### Cron Jobs
```bash
# Edit cron jobs
crontab -e

# Remove the keep-alive line, then save
```

## 🔍 Troubleshooting

### Server Still Sleeping?
1. **Check the ping frequency** - Render free tier sleeps after ~15 minutes
2. **Verify the URL** - Make sure `/health` endpoint is working
3. **Check logs** - Look for connection errors or timeouts

### GitHub Actions Not Running?
1. **Check repository settings** - Ensure Actions are enabled
2. **Verify workflow file** - Make sure `.github/workflows/keep-alive.yml` exists
3. **Check permissions** - Repository needs Actions permissions

### Local Script Issues?
1. **Check Node.js version** - Requires Node.js 14+
2. **Verify network** - Ensure you can reach Render
3. **Check permissions** - Scripts need execute permissions

## 💡 Best Practices

1. **Use GitHub Actions** for production (most reliable)
2. **Monitor regularly** - Check that pings are successful
3. **Adjust frequency** - Increase/decrease based on your needs
4. **Have backups** - Multiple keep-alive methods if needed
5. **Check costs** - Free tiers have limits

## 📈 Alternatives

If you need more advanced monitoring, consider:

- **UptimeRobot** (free tier available)
- **Pingdom** (paid service)
- **New Relic** (comprehensive monitoring)
- **DataDog** (enterprise monitoring)

## 🤝 Contributing

To modify the keep-alive behavior:

1. **GitHub Actions**: Edit `.github/workflows/keep-alive.yml`
2. **Node.js Script**: Edit `scripts/keep-alive.js`
3. **Bash Script**: Edit `scripts/keep-alive.sh`

Remember to test changes before deploying!
