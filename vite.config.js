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

export default defineConfig({
  plugins: [react(), feedbackStoragePlugin()],
})

