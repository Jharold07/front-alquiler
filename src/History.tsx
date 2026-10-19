import { useState, useEffect, useCallback } from 'react';
import {
  Filter,
  CheckCircle2,
  DollarSign,
  Calendar,
  Image,
  ExternalLink,
  X,
  Loader2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import type { PaymentMethod, DbPago } from './types';
import { modalityLabel } from './data';
import { supabase } from './lib/supabase';

interface Props {
  onOpenTenant: (id: string) => void;
}

const methodLabel: Record<string, string> = {
  efectivo: 'Efectivo',
  yape_plin: 'Yape / Plin',
  yape: 'Yape / Plin',
  transferencia: 'Transferencia',
};

const methodStyle: Record<string, string> = {
  efectivo: 'bg-gray-100 text-gray-700',
  yape_plin: 'bg-purple-100 text-purple-700',
  yape: 'bg-purple-100 text-purple-700',
  transferencia: 'bg-blue-100 text-blue-700',
};

export function History({ onOpenTenant }: Props) {
  const [payments, setPayments] = useState<DbPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState<'all' | PaymentMethod>('all');
  const [previewVoucher, setPreviewVoucher] = useState<{ url: string; tenant: string } | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      const { data, error } = await supabase
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
          creado_en,
          contratos (
            id,
            monto_mensual,
            modalidad,
            espacios (
              id,
              nombre,
              tipo,
              piso
            ),
            inquilinos (
              id,
              nombre_razon_social,
              telefono,
              documento_id
            )
          )
        `)
        .order('fecha_pago', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error al obtener historial de pagos:', error);
      } else if (data) {
        setPayments(data as unknown as DbPago[]);
      }
    } catch (err) {
      console.error('Error de red al consultar historial:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filtered = payments.filter((p) => {
    if (methodFilter === 'all') return true;
    return p.metodo === methodFilter;
  });

  const total = filtered
    .filter((p) => p.estado === 'pagado')
    .reduce((s, p) => s + (p.monto || 0), 0);

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-5 pt-7 pb-6 rounded-b-[2rem] shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-1">Historial</h1>
        <p className="text-blue-100 text-sm mb-4">Pagos registrados</p>

        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/15">
          <p className="text-blue-50 text-xs">Total cobrado registrado</p>
          <p className="text-2xl font-bold text-white">
            S/ {total.toLocaleString('es-PE')}
          </p>
          <p className="text-blue-100 text-xs mt-1">
            {filtered.length} transacciones registradas
          </p>
        </div>
      </div>

      <div className="px-5 pt-5">
        {/* Filter */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar">
          <Filter size={16} className="text-gray-400 shrink-0" />
          {(
            [
              { id: 'all', label: 'Todos' },
              { id: 'efectivo', label: 'Efectivo' },
              { id: 'yape_plin', label: 'Yape / Plin' },
              { id: 'transferencia', label: 'Transferencia' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setMethodFilter(f.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${methodFilter === f.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-gray-400 gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <p className="text-sm font-medium">Cargando pagos ...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => {
              const contrato = Array.isArray(p.contratos) ? p.contratos[0] : p.contratos;
              const tenant = Array.isArray(contrato?.inquilinos)
                ? contrato?.inquilinos[0]
                : contrato?.inquilinos;
              const space = Array.isArray(contrato?.espacios)
                ? contrato?.espacios[0]
                : contrato?.espacios;

              const isPaid = p.estado === 'pagado';
              const isVencido = p.estado === 'vencido';

              return (
                <div
                  key={p.id}
                  className="rounded-3xl bg-white border border-gray-100 p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    {tenant ? (
                      <button
                        onClick={() => onOpenTenant(tenant.id)}
                        className="flex items-center gap-3 text-left flex-1 min-w-0"
                      >
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isPaid
                            ? 'bg-green-100 text-green-600'
                            : isVencido
                              ? 'bg-red-100 text-red-600'
                              : 'bg-amber-100 text-amber-600'
                            }`}
                        >
                          {isPaid ? (
                            <CheckCircle2 size={20} />
                          ) : isVencido ? (
                            <AlertTriangle size={20} />
                          ) : (
                            <Clock size={20} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">
                            {tenant.nombre_razon_social}
                          </p>
                          <p className="text-xs text-gray-500">
                            {space?.piso} · {space?.tipo === 'local' ? 'Local' : 'Cuarto'} {space?.nombre}
                          </p>
                        </div>
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                          <CheckCircle2 size={20} />
                        </div>
                        <p className="font-bold text-gray-900 text-sm">Pago sin inquilino</p>
                      </div>
                    )}
                    <p
                      className={`text-lg font-bold shrink-0 ml-2 ${isPaid ? 'text-green-600' : isVencido ? 'text-red-600' : 'text-amber-600'
                        }`}
                    >
                      S/ {p.monto}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    {p.metodo && (
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${methodStyle[p.metodo] || 'bg-gray-100 text-gray-700'
                          }`}
                      >
                        {methodLabel[p.metodo] || p.metodo}
                      </span>
                    )}
                    {contrato?.modalidad && (
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                        {modalityLabel[contrato.modalidad] || contrato.modalidad}
                      </span>
                    )}
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={12} /> {p.mes_correspondiente}
                    </span>
                  </div>

                  {/* Detalle de fechas y voucher */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 text-xs">
                    <span className="text-gray-400 flex items-center gap-1">
                      <DollarSign size={12} />
                      {p.fecha_pago ? `Pagado el ${p.fecha_pago}` : `Vence el ${p.fecha_vencimiento}`}
                    </span>

                    {p.comprobante_url ? (
                      <button
                        onClick={() =>
                          setPreviewVoucher({
                            url: p.comprobante_url!,
                            tenant: tenant?.nombre_razon_social || 'Comprobante',
                          })
                        }
                        className="inline-flex items-center gap-1 text-blue-600 font-bold hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-lg"
                      >
                        <Image size={13} /> Ver voucher
                      </button>
                    ) : (
                      <span className="text-gray-300">Sin voucher</span>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-gray-500 py-12">
                No hay pagos registrados con este filtro.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal para previsualizar el voucher */}
      {previewVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setPreviewVoucher(null)}
          />
          <div className="relative w-full max-w-[380px] bg-white rounded-3xl p-4 shadow-2xl z-10 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-sm">
                Voucher de {previewVoucher.tenant}
              </h3>
              <button
                onClick={() => setPreviewVoucher(null)}
                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X size={16} />
              </button>
            </div>
            <img
              src={previewVoucher.url}
              alt="Comprobante"
              className="w-full rounded-2xl border border-gray-200 object-contain max-h-[60vh] bg-black/5"
            />
            <div className="mt-3 flex justify-end">
              <a
                href={previewVoucher.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100"
              >
                <ExternalLink size={14} /> Abrir en pestaña nueva
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
