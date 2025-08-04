import { z } from 'zod';

export const createInstanceSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Nome da instÃ¢ncia Ã© obrigatÃ³rio').max(100, 'Nome muito longo'),
    webhook_url: z.string().url('URL do webhook invÃ¡lida').optional(),
  }),
});

export const updateInstanceSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    webhook_url: z.string().url().optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
  params: z.object({
    instanceId: z.string().uuid('ID da instÃ¢ncia invÃ¡lido'),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    number: z.string().min(10, 'NÃºmero invÃ¡lido').max(20),
    message: z.string().min(1, 'Mensagem Ã© obrigatÃ³ria').max(4096),
    type: z.enum(['text', 'image', 'document', 'audio', 'video']).default('text'),
    media_url: z.string().url().optional(),
  }),
  params: z.object({
    instanceId: z.string().uuid('ID da instÃ¢ncia invÃ¡lido'),
  }),
});

export const bulkMessageSchema = z.object({
  body: z.object({
    messages: z
      .array(
        z.object({
          number: z.string().min(10).max(20),
          message: z.string().min(1).max(4096),
          type: z.enum(['text', 'image', 'document', 'audio', 'video']).default('text'),
        })
      )
      .min(1, 'Pelo menos uma mensagem Ã© obrigatÃ³ria')
      .max(100, 'MÃ¡ximo 100 mensagens por vez'),
    delay: z.number().min(1000).max(60000).default(2000),
  }),
  params: z.object({
    instanceId: z.string().uuid('ID da instÃ¢ncia invÃ¡lido'),
  }),
});

export const instanceParamsSchema = z.object({
  params: z.object({
    instanceId: z.string().uuid('ID da instÃ¢ncia invÃ¡lido'),
  }),
});

export const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  }),
});

export const instanceQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
    status: z.enum(['active', 'inactive', 'all']).default('all'),
    search: z.string().optional(),
  }),
});

export const messageQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
    type: z.enum(['text', 'image', 'document', 'audio', 'video', 'all']).default('all'),
    direction: z.enum(['incoming', 'outgoing', 'all']).default('all'),
    from: z.string().optional(),
    to: z.string().optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
  }),
});

export type CreateInstanceRequest = z.infer<typeof createInstanceSchema>;
export type UpdateInstanceRequest = z.infer<typeof updateInstanceSchema>;
export type SendMessageRequest = z.infer<typeof sendMessageSchema>;
export type BulkMessageRequest = z.infer<typeof bulkMessageSchema>;
export type InstanceParamsRequest = z.infer<typeof instanceParamsSchema>;
export type PaginationRequest = z.infer<typeof paginationSchema>;
export type InstanceQueryRequest = z.infer<typeof instanceQuerySchema>;
export type MessageQueryRequest = z.infer<typeof messageQuerySchema>;
