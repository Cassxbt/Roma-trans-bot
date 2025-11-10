# 24/7 Bot Deployment Guide 🚀

**Goal:** Deploy Discord and Telegram bots to run 24/7 on a server
**Users:** Just chat with the bots - no local setup needed

---

## 🎯 DEPLOYMENT OPTIONS

### Option 1: Railway.app (RECOMMENDED - Easiest) ⭐⭐⭐
- **Cost:** FREE tier available ($5/month for both bots)
- **Setup Time:** 15 minutes
- **Difficulty:** Easy
- **Auto-restart:** Yes
- **Logs:** Built-in dashboard
- **Best for:** Quick deployment, beginners

### Option 2: Heroku
- **Cost:** $7/month per bot ($14 total)
- **Setup Time:** 20 minutes
- **Difficulty:** Easy
- **Auto-restart:** Yes
- **Logs:** Built-in
- **Best for:** Reliable, established platform

### Option 3: DigitalOcean/AWS/VPS
- **Cost:** $6-12/month (one server for both bots)
- **Setup Time:** 45 minutes
- **Difficulty:** Medium
- **Auto-restart:** Manual setup (PM2)
- **Logs:** Manual setup
- **Best for:** Full control, scalability

### Option 4: Render.com
- **Cost:** FREE tier available
- **Setup Time:** 15 minutes
- **Difficulty:** Easy
- **Auto-restart:** Yes
- **Logs:** Built-in
- **Best for:** Free hosting, simple setup

---

## 🚀 RECOMMENDED: Railway.app Deployment

### Why Railway?
- ✅ FREE tier (500 hours/month - enough for both bots)
- ✅ Automatic deployments from GitHub
- ✅ Built-in monitoring and logs
- ✅ Auto-restart on crash
- ✅ Environment variables management
- ✅ No credit card required for free tier
- ✅ Simple setup (15 minutes)

---

## 📦 STEP-BY-STEP: Railway Deployment

### Prerequisites
- GitHub account
- Railway account (free signup)
- Your bot tokens (already in `.env`)

### Step 1: Prepare Repository (5 min)

#### 1.1 Create `.gitignore` (if not exists)
```bash
# Already exists, but verify it includes:
.env
venv312/
__pycache__/
*.pyc
*.db
data/
.DS_Store
```

#### 1.2 Create `requirements.txt`
```bash
cd /Users/apple/roma-translation-bot
source venv312/bin/activate
pip freeze > requirements.txt
```

#### 1.3 Create `Procfile` for Railway
```
discord: python run_discord_bot.py
telegram: python run_telegram_bot.py
```

#### 1.4 Create `railway.json` (optional - for configuration)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 2: Push to GitHub (5 min)

```bash
cd /Users/apple/roma-translation-bot

# Initialize git (if not already)
git init

# Add all files (except .env - it's in .gitignore)
git add .

# Commit
git commit -m "Initial commit - Discord and Telegram translation bots"

# Create GitHub repo (via GitHub website or CLI)
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/roma-translation-bot.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Railway (5 min)

#### 3.1 Sign up for Railway
1. Go to https://railway.app
2. Sign up with GitHub
3. Authorize Railway

#### 3.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `roma-translation-bot` repository
4. Railway will detect Python and start building

#### 3.3 Configure Environment Variables
1. Click on your project
2. Go to "Variables" tab
3. Add all variables from your `.env` file:
   ```
   DISCORD_BOT_TOKEN=...
   TELEGRAM_BOT_TOKEN=...
   DEEPL_API_KEY=...
   AZURE_TRANSLATOR_KEY=...
   AZURE_TRANSLATOR_REGION=...
   LIBRETRANSLATE_API_KEY=...
   MAX_TARGET_LANGUAGES=10
   MAX_TEXT_LENGTH=10000
   ```

#### 3.4 Deploy Both Bots
Railway will auto-deploy, but you need TWO services:

**For Discord Bot:**
1. Create new service from same repo
2. Set start command: `python run_discord_bot.py`
3. Name it "Discord Bot"

**For Telegram Bot:**
1. Create another service from same repo
2. Set start command: `python run_telegram_bot.py`
3. Name it "Telegram Bot"

### Step 4: Verify Deployment (2 min)

1. Check logs in Railway dashboard
2. Look for "✅ Discord bot logged in" or "🤖 Starting Telegram bot"
3. Test bots in Discord/Telegram
4. Both should respond!

---

## 🔧 ALTERNATIVE: DigitalOcean VPS Deployment

### Cost: $6/month (basic droplet)

### Step 1: Create Droplet
1. Sign up at DigitalOcean
2. Create Ubuntu 22.04 droplet ($6/month)
3. SSH into server

### Step 2: Setup Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.12
sudo apt install python3.12 python3.12-venv python3-pip -y

# Install Git
sudo apt install git -y

# Clone repository
git clone https://github.com/YOUR_USERNAME/roma-translation-bot.git
cd roma-translation-bot

# Create virtual environment
python3.12 -m venv venv312
source venv312/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Configure Environment
```bash
# Create .env file
nano .env

