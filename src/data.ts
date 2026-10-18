import type {
  Tenant,
  Space,
  Payment,
  AlertItem,
  PaymentModality,
  AlertStatus,
} from './types';

export const tenants: Tenant[] = [
  {
    id: 't1',
    name: 'María Quispe Rojas',
    type: 'persona',
    phone: '+51 987 654 321',
    document: 'DNI 42318765',
    email: 'maria.quispe@gmail.com',
    notes: 'Inquilina responsable. Siempre paga a tiempo.',
  },
  {
    id: 't2',
    name: 'EMP -> COFORT SAC',
    type: 'empresa',
    phone: '+51 912 345 678',
    document: 'RUC 20512345678',
    email: 'administracion@cofort.com',
    notes: 'Empresa dedicada a la venta de repuestos.',
  },
  {
    id: 't3',
    name: 'Carlos Mendoza Lara',
    type: 'persona',
    phone: '+51 999 887 766',
    document: 'DNI 70123456',
  },
  {
    id: 't4',
    name: 'Lucía Fernández Soto',
    type: 'persona',
    phone: '+51 988 112 233',
    document: 'DNI 45678912',
  },
  {
    id: 't5',
    name: 'Bodega El Sol EIRL',
    type: 'empresa',
    phone: '+51 945 678 901',
    document: 'RUC 20698765432',
  },
  {
    id: 't6',
    name: 'Jorge Salazar Poma',
    type: 'persona',
    phone: '+51 977 665 544',
    document: 'DNI 31876543',
  },
  {
    id: 't7',
    name: 'Ana Lucía Torres',
    type: 'persona',
    phone: '+51 966 554 433',
    document: 'DNI 73456789',
  },
  {
    id: 't8',
    name: 'Taller Mecánico R&R',
    type: 'empresa',
    phone: '+51 955 443 322',
    document: 'RUC 20445566778',
  },
];

export const spaces: Space[] = [
  // PISO 1
  {
    id: 's1',
    type: 'cuarto',
    floor: 'PISO 1',
    number: '101',
    status: 'ocupado',
    monthlyPrice: 350,
    tenantId: 't1',
    contract: {
      spaceId: 's1',
      startDate: '2024-03-01',
      duration: 'Indefinido',
      modality: 'adelantado',
      monthlyAmount: 350,
      paymentDay: 5,
    },
  },
  {
    id: 's2',
    type: 'cuarto',
    floor: 'PISO 1',
    number: '102',
    status: 'ocupado',
    monthlyPrice: 350,
    tenantId: 't2',
    contract: {
      spaceId: 's2',
      startDate: '2023-08-15',
      duration: '12 meses',
      modality: 'cumplido',
      monthlyAmount: 380,
      paymentDay: 10,
    },
  },
  {
    id: 's3',
    type: 'cuarto',
    floor: 'PISO 1',
    number: '103',
    status: 'disponible',
    monthlyPrice: 350,
  },
  // PISO 2
  {
    id: 's4',
    type: 'cuarto',
    floor: 'PISO 2',
    number: '201',
    status: 'ocupado',
    monthlyPrice: 380,
    tenantId: 't3',
    contract: {
      spaceId: 's4',
      startDate: '2024-01-10',
      duration: '6 meses',
      modality: 'adelantado',
      monthlyAmount: 380,
      paymentDay: 1,
    },
  },
  {
    id: 's5',
    type: 'cuarto',
    floor: 'PISO 2',
    number: '202',
    status: 'pendiente',
    monthlyPrice: 380,
    tenantId: 't4',
    contract: {
      spaceId: 's5',
      startDate: '2023-11-01',
      duration: 'Indefinido',
      modality: 'cumplido',
      monthlyAmount: 380,
      paymentDay: 15,
    },
  },
  // PISO 3
  {
    id: 's6',
    type: 'cuarto',
    floor: 'PISO 3',
    number: '301',
    status: 'ocupado',
    monthlyPrice: 400,
    tenantId: 't6',
    contract: {
      spaceId: 's6',
      startDate: '2024-02-20',
      duration: 'Indefinido',
      modality: 'adelantado',
      monthlyAmount: 400,
      paymentDay: 3,
    },
  },
  {
    id: 's7',
    type: 'cuarto',
    floor: 'PISO 3',
    number: '302',
    status: 'disponible',
    monthlyPrice: 400,
  },
  // PISO 4
  {
    id: 's8',
    type: 'cuarto',
    floor: 'PISO 4',
    number: '401',
    status: 'ocupado',
    monthlyPrice: 420,
    tenantId: 't7',
    contract: {
      spaceId: 's8',
      startDate: '2024-06-01',
      duration: '3 meses',
      modality: 'cumplido',
      monthlyAmount: 420,
      paymentDay: 12,
    },
  },
  // LOCALES
  {
    id: 'l1',
    type: 'local',
    floor: 'PLANTA BAJA',
    number: 'Local A',
    status: 'ocupado',
    monthlyPrice: 1200,
    tenantId: 't2',
    contract: {
      spaceId: 'l1',
      startDate: '2022-01-01',
      duration: 'Indefinido',
      modality: 'adelantado',
      monthlyAmount: 1200,
      paymentDay: 1,
    },
  },
  {
    id: 'l2',
    type: 'local',
    floor: 'PLANTA BAJA',
    number: 'Local B',
    status: 'ocupado',
    monthlyPrice: 950,
    tenantId: 't5',
    contract: {
      spaceId: 'l2',
      startDate: '2023-05-10',
      duration: '12 meses',
      modality: 'cumplido',
      monthlyAmount: 950,
      paymentDay: 20,
    },
  },
  {
    id: 'l3',
    type: 'local',
    floor: 'PLANTA BAJA',
    number: 'Local C',
    status: 'disponible',
    monthlyPrice: 1100,
  },
  {
    id: 'l4',
    type: 'local',
    floor: 'PLANTA BAJA',
    number: 'Local D',
    status: 'ocupado',
    monthlyPrice: 850,
    tenantId: 't8',
    contract: {
      spaceId: 'l4',
      startDate: '2024-04-01',
      duration: '6 meses',
      modality: 'adelantado',
      monthlyAmount: 850,
      paymentDay: 8,
    },
  },
];

