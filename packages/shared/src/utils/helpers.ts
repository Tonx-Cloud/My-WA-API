/**
 * Formatar número de telefone para padrão brasileiro
 */
export function formatPhoneNumber(phone: string): string {
  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');
  
  // Se começar com 55 (código do Brasil), remove
  const withoutCountryCode = numbers.startsWith('55') ? numbers.slice(2) : numbers;
  
  // Adiciona o código do país (+55) se necessário
  if (withoutCountryCode.length === 11) {
    return `+55${withoutCountryCode}`;
  } else if (withoutCountryCode.length === 10) {
    return `+55${withoutCountryCode}`;
  }
  
  return `+55${withoutCountryCode}`;
}

/**
 * Validar se um número de telefone é válido
 */
export function isValidPhoneNumber(phone: string): boolean {
  const numbers = phone.replace(/\D/g, '');
  
  // Verificar se tem entre 10 e 13 dígitos (considerando código do país)
  if (numbers.length < 10 || numbers.length > 13) {
    return false;
  }
  
  return true;
}

/**
 * Gerar delay aleatório para evitar spam
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
 * Formatar data para exibição
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

/**
 * Gerar ID único simples
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
