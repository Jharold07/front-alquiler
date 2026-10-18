import { useState, useRef } from 'react';
import {
  X,
  Camera,
  ImagePlus,
  Check,
  Banknote,
  Smartphone,
  Landmark,
  Save,
  Trash2,
} from 'lucide-react';
import type { PaymentMethod, PaymentModality, AlertItem } from './types';
import { modalityLabel } from './data';

interface Props {
  alert: AlertItem;
  onClose: () => void;
  onSave: () => void;
}

const methods: { id: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'yape', label: 'Yape / Plin', icon: Smartphone },
  { id: 'transferencia', label: 'Transferencia', icon: Landmark },
];

export function PaymentModal({ alert, onClose, onSave }: Props) {
  const [modality, setModality] = useState<PaymentModality>(alert.modality);
  const [amount, setAmount] = useState(alert.amount.toString());
  const [method, setMethod] = useState<PaymentMethod>('efectivo');
  const [observations, setObservations] = useState('');
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setVoucherPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => {
      onSave();
    }, 900);
  }

  const spaceLabel = `${alert.space.floor} · ${alert.space.number}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[420px] bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto animate-slide-up shadow-2xl">
        {/* Handle */}
        <div className="sticky top-0 bg-white pt-3 pb-2 rounded-t-3xl z-10">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-gray-300" />
          <div className="flex items-center justify-between px-5 pt-3">
            <h2 className="text-lg font-bold text-gray-900">Registrar Pago</h2>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-5 pb-8 pt-1">
          {/* Auto data */}
          <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 mb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-2">
              Datos del cobro
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Inquilino</span>
                <span className="font-semibold text-gray-900 text-right">
                  {alert.tenant.name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Espacio</span>
                <span className="font-semibold text-gray-900">{spaceLabel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mes</span>
                <span className="font-semibold text-gray-900">Octubre 2026</span>
              </div>
            </div>
          </div>

          {/* Modality selector */}
          <p className="text-sm font-semibold text-gray-900 mb-2">
            Modalidad de pago
          </p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              onClick={() => setModality('adelantado')}
              className={`rounded-2xl border-2 p-3 text-sm font-semibold transition ${
                modality === 'adelantado'
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              Pago Adelantado
            </button>
            <button
              onClick={() => setModality('cumplido')}
              className={`rounded-2xl border-2 p-3 text-sm font-semibold transition ${
                modality === 'cumplido'
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              Mes Cumplido
            </button>
          </div>
          <p className="text-xs text-gray-500 -mt-3 mb-5">
            Seleccionado: <span className="font-semibold">{modalityLabel[modality]}</span>
          </p>

          {/* Amount */}
          <p className="text-sm font-semibold text-gray-900 mb-2">Monto del pago</p>
          <div className="relative mb-5">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-lg">
              S/
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-2xl border-2 border-gray-200 pl-11 pr-4 py-3.5 text-xl font-bold text-gray-900 focus:border-blue-600 focus:outline-none transition"
              placeholder="0.00"
            />
          </div>

          {/* Payment method */}
          <p className="text-sm font-semibold text-gray-900 mb-2">Método de pago</p>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {methods.map((m) => {
              const Icon = m.icon;
              const active = method === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 transition ${
                    active
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <Icon
                    size={22}
                    className={active ? 'text-blue-600' : 'text-gray-500'}
                  />
                  <span
                    className={`text-xs font-semibold ${
                      active ? 'text-blue-700' : 'text-gray-600'
                    }`}
                  >
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Voucher upload */}
          <p className="text-sm font-semibold text-gray-900 mb-2">
            Comprobante de pago
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />
          {voucherPreview ? (
            <div className="relative mb-5">
              <img
                src={voucherPreview}
                alt="Comprobante"
                className="w-full rounded-2xl border-2 border-gray-200 object-cover max-h-56"
              />
              <button
                onClick={() => setVoucherPreview(null)}
                className="absolute top-2 right-2 h-9 w-9 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition"
              >
                <Trash2 size={16} />
              </button>
              <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1">
                <Check size={14} /> Comprobante adjuntado
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 py-5 text-gray-500 hover:border-blue-500 hover:text-blue-600 transition"
              >
                <Camera size={24} />
                <span className="text-xs font-semibold">Tomar foto</span>
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 py-5 text-gray-500 hover:border-blue-500 hover:text-blue-600 transition"
              >
                <ImagePlus size={24} />
                <span className="text-xs font-semibold">Subir imagen</span>
              </button>
            </div>
          )}

          {/* Observations */}
          <p className="text-sm font-semibold text-gray-900 mb-2">
            Observaciones <span className="text-gray-400 font-normal">(opcional)</span>
          </p>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={3}
            className="w-full rounded-2xl border-2 border-gray-200 p-3.5 text-sm text-gray-900 focus:border-blue-600 focus:outline-none transition resize-none mb-6"
            placeholder="Notas sobre este pago..."
          />

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saved}
            className={`w-full rounded-2xl py-4 text-base font-bold text-white shadow-lg transition flex items-center justify-center gap-2 ${
              saved ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saved ? (
              <>
                <Check size={20} /> ¡Pago registrado!
              </>
            ) : (
              <>
                <Save size={20} /> Guardar y Registrar Pago
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
