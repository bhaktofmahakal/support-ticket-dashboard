import { z } from 'zod';

export const ticketStatusEnum = z.enum(['Open', 'In Progress', 'Resolved']);
export type TicketStatus = z.infer<typeof ticketStatusEnum>;

export const ticketPriorityEnum = z.enum(['Low', 'Medium', 'High']);
export type TicketPriority = z.infer<typeof ticketPriorityEnum>;

export const ticketSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(120),
  description: z.string().min(1),
  customerEmail: z.string().email(),
  status: ticketStatusEnum,
  priority: ticketPriorityEnum,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createTicketSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title is required and must not be empty')
    .max(120, 'Title must not exceed 120 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(1, 'Description is required and must not be empty'),
  customerEmail: z
    .string({ required_error: 'Customer email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email format'),
  priority: ticketPriorityEnum,
  status: ticketStatusEnum.optional().default('Open'),
}).strip();

export const updateTicketSchema = z
  .object({
    status: ticketStatusEnum.optional(),
    priority: ticketPriorityEnum.optional(),
  })
  .strict('Unknown fields are not allowed')
  .refine(
    (data) => data.status !== undefined || data.priority !== undefined,
    { message: 'At least one of status or priority is required' }
  );

// Helper to reject repeated query parameters (arrays)
const rejectArray = (field: string) =>
  z.custom<unknown>(
    (val) => !Array.isArray(val),
    { message: `Repeated query parameter '${field}' is not allowed` }
  );

export const querySchema = z.object({
  search: rejectArray('search')
    .pipe(
      z.preprocess((val) => {
        if (typeof val === 'string') {
          const trimmed = val.trim();
          return trimmed === '' ? undefined : trimmed;
        }
        return val;
      }, z.string().max(100, 'Search query must not exceed 100 characters').optional())
    )
    .optional(),
  status: rejectArray('status')
    .pipe(
      z.preprocess((val) => (val === '' ? undefined : val), ticketStatusEnum.optional())
    )
    .optional(),
  priority: rejectArray('priority')
    .pipe(
      z.preprocess((val) => (val === '' ? undefined : val), ticketPriorityEnum.optional())
    )
    .optional(),
  sort: rejectArray('sort')
    .pipe(z.enum(['newest', 'oldest']).optional().default('newest'))
    .default('newest'),
  page: rejectArray('page')
    .pipe(
      z.preprocess((val) => {
        if (val === undefined || val === null || val === '') return 1;
        const num = Number(val);
        return isNaN(num) ? val : num;
      }, z.number({ invalid_type_error: 'Page must be a positive integer' }).int('Page must be an integer').min(1, 'Page must be a positive integer').default(1))
    )
    .default(1),
});

export const paginationSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export const errorDetailSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.enum(['VALIDATION_ERROR', 'NOT_FOUND', 'INTERNAL_ERROR']),
    message: z.string(),
    details: z.array(errorDetailSchema).optional(),
  }),
});

export const ticketStatsSchema = z.object({
  total: z.number().int().min(0),
  open: z.number().int().min(0),
  inProgress: z.number().int().min(0),
  resolved: z.number().int().min(0),
});

export const statsResponseSchema = z.object({
  data: ticketStatsSchema,
});
