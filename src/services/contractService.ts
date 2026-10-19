import { supabase } from '../lib/supabase';
import type { DbContrato, PaymentModality } from '../types';

export interface NewContractPayload {
  espacio_id: string;
  inquilino_id: string;
  monto_mensual: number;
  dia_de_pago: number;
  modalidad: PaymentModality;
  fecha_inicio: string;
}

export const contractService = {
  /**
   * Crea un nuevo contrato y marca el espacio como 'ocupado'.
   */
  async createContract(payload: NewContractPayload): Promise<DbContrato> {
    // 1. Insertar contrato activo
    const { data, error: contractError } = await supabase
      .from('contratos')
      .insert({
        espacio_id: payload.espacio_id,
        inquilino_id: payload.inquilino_id,
        monto_mensual: payload.monto_mensual,
        dia_de_pago: payload.dia_de_pago,
        modalidad: payload.modalidad,
        fecha_inicio: payload.fecha_inicio,
        activo: true,
      })
      .select()
      .single();

    if (contractError) {
      console.error('Error en contractService.createContract:', contractError);
      throw contractError;
    }

    // 2. Marcar el espacio como 'ocupado'
    const { error: spaceError } = await supabase
      .from('espacios')
      .update({ estado: 'ocupado' })
      .eq('id', payload.espacio_id);

    if (spaceError) {
      console.warn('Aviso: Contrato creado pero no se pudo actualizar el estado del espacio:', spaceError);
    }

    return data as DbContrato;
  },

  /**
   * Da de baja un contrato: lo desactiva, fija la fecha de fin y libera el espacio para que quede 'disponible'.
   */
  async terminateContract(contractId: string, espacioId: string, fechaFin?: string): Promise<void> {
    const today = fechaFin || new Date().toISOString().split('T')[0];

    // 1. Desactivar contrato y registrar fecha_fin
    const { error: contractError } = await supabase
      .from('contratos')
      .update({
        activo: false,
        fecha_fin: today,
      })
      .eq('id', contractId);

    if (contractError) {
      console.error('Error al dar de baja el contrato:', contractError);
      throw contractError;
    }

    // 2. Liberar la habitación / espacio (marcar como 'disponible')
    if (espacioId) {
      const { error: spaceError } = await supabase
        .from('espacios')
        .update({ estado: 'disponible' })
        .eq('id', espacioId);

      if (spaceError) {
        console.error('Error al liberar el espacio en Supabase:', spaceError);
        throw spaceError;
      }
    }
  },
};
