import cors from 'cors'
import express from 'express'
import fs from 'fs'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'

import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/error-handler.js'
import { authRouter } from './routes/auth.route.js'
import { budgetRouter } from './routes/budget.route.js'
import { checklistRouter } from './routes/checklist.route.js'
import { healthRouter } from './routes/health.route.js'
import { tripsRouter } from './routes/trips.route.js'
import { usersRouter } from './routes/users.route.js'


const app = express()
const uploadsDir = path.join(process.cwd(), 'uploads')
fs.mkdirSync(uploadsDir, { recursive: true })

app.use(helmet())
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
)
app.use(express.json())
app.use('/uploads', express.static(uploadsDir))
app.use(morgan('dev'))

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to TravelLoop backend',
  })
})

app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/auth', authRouter)
app.use('/trips', tripsRouter)
app.use('/budget', budgetRouter)
app.use('/checklist', checklistRouter)
app.use('/users', usersRouter)
app.use('/api/trips', tripsRouter)
app.use('/api/budget', budgetRouter)
app.use('/api/checklist', checklistRouter)
app.use('/api/users', usersRouter)

app.use(notFoundHandler)
app.use(errorHandler)

export { app }