export const payments: Payment[] = [
  {
    id: 'p1',
    tenantId: 't1',
    spaceId: 's1',
    month: 'Octubre 2026',
    amount: 350,
    method: 'yape',
    modality: 'adelantado',
    date: '2026-10-02',
  },
  {
    id: 'p2',
    tenantId: 't3',
    spaceId: 's4',
    month: 'Octubre 2026',
    amount: 380,
    method: 'efectivo',
    modality: 'adelantado',
    date: '2026-10-01',
  },
  {
    id: 'p3',
    tenantId: 't6',
    spaceId: 's6',
    month: 'Octubre 2026',
    amount: 400,
    method: 'transferencia',
    modality: 'adelantado',
    date: '2026-10-03',
  },
  {
    id: 'p4',
    tenantId: 't8',
    spaceId: 'l4',
    month: 'Octubre 2026',
    amount: 850,
    method: 'transferencia',
    modality: 'adelantado',
    date: '2026-10-08',
  },
  {
    id: 'p5',
    tenantId: 't2',
    spaceId: 'l1',
    month: 'Septiembre 2026',
    amount: 1200,
    method: 'transferencia',
    modality: 'adelantado',
    date: '2026-09-01',
  },
  {
    id: 'p6',
    tenantId: 't5',
    spaceId: 'l2',
    month: 'Septiembre 2026',
    amount: 950,
    method: 'yape',
    modality: 'cumplido',
    date: '2026-09-21',
  },
];

// Helper: find tenant by id
export function getTenant(id?: string): Tenant | undefined {
  return tenants.find((t) => t.id === id);
}

// Helper: find space by id
export function getSpace(id?: string): Space | undefined {
  return spaces.find((s) => s.id === id);
}

// Build alerts for dashboard
export function buildAlerts(): AlertItem[] {
  const items: AlertItem[] = [];

  // Vencidos (red)
  items.push({
    tenant: tenants[1], // COFORT - s2 cuarto
    space: spaces[1],
    status: 'vencido',
    daysLate: 8,
    amount: 380,
    modality: 'cumplido',
  });
  items.push({
    tenant: tenants[3], // Lucía - s202 pendiente
    space: spaces[4],
    status: 'vencido',
    daysLate: 3,
    amount: 380,
    modality: 'cumplido',
  });

  // Próximos a vencer (yellow)
  items.push({
    tenant: tenants[4], // Bodega El Sol - l2
    space: spaces[9],
    status: 'proximo',
    daysUntilDue: 3,
    amount: 950,
    modality: 'cumplido',
  });
  items.push({
    tenant: tenants[6], // Ana Lucía - s8
    space: spaces[7],
    status: 'proximo',
    daysUntilDue: 5,
    amount: 420,
    modality: 'cumplido',
  });

  // Al día (green)
  items.push({
    tenant: tenants[0], // María
    space: spaces[0],
    status: 'aldia',
    amount: 350,
    modality: 'adelantado',
  });
  items.push({
    tenant: tenants[2], // Carlos
    space: spaces[3],
    status: 'aldia',
    amount: 380,
    modality: 'adelantado',
  });
  items.push({
    tenant: tenants[5], // Jorge
    space: spaces[5],
    status: 'aldia',
    amount: 400,
    modality: 'adelantado',
  });

  return items;
}

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

export const modalityLabel: Record<PaymentModality, string> = {
  adelantado: 'Mes Adelantado',
  cumplido: 'Mes Cumplido',
};

// Financial summary
export function getFinancialSummary() {
  const totalCobrado = payments
    .filter((p) => p.month === 'Octubre 2026')
    .reduce((sum, p) => sum + p.amount, 0);

  const alerts = buildAlerts();
  const porCobrar = alerts
    .filter((a) => a.status !== 'aldia')
    .reduce((sum, a) => sum + a.amount, 0);

  const totalEsperado = totalCobrado + porCobrar;

  return {
    totalCobrado,
    porCobrar,
    totalEsperado,
    cobradoPct: totalEsperado > 0 ? Math.round((totalCobrado / totalEsperado) * 100) : 0,
  };
}

export const monthLabel = 'Octubre 2026';
