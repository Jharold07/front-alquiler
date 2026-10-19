import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Briefcase,
  User,
  Plus,
  Loader2,
} from 'lucide-react';
import { tenantService, type TenantWithDetails } from './services/tenantService';
import { CreateTenantModal } from './components/modals/CreateTenantModal';

interface Props {
  onOpenTenant: (id: string) => void;
}

export function Tenants({ onOpenTenant }: Props) {
  const [tenants, setTenants] = useState<TenantWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'persona' | 'empresa'>('all');
  const [showModal, setShowModal] = useState(false);

  const fetchTenants = useCallback(async () => {
    try {
      const data = await tenantService.getAllTenants();
      setTenants(data);
    } catch (err) {
      console.error('Error al cargar inquilinos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const filtered = tenants.filter((t) => {
    const q = query.toLowerCase();
    const matchesQuery =
      (t.nombre_razon_social || '').toLowerCase().includes(q) ||
      (t.documento_id || '').toLowerCase().includes(q) ||
      (t.telefono || '').toLowerCase().includes(q);
    const matchesFilter = filter === 'all' || t.tipo === filter;
    return matchesQuery && matchesFilter;
  });

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-5 pt-7 pb-6 rounded-b-[2rem] shadow-lg">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-white">Inquilinos</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-white text-blue-700 hover:bg-blue-50 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-md transition active:scale-95"
          >
            <Plus size={16} /> Nuevo Inquilino
          </button>
        </div>
        <p className="text-blue-100 text-sm mb-4">
          {tenants.length} inquilinos registrados en Supabase
        </p>

        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, documento o teléfono..."
            className="w-full rounded-2xl bg-white pl-11 pr-4 py-3 text-sm text-gray-900 focus:outline-none shadow placeholder-gray-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              Borrar
            </button>
          )}
        </div>
      </div>

      <div className="px-5 pt-5">
        {/* Filter chips */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'all', label: 'Todos' },
              { id: 'persona', label: 'Personas' },
              { id: 'empresa', label: 'Empresas' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
                filter === f.id
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
            <p className="text-sm font-medium">Cargando inquilinos desde Supabase...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((t) => (
              <TenantCard key={t.id} tenant={t} onOpen={() => onOpenTenant(t.id)} />
            ))}
            {filtered.length === 0 && (
              <div className="rounded-3xl bg-white border border-gray-100 p-8 text-center shadow-sm">
                <User size={36} className="mx-auto text-gray-300 mb-2" />
                <p className="font-bold text-gray-800 text-sm">No se encontraron inquilinos</p>
                <p className="text-xs text-gray-500 mt-1 mb-4">
                  {query ? 'Prueba con otro término de búsqueda.' : 'Registra a tu primer inquilino.'}
                </p>
                {!query && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow transition"
                  >
                    <Plus size={16} /> Registrar Inquilino
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <CreateTenantModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            fetchTenants();
          }}
        />
      )}
    </div>
  );
}

function TenantCard({
  tenant,
  onOpen,
}: {
  tenant: TenantWithDetails;
  onOpen: () => void;
}) {
  const Icon = tenant.tipo === 'empresa' ? Briefcase : User;

  // Total de espacios ocupados activamente
  const activeSpaces = (tenant.contratos || []).filter((c) => c.activo);
  const totalPayments = (tenant.contratos || []).reduce(
    (sum, c) => sum + (c.pagos?.length || 0),
    0
  );

  return (
    <button
      onClick={onOpen}
      className="w-full text-left rounded-3xl bg-white border border-gray-100 p-4 shadow-sm hover:shadow-md transition active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
          <Icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-gray-900 truncate">{tenant.nombre_razon_social}</p>
            {activeSpaces.length > 0 ? (
              <span className="shrink-0 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                {activeSpaces.length} activo(s)
              </span>
            ) : (
              <span className="shrink-0 text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                Sin espacio
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{tenant.documento_id}</p>
          <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
            {activeSpaces.map((c) => (
              <span key={c.id} className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                {c.espacios?.tipo === 'local' ? 'Local' : 'Cuarto'} {c.espacios?.nombre}
              </span>
            ))}
            <span className="text-xs text-gray-400">
              {totalPayments} cobro(s)
            </span>
            {tenant.telefono && (
              <span className="text-xs text-gray-400">
                · {tenant.telefono}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
