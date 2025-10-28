module.exports = {
  apps: [{
    name: 'alphaarena',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/alphaarena-live',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    time: true
  }]
}