# Paste your environment variables
# Save and exit (Ctrl+X, Y, Enter)
```

### Step 4: Install PM2 for Process Management
```bash
# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Create PM2 ecosystem file
nano ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [
    {
      name: 'discord-bot',
      script: 'run_discord_bot.py',
      interpreter: '/root/roma-translation-bot/venv312/bin/python',
      cwd: '/root/roma-translation-bot',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'telegram-bot',
      script: 'run_telegram_bot.py',
      interpreter: '/root/roma-translation-bot/venv312/bin/python',
      cwd: '/root/roma-translation-bot',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

### Step 5: Start Bots with PM2
```bash
# Start both bots
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it gives you

# Check status
pm2 status

# View logs
pm2 logs
```

### Step 6: Monitor Bots
```bash
# Real-time monitoring
pm2 monit

# Check logs
pm2 logs discord-bot
pm2 logs telegram-bot

# Restart if needed
pm2 restart all
```

---

## 📊 DEPLOYMENT COMPARISON

| Feature | Railway | Heroku | DigitalOcean | Render |
|---------|---------|--------|--------------|--------|
| **Cost** | FREE/$5 | $14/mo | $6/mo | FREE |
| **Setup Time** | 15 min | 20 min | 45 min | 15 min |
| **Auto-restart** | ✅ | ✅ | Manual (PM2) | ✅ |
| **Logs** | ✅ Built-in | ✅ Built-in | Manual | ✅ Built-in |
| **Monitoring** | ✅ Dashboard | ✅ Dashboard | Manual | ✅ Dashboard |
| **Scalability** | ✅ Easy | ✅ Easy | ✅ Full control | ✅ Easy |
| **Free Tier** | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| **Difficulty** | ⭐ Easy | ⭐ Easy | ⭐⭐ Medium | ⭐ Easy |

---

## 🎯 MY RECOMMENDATION

### For Quick Start: Railway.app
- **Why:** FREE, easiest setup, auto-deploy from GitHub
- **Time:** 15 minutes total
- **Perfect for:** Getting bots online ASAP

### For Full Control: DigitalOcean + PM2
- **Why:** Full server control, one price for both bots
- **Time:** 45 minutes setup
- **Perfect for:** Learning server management, customization

---

## 📝 POST-DEPLOYMENT CHECKLIST

After deployment, verify:
- [ ] Discord bot responds to commands
- [ ] Telegram bot responds to commands
- [ ] Both bots show online status
- [ ] ROMA parallel execution works
- [ ] All 10 languages work
- [ ] Natural language parsing works
- [ ] Error handling works
- [ ] Logs are accessible
- [ ] Auto-restart works (test by killing process)
- [ ] Environment variables loaded correctly

---

## 🔍 MONITORING & MAINTENANCE

### Daily Checks
- Check bot status (online/offline)
- Review error logs
- Monitor API quota usage

### Weekly Checks
- Review usage statistics
- Check for errors/crashes
- Update dependencies if needed

### Monthly Checks
- Review costs
- Optimize performance
- Update documentation

---

## 🚨 TROUBLESHOOTING

### Bot Not Starting
1. Check logs for errors
2. Verify environment variables
3. Check API keys are valid
4. Ensure dependencies installed

### Bot Crashes
1. Check memory usage
2. Review error logs
3. Check API quotas
4. Verify network connectivity

### Slow Response
1. Check provider API status
2. Review ROMA execution logs
3. Check server resources
4. Optimize cache settings

---

## 🚀 NEXT STEPS

1. **Choose deployment platform** (Railway recommended)
2. **Prepare repository** (requirements.txt, Procfile)
3. **Push to GitHub**
4. **Deploy to platform**
5. **Configure environment variables**
6. **Test both bots**
7. **Share bot links with users!**

---

## 📞 SUPPORT

### Railway Support
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway

### DigitalOcean Support
- Docs: https://docs.digitalocean.com
- Community: https://www.digitalocean.com/community

---

## ✅ READY TO DEPLOY?

Let me know which platform you want to use and I'll guide you through the setup step-by-step! 🚀
