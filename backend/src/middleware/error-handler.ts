import type { NextFunction, Request, Response } from 'express'

export class ApiError extends Error {
  public readonly statusCode: number

  constructor(message: string, statusCode = 500) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
  }
}

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError('Route not found', 404))
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  void _next
  const statusCode = err instanceof ApiError ? err.statusCode : 500

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
  })
}
