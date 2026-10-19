import { useState } from 'react';
import {
  X,
  AlertTriangle,
  Calendar,
  FileText,
  UserMinus,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { contractService } from '../../services/contractService';

interface Props {
  contractId: string;
  spaceId: string;
  spaceName: string;
  tenantName: string;
  onClose: () => void;
  onTerminated: () => void;
}

export function TerminateContractModal({
  contractId,
  spaceId,
  spaceName,
  tenantName,
  onClose,
  onTerminated,
}: Props) {
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await contractService.terminateContract(contractId, spaceId, fechaFin);
      onTerminated();
    } catch (err: unknown) {
      console.error('Error al dar de baja el contrato:', err);
      const msg = err instanceof Error ? err.message : 'No se pudo dar de baja el contrato.';
      setError(msg);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[420px] bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl">
        <div className="sticky top-0 bg-white pt-3 pb-2 rounded-t-3xl z-10 border-b border-gray-100">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-gray-300" />
          <div className="flex items-center justify-between px-5 pt-3">
            <div className="flex items-center gap-2 text-red-600">
              <UserMinus size={20} />
              <h2 className="text-lg font-bold text-gray-900">Dar de Baja Contrato</h2>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleConfirm} className="px-5 pb-8 pt-4 space-y-4">
          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Resumen del contrato */}
          <div className="rounded-2xl bg-red-50/70 border border-red-100 p-4">
            <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">
              Liberación de espacio
            </p>
            <div className="space-y-1.5 text-xs text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Inquilino:</span>
                <span className="font-bold text-gray-900">{tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Espacio a liberar:</span>
                <span className="font-bold text-gray-900">{spaceName}</span>
              </div>
            </div>
          </div>

          {/* Advertencia informativa */}
          <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p>
              Al confirmar, el contrato pasará a estado inactivo y la habitación <strong>{spaceName}</strong> cambiará inmediatamente a estado <strong>DISPONIBLE</strong> para que pueda ser alquilada por otro inquilino.
            </p>
          </div>

          {/* Fecha de baja / entrega */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Fecha de Salida / Término de Contrato
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full rounded-2xl border-2 border-gray-200 pl-10 pr-4 py-2.5 text-xs font-semibold text-gray-900 focus:border-red-600 focus:outline-none transition"
                required
              />
            </div>
          </div>

          {/* Motivo u observaciones */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Motivo u Observación <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <FileText size={16} className="absolute left-3.5 top-3 text-gray-400" />
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={2}
                placeholder="Ej. Fin de contrato pactado, retiro voluntario..."
                className="w-full rounded-2xl border-2 border-gray-200 pl-10 pr-4 py-2.5 text-xs text-gray-900 focus:border-red-600 focus:outline-none transition resize-none"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-red-600 hover:bg-red-700 py-3.5 text-sm font-bold text-white shadow-lg transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Liberando habitación...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} /> Confirmar y Liberar Habitación
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-gray-100 hover:bg-gray-200 py-3 text-xs font-semibold text-gray-600 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
