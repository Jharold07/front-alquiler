import { supabase } from '../lib/supabase';
import type { DbInquilino, TenantType, DbPago, DbContrato } from '../types';
import { contractService, type NewContractPayload } from './contractService';

export interface TenantWithDetails extends DbInquilino {
  contratos?: {
    id: string;
    activo: boolean;
    monto_mensual?: number;
    dia_de_pago?: number;
    modalidad?: string;
    fecha_inicio?: string;
    fecha_fin?: string | null;
    espacios?: {
      id: string;
      nombre: string;
      piso: string;
      tipo: string;
      precio_sugerido?: number;
    };
    pagos?: {
      id: string;
      monto: number;
      estado: string;
    }[];
  }[];
}

export interface NewTenantPayload {
  nombre_razon_social: string;
  tipo: TenantType;
  documento_id: string;
  telefono: string;
  email?: string | null;
}

export interface TenantContractAssignment {
  espacio_id: string;
  monto_mensual: number;
  dia_de_pago: number;
  modalidad: 'adelantado' | 'vencido';
  fecha_inicio: string;
  crearPrimerCobro?: boolean;
}

export const tenantService = {
  /**
   * Obtiene todos los inquilinos con sus contratos, espacios y pagos asociados.
   */
  async getAllTenants(): Promise<TenantWithDetails[]> {
    const { data, error } = await supabase
      .from('inquilinos')
      .select(`
        id,
        nombre_razon_social,
        tipo,
        documento_id,
        telefono,
        email,
        creado_en,
        contratos (
          id,
          activo,
          monto_mensual,
          dia_de_pago,
          modalidad,
          fecha_inicio,
          fecha_fin,
          espacios (
            id,
            nombre,
            piso,
            tipo,
            precio_sugerido
          ),
          pagos (
            id,
            monto,
            estado
          )
        )
      `)
      .order('nombre_razon_social', { ascending: true });

    if (error) {
      console.error('Error en tenantService.getAllTenants:', error);
      throw error;
    }

    const rawList = (data || []) as unknown as Record<string, unknown>[];
    return rawList.map((t) => ({
      ...(t as unknown as DbInquilino),
      contratos: Array.isArray(t.contratos)
        ? (t.contratos as Record<string, unknown>[]).map((c) => ({
            id: String(c.id || ''),
            activo: Boolean(c.activo),
            monto_mensual: Number(c.monto_mensual || 0),
            dia_de_pago: Number(c.dia_de_pago || 1),
            modalidad: String(c.modalidad || 'adelantado'),
            fecha_inicio: String(c.fecha_inicio || ''),
            fecha_fin: c.fecha_fin ? String(c.fecha_fin) : null,
            espacios: Array.isArray(c.espacios) ? c.espacios[0] : (c.espacios as any),
            pagos: Array.isArray(c.pagos) ? (c.pagos as any[]) : [],
          }))
        : [],
    }));
  },

  /**
   * Obtiene un inquilino por su ID con sus contratos y espacios.
   */
  async getTenantById(tenantId: string): Promise<{
    tenant: TenantWithDetails;
    payments: DbPago[];
  }> {
    const { data: tenantData, error: tenantError } = await supabase
      .from('inquilinos')
      .select(`
        id,
        nombre_razon_social,
        tipo,
        documento_id,
        telefono,
        email,
        creado_en,
        contratos (
          id,
          monto_mensual,
          dia_de_pago,
          modalidad,
          fecha_inicio,
          fecha_fin,
          activo,
          espacios (
            id,
            nombre,
            tipo,
            piso,
            precio_sugerido
          )
        )
      `)
      .eq('id', tenantId)
      .single();

    if (tenantError) {
      console.error('Error en tenantService.getTenantById:', tenantError);
      throw tenantError;
    }

    const raw = tenantData as unknown as Record<string, unknown>;
    const formattedTenant: TenantWithDetails = {
      ...(raw as unknown as DbInquilino),
      contratos: Array.isArray(raw.contratos)
        ? (raw.contratos as Record<string, unknown>[]).map((c) => ({
            id: String(c.id || ''),
            activo: Boolean(c.activo),
            monto_mensual: Number(c.monto_mensual || 0),
            dia_de_pago: Number(c.dia_de_pago || 1),
            modalidad: String(c.modalidad || 'adelantado'),
            fecha_inicio: String(c.fecha_inicio || ''),
            fecha_fin: c.fecha_fin ? String(c.fecha_fin) : null,
            espacios: Array.isArray(c.espacios) ? c.espacios[0] : (c.espacios as any),
          }))
        : [],
    };

    // Consultar pagos asociados a todos sus contratos
    let payments: DbPago[] = [];
    const contractIds = (formattedTenant.contratos || []).map((c) => c.id);
    if (contractIds.length > 0) {
      const { data: pagosData, error: pagosError } = await supabase
        .from('pagos')
        .select(`
          id,
          contrato_id,
          mes_correspondiente,
          monto,
          fecha_vencimiento,
          fecha_pago,
          metodo,
          comprobante_url,
          observacion,
          estado,
          contratos (
            id,
            modalidad,
            espacios (
              id,
              nombre,
              tipo,
              piso
            )
          )
        `)
        .in('contrato_id', contractIds)
        .order('fecha_vencimiento', { ascending: false });

      if (pagosError) {
        console.error('Error al consultar pagos del inquilino:', pagosError);
      } else if (pagosData) {
        payments = pagosData as unknown as DbPago[];
      }
    }

    return { tenant: formattedTenant, payments };
  },

  /**
   * Registra un nuevo inquilino y, opcionalmente, le asigna una habitación disponible creando su contrato.
   */
  async createTenantWithContract(
    tenantPayload: NewTenantPayload,
    assignment?: TenantContractAssignment
  ): Promise<{ tenant: DbInquilino; contract?: DbContrato }> {
    // 1. Crear inquilino
    const { data: tenant, error: tenantError } = await supabase
      .from('inquilinos')
      .insert({
        nombre_razon_social: tenantPayload.nombre_razon_social.trim(),
        tipo: tenantPayload.tipo,
        documento_id: tenantPayload.documento_id.trim(),
        telefono: tenantPayload.telefono.trim(),
        email: tenantPayload.email?.trim() || null,
      })
      .select()
      .single();

    if (tenantError) {
      console.error('Error al crear inquilino:', tenantError);
      throw tenantError;
    }

    let createdContract: DbContrato | undefined;

    // 2. Si se seleccionó una habitación vacía, crear contrato y ocupar habitación
    if (assignment && assignment.espacio_id) {
      const contractPayload: NewContractPayload = {
        espacio_id: assignment.espacio_id,
        inquilino_id: tenant.id,
        monto_mensual: assignment.monto_mensual,
        dia_de_pago: assignment.dia_de_pago,
        modalidad: assignment.modalidad,
        fecha_inicio: assignment.fecha_inicio,
      };

      createdContract = await contractService.createContract(contractPayload);

      // 3. Crear cobro inicial si está solicitado
      if (assignment.crearPrimerCobro && createdContract) {
        const meses = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const fechaObj = new Date(assignment.fecha_inicio);
        const mesNombre = `${meses[fechaObj.getMonth()]} ${fechaObj.getFullYear()}`;

        // Calcular fecha de vencimiento según día de pago
        const ano = fechaObj.getFullYear();
        const mesIdx = fechaObj.getMonth();
        const diaPago = Math.min(28, assignment.dia_de_pago);
        const fechaVenc = `${ano}-${String(mesIdx + 1).padStart(2, '0')}-${String(diaPago).padStart(2, '0')}`;

        await supabase.from('pagos').insert({
          contrato_id: createdContract.id,
          mes_correspondiente: mesNombre,
          monto: assignment.monto_mensual,
          fecha_vencimiento: fechaVenc,
          estado: 'pendiente',
          observacion: 'Cobro generado al registrar contrato',
        });
      }
    }

    return { tenant: tenant as DbInquilino, contract: createdContract };
  },
};
