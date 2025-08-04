import { z } from 'zod';

// Schema para validação de ID de usuário
export const userIdSchema = z.number().int().positive('ID do usuário deve ser um número positivo');

// Schema para validação de ID de instância
export const instanceIdSchema = z
  .string()
  .uuid('ID da instância deve ser um UUID válido')
  .min(1, 'ID da instância é obrigatório');

// Schema para criação de instância
export const createInstanceSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome da instância é obrigatório')
    .max(100, 'Nome muito longo (máximo 100 caracteres)')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Nome contém caracteres inválidos')
    .transform(val => val.trim()),

  webhookUrl: z
    .string()
    .url('URL do webhook deve ser válida')
    .optional()
    .refine(
      url => !url || url.startsWith('https://') || process.env.NODE_ENV === 'development',
      'URL do webhook deve usar HTTPS em produção'
    ),
});

// Schema para atualização de instância
export const updateInstanceSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Nome não pode estar vazio')
      .max(100, 'Nome muito longo (máximo 100 caracteres)')
      .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Nome contém caracteres inválidos')
      .transform(val => val.trim())
      .optional(),

    webhook_url: z
      .string()
      .url('URL do webhook deve ser válida')
      .optional()
      .refine(
        url => !url || url.startsWith('https://') || process.env.NODE_ENV === 'development',
        'URL do webhook deve usar HTTPS em produção'
      ),
  })
  .partial();

// Schema para paginação
export const paginationSchema = z.object({
  page: z
    .number()
    .int('Página deve ser um número inteiro')
    .min(1, 'Página deve ser maior que 0')
    .max(1000, 'Página não pode ser maior que 1000')
    .default(1),

  limit: z
    .number()
    .int('Limite deve ser um número inteiro')
    .min(1, 'Limite deve ser maior que 0')
    .max(100, 'Limite não pode ser maior que 100')
    .default(50),
});

// Schema para validação de parâmetros de rota
export const routeParamsSchema = z.object({
  instanceId: instanceIdSchema,
  userId: userIdSchema.optional(),
});

// Schema para validação de headers de autenticação
export const authHeaderSchema = z.object({
  authorization: z
    .string()
    .min(1, 'Token de autorização é obrigatório')
    .regex(/^Bearer\s+.+/, 'Token deve começar com "Bearer "'),

  'x-user-id': z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(userIdSchema)
    .optional(),
});

// Schema para validação de IP
export const ipValidationSchema = z
  .string()
  .ip('Endereço IP inválido')
  .refine(ip => {
    // Bloquear IPs privados em produção se necessário
    if (process.env.NODE_ENV === 'production') {
      return !ip.startsWith('192.168.') && !ip.startsWith('10.') && !ip.startsWith('172.');
    }
    return true;
  }, 'IP privado não permitido em produção');

// Schema para validação de rate limiting
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

// Funções de validação específicas
export const validateCreateInstance = (data: unknown) => createInstanceSchema.safeParse(data);
export const validateUpdateInstance = (data: unknown) => updateInstanceSchema.safeParse(data);
export const validateUserId = (data: unknown) => userIdSchema.safeParse(data);
export const validateInstanceId = (data: unknown) => instanceIdSchema.safeParse(data);
export const validatePagination = (data: unknown) => paginationSchema.safeParse(data);
export const validateAuthHeader = (data: unknown) => authHeaderSchema.safeParse(data);
export const validateIPAddress = (data: unknown) => ipValidationSchema.safeParse(data);

// Função helper para validação segura
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
