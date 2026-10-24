import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function saveToMysql(item) {
  try {
    const mysql = await import('mysql2/promise')
    const conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'minion',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'test',
    })
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        course VARCHAR(50),
        rating INT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    const [res] = await conn.execute(
      'INSERT INTO feedback (name, course, rating, message) VALUES (?, ?, ?, ?)',
      [item.name || 'Anonymous', item.course || 'general', item.rating || 5, item.message || '']
    )
    await conn.end()
    return res.insertId
  } catch (err) {
    console.warn('[MySQL] Warning:', err.message)
    return null
  }
}

async function getFromMysql() {
  try {
    const mysql = await import('mysql2/promise')
    const conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'minion',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'test',
    })
    const [rows] = await conn.execute('SELECT * FROM feedback ORDER BY id DESC')
    await conn.end()
    return rows
  } catch {
    return null
  }
}

function feedbackStoragePlugin() {
  return {
    name: 'feedback-storage-plugin',
    configureServer(server) {
      server.middlewares.use('/api/feedback', (req, res) => {
        const feedbackDir = path.resolve(__dirname, 'feedback')
        if (!fs.existsSync(feedbackDir)) {
          fs.mkdirSync(feedbackDir, { recursive: true })
        }
        const summaryFile = path.resolve(feedbackDir, 'feedbacks.json')
        const rootFeedbackFile = path.resolve(__dirname, 'feedback.json')

        if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => {
            body += chunk
          })
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}')
              data.id = 'fb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)
              data.createdAt = new Date().toISOString()

              // 1. Save to MySQL database
              const mysqlId = await saveToMysql(data)
              if (mysqlId) {
                data.mysqlId = mysqlId
              }

              // 2. Also save to feedback.json file on PC as local backup
              let feedbacks = []
              if (fs.existsSync(rootFeedbackFile)) {
                try {
                  const content = fs.readFileSync(rootFeedbackFile, 'utf-8').trim()
                  if (content) feedbacks = JSON.parse(content)
                } catch {
                  feedbacks = []
                }
              }
              feedbacks.push(data)
              fs.writeFileSync(rootFeedbackFile, JSON.stringify(feedbacks, null, 2), 'utf-8')

              // Also update feedback/ folder
              try {
                fs.writeFileSync(summaryFile, JSON.stringify(feedbacks, null, 2), 'utf-8')
              } catch {}

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, count: feedbacks.length, mysqlId }))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message }))
            }
          })
        } else if (req.method === 'GET') {
          ;(async () => {
            try {
              const mysqlRows = await getFromMysql()
              if (mysqlRows) {
                res.setHeader('Content-Type', 'application/json')
                return res.end(JSON.stringify({ success: true, count: mysqlRows.length, source: 'mysql', feedbacks: mysqlRows }))
              }
              let feedbacks = []
              if (fs.existsSync(rootFeedbackFile)) {
                const content = fs.readFileSync(rootFeedbackFile, 'utf-8').trim()
                if (content) feedbacks = JSON.parse(content)
              }
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, count: feedbacks.length, source: 'file', feedbacks }))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message }))
            }
          })()
        } else {
          res.statusCode = 404
          res.end()
        }
      })
    },
  }
}

async function findUserByEmail(email) {
  try {
    const mysql = await import('mysql2/promise')
    const conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'minion',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'test',
    })
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(100) DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)
    const cleanEmail = email.trim().toLowerCase()
    const [rows] = await conn.execute('SELECT id, email, name, created_at FROM users WHERE LOWER(email) = ?', [cleanEmail])
    if (rows.length > 0) {
      await conn.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [rows[0].id])
    }
    await conn.end()
    return rows[0] || null
  } catch (err) {
    console.warn('[MySQL Auth] findUser error:', err.message)
    return null
  }
}

async function registerUser(email, name = '') {
  const mysql = await import('mysql2/promise')
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'minion',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'test',
  })
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(100) DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)
  const cleanEmail = email.trim().toLowerCase()
  const cleanName = name.trim() || cleanEmail.split('@')[0]
  try {
    const [res] = await conn.execute(
      'INSERT INTO users (email, name) VALUES (?, ?)',
      [cleanEmail, cleanName]
    )
    await conn.end()
    return { id: res.insertId, email: cleanEmail, name: cleanName }
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const [rows] = await conn.execute('SELECT id, email, name FROM users WHERE LOWER(email) = ?', [cleanEmail])
      await conn.end()
      return rows[0]
    }
    await conn.end()
    throw err
  }
}

function authPlugin() {
  return {
    name: 'auth-plugin',
    configureServer(server) {
      // POST /api/auth/login
      server.middlewares.use('/api/auth/login', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end()
        }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const { email } = JSON.parse(body || '{}')
            if (!email || !email.includes('@')) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ error: 'Valid email is required' }))
            }
            const user = await findUserByEmail(email)
            res.setHeader('Content-Type', 'application/json')
            if (user) {
              res.end(JSON.stringify({ success: true, exists: true, user }))
            } else {
              res.end(JSON.stringify({ success: true, exists: false, message: 'Email not registered. Please register.' }))
            }
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })

      // POST /api/auth/register
      server.middlewares.use('/api/auth/register', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end()
        }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const { email, name } = JSON.parse(body || '{}')
            if (!email || !email.includes('@')) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ error: 'Valid email is required' }))
            }
            const user = await registerUser(email, name)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, user }))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), feedbackStoragePlugin(), authPlugin()],
})

