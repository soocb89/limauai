const path = require('path')
const dotenv = require('dotenv')
dotenv.config({ path: path.join(__dirname, '.env') })

module.exports = {
  apps: [
    {
      name: 'limauai',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: process.env.DATABASE_URL,
        REDIS_URL: process.env.REDIS_URL,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        ADMIN_API_KEY: process.env.ADMIN_API_KEY,
        OWNER_PHONE: process.env.OWNER_PHONE,
        BAILEYS_SESSION_PATH: process.env.BAILEYS_SESSION_PATH,
        PORT: process.env.PORT,
      },
    },
  ],
}
