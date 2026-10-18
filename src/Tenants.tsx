import { useState } from 'react';
import { Search, Briefcase, User } from 'lucide-react';
import { tenants, spaces, payments } from './data';
import type { Tenant } from './types';

interface Props {
  onOpenTenant: (id: string) => void;
}

export function Tenants({ onOpenTenant }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'persona' | 'empresa'>('all');

  const filtered = tenants.filter((t) => {
    const matchesQuery =
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.document.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === 'all' || t.type === filter;
    return matchesQuery && matchesFilter;
  });

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-5 pt-12 pb-6 rounded-b-[2rem] shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-1">Inquilinos</h1>
        <p className="text-blue-100 text-sm mb-4">{tenants.length} inquilinos registrados</p>

        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o documento..."
            className="w-full rounded-2xl bg-white pl-11 pr-4 py-3 text-sm text-gray-900 focus:outline-none shadow"
          />
        </div>
      </div>

      <div className="px-5 pt-5">
        {/* Filter chips */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          {([
            { id: 'all', label: 'Todos' },
            { id: 'persona', label: 'Personas' },
            { id: 'empresa', label: 'Empresas' },
          ] as const).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
                filter === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((t) => (
            <TenantCard key={t.id} tenant={t} onOpen={() => onOpenTenant(t.id)} />
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-10">
              No se encontraron inquilinos.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TenantCard({ tenant, onOpen }: { tenant: Tenant; onOpen: () => void }) {
  const tenantSpaces = spaces.filter((s) => s.tenantId === tenant.id);
  const tenantPayments = payments.filter((p) => p.tenantId === tenant.id);
  const Icon = tenant.type === 'empresa' ? Briefcase : User;

  return (
    <button
      onClick={onOpen}
      className="w-full text-left rounded-3xl bg-white border border-gray-100 p-4 shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
          <Icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 truncate">{tenant.name}</p>
          <p className="text-xs text-gray-500">{tenant.document}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-500">
              {tenantSpaces.length} espacio(s)
            </span>
            <span className="text-xs text-gray-500">·</span>
            <span className="text-xs text-gray-500">
              {tenantPayments.length} pago(s)
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
