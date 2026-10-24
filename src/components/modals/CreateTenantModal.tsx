import { useState, useEffect } from 'react';
import {
  X,
  User,
  Briefcase,
  FileText,
  Phone,
  Mail,
  Hash,
  Save,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { TenantType, DbEspacio, PaymentModality } from '../../types';
import { spaceService } from '../../services/spaceService';
import { tenantService } from '../../services/tenantService';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateTenantModal({ onClose, onCreated }: Props) {
  // Datos del inquilino
  const [tipo, setTipo] = useState<TenantType>('persona');
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');

  // Asignación de habitación
  const [assignSpace, setAssignSpace] = useState(true);
  const [availableSpaces, setAvailableSpaces] = useState<DbEspacio[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(true);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<string[]>([]);
  const [montoMensual, setMontoMensual] = useState<string>('');
  const [priceMode, setPriceMode] = useState<'global' | 'individual'>('global');
  const [spacePrices, setSpacePrices] = useState<Record<string, string>>({});
  const [diaDePago, setDiaDePago] = useState<number>(5);
  const [modalidad, setModalidad] = useState<PaymentModality>('adelantado');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [generarCobro, setGenerarCobro] = useState(true);

  // Estados de interfaz
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar habitaciones disponibles al abrir el modal
  useEffect(() => {
    async function loadSpaces() {
      try {
        const spaces = await spaceService.getAvailableSpaces();
        setAvailableSpaces(spaces);
        if (spaces.length > 0) {
          setSelectedSpaceId(spaces[0].id);
          setSelectedSpaceIds([spaces[0].id]);
          setMontoMensual(String(spaces[0].precio_sugerido || ''));
        } else {
          setAssignSpace(false);
        }
      } catch (err) {
        console.error('Error al cargar espacios disponibles:', err);
      } finally {
        setLoadingSpaces(false);
      }
    }
    loadSpaces();
  }, []);

  // Al cambiar el espacio seleccionado, autocompletar el precio
  function handleSelectSpace(spaceId: string) {
    setSelectedSpaceId(spaceId);
    setSelectedSpaceIds([spaceId]);
    const sp = availableSpaces.find((s) => s.id === spaceId);
    if (sp) {
      setMontoMensual(String(sp.precio_sugerido || ''));
    }
  }

  function toggleSpace(spaceId: string) {
    setSelectedSpaceIds((current) => {
      const exists = current.includes(spaceId);
      if (!exists) {
        const space = availableSpaces.find((item) => item.id === spaceId);
        setSpacePrices((prices) => ({ ...prices, [spaceId]: prices[spaceId] || String(space?.precio_sugerido || '') }));
      }
      return exists ? current.filter((id) => id !== spaceId) : [...current, spaceId];
    });
  }

  function getGlobalSpacePrice(index: number): number {
    const totalCents = Math.round((parseFloat(montoMensual) || 0) * 100);
    const baseCents = Math.floor(totalCents / selectedSpaceIds.length);
    const remainderCents = totalCents % selectedSpaceIds.length;
    return (baseCents + (index < remainderCents ? 1 : 0)) / 100;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('Por favor indica el nombre o razón social.');
      return;
    }
    if (!documento.trim()) {
      setError('Por favor indica el documento de identidad (DNI o RUC).');
      return;
    }
    if (!telefono.trim()) {
      setError('Por favor indica el teléfono de contacto.');
      return;
    }

    if (assignSpace) {
      const hasSelectedSpaces = tipo === 'empresa' ? selectedSpaceIds.length > 0 : Boolean(selectedSpaceId);
      if (!hasSelectedSpaces) {
        setError('Por favor selecciona al menos un espacio o desmarca la asignación.');
        return;
      }
      const invalidIndividualPrice = tipo === 'empresa' && priceMode === 'individual'
        && selectedSpaceIds.some((id) => !spacePrices[id] || parseFloat(spacePrices[id]) <= 0);
      if (invalidIndividualPrice || (tipo === 'empresa' && priceMode === 'global' && (!montoMensual || parseFloat(montoMensual) <= 0)) || (tipo === 'persona' && (!montoMensual || parseFloat(montoMensual) <= 0))) {
        setError('Por favor indica un monto mensual de alquiler válido.');
        return;
      }
    }

    setIsSaving(true);
    setError(null);

    try {
      await tenantService.createTenantWithContract(
        {
          nombre_razon_social: nombre.trim(),
          tipo,
          documento_id: documento.trim(),
          telefono: telefono.trim(),
          email: email.trim() || null,
        },
        assignSpace
          ? tipo === 'empresa'
            ? { assignments: selectedSpaceIds.map((spaceId, index) => ({
                espacio_id: spaceId,
                monto_mensual: priceMode === 'individual'
                  ? parseFloat(spacePrices[spaceId])
                  : getGlobalSpacePrice(index),
                dia_de_pago: diaDePago,
                modalidad,
                fecha_inicio: fechaInicio,
                crearPrimerCobro: generarCobro,
              })) }
            : {
              espacio_id: selectedSpaceId,
              monto_mensual: parseFloat(montoMensual),
              dia_de_pago: diaDePago,
              modalidad,
              fecha_inicio: fechaInicio,
              crearPrimerCobro: generarCobro,
            }
          : undefined
      );

      onCreated();
    } catch (err: unknown) {
      console.error('Error al guardar inquilino:', err);
      const msg = err instanceof Error ? err.message : 'Error al guardar el inquilino.';
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
      <div className="relative w-full max-w-[440px] bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto animate-slide-up shadow-2xl">
        <div className="sticky top-0 bg-white pt-3 pb-2 rounded-t-3xl z-10 border-b border-gray-100">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-gray-300" />
          <div className="flex items-center justify-between px-5 pt-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Registrar Inquilino</h2>
              <p className="text-xs text-gray-500">Datos personales y asignación de espacio</p>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving}
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

          {/* Tipo de inquilino */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Tipo de Inquilino
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipo('persona')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 font-bold text-xs transition ${
                  tipo === 'persona'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <User size={16} /> Persona Natural
              </button>
              <button
                type="button"
                onClick={() => setTipo('empresa')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 font-bold text-xs transition ${
                  tipo === 'empresa'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Briefcase size={16} /> Empresa
              </button>
            </div>
          </div>

          {/* Nombre / Razón Social */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              {tipo === 'persona' ? 'Nombres y Apellidos' : 'Razón Social'}
            </label>
            <input
              type="text"
              inputMode="text"
              autoComplete="name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={tipo === 'persona' ? 'Ej. María Elena Quispe' : 'Ej. Distribuidora del Norte SAC'}
              className="w-full rounded-2xl border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:outline-none transition"
              required
            />
          </div>

          {/* Documento y Teléfono */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {tipo === 'persona' ? 'DNI / Pasaporte' : 'Número RUC'}
              </label>
              <div className="relative">
                <FileText size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  placeholder={tipo === 'persona' ? '42318765' : '20512345678'}
                  className="w-full rounded-2xl border-2 border-gray-200 pl-8 pr-3 py-2 text-xs text-gray-900 focus:border-blue-600 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Teléfono / WhatsApp
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="987654321"
                  className="w-full rounded-2xl border-2 border-gray-200 pl-8 pr-3 py-2 text-xs text-gray-900 focus:border-blue-600 focus:outline-none transition"
                  required
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Correo Electrónico <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="inquilino@ejemplo.com"
                className="w-full rounded-2xl border-2 border-gray-200 pl-8 pr-3 py-2 text-xs text-gray-900 focus:border-blue-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Sección de Asignación de Habitación / Espacio */}
          <div className="pt-2">
            <div className="rounded-2xl border-2 border-blue-100 bg-blue-50/50 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <Sparkles size={15} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900">
                      Asignar Habitación / Local
                    </span>
                    <p className="text-[11px] text-gray-500">Vincular a un espacio disponible</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignSpace}
                    onChange={(e) => setAssignSpace(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {assignSpace && (
                <div className="pt-2 space-y-3 border-t border-blue-100">
                  {loadingSpaces ? (
                    <div className="py-4 text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
                      <Loader2 size={16} className="animate-spin text-blue-600" />
                      Cargando habitaciones disponibles...
                    </div>
                  ) : availableSpaces.length === 0 ? (
                    <div className="rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800">
                      ⚠️ No hay habitaciones vacías disponibles en este momento. El inquilino se registrará sin espacio asignado.
                    </div>
                  ) : (
                    <>
                      {/* Selector según tipo de inquilino */}
                      {tipo === 'empresa' ? (
                        <fieldset>
                          <legend className="block text-xs font-bold text-gray-700 mb-1">
                            Seleccionar Locales / Cuartos ({selectedSpaceIds.length} seleccionados)
                          </legend>
                          <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 space-y-1.5">
                            {availableSpaces.map((sp) => (
                              <label key={sp.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-gray-700 hover:bg-blue-50">
                                <input type="checkbox" checked={selectedSpaceIds.includes(sp.id)} onChange={() => toggleSpace(sp.id)} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
                                <span>{sp.tipo === 'cuarto' ? 'Cuarto' : 'Local'} {sp.nombre} · {sp.piso} (S/ {sp.precio_sugerido})</span>
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      ) : <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Seleccionar Habitación Disponible ({availableSpaces.length} vacías)
                        </label>
                        <select
                          value={selectedSpaceId}
                          onChange={(e) => handleSelectSpace(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 focus:border-blue-600 focus:outline-none"
                        >
                          {availableSpaces.map((sp) => {
                            const label = `${sp.tipo === 'cuarto' ? 'Cuarto' : 'Local'} ${sp.nombre} · ${sp.piso} (S/ ${sp.precio_sugerido})`;
                            return (
                              <option key={sp.id} value={sp.id}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                      </div>}

                      {tipo === 'empresa' && (
                        <div>
                          <p className="block text-xs font-bold text-gray-700 mb-1.5">Modo de precio</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setPriceMode('global')} className={`rounded-xl border px-2 py-2 text-[11px] font-bold ${priceMode === 'global' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}>Precio Total Global</button>
                            <button type="button" onClick={() => setPriceMode('individual')} className={`rounded-xl border px-2 py-2 text-[11px] font-bold ${priceMode === 'individual' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}>Precio por Habitación</button>
                          </div>
                        </div>
                      )}

                      {/* Precio global / por espacio */}
                      {tipo === 'empresa' && priceMode === 'individual' ? (
                        <div className="space-y-2">
                          {selectedSpaceIds.map((spaceId) => {
                            const space = availableSpaces.find((item) => item.id === spaceId);
                            return <label key={spaceId} className="grid grid-cols-[1fr_120px] items-center gap-2 text-xs font-semibold text-gray-700">
                              <span>{space?.tipo === 'local' ? 'Local' : 'Cuarto'} {space?.nombre}</span>
                              <span className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">S/</span><input type="number" min="0.01" step="0.01" value={spacePrices[spaceId] || ''} onChange={(e) => setSpacePrices((prices) => ({ ...prices, [spaceId]: e.target.value }))} className="w-full rounded-lg border border-gray-200 pl-7 pr-2 py-2 text-xs" /></span>
                            </label>;
                          })}
                          <p className="text-right text-xs font-bold text-blue-700">Total mensual: S/ {selectedSpaceIds.reduce((sum, id) => sum + (parseFloat(spacePrices[id]) || 0), 0).toLocaleString('es-PE')}</p>
                        </div>
                      ) : (
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Alquiler Mensual (S/)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                              S/
                            </span>
                            <input
                              type="number"
                              inputMode="decimal"
                              value={montoMensual}
                              onChange={(e) => setMontoMensual(e.target.value)}
                              placeholder="0.00"
                              className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3 py-2 text-xs font-bold text-gray-900 focus:border-blue-600 focus:outline-none"
                              required={assignSpace}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Día de Pago (cada mes)
                          </label>
                          <div className="relative">
                            <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="number"
                              min={1}
                              max={31}
                              value={diaDePago}
                              onChange={(e) => setDiaDePago(Number(e.target.value))}
                              className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3 py-2 text-xs font-bold text-gray-900 focus:border-blue-600 focus:outline-none"
                              required={assignSpace}
                            />
                          </div>
                        </div>
                      </div>
                      )}

                      {/* Modalidad y Fecha de inicio */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Modalidad
                          </label>
                          <select
                            value={modalidad}
                            onChange={(e) => setModalidad(e.target.value as PaymentModality)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs font-semibold text-gray-900 focus:border-blue-600 focus:outline-none"
                          >
                            <option value="adelantado">Mes Adelantado</option>
                            <option value="vencido">Mes Vencido</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Fecha de Inicio
                          </label>
                          <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs font-semibold text-gray-900 focus:border-blue-600 focus:outline-none"
                            required={assignSpace}
                          />
                        </div>
                      </div>

                      {/* Toggle de generar primer cobro */}
                      <label className="flex items-center gap-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={generarCobro}
                          onChange={(e) => setGenerarCobro(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <span className="text-xs text-gray-700">
                          Crear alerta de cobro pendiente para el mes actual
                        </span>
                      </label>
                    </>
                  )}
                </div>
              )}
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
                  <Save size={18} />
                  {assignSpace && availableSpaces.length > 0
                    ? tipo === 'empresa' ? 'Registrar Empresa y Asignar Espacios' : 'Registrar Inquilino y Asignar Habitación'
                    : 'Registrar Inquilino'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
