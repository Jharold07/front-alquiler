import { useState } from 'react';
import {
  X,
  Building2,
  Store,
  Layers,
  Tag,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { SpaceType, SpaceStatus, DbEspacio } from '../../types';
import { spaceService } from '../../services/spaceService';

interface Props {
  defaultType: SpaceType;
  space?: DbEspacio;
  onClose: () => void;
  onCreated: () => void;
}

const commonFloors = ['PLANTA BAJA', 'PISO 1', 'PISO 2', 'PISO 3', 'PISO 4', 'PISO 5'];

export function CreateSpaceModal({ defaultType, space, onClose, onCreated }: Props) {
  const [nombre, setNombre] = useState(space?.nombre || '');
  const [tipo, setTipo] = useState<SpaceType>(space?.tipo || defaultType);
  const [piso, setPiso] = useState(space?.piso || (defaultType === 'local' ? 'PLANTA BAJA' : 'PISO 1'));
  const [rubro, setRubro] = useState(space?.rubro || (defaultType === 'local' ? 'Comercial' : 'Habitación'));
  const [precioSugerido, setPrecioSugerido] = useState(String(space?.precio_sugerido ?? (defaultType === 'local' ? '900' : '380')));
  const [estado, setEstado] = useState<SpaceStatus>(space?.estado || 'disponible');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('Por favor indica el número o nombre del espacio.');
      return;
    }
    if (!piso.trim()) {
      setError('Por favor indica el piso o ubicación.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        nombre,
        tipo,
        piso,
        rubro: rubro.trim() || null,
        precio_sugerido: parseFloat(precioSugerido) || 0,
        estado,
      };
      if (space) await spaceService.updateSpace(space.id, payload);
      else await spaceService.createSpace(payload);

      onCreated();
    } catch (err: unknown) {
      console.error('Error al guardar espacio:', err);
      const msg = err instanceof Error ? err.message : 'Error al guardar el espacio.';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[420px] bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto animate-slide-up shadow-2xl">
        <div className="sticky top-0 bg-white pt-3 pb-2 rounded-t-3xl z-10 border-b border-gray-100">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-gray-300" />
          <div className="flex items-center justify-between px-5 pt-3">
            <h2 className="text-lg font-bold text-gray-900">{space ? 'Editar Espacio' : 'Registrar Espacio'}</h2>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-8 pt-4 space-y-4">
          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-3 flex items-start gap-2 text-xs text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Tipo de espacio */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Tipo de Espacio
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTipo('cuarto');
                  if (rubro === 'Comercial') setRubro('Habitación');
                  if (piso === 'PLANTA BAJA') setPiso('PISO 1');
                }}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 font-bold text-sm transition ${
                  tipo === 'cuarto'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                <Building2 size={18} /> Cuarto
              </button>
              <button
                type="button"
                onClick={() => {
                  setTipo('local');
                  if (rubro === 'Habitación') setRubro('Comercial');
                  if (piso === 'PISO 1') setPiso('PLANTA BAJA');
                }}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 font-bold text-sm transition ${
                  tipo === 'local'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                <Store size={18} /> Local
              </button>
            </div>
          </div>

          {/* Nombre / Número */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              {tipo === 'cuarto' ? 'Número de Cuarto' : 'Nombre o Letra del Local'}
            </label>
            <input
              type="text"
              inputMode="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={tipo === 'cuarto' ? 'Ej. 104, 203' : 'Ej. Local E, Stand 12'}
              className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-blue-600 focus:outline-none transition"
              required
            />
          </div>

          {/* Piso */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Piso / Nivel
            </label>
            <div className="flex gap-1.5 mb-2 overflow-x-auto no-scrollbar py-1">
              {commonFloors.map((f) => (
                <button
                  type="button"
                  key={f}
                  onClick={() => setPiso(f)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition ${
                    piso === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="relative">
              <Layers size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                inputMode="text"
                value={piso}
                onChange={(e) => setPiso(e.target.value)}
                placeholder="PISO 1, PLANTA BAJA, AZOTEA..."
                className="w-full rounded-2xl border-2 border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:outline-none transition"
                required
              />
            </div>
          </div>

          {/* Rubro */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Rubro / Uso
            </label>
            <div className="relative">
              <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={rubro}
                onChange={(e) => setRubro(e.target.value)}
                placeholder="Habitación, Comercial, Oficina, etc."
                className="w-full rounded-2xl border-2 border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Precio sugerido */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Precio Sugerido Mensual (S/)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                S/
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={precioSugerido}
                onChange={(e) => setPrecioSugerido(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-2xl border-2 border-gray-200 pl-10 pr-4 py-3 text-base font-bold text-gray-900 focus:border-blue-600 focus:outline-none transition"
                required
              />
            </div>
          </div>

          {/* Estado inicial */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Estado
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'disponible', label: 'Disponible' },
                  { id: 'ocupado', label: 'Ocupado' },
                  { id: 'mantenimiento', label: 'Mantenimiento' },
                ] as const
              ).map((st) => (
                <button
                  type="button"
                  key={st.id}
                  onClick={() => setEstado(st.id)}
                  className={`py-2 px-2 rounded-xl border-2 text-xs font-bold transition ${
                    estado === st.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 py-3.5 text-sm font-bold text-white shadow-lg transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Guardando en Supabase...
                </>
              ) : (
                <>
                  <Save size={18} /> {space ? 'Guardar cambios' : 'Registrar Espacio'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
