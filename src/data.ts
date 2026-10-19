import type { AlertStatus } from './types';

export const statusConfig: Record<
  AlertStatus,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  vencido: {
    label: 'Vencido',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  proximo: {
    label: 'Próximo a vencer',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  aldia: {
    label: 'Al día',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
};

export const modalityLabel: Record<string, string> = {
  adelantado: 'Mes Adelantado',
  vencido: 'Mes Vencido / Cumplido',
  cumplido: 'Mes Cumplido',
};

/**
 * Retorna el nombre del mes actual en formato legible (ej. "Octubre 2026").
 */
export function getCurrentMonthLabel(): string {
  const now = new Date();
  const monthName = now.toLocaleString('es-PE', { month: 'long' });
  const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `${capitalized} ${now.getFullYear()}`;
}
