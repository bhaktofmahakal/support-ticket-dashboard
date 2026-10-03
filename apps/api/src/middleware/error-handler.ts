import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../errors/app-error.js';
import type { ErrorResponse } from '@support-ticket/shared';

export const errorHandler: ErrorRequestHandler = (
  err: any,
  _req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction
): void => {
  // 1. Handle JSON parse errors from express.json()
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400 && 'body' in err) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON in request body',
      },
    });
    return;
  }

  // 2. Handle application-specific typed errors (ValidationError, NotFoundError, etc.)
  if (err instanceof AppError) {
    const errorPayload: ErrorResponse['error'] = {
      code: err.code,
      message: err.message,
    };
    if (err.details && err.details.length > 0) {
      errorPayload.details = err.details;
    }
    res.status(err.statusCode).json({ error: errorPayload });
    return;
  }

  // 3. Unexpected internal errors (never leak stack trace)
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
};
