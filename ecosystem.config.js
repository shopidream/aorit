module.exports = {
    apps: [{
      name: 'aorit',
      script: './node_modules/.bin/next',
      args: 'start -p 3100',
      cwd: '/var/www/aorit/aorit',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3100
      },
      env_file: './.env.local',
      error_file: '/root/.pm2/logs/aorit-error.log',
      out_file: '/root/.pm2/logs/aorit-out.log',
      log_file: '/root/.pm2/logs/aorit-combined.log',
      time: true
    }]
  }