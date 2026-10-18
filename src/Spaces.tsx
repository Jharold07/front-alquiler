import { useState } from 'react';
import { Building2, Store, Plus, User, DollarSign } from 'lucide-react';
import { spaces, getTenant } from './data';
import type { Space, SpaceType } from './types';

interface Props {
  onOpenTenant: (tenantId: string) => void;
}

const statusStyle: Record<
  Space['status'],
  { label: string; bg: string; text: string; dot: string }
> = {
  ocupado: {
    label: 'Ocupado',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  disponible: {
    label: 'Disponible',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
  pendiente: {
    label: 'Pago Pendiente',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
};

export function Spaces({ onOpenTenant }: Props) {
  const [tab, setTab] = useState<SpaceType>('cuarto');

  const filtered = spaces.filter((s) => s.type === tab);

  // Group by floor
  const floors = Array.from(new Set(filtered.map((s) => s.floor)));

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-5 pt-12 pb-6 rounded-b-[2rem] shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-1">Espacios</h1>
        <p className="text-blue-100 text-sm mb-5">
          {filtered.length} {tab === 'cuarto' ? 'cuartos' : 'locales'} registrados
        </p>

        {/* Tabs */}
        <div className="bg-white/15 backdrop-blur rounded-2xl p-1 flex">
          <button
            onClick={() => setTab('cuarto')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
              tab === 'cuarto'
                ? 'bg-white text-blue-700 shadow'
                : 'text-white'
            }`}
          >
            <Building2 size={17} /> Cuartos por Piso
          </button>
          <button
            onClick={() => setTab('local')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
              tab === 'local'
                ? 'bg-white text-blue-700 shadow'
                : 'text-white'
            }`}
          >
            <Store size={17} /> Locales
          </button>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-6">
        {floors.map((floor) => {
          const floorSpaces = filtered.filter((s) => s.floor === floor);
          return (
            <div key={floor}>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 px-3 rounded-lg bg-gray-900 text-white text-xs font-bold flex items-center">
                  {floor}
                </div>
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">
                  {floorSpaces.length} {tab === 'cuarto' ? 'cuartos' : 'locales'}
                </span>
              </div>

              <div className="space-y-3">
                {floorSpaces.map((space) => (
                  <SpaceCard
                    key={space.id}
                    space={space}
                    onOpenTenant={onOpenTenant}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SpaceCard({
  space,
  onOpenTenant,
}: {
  space: Space;
  onOpenTenant: (id: string) => void;
}) {
  const style = statusStyle[space.status];
  const Icon = space.type === 'cuarto' ? Building2 : Store;

  return (
    <div className="rounded-3xl bg-white border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600">
            <Icon size={22} />
          </div>
          <div>
            <p className="font-bold text-gray-900">
              {space.type === 'cuarto' ? 'Cuarto' : 'Local'} {space.number}
            </p>
            <p className="text-xs text-gray-500">{space.floor}</p>
          </div>
        </div>
        <span
          className={`flex items-center gap-1.5 text-xs font-semibold ${style.text} ${style.bg} px-2.5 py-1 rounded-full`}
        >
          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
          {style.label}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
        <DollarSign size={15} className="text-gray-400" />
        <span className="font-bold text-gray-900">
          S/ {space.monthlyPrice.toLocaleString('es-PE')}
        </span>
        <span className="text-gray-400 text-xs">/ mes</span>
      </div>

      {space.status === 'ocupado' && space.tenantId && (
        <button
          onClick={() => onOpenTenant(space.tenantId!)}
          className="w-full flex items-center gap-2 rounded-2xl bg-gray-50 p-3 text-left hover:bg-gray-100 transition"
        >
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            <User size={15} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {/* tenant name resolved at render via lookup */}
              {getTenantName(space.tenantId)}
            </p>
            <p className="text-xs text-gray-500">Ver ficha del inquilino</p>
          </div>
        </button>
      )}

      {space.status === 'disponible' && (
        <button className="w-full flex items-center justify-center gap-2 rounded-2xl bg-green-500 py-3 text-sm font-bold text-white hover:bg-green-600 transition shadow-sm">
          <Plus size={18} /> Alquilar este espacio
        </button>
      )}

      {space.status === 'pendiente' && space.tenantId && (
        <div className="space-y-2">
          <button
            onClick={() => onOpenTenant(space.tenantId!)}
            className="w-full flex items-center gap-2 rounded-2xl bg-gray-50 p-3 text-left hover:bg-gray-100 transition"
          >
            <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              <User size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {getTenantName(space.tenantId)}
              </p>
              <p className="text-xs text-red-500">Ver ficha del inquilino</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

function getTenantName(id?: string): string {
  return getTenant(id)?.name ?? '—';
}
