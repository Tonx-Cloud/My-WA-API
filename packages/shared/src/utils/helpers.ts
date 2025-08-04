/**
 * Formatar nÃºmero de telefone para padrÃ£o brasileiro
 */
export function formatPhoneNumber(phone: string): string {
  // Remove todos os caracteres nÃ£o numÃ©ricos
  const numbers = phone.replace(/\D/g, '');

  // Se comeÃ§ar com 55 (cÃ³digo do Brasil), remove
  const withoutCountryCode = numbers.startsWith('55') ? numbers.slice(2) : numbers;

  // Adiciona o cÃ³digo do paÃ­s (+55) se necessÃ¡rio
  if (withoutCountryCode.length === 11) {
    return `+55${withoutCountryCode}`;
  } else if (withoutCountryCode.length === 10) {
    return `+55${withoutCountryCode}`;
  }

  return `+55${withoutCountryCode}`;
}

/**
 * Validar se um nÃºmero de telefone Ã© vÃ¡lido
 */
export function isValidPhoneNumber(phone: string): boolean {
  const numbers = phone.replace(/\D/g, '');

  // Verificar se tem entre 10 e 13 dÃ­gitos (considerando cÃ³digo do paÃ­s)
  if (numbers.length < 10 || numbers.length > 13) {
    return false;
  }

  return true;
}

/**
 * Gerar delay aleatÃ³rio para evitar spam
 */
export function getRandomDelay(min: number = 1000, max: number = 3000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Escapar caracteres especiais em mensagens
 */
export function escapeMessage(message: string): string {
  return message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Truncar texto com ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Formatar data para exibiÃ§Ã£o
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Gerar ID Ãºnico simples
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
