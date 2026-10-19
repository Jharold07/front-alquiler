import { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Store,
  Plus,
  User,
  DollarSign,
  Loader2,
  UserMinus,
  CheckCircle2,
} from 'lucide-react';
import type { SpaceType, SpaceStatus } from './types';
import { spaceService, type SpaceWithDetails } from './services/spaceService';
import { CreateSpaceModal } from './components/modals/CreateSpaceModal';
import { TerminateContractModal } from './components/modals/TerminateContractModal';

interface Props {
  onOpenTenant: (tenantId: string) => void;
}

const statusStyle: Record<
  SpaceStatus,
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
  mantenimiento: {
    label: 'Mantenimiento',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
};

export function Spaces({ onOpenTenant }: Props) {
  const [tab, setTab] = useState<SpaceType>('cuarto');
  const [spaces, setSpaces] = useState<SpaceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estado para dar de baja contrato desde la vista de espacios
  const [terminateTarget, setTerminateTarget] = useState<{
    contractId: string;
    spaceId: string;
    spaceName: string;
    tenantName: string;
  } | null>(null);

  const fetchSpaces = useCallback(async () => {
    try {
      const data = await spaceService.getAllSpaces();
      setSpaces(data);
    } catch (err) {
      console.error('Error al cargar espacios:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const filtered = spaces.filter((s) => s.tipo === tab);

  // Group by floor
  const floors = Array.from(new Set(filtered.map((s) => s.piso))).filter(Boolean);

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-5 pt-7 pb-6 rounded-b-[2rem] shadow-lg">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-white">Espacios</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-white text-blue-700 hover:bg-blue-50 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-md transition active:scale-95"
          >
            <Plus size={16} /> Nuevo Espacio
          </button>
        </div>
        <p className="text-blue-100 text-sm mb-5">
          {filtered.length} {tab === 'cuarto' ? 'cuartos' : 'locales'} registrados
        </p>

        {/* Tabs */}
        <div className="bg-white/15 backdrop-blur rounded-2xl p-1 flex">
          <button
            onClick={() => setTab('cuarto')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${tab === 'cuarto'
              ? 'bg-white text-blue-700 shadow'
              : 'text-white hover:text-white/80'
              }`}
          >
            <Building2 size={17} /> Cuartos por Piso
          </button>
          <button
            onClick={() => setTab('local')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${tab === 'local'
              ? 'bg-white text-blue-700 shadow'
              : 'text-white hover:text-white/80'
              }`}
          >
            <Store size={17} /> Locales
          </button>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-6">
        {/* Feedback notification */}
        {successMessage && (
          <div className="rounded-2xl bg-green-50 border border-green-200 p-3.5 flex items-center justify-between text-xs text-green-800 animate-fade-in shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-700 hover:text-green-900 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-gray-400 gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <p className="text-sm font-medium">Cargando espacios ...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl bg-white border border-gray-100 p-8 text-center shadow-sm">
            <Building2 size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="font-bold text-gray-800 text-sm">No hay {tab === 'cuarto' ? 'cuartos' : 'locales'}</p>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Comienza registrando tu primer {tab === 'cuarto' ? 'cuarto' : 'local'}.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow transition"
            >
              <Plus size={16} /> Registrar Espacio
            </button>
          </div>
        ) : (
          floors.map((floor) => {
            const floorSpaces = filtered.filter((s) => s.piso === floor);
            return (
              <div key={floor}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 px-3 rounded-lg bg-gray-900 text-white text-xs font-bold flex items-center shadow-sm">
                    {floor}
                  </div>
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">
                    {floorSpaces.length} {tab === 'cuarto' ? 'cuartos' : 'locales'}
                  </span>
                </div>

                <div className="space-y-3">
                  {floorSpaces.map((space) => {
                    const activeContract = space.contratos?.find((c) => c.activo);
                    const inquilino = activeContract?.inquilinos;
                    const spaceTitle = `${space.tipo === 'cuarto' ? 'Cuarto' : 'Local'} ${space.nombre}`;

                    return (
                      <SpaceCard
                        key={space.id}
                        space={space}
                        inquilino={inquilino}
                        activeContractId={activeContract?.id}
                        spaceTitle={spaceTitle}
                        onOpenTenant={onOpenTenant}
                        onLiberarSpace={() => {
                          if (activeContract && inquilino) {
                            setTerminateTarget({
                              contractId: activeContract.id,
                              spaceId: space.id,
                              spaceName: `${spaceTitle} · ${space.piso}`,
                              tenantName: inquilino.nombre_razon_social,
                            });
                          }
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showCreateModal && (
        <CreateSpaceModal
          defaultType={tab}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            setSuccessMessage('¡Espacio registrado con éxito en Supabase!');
            fetchSpaces();
          }}
        />
      )}

      {terminateTarget && (
        <TerminateContractModal
          contractId={terminateTarget.contractId}
          spaceId={terminateTarget.spaceId}
          spaceName={terminateTarget.spaceName}
          tenantName={terminateTarget.tenantName}
          onClose={() => setTerminateTarget(null)}
          onTerminated={() => {
            setTerminateTarget(null);
            setSuccessMessage(`¡Espacio ${terminateTarget.spaceName} liberado y listo para alquilar!`);
            fetchSpaces();
          }}
        />
      )}
    </div>
  );
}

function SpaceCard({
  space,
  inquilino,
  activeContractId,
  spaceTitle,
  onOpenTenant,
  onLiberarSpace,
}: {
  space: SpaceWithDetails;
  inquilino?: {
    id: string;
    nombre_razon_social: string;
    telefono: string;
    documento_id: string;
  };
  activeContractId?: string;
  spaceTitle: string;
  onOpenTenant: (id: string) => void;
  onLiberarSpace: () => void;
}) {
  const currentStatus = space.estado || 'disponible';
  const style = statusStyle[currentStatus] || statusStyle.disponible;
  const Icon = space.tipo === 'cuarto' ? Building2 : Store;

  return (
    <div className="rounded-3xl bg-white border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
            <Icon size={22} />
          </div>
          <div>
            <p className="font-bold text-gray-900">{spaceTitle}</p>
            <p className="text-xs text-gray-500">
              {space.piso} {space.rubro ? `· ${space.rubro}` : ''}
            </p>
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
          S/ {(space.precio_sugerido || 0).toLocaleString('es-PE')}
        </span>
        <span className="text-gray-400 text-xs">/ mes</span>
      </div>

      {inquilino && (
        <div className="space-y-2">
          <button
            onClick={() => onOpenTenant(inquilino.id)}
            className="w-full flex items-center gap-2 rounded-2xl bg-gray-50 p-3 text-left hover:bg-gray-100 transition active:scale-[0.99]"
          >
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              <User size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">Inquilino actual:</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {inquilino.nombre_razon_social}
              </p>
            </div>
          </button>

          {activeContractId && (
            <button
              onClick={onLiberarSpace}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition active:scale-[0.99]"
            >
              <UserMinus size={14} /> Liberar habitación / Dar de baja
            </button>
          )}
        </div>
      )}

      {currentStatus === 'disponible' && !inquilino && (
        <div className="rounded-2xl bg-green-50 border border-green-100 py-2.5 px-3 text-center">
          <p className="text-xs font-semibold text-green-700">✓ Espacio libre y disponible para alquiler</p>
        </div>
      )}
    </div>
  );
}
