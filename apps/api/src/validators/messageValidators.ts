import { z } from 'zod';

// Phone number validation - supports international formats
const phoneNumberSchema = z
  .string()
  .min(10, 'NÃºmero de telefone deve ter pelo menos 10 dÃ­gitos')
  .max(20, 'NÃºmero de telefone muito longo')
  .regex(/^[\d\s\-+()]+$/, 'Formato de telefone invÃ¡lido')
  .transform(val => val.replace(/\D/g, '')); // Remove non-digits

// Message content validation
const messageContentSchema = z
  .string()
  .min(1, 'Mensagem nÃ£o pode estar vazia')
  .max(4096, 'Mensagem muito longa (mÃ¡ximo 4096 caracteres)');

// Media URL validation
const mediaUrlSchema = z
  .string()
  .url('URL de mÃ­dia invÃ¡lida')
  .refine(url => {
    const allowedExtensions = /\.(jpg|jpeg|png|gif|pdf|mp4|mp3|wav|ogg|webm|webp)$/i;
    return allowedExtensions.test(url);
  }, 'Formato de arquivo nÃ£o suportado');

export const sendMessageSchema = z.object({
  body: z
    .object({
      number: phoneNumberSchema,
      message: messageContentSchema,
      type: z.enum(['text', 'image', 'document', 'audio', 'video']).default('text'),
      media_url: mediaUrlSchema.optional(),
      filename: z.string().max(255).optional(),
      caption: z.string().max(1024).optional(),
    })
    .refine(
      data => {
        // If type is not text, media_url should be provided
        if (data.type !== 'text' && !data.media_url) {
          return false;
        }
        return true;
      },
      {
        message: 'URL de mÃ­dia Ã© obrigatÃ³ria para mensagens que nÃ£o sÃ£o texto',
        path: ['media_url'],
      }
    ),
  params: z.object({
    instanceId: z.string().uuid('ID da instÃ¢ncia invÃ¡lido'),
  }),
});

export const bulkMessageSchema = z.object({
  body: z.object({
    messages: z
      .array(
        z.object({
          number: phoneNumberSchema,
          message: messageContentSchema,
          type: z.enum(['text', 'image', 'document', 'audio', 'video']).default('text'),
          media_url: mediaUrlSchema.optional(),
          filename: z.string().max(255).optional(),
          caption: z.string().max(1024).optional(),
        })
      )
      .min(1, 'Pelo menos uma mensagem Ã© obrigatÃ³ria')
      .max(100, 'MÃ¡ximo 100 mensagens por vez'),
    delay: z
      .number()
      .min(1000, 'Delay mÃ­nimo de 1 segundo')
      .max(300000, 'Delay mÃ¡ximo de 5 minutos')
      .default(2000),
    schedule_at: z.string().datetime().optional(),
  }),
  params: z.object({
    instanceId: z.string().uuid('ID da instÃ¢ncia invÃ¡lido'),
  }),
});

export const getMessagesSchema = z.object({
  params: z.object({
    instanceId: z.string().uuid('ID da instÃ¢ncia invÃ¡lido'),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
    type: z.enum(['text', 'image', 'document', 'audio', 'video', 'all']).default('all'),
    direction: z.enum(['incoming', 'outgoing', 'all']).default('all'),
    from: phoneNumberSchema.optional(),
    to: phoneNumberSchema.optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    search: z.string().max(255).optional(),
  }),
});

export const webhookConfigSchema = z.object({
  body: z.object({
    url: z.string().url('URL do webhook invÃ¡lida'),
    events: z
      .array(
        z.enum([
          'message.received',
          'message.sent',
          'message.ack',
          'qr_code',
          'ready',
          'disconnected',
          'contact.update',
          'group.join',
          'group.leave',
        ])
      )
      .min(1, 'Pelo menos um evento deve ser selecionado'),
    secret: z.string().min(8, 'Secret deve ter pelo menos 8 caracteres').optional(),
    enabled: z.boolean().default(true),
  }),
  params: z.object({
    instanceId: z.string().uuid('ID da instÃ¢ncia invÃ¡lido'),
  }),
});

export const forwardMessageSchema = z.object({
  body: z.object({
    messageId: z.string().min(1, 'ID da mensagem Ã© obrigatÃ³rio'),
    to: z
      .array(phoneNumberSchema)
      .min(1, 'Pelo menos um destinatÃ¡rio Ã© obrigatÃ³rio')
      .max(50, 'MÃ¡ximo 50 destinatÃ¡rios'),
  }),
  params: z.object({
    instanceId: z.string().uuid('ID da instÃ¢ncia invÃ¡lido'),
  }),
});

export const deleteMessageSchema = z.object({
  params: z.object({
    instanceId: z.string().uuid('ID da instÃ¢ncia invÃ¡lido'),
    messageId: z.string().min(1, 'ID da mensagem Ã© obrigatÃ³rio'),
  }),
  body: z.object({
    forEveryone: z.boolean().default(false),
  }),
});

export type SendMessageRequest = z.infer<typeof sendMessageSchema>;
export type BulkMessageRequest = z.infer<typeof bulkMessageSchema>;
export type GetMessagesRequest = z.infer<typeof getMessagesSchema>;
export type WebhookConfigRequest = z.infer<typeof webhookConfigSchema>;
export type ForwardMessageRequest = z.infer<typeof forwardMessageSchema>;
export type DeleteMessageRequest = z.infer<typeof deleteMessageSchema>;
