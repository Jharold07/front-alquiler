import type { AlertItem } from '../types';

/**
 * Formatea un número de teléfono para WhatsApp.
 * Si tiene 9 dígitos (formato estándar de Perú) y no tiene código de país, antepone '51'.
 */
export function formatWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 9 && digits.startsWith('9')) {
    return `51${digits}`;
  }
  return digits;
}

/**
 * Genera el texto dinámico y personalizado para el recordatorio de cobro.
 */
export function buildPaymentReminderMessage(alert: AlertItem): string {
  const nombre = alert.tenant.name;
  const espacio = `${alert.space.floor} - ${alert.space.number}`;
  const mes = alert.month || 'el mes en curso';
  const monto = alert.amount.toLocaleString('es-PE');
  const vencimiento = alert.dueDate || 'fecha indicada';
  const espaciosAsignados = alert.tenant.spaceNumbers?.length
    ? `\n🏢 *Cuartos / Locales Asignados:* ${[...new Set(alert.tenant.spaceNumbers)].join(', ')}`
    : '';

  if (alert.status === 'vencido') {
    const diasTexto = alert.daysLate
      ? ` (registra ${alert.daysLate} día${alert.daysLate > 1 ? 's' : ''} de retraso)`
      : '';
    return `Hola ${nombre}, le saludamos de administración para recordarle que el pago del alquiler de ${espacio} correspondiente a ${mes} por un monto de S/ ${monto} venció el ${vencimiento}${diasTexto}. Por favor, le agradeceremos regularizar el pago y enviarnos el comprobante por este medio. ¡Muchas gracias!${espaciosAsignados}`;
  }

  if (alert.status === 'proximo') {
    const diasTexto = alert.daysUntilDue
      ? ` (en ${alert.daysUntilDue} día${alert.daysUntilDue > 1 ? 's' : ''})`
      : '';
    return `Hola ${nombre}, le saludamos cordialmente para recordarle que el pago del alquiler de ${espacio} correspondiente a ${mes} por un monto de S/ ${monto} vencerá el ${vencimiento}${diasTexto}. Quedamos atentos a la confirmación y voucher del pago. ¡Saludos!${espaciosAsignados}`;
  }

  return `Hola ${nombre}, confirmamos que el pago de alquiler de ${espacio} por S/ ${monto} correspondiente a ${mes} se encuentra al día. ¡Muchas gracias por su puntualidad!${espaciosAsignados}`;
}

/**
 * Construye el enlace directo a WhatsApp con el mensaje codificado.
 */
export function getWhatsAppLink(phone: string, alert: AlertItem): string {
  const cleanPhone = formatWhatsAppPhone(phone);
  const message = buildPaymentReminderMessage(alert);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
