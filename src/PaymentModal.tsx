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
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { PaymentMethod, PaymentModality, AlertItem } from './types';
import { modalityLabel, getCurrentMonthLabel } from './data';
import { supabase } from './lib/supabase';

interface Props {
  alert: AlertItem;
  onClose: () => void;
  onSave: () => void;
}

const methods: { id: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'yape_plin', label: 'Yape / Plin', icon: Smartphone },
  { id: 'transferencia', label: 'Transferencia', icon: Landmark },
];

export function PaymentModal({ alert, onClose, onSave }: Props) {
  const [modality, setModality] = useState<PaymentModality>(alert.modality || 'adelantado');
  const [amount, setAmount] = useState(alert.amount.toString());
  const [method, setMethod] = useState<PaymentMethod>('yape_plin');
  const [observations, setObservations] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setVoucherPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    setVoucherPreview(null);
    if (fileRef.current) {
      fileRef.current.value = '';
    }
  }

  async function handleSave() {
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMessage('Por favor ingresa un monto válido.');
      return;
    }
    if (parseFloat(amount) > alert.amount + 0.009) {
      setErrorMessage('El monto abonado no puede superar el saldo pendiente.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      let voucherUrl: string | null = alert.voucherUrl || null;

      // 1. Subir comprobante al bucket 'comprobantes' si se adjuntó un archivo
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop() || 'png';
        const cleanName = selectedFile.name.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${Date.now()}_${cleanName}.${fileExt}`;
        const filePath = `vouchers/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('comprobantes')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.warn('Error al subir voucher a Storage:', uploadError);
          // Si falló por RLS u otra razón, registramos advertencia pero no bloqueamos el registro del pago
          if (uploadError.message.includes('row-level security') || uploadError.message.includes('Unauthorized')) {
            console.warn(
              "Aviso: El bucket 'comprobantes' requiere habilitar una política RLS de INSERT pública para almacenar el archivo."
            );
          }
        } else if (uploadData?.path) {
          const { data: publicUrlData } = supabase.storage
            .from('comprobantes')
            .getPublicUrl(uploadData.path);
          voucherUrl = publicUrlData.publicUrl;
        }
      }

      const today = new Date().toISOString().split('T')[0];
      const parsedAmount = parseFloat(amount);
      const targetPaymentId = alert.id || alert.paymentId;

      // 2. Guardar en la tabla 'pagos'
      const obligations = alert.paymentAmounts?.length
        ? alert.paymentAmounts
        : targetPaymentId
          ? [{ id: targetPaymentId, amount: alert.amount, contractId: alert.contratoId, dueDate: alert.dueDate }]
          : [];
      if (obligations.length > 0) {
        let remainingToApply = Math.round(parsedAmount * 100) / 100;
        for (const obligation of obligations) {
          if (remainingToApply <= 0) break;
          const applied = Math.min(obligation.amount, remainingToApply);
          const balance = Math.round((obligation.amount - applied) * 100) / 100;
          if (balance <= 0.009) {
            const totalPaid = Math.round(((obligation.paidAmount || 0) + applied) * 100) / 100;
            const { error: updateError } = await supabase.from('pagos').update({
              monto: totalPaid,
              metodo: method,
              fecha_pago: today,
              estado: 'pagado',
              comprobante_url: voucherUrl,
              observacion: [`ABONO ACUMULADO: S/ ${totalPaid.toFixed(2)}`, observations.trim()].filter(Boolean).join(' · '),
            }).eq('id', obligation.id);
            if (updateError) throw updateError;
          } else {
            const accumulated = Math.round(((obligation.paidAmount || 0) + applied) * 100) / 100;
            const note = [`ABONO ACUMULADO: S/ ${accumulated.toFixed(2)}`, observations.trim()].filter(Boolean).join(' · ');
            const { error: balanceError } = await supabase.from('pagos').update({
              monto: balance,
              fecha_pago: null,
              estado: 'pendiente',
              observacion: note,
            }).eq('id', obligation.id);
            if (balanceError) throw balanceError;

            const { error: transactionError } = await supabase.from('pagos').insert({
              contrato_id: obligation.contractId || alert.contratoId,
              mes_correspondiente: alert.month || getCurrentMonthLabel(),
              monto: applied,
              fecha_vencimiento: obligation.dueDate || alert.dueDate || today,
              fecha_pago: today,
              metodo: method,
              estado: 'pagado',
              comprobante_url: voucherUrl,
              observacion: `ABONO_TRANSACCION: obligación ${obligation.id}${observations.trim() ? ` · ${observations.trim()}` : ''}`,
            });
            if (transactionError?.code === '23505') {
              const fallbackNote = `${note} · ABONO TRANSACCION: S/ ${applied.toFixed(2)}${observations.trim() ? ` · ${observations.trim()}` : ''}`;
              const { error: fallbackError } = await supabase.from('pagos').update({ observacion: fallbackNote }).eq('id', obligation.id);
              if (fallbackError) throw fallbackError;
            } else if (transactionError) {
              throw transactionError;
            }
          }
          remainingToApply = Math.round((remainingToApply - applied) * 100) / 100;
        }
        if (remainingToApply > 0.009) throw new Error('No se pudo aplicar el monto completo al saldo seleccionado.');
      } else if (alert.contratoId) {
        // Insertar nuevo registro de pago asociado al contrato
        const { error: insertError } = await supabase
          .from('pagos')
          .insert({
            contrato_id: alert.contratoId,
            mes_correspondiente: alert.month || getCurrentMonthLabel(),
            monto: parsedAmount,
            fecha_vencimiento: alert.dueDate || today,
            fecha_pago: today,
            metodo: method,
            estado: 'pagado',
            comprobante_url: voucherUrl,
            observacion: observations.trim() || null,
          });

        if (insertError) {
          throw insertError;
        }
      }

      // Si la modalidad cambió y tenemos contratoId, actualizar contrato
      if (alert.contractIds?.length && modality !== alert.modality) {
        const { error: modalityError } = await supabase
          .from('contratos')
          .update({ modalidad: modality })
          .in('id', alert.contractIds);
        if (modalityError) throw modalityError;
      } else if (alert.contratoId && modality !== alert.modality) {
        await supabase
          .from('contratos')
          .update({ modalidad: modality })
          .eq('id', alert.contratoId);
      }

      setSaved(true);
      setTimeout(() => {
        onSave();
      }, 700);
    } catch (err: unknown) {
      console.error('Error al registrar pago en Supabase:', err);
      const msg = err instanceof Error ? err.message : 'Error al guardar el pago.';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  }

  const spaceLabel = alert.spaces && alert.spaces.length > 1
    ? alert.spaces.map((space) => `${space.floor} · ${space.number}`).join(', ')
    : `${alert.space.floor} · ${alert.space.number}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[420px] bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto animate-slide-up shadow-2xl">
        {/* Handle */}
        <div className="sticky top-0 bg-white pt-3 pb-2 rounded-t-3xl z-10 border-b border-gray-100">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-gray-300" />
          <div className="flex items-center justify-between px-5 pt-3">
            <h2 className="text-lg font-bold text-gray-900">Registrar Pago</h2>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-5 pb-8 pt-3">
          {errorMessage && (
            <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-2 text-xs text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

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
                <span className="text-gray-500">{alert.spaces && alert.spaces.length > 1 ? 'Espacios' : 'Espacio'}</span>
                <span className="font-semibold text-gray-900">{spaceLabel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mes</span>
                <span className="font-semibold text-gray-900">
                  {alert.month || getCurrentMonthLabel()}
                </span>
              </div>
            </div>
          </div>

          {/* Modality selector */}
          <p className="text-sm font-semibold text-gray-900 mb-2">
            Modalidad de pago
          </p>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <button
              type="button"
              onClick={() => setModality('adelantado')}
              className={`rounded-2xl border-2 p-3 text-sm font-semibold transition ${
                modality === 'adelantado'
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              Mes Adelantado
            </button>
            <button
              type="button"
              onClick={() => setModality('vencido')}
              className={`rounded-2xl border-2 p-3 text-sm font-semibold transition ${
                modality === 'vencido'
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              Mes Vencido / Cumplido
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-5">
            Seleccionado: <span className="font-semibold">{modalityLabel[modality]}</span>
          </p>

          {/* Amount */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-900">Monto abonado</p>
            <span className="text-xs text-gray-500">Saldo: S/ {alert.amount.toLocaleString('es-PE')}</span>
          </div>
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
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {methods.map((m) => {
              const Icon = m.icon;
              const active = method === m.id;
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 transition ${
                    active
                      ? 'border-blue-600 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
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

          {/* Voucher upload to Supabase Storage 'comprobantes' */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-900">
              Comprobante de pago (Voucher)
            </p>
            <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Supabase Storage
            </span>
          </div>

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
                type="button"
                onClick={handleRemoveFile}
                className="absolute top-2 right-2 h-9 w-9 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition"
              >
                <Trash2 size={16} />
              </button>
              <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1">
                <Check size={14} /> Voucher listo para subir al bucket 'comprobantes'
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 py-5 text-gray-500 hover:border-blue-500 hover:text-blue-600 transition bg-gray-50/50"
              >
                <Camera size={24} />
                <span className="text-xs font-semibold">Tomar foto</span>
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 py-5 text-gray-500 hover:border-blue-500 hover:text-blue-600 transition bg-gray-50/50"
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
            type="button"
            onClick={handleSave}
            disabled={isSaving || saved}
            className={`w-full rounded-2xl py-4 text-base font-bold text-white shadow-lg transition flex items-center justify-center gap-2 ${
              saved
                ? 'bg-green-500'
                : isSaving
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99]'
            }`}
          >
            {saved ? (
              <>
                <Check size={20} /> ¡Pago registrado con éxito!
              </>
            ) : isSaving ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Guardando en Supabase...
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
