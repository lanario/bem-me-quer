/**
 * Monta a URL `https://wa.me/...` para abrir conversa no WhatsApp Web/App.
 * Números só com DDD (10–11 dígitos) recebem o prefixo 55 (Brasil).
 */
export function buildWhatsAppChatUrl(phone: string | null | undefined): string | null {
  if (phone == null || !String(phone).trim()) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length < 10) return null;

  let n = digits;
  if (!n.startsWith("55") && n.length <= 11) {
    n = `55${n}`;
  }

  if (n.length < 12) return null;

  return `https://wa.me/${n}`;
}
