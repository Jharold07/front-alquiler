import { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Building2,
  Store,
  Calendar,
  Repeat,
  DollarSign,
  Hash,
  ChevronDown,
  Briefcase,
  User,
  FileText,
  History,
} from 'lucide-react';
import { getTenant, getSpace, spaces, payments, modalityLabel } from './data';
import type { Tenant, Space } from './types';

interface Props {
  tenantId: string;
  onBack: () => void;
}

export function TenantProfile({ tenantId, onBack }: Props) {
  const tenant = getTenant(tenantId);
  const [openHistory, setOpenHistory] = useState(false);

  if (!tenant) {
    return (
      <div className="px-5 pt-12">
        <button onClick={onBack} className="text-blue-600 font-semibold">
          Volver
        </button>
        <p className="mt-4 text-gray-500">Inquilino no encontrado.</p>
      </div>
    );
  }

  // Find current space(s) for tenant
  const currentSpaces = spaces.filter((s) => s.tenantId === tenantId);
  const tenantPayments = payments.filter((p) => p.tenantId === tenantId);

  function whatsappPhone(phone: string) {
    return phone.replace(/[^0-9]/g, '');
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-5 pt-12 pb-6 rounded-b-[2rem] shadow-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-white mb-4 text-sm font-semibold"
        >
          <ArrowLeft size={18} /> Volver
        </button>

        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-3xl bg-white/20 flex items-center justify-center text-white font-bold text-2xl shrink-0">
            {tenant.type === 'empresa' ? (
              <Briefcase size={28} />
            ) : (
              tenant.name.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{tenant.name}</h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-white/20 px-2.5 py-1 rounded-full mt-1">
              {tenant.type === 'empresa' ? (
                <>
                  <Briefcase size={12} /> Empresa
                </>
              ) : (
                <>
                  <User size={12} /> Persona Natural
                </>
              )}
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <a
            href={`tel:${whatsappPhone(tenant.phone)}`}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-bold text-blue-700 hover:bg-blue-50 transition shadow"
          >
            <Phone size={17} /> Llamar
          </a>
          <a
            href={`https://wa.me/${whatsappPhone(tenant.phone)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-green-500 py-3 text-sm font-bold text-white hover:bg-green-600 transition shadow"
          >
            <MessageCircle size={17} /> WhatsApp
          </a>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Contact info */}
        <Section title="Datos de contacto">
          <InfoRow icon={<Phone size={16} />} label="Teléfono" value={tenant.phone} />
          <InfoRow icon={<FileText size={16} />} label="Documento" value={tenant.document} />
          {tenant.email && (
            <InfoRow icon={<User size={16} />} label="Correo" value={tenant.email} />
          )}
        </Section>

        {/* Active contract(s) */}
        <Section title="Contrato activo">
          {currentSpaces.length === 0 && (
            <p className="text-sm text-gray-500">Sin contratos activos.</p>
          )}
          {currentSpaces.map((space) => (
            <ContractCard key={space.id} space={space} />
          ))}
        </Section>

        {/* Past rentals (collapsible) */}
        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setOpenHistory((v) => !v)}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-2">
              <History size={18} className="text-blue-600" />
              <span className="font-bold text-gray-900 text-sm">
                Historial de alquileres pasados
              </span>
            </div>
            <ChevronDown
              size={20}
              className={`text-gray-400 transition-transform ${
                openHistory ? 'rotate-180' : ''
              }`}
            />
          </button>
          {openHistory && (
            <div className="px-4 pb-4 space-y-2">
              {tenantPayments.length === 0 && (
                <p className="text-sm text-gray-500 pl-6">
                  No hay registros históricos.
                </p>
              )}
              {tenantPayments.map((p) => {
                const sp = getSpace(p.spaceId);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-2xl bg-gray-50 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {p.month}
                      </p>
                      <p className="text-xs text-gray-500">
                        {sp?.floor} · {sp?.number} · {modalityLabel[p.modality]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">
                        S/ {p.amount}
                      </p>
                      <p className="text-xs text-gray-400">{p.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes */}
        {tenant.notes && (
          <Section title="Observaciones">
            <p className="text-sm text-gray-700 leading-relaxed">{tenant.notes}</p>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white border border-gray-100 p-4 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function ContractCard({ space }: { space: Space }) {
  const c = space.contract;
  if (!c) return null;
  const Icon = space.type === 'cuarto' ? Building2 : Store;

  const rows: { icon: React.ReactNode; label: string; value: string }[] = [
    {
      icon: <Icon size={15} />,
      label: 'Tipo de espacio',
      value: `${space.type === 'cuarto' ? 'Cuarto' : 'Local'} ${space.number} · ${space.floor}`,
    },
    {
      icon: <Calendar size={15} />,
      label: 'Duración',
      value: c.duration,
    },
    {
      icon: <Repeat size={15} />,
      label: 'Modalidad de pago',
      value: modalityLabel[c.modality],
    },
    {
      icon: <DollarSign size={15} />,
      label: 'Monto mensual',
      value: `S/ ${c.monthlyAmount.toLocaleString('es-PE')}`,
    },
    {
      icon: <Hash size={15} />,
      label: 'Día de cobro',
      value: `Día ${c.paymentDay} de cada mes`,
    },
  ];

  return (
    <div className="rounded-2xl bg-blue-50 border border-blue-100 p-3 mb-3 last:mb-0">
      <div className="space-y-2.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-gray-600 text-xs">
              {r.icon}
              <span>{r.label}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 text-right">
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
