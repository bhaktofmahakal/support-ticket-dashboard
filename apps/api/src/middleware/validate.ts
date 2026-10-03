import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { ValidationError, type ErrorDetail } from '../errors/app-error.js';

export interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const details: ErrorDetail[] = [];

    // Ensure container on res.locals
    if (!res.locals.validated) {
      res.locals.validated = {};
    }

    // 1. Validate route params
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (result.success) {
        res.locals.validated.params = result.data;
      } else {
        formatZodErrors(result.error, details);
      }
    }

    // 2. Validate query params (Express 5: req.query is read-only getter)
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (result.success) {
        res.locals.validated.query = result.data;
      } else {
        formatZodErrors(result.error, details);
      }
    }

    // 3. Validate request body (Express 5: req.body is undefined when no body sent)
    if (schemas.body) {
      const bodyToValidate = req.body === undefined ? {} : req.body;
      const result = schemas.body.safeParse(bodyToValidate);
      if (result.success) {
        res.locals.validated.body = result.data;
      } else {
        formatZodErrors(result.error, details);
      }
    }

    if (details.length > 0) {
      const firstMessage = details[0].message || 'Invalid request parameters';
      return next(new ValidationError(firstMessage, details));
    }

    next();
  };
}

function formatZodErrors(error: ZodError, details: ErrorDetail[]): void {
  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'request';
    details.push({
      field,
      message: issue.message,
    });
  }
}
