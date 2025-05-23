const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
    user: process.env.DB_USER || 'dauduphilip',
    password: process.env.DB_PASSWORD || 'dauduphilip',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'whatsapp_bot_birthday'
})

module.exports = {
    query: (text, params) => pool.query(text, params)
} 