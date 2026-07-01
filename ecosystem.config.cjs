module.exports = {
  apps: [
    {
      name: 'clamav-ui',
      script: 'packages/backend/src/index.js',
      cwd: 'C:/Users/USUARIO/Desktop/clamav-ui',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: 47219
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      error_file: 'logs/clamav-ui.error.log',
      out_file: 'logs/clamav-ui.out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
}
