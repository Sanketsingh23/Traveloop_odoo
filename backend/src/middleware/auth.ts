import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

import { env } from '../config/env.js'

type JwtPayload = {
  userId: string
  email: string
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token is required',
    })
  }

  const token = header.slice(7)

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload
    req.user = decoded
    return next()
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    })
  }
}
