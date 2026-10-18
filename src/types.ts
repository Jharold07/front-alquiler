export type TenantType = 'persona' | 'empresa';

export type PaymentModality = 'adelantado' | 'cumplido';

export type PaymentMethod = 'efectivo' | 'yape' | 'transferencia';

export type SpaceType = 'cuarto' | 'local';

export type SpaceStatus = 'ocupado' | 'disponible' | 'pendiente';

export type AlertStatus = 'vencido' | 'proximo' | 'aldia';

export interface Tenant {
  id: string;
  name: string;
  type: TenantType;
  phone: string;
  document: string;
  email?: string;
  notes?: string;
}

export interface Contract {
  spaceId: string;
  startDate: string;
  duration: string;
  modality: PaymentModality;
  monthlyAmount: number;
  paymentDay: number;
}

export interface Space {
  id: string;
  type: SpaceType;
  floor: string;
  number: string;
  status: SpaceStatus;
  monthlyPrice: number;
  tenantId?: string;
  contract?: Contract;
}

export interface Payment {
  id: string;
  tenantId: string;
  spaceId: string;
  month: string;
  amount: number;
  method: PaymentMethod;
  modality: PaymentModality;
  date: string;
  voucherUrl?: string;
  observations?: string;
}

export interface AlertItem {
  tenant: Tenant;
  space: Space;
  status: AlertStatus;
  daysLate?: number;
  daysUntilDue?: number;
  amount: number;
  modality: PaymentModality;
}
