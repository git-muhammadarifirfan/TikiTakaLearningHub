/**
 * Format nomor telepon untuk tampilan
 * Input: "6281234567890" → Output: "+62 812-3456-7890"
 */
export function formatPhone(phone: string): string {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('62') && cleaned.length >= 10) {
    const rest = cleaned.slice(2);
    return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
  }
  return phone;
}

/**
 * Format nomor WA untuk wa.me link
 * Input: "081234567890" atau "6281234567890" → Output: "6281234567890"
 */
export function formatWaNumber(waNumber: string): string {
  const cleaned = waNumber.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    return '62' + cleaned.slice(1);
  }
  return cleaned;
}

/**
 * Buat link wa.me dengan pesan encoded
 */
export function createWhatsAppLink(waNumber: string, message: string): string {
  const number = formatWaNumber(waNumber);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${encodedMessage}`;
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
