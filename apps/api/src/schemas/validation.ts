import { z } from 'zod';

// Schema para validaÃ§Ã£o de ID de usuÃ¡rio
export const userIdSchema = z
  .number()
  .int()
  .positive('ID do usuÃ¡rio deve ser um nÃºmero positivo');

// Schema para validaÃ§Ã£o de ID de instÃ¢ncia
export const instanceIdSchema = z
  .string()
  .uuid('ID da instÃ¢ncia deve ser um UUID vÃ¡lido')
  .min(1, 'ID da instÃ¢ncia Ã© obrigatÃ³rio');

// Schema para criaÃ§Ã£o de instÃ¢ncia
export const createInstanceSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome da instÃ¢ncia Ã© obrigatÃ³rio')
    .max(100, 'Nome muito longo (mÃ¡ximo 100 caracteres)')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Nome contÃ©m caracteres invÃ¡lidos')
    .transform(val => val.trim()),

  webhookUrl: z
    .string()
    .url('URL do webhook deve ser vÃ¡lida')
    .optional()
    .refine(
      url => !url || url.startsWith('https://') || process.env.NODE_ENV === 'development',
      'URL do webhook deve usar HTTPS em produÃ§Ã£o'
    ),
});

// Schema para atualizaÃ§Ã£o de instÃ¢ncia
export const updateInstanceSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Nome nÃ£o pode estar vazio')
      .max(100, 'Nome muito longo (mÃ¡ximo 100 caracteres)')
      .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Nome contÃ©m caracteres invÃ¡lidos')
      .transform(val => val.trim())
      .optional(),

    webhook_url: z
      .string()
      .url('URL do webhook deve ser vÃ¡lida')
      .optional()
      .refine(
        url => !url || url.startsWith('https://') || process.env.NODE_ENV === 'development',
        'URL do webhook deve usar HTTPS em produÃ§Ã£o'
      ),
  })
  .partial();

// Schema para paginaÃ§Ã£o
export const paginationSchema = z.object({
  page: z
    .number()
    .int('PÃ¡gina deve ser um nÃºmero inteiro')
    .min(1, 'PÃ¡gina deve ser maior que 0')
    .max(1000, 'PÃ¡gina nÃ£o pode ser maior que 1000')
    .default(1),

  limit: z
    .number()
    .int('Limite deve ser um nÃºmero inteiro')
    .min(1, 'Limite deve ser maior que 0')
    .max(100, 'Limite nÃ£o pode ser maior que 100')
    .default(50),
});

// Schema para validaÃ§Ã£o de parÃ¢metros de rota
export const routeParamsSchema = z.object({
  instanceId: instanceIdSchema,
  userId: userIdSchema.optional(),
});

// Schema para validaÃ§Ã£o de headers de autenticaÃ§Ã£o
export const authHeaderSchema = z.object({
  authorization: z
    .string()
    .min(1, 'Token de autorizaÃ§Ã£o Ã© obrigatÃ³rio')
    .regex(/^Bearer\s+.+/, 'Token deve comeÃ§ar com "Bearer "'),

  'x-user-id': z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(userIdSchema)
    .optional(),
});

// Schema para validaÃ§Ã£o de IP
export const ipValidationSchema = z
  .string()
  .ip('EndereÃ§o IP invÃ¡lido')
  .refine(ip => {
    // Bloquear IPs privados em produÃ§Ã£o se necessÃ¡rio
    if (process.env.NODE_ENV === 'production') {
      return !ip.startsWith('192.168.') && !ip.startsWith('10.') && !ip.startsWith('172.');
    }
    return true;
  }, 'IP privado nÃ£o permitido em produÃ§Ã£o');

// Schema para validaÃ§Ã£o de rate limiting
export const rateLimitSchema = z.object({
  windowMs: z.number().int().min(1000).max(3600000), // 1s a 1h
  maxRequests: z.number().int().min(1).max(10000),
  identifier: z.string().min(1).max(100),
});

// Tipos TypeScript derivados dos schemas
export type CreateInstanceInput = z.infer<typeof createInstanceSchema>;
export type UpdateInstanceInput = z.infer<typeof updateInstanceSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type RouteParamsInput = z.infer<typeof routeParamsSchema>;
export type AuthHeaderInput = z.infer<typeof authHeaderSchema>;
export type RateLimitInput = z.infer<typeof rateLimitSchema>;

// FunÃ§Ãµes de validaÃ§Ã£o especÃ­ficas
export const validateCreateInstance = (data: unknown) => createInstanceSchema.safeParse(data);
export const validateUpdateInstance = (data: unknown) => updateInstanceSchema.safeParse(data);
export const validateUserId = (data: unknown) => userIdSchema.safeParse(data);
export const validateInstanceId = (data: unknown) => instanceIdSchema.safeParse(data);
export const validatePagination = (data: unknown) => paginationSchema.safeParse(data);
export const validateAuthHeader = (data: unknown) => authHeaderSchema.safeParse(data);
export const validateIPAddress = (data: unknown) => ipValidationSchema.safeParse(data);

// FunÃ§Ã£o helper para validaÃ§Ã£o segura
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
):
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
      details: z.ZodError;
    } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errorMessage = result.error.errors
    .map(err => `${err.path.join('.')}: ${err.message}`)
    .join(', ');

  return {
    success: false,
    error: errorMessage,
    details: result.error,
  };
}
