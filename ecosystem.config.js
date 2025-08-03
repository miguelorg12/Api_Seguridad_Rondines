module.exports = {
  apps: [{
    name: 'api-seguridad-rondines',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    cwd: './',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_qa: {
      NODE_ENV: 'qa',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
}; 