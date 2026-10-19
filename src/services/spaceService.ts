import { supabase } from '../lib/supabase';
import type { DbEspacio, SpaceType, SpaceStatus } from '../types';

export interface SpaceWithDetails extends DbEspacio {
  contratos?: {
    id: string;
    monto_mensual: number;
    dia_de_pago: number;
    modalidad: string;
    activo: boolean;
    inquilinos?: {
      id: string;
      nombre_razon_social: string;
      telefono: string;
      documento_id: string;
    };
  }[];
}

export interface NewSpacePayload {
  nombre: string;
  tipo: SpaceType;
  piso: string;
  rubro?: string | null;
  precio_sugerido: number;
  estado: SpaceStatus;
}

export const spaceService = {
  /**
   * Obtiene todos los espacios con sus contratos e inquilinos relacionados.
   */
  async getAllSpaces(): Promise<SpaceWithDetails[]> {
    const { data, error } = await supabase
      .from('espacios')
      .select(`
        id,
        nombre,
        tipo,
        piso,
        rubro,
        precio_sugerido,
        estado,
        creado_en,
        contratos (
          id,
          monto_mensual,
          dia_de_pago,
          modalidad,
          activo,
          inquilinos (
            id,
            nombre_razon_social,
            telefono,
            documento_id
          )
        )
      `)
      .order('piso', { ascending: true })
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error en spaceService.getAllSpaces:', error);
      throw error;
    }

    const rawList = (data || []) as unknown as Record<string, unknown>[];
    return rawList.map((item) => ({
      ...(item as unknown as DbEspacio),
      contratos: Array.isArray(item.contratos)
        ? (item.contratos as Record<string, unknown>[]).map((c) => ({
            id: String(c.id || ''),
            monto_mensual: Number(c.monto_mensual || 0),
            dia_de_pago: Number(c.dia_de_pago || 1),
            modalidad: String(c.modalidad || 'adelantado'),
            activo: Boolean(c.activo),
            inquilinos: Array.isArray(c.inquilinos) ? c.inquilinos[0] : (c.inquilinos as any),
          }))
        : [],
    }));
  },

  /**
   * Obtiene los espacios que se encuentran disponibles (sin inquilino activo).
   */
  async getAvailableSpaces(): Promise<DbEspacio[]> {
    const { data, error } = await supabase
      .from('espacios')
      .select('*')
      .eq('estado', 'disponible')
      .order('piso', { ascending: true })
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error en spaceService.getAvailableSpaces:', error);
      throw error;
    }

    return (data || []) as DbEspacio[];
  },

  /**
   * Registra un nuevo espacio en Supabase.
   */
  async createSpace(payload: NewSpacePayload): Promise<DbEspacio> {
    const { data, error } = await supabase
      .from('espacios')
      .insert({
        nombre: payload.nombre.trim(),
        tipo: payload.tipo,
        piso: payload.piso.trim(),
        rubro: payload.rubro?.trim() || null,
        precio_sugerido: payload.precio_sugerido,
        estado: payload.estado,
      })
      .select()
      .single();

    if (error) {
      console.error('Error en spaceService.createSpace:', error);
      throw error;
    }

    return data as DbEspacio;
  },

  /**
   * Actualiza el estado de un espacio ('disponible', 'ocupado', 'mantenimiento').
   */
  async updateStatus(spaceId: string, estado: SpaceStatus): Promise<void> {
    const { error } = await supabase
      .from('espacios')
      .update({ estado })
      .eq('id', spaceId);

    if (error) {
      console.error('Error en spaceService.updateStatus:', error);
      throw error;
    }
  },
};
