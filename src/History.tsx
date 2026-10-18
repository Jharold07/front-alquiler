import { useState } from 'react';
import { Filter, CheckCircle2, DollarSign, Calendar } from 'lucide-react';
import { payments, getTenant, getSpace, modalityLabel } from './data';
import type { PaymentMethod } from './types';

interface Props {
  onOpenTenant: (id: string) => void;
}

const methodLabel: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  yape: 'Yape / Plin',
  transferencia: 'Transferencia',
};

const methodStyle: Record<PaymentMethod, string> = {
  efectivo: 'bg-gray-100 text-gray-700',
  yape: 'bg-purple-100 text-purple-700',
  transferencia: 'bg-blue-100 text-blue-700',
};

export function History({ onOpenTenant }: Props) {
  const [methodFilter, setMethodFilter] = useState<'all' | PaymentMethod>('all');

  const filtered = payments.filter(
    (p) => methodFilter === 'all' || p.method === methodFilter,
  );

  const total = filtered.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-5 pt-12 pb-6 rounded-b-[2rem] shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-1">Historial</h1>
        <p className="text-blue-100 text-sm mb-4">Todos los pagos registrados</p>

        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/15">
          <p className="text-blue-50 text-xs">Total registrado</p>
          <p className="text-2xl font-bold text-white">
            S/ {total.toLocaleString('es-PE')}
          </p>
          <p className="text-blue-100 text-xs mt-1">
            {filtered.length} transacciones
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
              { id: 'yape', label: 'Yape/Plin' },
              { id: 'transferencia', label: 'Transferencia' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setMethodFilter(f.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                methodFilter === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((p) => {
            const tenant = getTenant(p.tenantId);
            const space = getSpace(p.spaceId);
            if (!tenant || !space) return null;
            return (
              <div
                key={p.id}
                className="rounded-3xl bg-white border border-gray-100 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <button
                    onClick={() => onOpenTenant(tenant.id)}
                    className="flex items-center gap-3 text-left"
                  >
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {space.floor} · {space.number}
                      </p>
                    </div>
                  </button>
                  <p className="text-lg font-bold text-green-600">
                    S/ {p.amount}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${methodStyle[p.method]}`}
                  >
                    {methodLabel[p.method]}
                  </span>
                  <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                    {modalityLabel[p.modality]}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar size={12} /> {p.month}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <DollarSign size={12} /> Registrado el {p.date}
                </p>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-10">
              No hay pagos con este filtro.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
