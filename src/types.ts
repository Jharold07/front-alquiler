export type TenantType = 'persona' | 'empresa';

export type PaymentModality = 'adelantado' | 'vencido';

export type PaymentMethod = 'efectivo' | 'yape_plin' | 'transferencia';

export type SpaceType = 'cuarto' | 'local';

export type SpaceStatus = 'disponible' | 'ocupado' | 'mantenimiento' | 'pendiente';

export type PaymentStatus = 'pendiente' | 'pagado' | 'vencido';

export type AlertStatus = 'vencido' | 'proximo' | 'abonado' | 'aldia';

// ================= Supabase Database Models =================
export interface DbEspacio {
  id: string;
  nombre: string;
  tipo: SpaceType;
  piso: string;
  rubro: string | null;
  precio_sugerido: number;
  estado: SpaceStatus;
  creado_en?: string;
}

export interface DbInquilino {
  id: string;
  nombre_razon_social: string;
  tipo: TenantType;
  documento_id: string;
  telefono: string;
  email: string | null;
  /** IDs de espacios asignados, derivados de sus contratos cuando corresponda. */
  space_ids?: string[];
  creado_en?: string;
}

export interface DbContrato {
  id: string;
  espacio_id: string;
  inquilino_id: string;
  monto_mensual: number;
  dia_de_pago: number;
  modalidad: PaymentModality;
  fecha_inicio: string;
  fecha_fin: string | null;
  activo: boolean;
  creado_en?: string;
  espacios?: DbEspacio;
  inquilinos?: DbInquilino;
}

export interface DbPago {
  id: string;
  contrato_id: string;
  mes_correspondiente: string;
  monto: number;
  fecha_vencimiento: string;
  fecha_pago: string | null;
  metodo: PaymentMethod | null;
  comprobante_url: string | null;
  observacion: string | null;
  estado: PaymentStatus;
  creado_en?: string;
  contratos?: DbContrato & {
    espacios?: DbEspacio;
    inquilinos?: DbInquilino;
  };
}

// ================= UI View Models =================
export interface AlertItem {
  id?: string; // id de pago en Supabase
  contratoId?: string;
  tenant: {
    id: string;
    name: string;
    phone: string;
    document: string;
    type?: TenantType;
    email?: string | null;
    spaceNumbers?: string[];
    assignedSpaces?: { id: string; number: string; floor: string; type?: SpaceType }[];
  };
  space: {
    id: string;
    number: string;
    floor: string;
    type?: SpaceType;
  };
  status: AlertStatus;
  daysLate?: number;
  daysUntilDue?: number;
  amount: number;
  paidAmount?: number;
  modality: PaymentModality;
  month?: string;
  dueDate?: string;
  paymentDate?: string | null;
  voucherUrl?: string | null;
  paymentId?: string;
  paymentIds?: string[];
  contractIds?: string[];
  spaces?: { id: string; number: string; floor: string; type?: SpaceType }[];
  paymentAmounts?: { id: string; amount: number; contractId?: string; dueDate?: string; paidAmount?: number }[];
}
