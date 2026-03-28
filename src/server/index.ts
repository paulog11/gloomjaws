import express from 'express'
import { gameRouter } from './routes/game.js'

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(express.json())

// API routes
app.use('/api/game', gameRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

app.listen(PORT, () => {
  console.log(`Gloomjaws server running on http://localhost:${PORT}`)
})
