/**
 * PM2 Ecosystem Configuration
 * 
 * Manages Discord bot, Telegram bot, and API server with auto-restart,
 * memory limits, and graceful shutdown.
 * 
 * Usage:
 *   pm2 start ecosystem.config.js              # Start all processes
 *   pm2 monit                                   # Monitor processes
 *   pm2 logs                                    # View logs
 *   pm2 save                                    # Save state
 *   pm2 startup                                 # Enable startup on system reboot
 */

module.exports = {
  apps: [
    {
      name: 'discord-bot',
      script: 'run_discord_bot.py',
      interpreter: '/Users/apple/roma-translation-bot/venv312/bin/python',
      interpreter_args: '-u',
      
      // Auto-restart on crash
      autorestart: true,
      max_restarts: 10,
      min_uptime: '30s',
      max_memory_restart: '512M',
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
      shutdown_with_message: true,
      
      // Environment
      env: {
        NODE_ENV: 'production',
        PYTHONUNBUFFERED: '1',
        LOG_LEVEL: 'INFO'
      },
      
      // Logging
      output: 'logs/discord-bot.log',
      error: 'logs/discord-bot-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Instance management
      instances: 1,
      exec_mode: 'fork',
      
      // Monitoring
      monitor_delay: 2000,
      
      // Ignore patterns
      ignore_watch: [
        'node_modules',
        'logs',
        'data',
        '.git'
      ],
      
      // Watch for changes
      watch: false,
      
      // Merge logs
      merge_logs: true
    },
    
    {
      name: 'telegram-bot',
      script: 'run_telegram_bot.py',
      interpreter: '/Users/apple/roma-translation-bot/venv312/bin/python',
      interpreter_args: '-u',
      
      // Auto-restart on crash
      autorestart: true,
      max_restarts: 10,
      min_uptime: '30s',
      max_memory_restart: '512M',
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
      shutdown_with_message: true,
      
      // Environment
      env: {
        NODE_ENV: 'production',
        PYTHONUNBUFFERED: '1',
        LOG_LEVEL: 'INFO'
      },
      
      // Logging
      output: 'logs/telegram-bot.log',
      error: 'logs/telegram-bot-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Instance management
      instances: 1,
      exec_mode: 'fork',
      
      // Monitoring
      monitor_delay: 2000,
      
      // Ignore patterns
      ignore_watch: [
        'node_modules',
        'logs',
        'data',
        '.git'
      ],
      
      // Watch for changes
      watch: false,
      
      // Merge logs
      merge_logs: true
    },
    
    {
      name: 'api-server',
      script: 'run_api.py',
      interpreter: '/Users/apple/roma-translation-bot/venv312/bin/python',
      interpreter_args: '-u',
      
      // Auto-restart on crash
      autorestart: true,
      max_restarts: 10,
      min_uptime: '30s',
      max_memory_restart: '1G',
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
      shutdown_with_message: true,
      
      // Environment
      env: {
        NODE_ENV: 'production',
        PYTHONUNBUFFERED: '1',
        LOG_LEVEL: 'INFO'
      },
      
      // Logging
      output: 'logs/api-server.log',
      error: 'logs/api-server-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Instance management
      instances: 1,
      exec_mode: 'fork',
      
      // Monitoring
      monitor_delay: 2000,
      
      // Ignore patterns
      ignore_watch: [
        'node_modules',
        'logs',
        'data',
        '.git'
      ],
      
      // Watch for changes
      watch: false,
      
      // Merge logs
      merge_logs: true
    }
  ],
  
  // Deploy configuration (optional)
  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo.git',
      path: '/var/www/roma-translation-bot',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': ''
    }
  }
};
